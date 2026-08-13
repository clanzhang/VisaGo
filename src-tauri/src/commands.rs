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
    println!("=== ai_chat 收到 messages 数: {} ===", messages.len());
    for (i, m) in messages.iter().enumerate() {
        println!("=== ai_chat message[{}] role={}, content前200字: {} ===", i, m.role, m.content.chars().take(200).collect::<String>());
    }
    let msgs = messages
        .into_iter()
        .map(|m| kimi::ChatMessage {
            role: m.role,
            content: m.content,
        })
        .collect::<Vec<_>>();
    let opts = options.unwrap_or_default();
    println!("=== ai_chat model: {:?}, max_tokens: {:?} ===", opts.model, opts.max_tokens);
    let result = kimi::chat(
        msgs,
        kimi::ChatOptions {
            model: opts.model,
            temperature: opts.temperature,
            max_tokens: opts.max_tokens,
            response_format: opts.response_format,
        },
    )
    .await;
    match &result {
        Ok(content) => println!("=== ai_chat Kimi 返回 (前1000字): {} ===", content.chars().take(1000).collect::<String>()),
        Err(e) => println!("=== ai_chat Kimi 错误: {} ===", e),
    }
    Ok(AiChatResponse { content: result? })
}

/// IPC: kimi_chat — 简单版 Kimi 对话（单 prompt，可指定模型）
#[tauri::command]
pub(crate) async fn kimi_chat(prompt: String, model: Option<String>) -> Result<String, String> {
    println!("=== 生成请求 prompt 长度: {} 字符 ===", prompt.chars().count());
    println!("=== 生成请求 model: {:?} ===", model);
    println!("=== 生成请求 prompt 前500字: {} ===", prompt.chars().take(500).collect::<String>());
    let messages = vec![kimi::ChatMessage {
        role: "user".to_string(),
        content: prompt,
    }];
    let result = kimi::chat(
        messages,
        kimi::ChatOptions {
            model,
            temperature: Some(0.3),
            max_tokens: Some(6000),
            ..Default::default()
        },
    )
    .await;
    match &result {
        Ok(resp) => {
            println!("=== Kimi 返回 (前1000字): {} ===", resp.chars().take(1000).collect::<String>());
        }
        Err(e) => {
            println!("=== Kimi 错误: {} ===", e);
        }
    }
    result
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
                // 文本充足（≥50 字符）→ 文本识别
                Ok(text) if text.trim().chars().count() >= 50 => {
                    println!("[recognize] PDF 文本提取成功: {} 字符，走文本识别", text.chars().count());
                    file_text = Some(text);
                }
                // 文本为空或过短（<50）→ 扫描件，sips 渲染为图片走视觉识别
                Ok(text) => {
                    println!("[recognize] PDF 文本不足 ({} 字符)，判断为扫描件，sips 渲染为图片走视觉识别", text.trim().chars().count());
                    match crate::scanner::render_pdf_to_png(&path) {
                        Ok(b64) => {
                            println!("[recognize] sips 渲染 PDF 成功，图片 base64 长度 {}", b64.len());
                            content_b64 = Some(b64);
                        }
                        Err(e) => {
                            println!("[recognize] sips 渲染 PDF 失败: {e}，回退为文件名识别");
                            file_text = Some(format!(
                                "（这是一个扫描件/图片型 PDF，无法直接提取文本。请根据文件名「{name}」和你的常识判断该文件类型，并尽力提取字段；若无法确定则 category 填\"其他\"，fields 全部填 null）"
                            ));
                        }
                    }
                }
                Err(e) => {
                    println!("[recognize] PDF 文本提取失败: {e}，尝试 sips 渲染为图片");
                    match crate::scanner::render_pdf_to_png(&path) {
                        Ok(b64) => {
                            println!("[recognize] sips 渲染 PDF 成功，图片 base64 长度 {}", b64.len());
                            content_b64 = Some(b64);
                        }
                        Err(e2) => {
                            println!("[recognize] sips 渲染 PDF 失败: {e2}，回退为文件名识别");
                            file_text = Some(format!(
                                "（PDF 提取失败。请根据文件名「{name}」和你的常识判断该文件类型，尽力提取字段；若无法确定则 category 填\"其他\"，fields 全部填 null）"
                            ));
                        }
                    }
                }
            }
        }
        "docx" | "doc" => {
            match scanner::extract_docx_text(&path) {
                Ok(text) if text.trim().chars().count() >= 50 => {
                    println!("[recognize] DOCX 文本提取成功: {} 字符，走文本识别", text.chars().count());
                    file_text = Some(text);
                }
                // DOCX 文本为空或过短 → 尝试渲染为图片走视觉识别
                _ => {
                    println!("[recognize] DOCX 文本不足，尝试 sips 渲染为图片走视觉识别");
                    match crate::scanner::render_pdf_to_png(&path) {
                        Ok(b64) => {
                            println!("[recognize] DOCX sips 渲染成功，图片 base64 长度 {}", b64.len());
                            content_b64 = Some(b64);
                        }
                        Err(e) => {
                            println!("[recognize] DOCX 无文本且无法渲染: {e}");
                        }
                    }
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

/// IPC: list_profiles — 列出全部资料卡
#[tauri::command]
pub(crate) fn list_profiles(app: tauri::AppHandle) -> Result<Vec<store::ProfileCard>, String> {
    let r = store::list_profiles(&app);
    match &r {
        Ok(cards) => println!("[IPC] list_profiles: {} 张资料卡", cards.len()),
        Err(e) => println!("[IPC] list_profiles 失败: {e}"),
    }
    r
}

/// IPC: create_profile — 新建资料卡
#[tauri::command]
pub(crate) fn create_profile(app: tauri::AppHandle, name: String) -> Result<store::ProfileCard, String> {
    println!("[IPC] create_profile: name={name}");
    store::create_profile(&app, &name)
}

/// IPC: save_profile_card — 保存资料卡（新增/覆盖）
#[tauri::command]
pub(crate) fn save_profile_card(
    app: tauri::AppHandle,
    card: store::ProfileCard,
) -> Result<(), String> {
    println!("[IPC] save_profile_card: id={}, name={}", card.id, card.name);
    store::save_profile_card(&app, &card)
}

/// IPC: delete_profile — 删除资料卡
#[tauri::command]
pub(crate) fn delete_profile(app: tauri::AppHandle, id: String) -> Result<(), String> {
    println!("[IPC] delete_profile: id={id}");
    store::delete_profile(&app, &id)
}

/// IPC: get_active_profile_id — 读取当前活跃资料卡 id
#[tauri::command]
pub(crate) fn get_active_profile_id(app: tauri::AppHandle) -> Result<Option<String>, String> {
    store::get_active_profile_id(&app)
}

/// IPC: set_active_profile_id — 设置当前活跃资料卡 id
#[tauri::command]
pub(crate) fn set_active_profile_id(
    app: tauri::AppHandle,
    id: Option<String>,
) -> Result<(), String> {
    println!("[IPC] set_active_profile_id: {id:?}");
    store::set_active_profile_id(&app, id.as_deref())
}

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

// ===== 签证提醒 =====

/// 提醒项 DTO
#[derive(Serialize)]
pub struct ReminderDto {
    pub id: String,          // 申请 id
    pub title: String,       // 标题（国家+签证类型）
    pub kind: String,        // submission / issue
    pub date: String,        // 提醒日期
    pub body: String,        // 提醒内容
}

/// IPC: check_reminders — 检查所有申请的递签/出签提醒
/// 返回今天有提醒的列表（submission_date 或 expected_issue_date 与今天匹配），
/// 并自动推送 macOS 系统通知（即使应用最小化也能弹出）。
#[tauri::command]
pub(crate) fn check_reminders(app: tauri::AppHandle) -> Vec<ReminderDto> {
    println!("[IPC] check_reminders 被调用");
    let mut reminders = Vec::new();
    let today = chrono::Local::now().format("%Y-%m-%d").to_string();

    // 读取设置：desktopNotification 为 true 才推系统通知
    let settings = store::load_settings(&app).unwrap_or_default();
    let push_system = settings.desktop_notification;
    println!("[IPC] check_reminders: desktop_notification={push_system}");

    for app_json in store::load_all_applications(&app) {
        let id = app_json["id"].as_str().unwrap_or("").to_string();
        // 标题：国家名 + 签证类型名
        let title = app_json["title"]
            .as_str()
            .map(|s| s.to_string())
            .unwrap_or_else(|| {
                let c = app_json["countryName"].as_str().unwrap_or("申请");
                let v = app_json["visaTypeName"].as_str().unwrap_or("");
                if v.is_empty() { c.to_string() } else { format!("{c} {v}") }
            });

        // 递签提醒：submission_date == 今天
        if let Some(d) = app_json["submission_date"].as_str() {
            if d == today && settings.notify_submission {
                println!("[IPC] 匹配到递签提醒: {title} @ {d}");
                let body = format!("今天（{d}）是递签日期，请带齐材料前往签证中心");
                reminders.push(ReminderDto {
                    id: id.clone(),
                    title: title.clone(),
                    kind: "submission".into(),
                    date: d.to_string(),
                    body: body.clone(),
                });
                if push_system {
                    push_system_notification(&app, "VisaGo 签证提醒", &body);
                }
            }
        }
        // 出签提醒：expected_issue_date == 今天 或 前 3 天（notify_pre_issue）
        if let Some(d) = app_json["expected_issue_date"].as_str() {
            let is_today = d == today;
            let is_pre_issue = settings.notify_pre_issue && is_within_days(d, &today, 3);
            if (is_today && settings.notify_submission) || (is_pre_issue && !is_today) {
                println!("[IPC] 匹配到出签提醒: {title} @ {d}");
                let body = if is_today {
                    format!("今天（{d}）是预计出签日期，请留意结果通知")
                } else {
                    format!("预计 {d} 出签，请留意结果通知（约 3 天内）")
                };
                reminders.push(ReminderDto {
                    id,
                    title: title.clone(),
                    kind: "issue".into(),
                    date: d.to_string(),
                    body: body.clone(),
                });
                if push_system {
                    push_system_notification(&app, "VisaGo 签证提醒", &body);
                }
            }
        }
    }
    println!("[IPC] check_reminders: 共 {} 条提醒", reminders.len());
    reminders
}

/// 判断 target 是否在 today 之后的 n 天内（含当天）
fn is_within_days(target: &str, today: &str, n: i64) -> bool {
    let parse = |s: &str| chrono::NaiveDate::parse_from_str(s, "%Y-%m-%d").ok();
    match (parse(target), parse(today)) {
        (Some(t), Some(td)) => {
            let diff = (t - td).num_days();
            diff >= 0 && diff <= n
        }
        _ => false,
    }
}

/// 推送 macOS 系统通知
fn push_system_notification(app: &tauri::AppHandle, title: &str, body: &str) {
    use tauri_plugin_notification::NotificationExt;
    if let Err(e) = app
        .notification()
        .builder()
        .title(title.to_string())
        .body(body.to_string())
        .show()
    {
        println!("[IPC] 系统通知发送失败: {e}");
    } else {
        println!("[IPC] 系统通知已发送: {title} - {body}");
    }
}

/// IPC: push_notification — 手动推送 macOS 系统通知
#[tauri::command]
pub(crate) fn push_notification(app: tauri::AppHandle, title: String, body: String) -> Result<(), String> {
    println!("[IPC] push_notification: {title} - {body}");
    push_system_notification(&app, &title, &body);
    Ok(())
}

/// IPC: send_notification — 发送系统通知（用户命名，等价 push_notification）
#[tauri::command]
pub(crate) fn send_notification(app: tauri::AppHandle, title: String, body: String) -> Result<(), String> {
    println!("[IPC] send_notification: {title} - {body}");
    push_system_notification(&app, &title, &body);
    Ok(())
}

// ===== 设置 =====

/// IPC: load_settings — 读取用户设置
#[tauri::command]
pub(crate) fn load_settings(app: tauri::AppHandle) -> Result<store::AppSettings, String> {
    store::load_settings(&app)
}

/// IPC: save_settings — 保存用户设置
#[tauri::command]
pub(crate) fn save_settings(app: tauri::AppHandle, settings: store::AppSettings) -> Result<(), String> {
    println!("[IPC] save_settings: desktop={}, submission={}, pre_issue={}, lang={}",
        settings.desktop_notification, settings.notify_submission, settings.notify_pre_issue, settings.language);
    store::save_settings(&app, &settings)
}

/// IPC: request_notification_permission — 请求 macOS 通知权限
#[tauri::command]
pub(crate) fn request_notification_permission(app: tauri::AppHandle) -> Result<bool, String> {
    use tauri_plugin_notification::NotificationExt;
    // permission_state() / request_permission() 均为同步方法
    let state = app.notification().permission_state().unwrap_or(tauri_plugin_notification::PermissionState::Prompt);
    if state == tauri_plugin_notification::PermissionState::Granted {
        println!("[IPC] 通知权限已授予");
        return Ok(true);
    }
    let granted = app
        .notification()
        .request_permission()
        .map_err(|e| format!("请求通知权限失败: {e}"))?;
    println!("[IPC] 通知权限请求结果: {granted:?}");
    Ok(granted == tauri_plugin_notification::PermissionState::Granted)
}

/// IPC: save_application — 保存申请记录到 applications/<id>.json（供提醒检查读取）
#[tauri::command]
pub(crate) fn save_application(app: tauri::AppHandle, id: String, data: serde_json::Value) -> Result<(), String> {
    println!("[IPC] save_application: id={id}, 含日期 submission/issue");
    store::save_application(&app, &id, &data)
}

/// IPC: delete_application — 删除申请记录
#[tauri::command]
pub(crate) fn delete_application(app: tauri::AppHandle, id: String) -> Result<(), String> {
    println!("[IPC] delete_application: id={id}");
    let dir = store::applications_dir(&app)?;
    let path = dir.join(format!("{id}.json"));
    if path.exists() {
        std::fs::remove_file(&path).map_err(|e| format!("删除申请记录失败: {e}"))?;
    }
    Ok(())
}

// ===== 注册 =====

// 命令函数通过 lib.rs 的 Builder.invoke_handler 注册（见 lib.rs）
