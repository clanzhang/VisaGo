// src/commands.rs — Tauri IPC 命令
use serde::{Deserialize, Serialize};
use tauri::Manager;

use crate::cache;
use crate::kimi;

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

/// IPC: ai_chat — 调用 Kimi 对话
#[tauri::command]
async fn ai_chat(
    app: tauri::AppHandle,
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

/// IPC: get_visa_data — 读取签证数据（优先本地缓存）
#[tauri::command]
fn get_visa_data(app: tauri::AppHandle, key: String) -> Result<serde_json::Value, String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    cache::read(&dir, &key).ok_or_else(|| "缓存不存在或已过期".to_string())
}

/// IPC: refresh_visa_data — 强制刷新签证数据（调用 Kimi 并写缓存）
#[tauri::command]
async fn refresh_visa_data(
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
    // 尝试解析 JSON
    let json: serde_json::Value = serde_json::from_str(&content).unwrap_or(serde_json::Value::String(content));
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    cache::write(&dir, &key, json.clone());
    Ok(json)
}

/// IPC: ai_generate — 生成文档内容
#[tauri::command]
async fn ai_generate(
    _app: tauri::AppHandle,
    prompt: String,
) -> Result<String, String> {
    kimi::chat(
        vec![kimi::ChatMessage {
            role: "user".to_string(),
            content: prompt,
        }],
        kimi::ChatOptions {
            temperature: Some(0.4),
            max_tokens: Some(10000),
            ..Default::default()
        },
    )
    .await
}

/// IPC: ai_recommend — 申请助手个性化推荐
#[tauri::command]
async fn ai_recommend(
    _app: tauri::AppHandle,
    prompt: String,
) -> Result<String, String> {
    kimi::chat(
        vec![kimi::ChatMessage {
            role: "user".to_string(),
            content: prompt,
        }],
        kimi::ChatOptions {
            temperature: Some(0.3),
            max_tokens: Some(8000),
            ..Default::default()
        },
    )
    .await
}

/// 注册所有命令
pub fn register(app: &mut tauri::App) {
    use tauri::generate_handler;
    app.invoke_handler(generate_handler![
        ai_chat,
        get_visa_data,
        refresh_visa_data,
        ai_generate,
        ai_recommend
    ]);
}
