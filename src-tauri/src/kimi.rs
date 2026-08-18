// src/kimi.rs — Kimi API 封装（Key 存于 Rust 端，不暴露给前端）
use serde::{Deserialize, Serialize};
use std::time::Duration;

use crate::store;

const BASE_URL: &str = "https://api.moonshot.cn/v1/chat/completions";
const MODEL: &str = "moonshot-v1-8k";
/// 视觉模型：支持图片理解（用于识别扫描件 PDF / 图片类材料）
const VISION_MODEL: &str = "moonshot-v1-8k-vision-preview";
const TIMEOUT: Duration = Duration::from_secs(60);

#[derive(Serialize, Deserialize, Clone)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
}

#[derive(Serialize)]
struct ChatRequest {
    model: String,
    messages: Vec<ChatMessage>,
    temperature: f32,
    max_tokens: u32,
    #[serde(skip_serializing_if = "Option::is_none")]
    response_format: Option<serde_json::Value>,
}

#[derive(Deserialize)]
struct ChatResponse {
    choices: Vec<Choice>,
}

#[derive(Deserialize)]
struct Choice {
    message: ChatMessage,
}

#[derive(Serialize, Deserialize, Default)]
pub struct ChatOptions {
    pub model: Option<String>,
    pub temperature: Option<f32>,
    pub max_tokens: Option<u32>,
    pub response_format: Option<serde_json::Value>,
}

/// 从三个来源读取 Kimi Key，优先级：环境变量 > 用户设置（settings.json）> 项目根 .env。
/// 理由：环境变量是部署/CI/开发的标准注入方式（vite proxy 也读它），保持最高优先级
/// 不破坏现有 dev 流程；用户设置是桌面端运行时显式配置，次之；.env 是开发兜底最后读。
/// 不打印 Key 本身或任何片段。
pub fn api_key(app: &tauri::AppHandle) -> Result<String, String> {
    // 1) 环境变量
    if let Ok(key) = std::env::var("KIMI_API_KEY") {
        if !key.trim().is_empty() {
            return Ok(key);
        }
    }
    // 2) 用户设置（settings.json 中的 kimi_api_key）
    if let Ok(settings) = store::load_settings(app) {
        if let Some(key) = settings.kimi_api_key {
            if !key.trim().is_empty() {
                return Ok(key);
            }
        }
    }
    // 3) 项目根 .env（向上级目录查找，兼容 src-tauri 作为 cwd 的情况）
    let candidates = [
        std::path::Path::new(".env"),
        std::path::Path::new("../.env"),
        std::path::Path::new("../../.env"),
    ];
    for env_path in candidates {
        if let Ok(content) = std::fs::read_to_string(env_path) {
            for line in content.lines() {
                if let Some((k, v)) = line.trim().split_once('=') {
                    if k.trim() == "KIMI_API_KEY" && !v.trim().is_empty() {
                        return Ok(v.trim().to_string());
                    }
                }
            }
        }
    }
    Err("未找到 KIMI_API_KEY，请在设置、环境变量或项目根 .env 中配置".to_string())
}

/// 调用 Kimi Chat Completions，返回回复文本
pub async fn chat(
    app: &tauri::AppHandle,
    messages: Vec<ChatMessage>,
    options: ChatOptions,
) -> Result<String, String> {
    let key = api_key(app)?;
    let client = reqwest::Client::builder()
        .timeout(TIMEOUT)
        .build()
        .map_err(|e| format!("HTTP 客户端初始化失败: {e}"))?;

    let req = ChatRequest {
        model: options.model.unwrap_or_else(|| MODEL.to_string()),
        messages,
        temperature: options.temperature.unwrap_or(0.3),
        max_tokens: options.max_tokens.unwrap_or(8192),
        response_format: options.response_format,
    };

    let res = client
        .post(BASE_URL)
        .header("Authorization", format!("Bearer {key}"))
        .header("Content-Type", "application/json")
        .json(&req)
        .send()
        .await
        .map_err(|e| {
            println!("=== Kimi 请求网络错误: {e} ===");
            format!("Kimi 请求失败: {e}")
        })?;

    let status = res.status();
    if !status.is_success() {
        let body = res.text().await.unwrap_or_default();
        println!("=== Kimi 返回错误 {status}: {body} ===");
        return Err(format!("Kimi 返回错误 {status}: {body}"));
    }

    let data: ChatResponse = res.json().await.map_err(|e| {
        println!("=== Kimi 响应解析失败: {e} ===");
        format!("Kimi 响应解析失败: {e}")
    })?;
    data.choices
        .first()
        .map(|c| c.message.content.clone())
        .ok_or_else(|| {
            println!("=== Kimi 返回内容为空 ===");
            "Kimi 返回内容为空".to_string()
        })
}

/// 调用 Kimi 视觉模型（moonshot-v1-8k-vision-preview）识别图片
/// system 为系统提示词，text 为附加文本（如文件名），image_b64 为图片 base64
pub async fn chat_vision(
    app: &tauri::AppHandle,
    system: &str,
    text: &str,
    image_b64: &str,
) -> Result<String, String> {
    let key = api_key(app)?;
    let client = reqwest::Client::builder()
        .timeout(TIMEOUT)
        .build()
        .map_err(|e| format!("HTTP 客户端初始化失败: {e}"))?;

    // 多模态消息：content 为数组，含 text 与 image_url
    let image_data_url = format!("data:image/png;base64,{image_b64}");
    let messages = serde_json::json!([
        {
            "role": "system",
            "content": system
        },
        {
            "role": "user",
            "content": [
                { "type": "text", "text": text },
                { "type": "image_url", "image_url": { "url": image_data_url } }
            ]
        }
    ]);

    let req = serde_json::json!({
        "model": VISION_MODEL,
        "messages": messages,
        "temperature": 0.1,
        "max_tokens": 4000,
        "response_format": { "type": "json_object" }
    });

    let res = client
        .post(BASE_URL)
        .header("Authorization", format!("Bearer {key}"))
        .header("Content-Type", "application/json")
        .json(&req)
        .send()
        .await
        .map_err(|e| format!("Kimi 视觉请求失败: {e}"))?;

    let status = res.status();
    if !status.is_success() {
        let body = res.text().await.unwrap_or_default();
        return Err(format!("Kimi 视觉返回错误 {status}: {body}"));
    }

    let data: ChatResponse = res.json().await.map_err(|e| format!("Kimi 视觉响应解析失败: {e}"))?;
    data.choices
        .first()
        .map(|c| c.message.content.clone())
        .ok_or_else(|| "Kimi 视觉返回内容为空".to_string())
}
