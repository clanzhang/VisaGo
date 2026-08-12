// src/store.rs — 本地数据读写（profiles / scanned_files / applications）
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::Manager;

/// 用户资料（所有字段可空/默认，容忍前端缺字段）
#[derive(Serialize, Deserialize, Clone, Default)]
pub struct UserProfile {
    #[serde(default)]
    pub name: String,
    #[serde(default)]
    pub passport_number: String,
    #[serde(default)]
    pub nationality: String,
    #[serde(default)]
    pub birth_date: String,
    #[serde(default)]
    pub gender: String,
    #[serde(default)]
    pub id_number: String,
    #[serde(default)]
    pub phone: String,
    #[serde(default)]
    pub address: String,
    #[serde(default)]
    pub home_province: String,
    #[serde(default)]
    pub occupation: String,
    #[serde(default)]
    pub company: String,
    #[serde(default)]
    pub position: String,
    #[serde(default)]
    pub salary: String,
    #[serde(default)]
    pub passport_issued_in: String,
    #[serde(default)]
    pub has_history_visa: bool,
}

/// 资料卡（多用户资料，每张一个 JSON 文件）
#[derive(Serialize, Deserialize, Clone, Default)]
pub struct ProfileCard {
    #[serde(default)]
    pub id: String,          // profile_001
    #[serde(default)]
    pub name: String,        // 用户命名，如「我的资料」
    #[serde(default)]
    pub fields: UserProfile, // 提取/填写的字段
    #[serde(default)]
    pub created_at: String,
    #[serde(default)]
    pub updated_at: String,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct ScannedFile {
    pub path: String,
    pub name: String,
    pub file_type: String, // pdf/jpg/png/docx
    pub size: u64,
    pub recognized: bool,
    pub doc_category: String, // 身份证/护照/银行流水/在职证明/户口本/房产证/其他
    pub fields: serde_json::Value, // Kimi 提取的字段
    pub error: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Default)]
pub struct ScannedFiles {
    pub folder: String,
    pub scanned_at: String,
    pub files: Vec<ScannedFile>,
}

fn data_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("无法获取数据目录: {e}"))?;
    let data = dir.join("data");
    std::fs::create_dir_all(&data).map_err(|e| format!("创建数据目录失败: {e}"))?;
    Ok(data)
}

fn profiles_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let dir = data_dir(app)?.join("profiles");
    std::fs::create_dir_all(&dir).map_err(|e| format!("创建资料卡目录失败: {e}"))?;
    Ok(dir)
}

fn read_json<T: for<'de> Deserialize<'de>>(path: &PathBuf) -> Option<T> {
    std::fs::read_to_string(path)
        .ok()
        .and_then(|s| serde_json::from_str(&s).ok())
}

fn write_json<T: Serialize>(path: &PathBuf, value: &T) -> Result<(), String> {
    let json = serde_json::to_string_pretty(value).map_err(|e| e.to_string())?;
    std::fs::write(path, json).map_err(|e| format!("写入失败: {e}"))
}

// ===== 多资料卡管理 =====

/// 列出全部资料卡（按序号排序）
pub fn list_profiles(app: &tauri::AppHandle) -> Result<Vec<ProfileCard>, String> {
    let dir = profiles_dir(app)?;
    let mut cards = Vec::new();
    let mut entries: Vec<_> = std::fs::read_dir(&dir)
        .map_err(|e| format!("读取资料卡目录失败: {e}"))?
        .flatten()
        .filter(|e| e.path().extension().map(|x| x == "json").unwrap_or(false))
        .filter(|e| {
            e.file_name()
                .to_str()
                .map(|n| n.starts_with("profile_"))
                .unwrap_or(false)
        })
        .collect();
    entries.sort_by_key(|e| e.file_name());
    for entry in entries {
        if let Some(card) = read_json::<ProfileCard>(&entry.path()) {
            cards.push(card);
        }
    }
    Ok(cards)
}

/// 读取单个资料卡
pub fn get_profile(app: &tauri::AppHandle, id: &str) -> Result<Option<ProfileCard>, String> {
    let path = profiles_dir(app)?.join(format!("{id}.json"));
    Ok(read_json(&path))
}

/// 生成下一个资料卡序号（profile_001, profile_002...）
fn next_profile_id(app: &tauri::AppHandle) -> Result<String, String> {
    let dir = profiles_dir(app)?;
    let mut max = 0usize;
    for entry in std::fs::read_dir(&dir).map_err(|e| format!("读取资料卡目录失败: {e}"))?.flatten() {
        let name = entry.file_name().to_string_lossy().to_string();
        if let Some(num) = name.strip_prefix("profile_").and_then(|n| n.strip_suffix(".json")) {
            if let Ok(n) = num.parse::<usize>() {
                max = max.max(n);
            }
        }
    }
    Ok(format!("profile_{:03}", max + 1))
}

