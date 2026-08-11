// src/recognizer.rs — 调用 Kimi 识别签证材料文件
use serde::{Deserialize, Serialize};

use crate::kimi;

#[derive(Serialize, Deserialize, Clone)]
pub struct RecognizedDoc {
    pub category: String, // 身份证/护照/银行流水/在职证明/户口本/房产证/其他
    pub fields: serde_json::Value,
    pub summary: String,
}

/// 完整字段提取 Prompt：要求 Kimi 读取文件完整文本，输出标准字段 JSON
const RECOGNIZE_PROMPT: &str = r#"你是一个签证材料识别专家。以下是用户文件的完整文本内容。
请从中提取所有可用的个人信息，输出严格 JSON 格式：
{
  "name": "姓名",
  "id_number": "身份证号",
  "passport_number": "护照号",
  "nationality": "国籍",
  "gender": "性别（男/女）",
  "birth_date": "出生日期（YYYY-MM-DD）",
  "phone": "手机号",
  "home_province": "户籍省份",
  "home_address": "家庭住址",
  "occupation": "职业（employed/student/retired/freelance）",
  "company": "公司名称",
  "position": "职位",
  "salary": "薪资",
  "passport_issued_in": "护照签发地"
}
同时输出：
"category": "文件类型（身份证/护照/银行流水/在职证明/户口本/房产证/其他）",
"summary": "一句话描述"
规则：
1. 能提取的字段填真实值
2. 文本中没有的字段填 null
3. 不要编造数据
4. 只输出 JSON，不要其他内容"#;

/// 识别单个文件（文件名 + 文件文本内容 + 可选图片 base64 调 Kimi）
pub async fn recognize_file(
    path: &str,
    name: &str,
    file_text: Option<String>,
    content_b64: Option<String>,
) -> Result<RecognizedDoc, String> {
    let mut msg = format!("文件名称：{name}\n文件路径：{path}\n");

    // 优先传文本内容（PDF/DOCX 提取的真实文本）
    if let Some(text) = &file_text {
        let text = text.trim();
        if !text.is_empty() {
            msg.push_str(&format!("文件文本内容：\n{text}\n"));
        } else {
            msg.push_str("文件文本内容：<空>（可能是扫描件/图片型文件）\n");
        }
    }

    // 图片类：追加 base64（Kimi 支持图片理解）
    if let Some(b64) = content_b64 {
        if b64.len() < 3_000_000 {
            msg.push_str(&format!("文件图片(base64)：{b64}\n"));
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

    println!("[recognize] Kimi 原始响应(前300): {}", raw.chars().take(300).collect::<String>());

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

    // 兼容两种格式：
    // 1. 包装式 { "category": ..., "fields": {...}, "summary": ... }
    // 2. 平铺式 { "name": ..., "category": ... } 字段直接在最外层
    let (category, fields) = if json.get("fields").is_some() {
        (
            json["category"].as_str().unwrap_or("其他").to_string(),
            json["fields"].clone(),
        )
    } else {
        // 平铺式：category 在最外层，其余字段作为 fields
        let cat = json["category"].as_str().unwrap_or("其他").to_string();
        let mut fields = json.clone();
        // 从 fields 中移除元字段
        if let serde_json::Value::Object(map) = &mut fields {
            map.remove("category");
            map.remove("summary");
        }
        (cat, fields)
    };

    println!("[recognize] 解析结果: category={}, fields={}", category, fields);

    Ok(RecognizedDoc {
        category,
        fields,
        summary: json["summary"].as_str().unwrap_or("").to_string(),
    })
}
