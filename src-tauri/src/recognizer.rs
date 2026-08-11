// src/recognizer.rs — 调用 Kimi 识别签证材料文件
use serde::{Deserialize, Serialize};

use crate::kimi;

#[derive(Serialize, Deserialize, Clone)]
pub struct RecognizedDoc {
    pub category: String, // 身份证/护照/银行流水/在职证明/户口本/房产证/其他
    pub fields: serde_json::Value,
    pub summary: String,
}

const RECOGNIZE_PROMPT: &str = "这是用户的签证申请材料。识别文件类型（身份证/护照/银行流水/在职证明/户口本/房产证/其他），提取所有关键字段，输出严格 JSON，不要任何额外文字：
{
  \"category\": \"护照\",
  \"summary\": \"一句话描述\",
  \"fields\": {
    \"姓名\": \"张三\",
    \"护照号\": \"E12345678\"
  }
}";

/// 识别单个文件（通过文件名 + 内容 base64 调 Kimi）
pub async fn recognize_file(path: &str, name: &str, content_b64: Option<String>) -> Result<RecognizedDoc, String> {
    let mut msg = format!("文件名称：{name}\n文件路径：{path}\n");

    if let Some(b64) = content_b64 {
        // 图片类：传 base64（限制长度，避免超 token）
        if b64.len() < 3_000_000 {
            msg.push_str(&format!("文件内容(base64，图片): {b64}\n"));
        }
    }

    let raw = kimi::chat(
        vec![
            kimi::ChatMessage {
                role: "system".to_string(),
                content: RECOGNIZE_PROMPT.to_string(),
            },
            kimi::ChatMessage {
                role: "user".to_string(),
                content: msg,
            },
        ],
        kimi::ChatOptions {
            temperature: Some(0.1),
            max_tokens: Some(4000),
            ..Default::default()
        },
    )
    .await?;

    // 提取 JSON
    let json: serde_json::Value = serde_json::from_str(&raw).unwrap_or_else(|_| {
        // 容忍 markdown 包裹
        let start = raw.find('{');
        let end = raw.rfind('}');
        if let (Some(s), Some(e)) = (start, end) {
            raw[s..=e].parse().unwrap_or(serde_json::Value::Null)
        } else {
            serde_json::Value::Null
        }
    });

    if json.is_null() {
        return Err("Kimi 无法解析该文件".to_string());
    }

    Ok(RecognizedDoc {
        category: json["category"].as_str().unwrap_or("其他").to_string(),
        fields: json["fields"].clone(),
        summary: json["summary"].as_str().unwrap_or("").to_string(),
    })
}