/// 新建资料卡
pub fn create_profile(app: &tauri::AppHandle, card_name: &str) -> Result<ProfileCard, String> {
    let id = next_profile_id(app)?;
    let now = chrono::Utc::now().to_rfc3339();
    let card = ProfileCard {
        id: id.clone(),
        name: if card_name.trim().is_empty() {
            format!("资料卡 {id}")
        } else {
            card_name.trim().to_string()
        },
        fields: UserProfile::default(),
        created_at: now.clone(),
        updated_at: now,
    };
    let path = profiles_dir(app)?.join(format!("{id}.json"));
    write_json(&path, &card)?;
    Ok(card)
}

/// 保存资料卡（新增或覆盖）
pub fn save_profile_card(app: &tauri::AppHandle, card: &ProfileCard) -> Result<(), String> {
    let mut card = card.clone();
    card.updated_at = chrono::Utc::now().to_rfc3339();
    let path = profiles_dir(app)?.join(format!("{}.json", card.id));
    write_json(&path, &card)
}

/// 删除资料卡
pub fn delete_profile(app: &tauri::AppHandle, id: &str) -> Result<(), String> {
    let path = profiles_dir(app)?.join(format!("{id}.json"));
    if path.exists() {
        std::fs::remove_file(&path).map_err(|e| format!("删除资料卡失败: {e}"))?;
    }
    // 若删除的是活跃卡，清空活跃记录
    if let Ok(Some(active)) = get_active_profile_id(app) {
        if active == id {
            let _ = set_active_profile_id(app, None);
        }
    }
    Ok(())
}

/// 读取当前活跃资料卡 id
pub fn get_active_profile_id(app: &tauri::AppHandle) -> Result<Option<String>, String> {
    let path = profiles_dir(app)?.join("active_profile_id.json");
    Ok(read_json::<serde_json::Value>(&path).and_then(|v| v.as_str().map(|s| s.to_string())))
}

/// 设置当前活跃资料卡 id
pub fn set_active_profile_id(app: &tauri::AppHandle, id: Option<&str>) -> Result<(), String> {
    let path = profiles_dir(app)?.join("active_profile_id.json");
    let value = serde_json::json!(id);
    write_json(&path, &value)
}

// ===== 兼容旧版单资料 =====

/// 保存用户资料（兼容旧命令，若存在活跃卡则更新其 fields）
pub fn save_profile(app: &tauri::AppHandle, profile: &UserProfile) -> Result<(), String> {
    // 优先写入活跃资料卡
    if let Ok(Some(active_id)) = get_active_profile_id(app) {
        if let Ok(Some(mut card)) = get_profile(app, &active_id) {
            card.fields = profile.clone();
            return save_profile_card(app, &card);
        }
    }
    // 无活跃卡：保存为默认 user_profile.json（兼容）
    let path = data_dir(app)?.join("user_profile.json");
    write_json(&path, profile)
}

/// 加载用户资料（优先活跃卡，其次旧版 user_profile.json）
pub fn load_profile(app: &tauri::AppHandle) -> Result<Option<UserProfile>, String> {
    if let Ok(Some(active_id)) = get_active_profile_id(app) {
        if let Ok(Some(card)) = get_profile(app, &active_id) {
            return Ok(Some(card.fields));
        }
    }
    let path = data_dir(app)?.join("user_profile.json");
    Ok(read_json(&path))
}

/// 保存扫描记录
pub fn save_scanned(app: &tauri::AppHandle, scanned: &ScannedFiles) -> Result<(), String> {
    let path = data_dir(app)?.join("scanned_files.json");
    write_json(&path, scanned)
}

/// 加载扫描记录
pub fn load_scanned(app: &tauri::AppHandle) -> Result<Option<ScannedFiles>, String> {
    let path = data_dir(app)?.join("scanned_files.json");
    Ok(read_json(&path))
}

/// 保存申请记录
#[allow(dead_code)] // 供申请记录持久化使用
pub fn save_application(
    app: &tauri::AppHandle,
    id: &str,
    data: &serde_json::Value,
) -> Result<(), String> {
    let dir = data_dir(app)?.join("applications");
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let path = dir.join(format!("{id}.json"));
    write_json(&path, data)
}

/// 列出申请记录
#[allow(dead_code)] // 供申请记录列表展示使用
pub fn list_applications(app: &tauri::AppHandle) -> Result<Vec<String>, String> {
    let dir = data_dir(app)?.join("applications");
    let mut names = Vec::new();
    if let Ok(entries) = std::fs::read_dir(dir) {
        for entry in entries.flatten() {
            if let Some(name) = entry.file_name().to_str() {
                names.push(name.to_string());
            }
        }
    }
    Ok(names)
}
