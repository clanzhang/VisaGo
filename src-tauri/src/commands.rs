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

/// IPC: scan_folder — 扫描指定文件夹（前端已用 dialog 选好路径）
/// 接收前端传来的 path，递归扫描其中的材料文件。
/// 不再在 Rust 端弹选择器（文件夹选择器在 macOS 上无法选单个文件）。
#[tauri::command]
pub(crate) fn scan_folder(app: tauri::AppHandle, path: String) -> Result<ScanResult, String> {
    println!("[IPC] scan_folder 被调用，扫描路径: {path}");
    let files = scanner::scan_folder(&path)?;
    let result = ScanResult {
        folder: path.clone(),
        files,
    };

    // 记录扫描
    let scanned = store::ScannedFiles {
        folder: path.clone(),
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

/// IPC: scan_files — 扫描指定的单个或多个文件（前端已用 dialog 选好）
/// 支持用户只选一个文件或多个文件，而不是整文件夹。
#[tauri::command]
pub(crate) fn scan_files(app: tauri::AppHandle, paths: Vec<String>) -> Result<ScanResult, String> {
    println!("[IPC] scan_files 被调用，共 {} 个文件", paths.len());
    let mut items = Vec::new();
    for p in &paths {
        let meta = std::fs::metadata(p).map_err(|e| format!("读取文件失败 {p}: {e}"))?;
        let name = std::path::Path::new(p)
            .file_name()
            .map(|n| n.to_string_lossy().to_string())
            .unwrap_or_else(|| p.clone());
        let ext = std::path::Path::new(p)
            .extension()
            .and_then(|e| e.to_str())
            .unwrap_or("")
            .to_lowercase();
        items.push(scanner::ScannedItem {
            path: p.clone(),
            name,
            file_type: if ext == "jpeg" { "jpg".to_string() } else { ext },
            size: meta.len(),
        });
    }
    items.sort_by(|a, b| a.name.cmp(&b.name));

    let result = ScanResult {
        folder: paths.join(", "),
        files: items,
    };

    // 记录扫描
    let scanned = store::ScannedFiles {
        folder: result.folder.clone(),
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
    println!("[IPC] recognize_file 被调用: {name} ({path})");

    let ext = path
        .rsplit('.')
        .next()
        .unwrap_or("")
        .to_lowercase();

    // 提取文件文本内容（PDF/DOCX）与图片 base64（jpg/png）
    let mut file_text: Option<String> = None;
    let mut content_b64: Option<String> = None;

    match ext.as_str() {
        "pdf" => {
            match scanner::extract_pdf_text(&path) {
                Ok(text) if !text.trim().is_empty() => {
                    println!("[recognize] PDF 文本提取成功: {} 字符", text.chars().count());
                    file_text = Some(text);
                }
                Ok(_) => {
                    // 扫描件 PDF（无文本层）：回退为"仅文件名"，让 Kimi 基于文件名+常识尽力识别
                    println!("[recognize] PDF 无文本层（扫描件），回退为文件名识别");
                    file_text = Some(format!(
                        "（这是一个扫描件/图片型 PDF，无法直接提取文本。请根据文件名「{name}」和你的常识判断该文件类型，并尽力提取字段；若无法确定则 category 填\"其他\"，fields 全部填 null）"
                    ));
                }
                Err(e) => {
                    println!("[recognize] PDF 文本提取失败: {e}（将尝试仅用文件名识别）");
                    file_text = Some(format!(
                        "（PDF 提取失败。请根据文件名「{name}」和你的常识判断该文件类型，尽力提取字段；若无法确定则 category 填\"其他\"，fields 全部填 null）"
                    ));
                }
            }
        }
        "docx" | "doc" => {
            match scanner::extract_docx_text(&path) {
                Ok(text) => {
                    println!("[recognize] DOCX 文本提取成功: {} 字符", text.chars().count());
                    file_text = Some(text);
                }
                Err(e) => {
                    println!("[recognize] DOCX 文本提取失败: {e}");
                }
            }
        }
        "jpg" | "jpeg" | "png" => {
            match scanner::read_file_base64(&path) {
                Ok(b64) => {
                    println!("[recognize] 读取图片成功: {} bytes(base64 长度 {})", name, b64.len());
                    content_b64 = Some(b64);
                }
                Err(e) => {
                    println!("[recognize] 读取图片失败: {name}: {e}");
                    return Err(format!("读取图片失败: {e}"));
                }
            }
        }
        _ => {
            println!("[recognize] 不支持的扩展名: {ext}");
        }
    }

    println!("[recognize] 发送给 Kimi: name={name}, ext={ext}, file_text={}, content_b64={}",
        file_text.as_ref().map(|t| t.chars().count()).unwrap_or(0),
        content_b64.is_some());

    let recognized = match recognizer::recognize_file(&path, &name, file_text, content_b64).await {
        Ok(r) => {
            println!("[recognize] Kimi 识别成功: category={}, fields={}", r.category, r.fields);
            r
        }
        Err(e) => {
            println!("[recognize] Kimi 识别失败: {e}");
            return Err(e);
        }
    };

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
    println!("[IPC] save_profile 被调用: name={}, passport={}", profile.name, profile.passport_number);
    let r = store::save_profile(&app, &profile);
    match &r {
        Ok(_) => println!("[IPC] save_profile 保存成功"),
        Err(e) => println!("[IPC] save_profile 失败: {e}"),
    }
    r
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

/// IPC: export_pdf — HTML 转 PDF，弹保存对话框让用户选位置
#[tauri::command]
pub(crate) fn export_pdf(html: String, filename: String) -> Result<String, String> {
    exporter::export_pdf(html, filename)
}

// ===== 注册 =====

// 命令函数通过 lib.rs 的 Builder.invoke_handler 注册（见 lib.rs）
