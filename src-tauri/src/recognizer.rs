// src/recognizer.rs — 调用 Kimi 识别签证材料文件
use serde::{Deserialize, Serialize};

use crate::kimi;
use crate::{log_debug, log_info};

#[derive(Serialize, Deserialize, Clone)]
pub struct RecognizedDoc {
    pub category: String, // 身份证/护照/银行流水/在职证明/户口本/房产证/其他
    pub fields: serde_json::Value,
    pub summary: String,
}

/// 完整字段提取 Prompt：要求 Kimi 读取文件完整文本，输出标准字段 JSON
const RECOGNIZE_PROMPT: &str = r#"你是一个签证材料识别专家。以下是用户文件的完整文本内容。
如果文件是户口本，优先提取与户主关系为'子'或'女'的申请人信息，不要提取户主或配偶的信息。
如果文件包含多人信息（如户口本），识别申请人本人的资料，忽略其他家庭成员。
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
  "address": "家庭住址",
  "occupation": "职业（employed/student/retired/freelance）",
  "company": "公司名称",
  "position": "职位",
  "salary": "薪资",
  "passport_issued_in": "护照签发地",
  "family": [
    { "name": "成员姓名", "relation": "与申请人关系（父/母/配偶/子/女）", "idNumber": "身份证号" }
  ]
}
family 数组规则：如果文件是户口本，列出户口本中除申请人外的家庭成员（父/母/配偶/兄弟姐妹等）；如果文件中没有家庭成员信息，family 填 null。
如果文件是【行程单】，除上述字段外，必须额外提取行程信息：
{
  "trip": {
    "destination": "目的地国家/城市",
    "start_date": "出发日期（YYYY-MM-DD）",
    "end_date": "返回日期（YYYY-MM-DD）",
    "days": "总天数（数字）",
    "cities": ["途经城市1", "城市2"],
    "daily_plan": [
      { "day": 1, "date": "MM-DD", "city": "城市", "activity": "当日安排", "transport": "交通方式", "accommodation": "住宿" }
    ]
  }
}
同时输出：
"category": "文件类型（身份证/护照/银行流水/在职证明/户口本/房产证/行程单/其他）",
"summary": "一句话描述"
规则：
1. 能提取的字段填真实值，行程信息从文件文本中逐字提取，不要编造
2. 文本中没有的字段填 null
3. 不要编造数据
4. 只输出纯 JSON，不要包裹在 markdown 代码块（```json）中，不要加任何解释文字或前后缀
5. 多人的文件中（如户口本），以申请人为准，不要混淆"#;

/// 根据文件名返回针对性识别提示（户口本/银行流水等多信息文件）
fn file_type_hint(name: &str) -> String {
    if name.contains("户口本") || name.contains("户籍") {
        return "该文件是户口本，包含多人信息。请提取与户主关系为'子'的申请人信息，不要提取户主或配偶的信息。".to_string();
    }
    if name.contains("银行流水") || name.contains("流水") {
        return "该文件是银行流水，客户名为申请人本人。".to_string();
    }
    String::new()
}

/// 识别单个文件（文件名 + 文件文本内容 + 可选图片 base64 调 Kimi）
pub async fn recognize_file(
    app: &tauri::AppHandle,
    path: &str,
    name: &str,
    file_text: Option<String>,
    content_b64: Option<String>,
) -> Result<RecognizedDoc, String> {
    let raw = if let Some(b64) = &content_b64 {
        // 图片类 / 扫描件 PDF 渲染图：走视觉模型识图
        if b64.len() >= 3_000_000 {
            log_debug!("[recognize] 图片 base64 过大 ({}), 跳过识图", b64.len());
            // 过大则用文件名提示走文本模型
            let hint = file_type_hint(name);
            let hint_text = if hint.is_empty() { String::new() } else { format!("【识别提示】{hint}\n") };
            let msg = format!(
                "文件名称：{name}\n文件路径：{path}\n{hint_text}（图片过大无法识别，请根据文件名「{name}」判断文件类型，尽力提取字段；无法确定则 category 填\"其他\"，fields 全部填 null）"
            );
            kimi::chat(
                app,
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
                    model: None,
                    temperature: Some(0.1),
                    max_tokens: Some(4000),
                    response_format: Some(serde_json::json!({ "type": "json_object" })),
                    ..Default::default()
                },
            )
            .await?
        } else {
            // 正常：视觉模型 + 图片
            log_debug!("[recognize] 使用视觉模型识别图片 (base64 长度 {})", b64.len());
            let hint = file_type_hint(name);
            let hint_text = if hint.is_empty() { String::new() } else { format!("【识别提示】{hint}\n") };
            let text = format!(
                "文件名称：{name}\n文件路径：{path}\n{hint_text}{}\n请识别图片中的签证材料内容，提取字段。",
                file_text.as_deref().unwrap_or("")
            );
            kimi::chat_vision(app, RECOGNIZE_PROMPT, &text, b64).await?
        }
    } else {
        // 文本类文件（PDF 有文本层 / DOCX）：走文本模型
        let mut msg = format!("文件名称：{name}\n文件路径：{path}\n");
        // 针对多信息文件（户口本/银行流水）加识别提示
        let hint = file_type_hint(name);
        if !hint.is_empty() {
            msg.push_str(&format!("【识别提示】{hint}\n"));
        }
        log_debug!("[recognize] 文件路径: {path}");

        if let Some(text) = &file_text {
            let text = text.trim();
            if !text.is_empty() {
                log_debug!("[recognize] 提取文本长度: {} 字符", text.len());
                // 文本内容只打印长度，不打印值（防隐私泄露）
                msg.push_str(&format!("文件文本内容：\n{text}\n"));
            } else {
                log_debug!("[recognize] 提取文本长度: 0（扫描件/图片型文件）");
                msg.push_str("文件文本内容：<空>（可能是扫描件/图片型文件）\n");
            }
        }

        kimi::chat(
            app,
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
                model: None,
                temperature: Some(0.1),
                max_tokens: Some(4000),
                response_format: Some(serde_json::json!({ "type": "json_object" })),
                ..Default::default()
            },
        )
        .await?
    };

    // 只打印长度，不打印原始响应内容（防隐私泄露）
    log_debug!("[recognize] Kimi 返回 {} 字符", raw.len());

    // 提取 JSON：先尝试整体解析，失败则 strip markdown 代码块再解析
    let json: serde_json::Value = {
        // 去除 ```json / ``` 代码块标记（若 Kimi 误包）
        let cleaned = raw.replace("```json", "").replace("```", "").trim().to_string();
        serde_json::from_str(&cleaned).unwrap_or_else(|_| {
            // 再兜底：截取第一个 { 到最后一个 }
            let start = raw.find('{');
            let end = raw.rfind('}');
            if let (Some(s), Some(e)) = (start, end) {
                raw[s..=e].parse().unwrap_or(serde_json::Value::Null)
            } else {
                serde_json::Value::Null
            }
        })
    };

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

    // 只打印数量和元信息，不打印字段值
    let field_count = fields.as_object().map(|m| m.len()).unwrap_or(0);
    log_info!("[recognize] ok, category={category}, {field_count} fields");

    Ok(RecognizedDoc {
        category,
        fields,
        summary: json["summary"].as_str().unwrap_or("").to_string(),
    })
}