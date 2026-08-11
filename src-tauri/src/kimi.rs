// src/kimi.rs — Kimi API 封装（Key 存于 Rust 端，不暴露给前端）
use serde::{Deserialize, Serialize};
use std::time::Duration;

const BASE_URL: &str = "https://api.moonshot.cn/v1/chat/completions";
const MODEL: &str = "moonshot-v1-128k";
const TIMEOUT: Duration = Duration::from_secs(30);

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

/// 从环境变量读取 Kimi Key（Tauri 打包时通过 .env / 环境注入，不硬编码进二进制源码）
pub fn api_key() -> Result<String, String> {
    std::env::var("KIMI_API_KEY").or_else(|_| {
        // 尝试读取项目根 .env
        let env_path = std::path::Path::new(".env");
        if let Ok(content) = std::fs::read_to_string(env_path) {
            for line in content.lines() {
                if let Some((k, v)) = line.trim().split_once('=') {
                    if k.trim() == "KIMI_API_KEY" {
                        return Ok(v.trim().to_string());
                    }
                }
            }
        }
        Err("未找到 KIMI_API_KEY，请在环境变量或 .env 中配置".to_string())
    })
}

/// 调用 Kimi Chat Completions，返回回复文本
pub async fn chat(messages: Vec<ChatMessage>, options: ChatOptions) -> Result<String, String> {
    let key = api_key()?;
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
        .map_err(|e| format!("Kimi 请求失败: {e}"))?;

    let status = res.status();
    if !status.is_success() {
        let body = res.text().await.unwrap_or_default();
        return Err(format!("Kimi 返回错误 {status}: {body}"));
    }

    let data: ChatResponse = res.json().await.map_err(|e| format!("Kimi 响应解析失败: {e}"))?;
    data.choices
        .first()
        .map(|c| c.message.content.clone())
        .ok_or_else(|| "Kimi 返回内容为空".to_string())
}
