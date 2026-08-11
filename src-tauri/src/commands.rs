// src/commands.rs — Tauri IPC 命令
use serde::{Deserialize, Serialize};
use tauri::Manager;

use crate::cache;
use crate::exporter;
use crate::kimi;
use crate::recognizer;
use crate::scanner;
use crate::store;

// ===== DTOs =====

#[derive(Serialize, Deserialize, Clone)]
pub struct ChatMessageDto {
    pub role: String,
    pub content: String,
}

#[derive(Serialize, Deserialize, Default)]
pub struct ChatOptionsDto {
    pub model: Option<String>,
    pub temperature: Option<f32>,
    pub max_tokens: Option<u32>,
    pub response_format: Option<serde_json::Value>,
}

#[derive(Serialize)]
pub struct AiChatResponse {
    pub content: String,
}

#[derive(Serialize)]
pub struct ScanResult {
    pub folder: String,
    pub files: Vec<scanner::ScannedItem>,
}

#[derive(Serialize)]
pub struct RecognizeResult {
    pub path: String,
    pub name: String,
    pub category: String,
    pub fields: serde_json::Value,
    pub summary: String,
}

// ===== Kimi 对话 =====

/// IPC: ai_chat — 调用 Kimi 对话（Key 在 Rust 端）
#[tauri::command]
pub(crate) async fn ai_chat(
    messages: Vec<ChatMessageDto>,
    options: Option<ChatOptionsDto>,
) -> Result<AiChatResponse, String> {
    let msgs = messages
        .into_iter()
        .map(|m| kimi::ChatMessage {
            role: m.role,
            content: m.content,
        })
        .collect::<Vec<_>>();
    let opts = options.unwrap_or_default();
    let content = kimi::chat(
        msgs,
        kimi::ChatOptions {
            model: opts.model,
            temperature: opts.temperature,
            max_tokens: opts.max_tokens,
            response_format: opts.response_format,
        },
    )
    .await?;
    Ok(AiChatResponse { content })
}

/// IPC: kimi_chat — 简单版 Kimi 对话（单 prompt）
#[tauri::command]
pub(crate) async fn kimi_chat(prompt: String) -> Result<String, String> {
    kimi::chat(
        vec![kimi::ChatMessage {
            role: "user".to_string(),
            content: prompt,
        }],
        kimi::ChatOptions {
            temperature: Some(0.3),
            max_tokens: Some(4000),
            ..Default::default()
        },
    )
    .await
}

// ===== 文件扫描与识别 =====

/// IPC: scan_folder — 系统文件选择器选文件夹，递归扫描
#[tauri::command]
pub(crate) async fn scan_folder(app: tauri::AppHandle) -> Result<ScanResult, String> {
    let picked = rfd::FileDialog::new().pick_folder();
    let folder = match picked {
        Some(dir) => dir.to_string_lossy().to_string(),
        None => return Err("用户取消了选择".to_string()),
    };

    let files = scanner::scan_folder(&folder)?;
    let result = ScanResult {
        folder: folder.clone(),
        files,
    };

    // 记录扫描
    let scanned = store::ScannedFiles {
        folder: folder.clone(),
        scanned_at: chrono::Utc::now().to_rfc3339(),
        files: result
            .files
            .iter()
            .map(|f| store::ScannedFile {
                path: f.path.clone(),
                name: f.name.clone(),
                file_type: f.file_type.clone(),
                size: f.size,
                recognized: false,
                doc_category: String::new(),
                fields: serde_json::Value::Null,
                error: None,
            })
            .collect(),
    };
    let _ = store::save_scanned(&app, &scanned);

    Ok(result)
}

/// IPC: recognize_file — 读文件内容，调 Kimi 识别类型 + 提取字段
#[tauri::command]
pub(crate) async fn recognize_file(app: tauri::AppHandle, path: String, name: String) -> Result<RecognizeResult, String> {
    // 读取文件内容（图片转 base64，文本直接读）
    let ext = path
        .rsplit('.')
        .next()
        .unwrap_or("")
        .to_lowercase();
    let content_b64 = match ext.as_str() {
        "jpg" | "jpeg" | "png" => Some(scanner::read_file_base64(&path)?),
        _ => None,
    };

    let recognized = recognizer::recognize_file(&path, &name, content_b64).await?;

    // 更新扫描记录中的识别状态
    if let Ok(mut scanned) = store::load_scanned(&app) {
        if let Some(list) = &mut scanned {
            for file in list.files.iter_mut() {
                if file.path == path {
                    file.recognized = true;
                    file.doc_category = recognized.category.clone();
                    file.fields = recognized.fields.clone();
                }
            }
            let _ = store::save_scanned(&app, list);
        }
    }

    Ok(RecognizeResult {
        path,
        name,
        category: recognized.category,
        fields: recognized.fields,
        summary: recognized.summary,
    })
}

// ===== 用户资料 =====

/// IPC: save_profile — 保存用户资料
#[tauri::command]
pub(crate) fn save_profile(app: tauri::AppHandle, profile: store::UserProfile) -> Result<(), String> {
    store::save_profile(&app, &profile)
}

/// IPC: load_profile — 加载用户资料
#[tauri::command]
pub(crate) fn load_profile(app: tauri::AppHandle) -> Result<Option<store::UserProfile>, String> {
    store::load_profile(&app)
}

// ===== 签证数据缓存 =====

/// IPC: get_visa_data — 读取签证数据（优先本地缓存）
#[tauri::command]
pub(crate) fn get_visa_data(app: tauri::AppHandle, key: String) -> Result<serde_json::Value, String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    cache::read(&dir, &key).ok_or_else(|| "缓存不存在或已过期".to_string())
}

/// IPC: refresh_visa_data — 强制刷新签证数据
#[tauri::command]
pub(crate) async fn refresh_visa_data(
    app: tauri::AppHandle,
    key: String,
    prompt: String,
) -> Result<serde_json::Value, String> {
    let content = kimi::chat(
        vec![kimi::ChatMessage {
            role: "user".to_string(),
            content: prompt,
        }],
        kimi::ChatOptions {
            temperature: Some(0.2),
            max_tokens: Some(12000),
            ..Default::default()
        },
    )
    .await?;
    let json: serde_json::Value = serde_json::from_str(&content).unwrap_or(serde_json::Value::String(content));
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    cache::write(&dir, &key, json.clone());
    Ok(json)
}

// ===== PDF 导出 =====

/// IPC: export_pdf — HTML 转 PDF 存本地
#[tauri::command]
pub(crate) fn export_pdf(app: tauri::AppHandle, html: String, filename: String) -> Result<String, String> {
    exporter::export_pdf(app, html, filename)
}

// ===== 注册 =====

// 命令函数通过 lib.rs 的 Builder.invoke_handler 注册（见 lib.rs）
