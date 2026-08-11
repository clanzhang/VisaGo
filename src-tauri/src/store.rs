// src/store.rs — 本地数据读写（user_profile / scanned_files / applications）
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

fn read_json<T: for<'de> Deserialize<'de>>(path: &PathBuf) -> Option<T> {
    std::fs::read_to_string(path)
        .ok()
        .and_then(|s| serde_json::from_str(&s).ok())
}

fn write_json<T: Serialize>(path: &PathBuf, value: &T) -> Result<(), String> {
    let json = serde_json::to_string_pretty(value).map_err(|e| e.to_string())?;
    std::fs::write(path, json).map_err(|e| format!("写入失败: {e}"))
}

/// 保存用户资料
pub fn save_profile(app: &tauri::AppHandle, profile: &UserProfile) -> Result<(), String> {
    let path = data_dir(app)?.join("user_profile.json");
    write_json(&path, profile)
}

/// 加载用户资料
pub fn load_profile(app: &tauri::AppHandle) -> Result<Option<UserProfile>, String> {
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
