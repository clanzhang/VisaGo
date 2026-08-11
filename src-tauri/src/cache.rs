// src/cache.rs — 本地文件缓存（签证数据）
use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

const CACHE_DIR: &str = "visago_data";
const TTL_DAYS: i64 = 7;

#[derive(Serialize, Deserialize)]
struct CacheEntry {
    data: serde_json::Value,
    updated_at: i64, // unix 秒
}

fn cache_dir(app_dir: &std::path::Path) -> PathBuf {
    app_dir.join(CACHE_DIR)
}

fn entry_path(app_dir: &std::path::Path, key: &str) -> PathBuf {
    // 防止路径穿越
    let safe_key: String = key.chars().filter(|c| c.is_alphanumeric() || *c == '_' || *c == '-').collect();
    cache_dir(app_dir).join(format!("{safe_key}.json"))
}

/// 读取缓存；不存在或超过 7 天返回 None
pub fn read(app_dir: &std::path::Path, key: &str) -> Option<serde_json::Value> {
    let path = entry_path(app_dir, key);
    let content = std::fs::read_to_string(path).ok()?;
    let entry: CacheEntry = serde_json::from_str(&content).ok()?;
    let now = Utc::now().timestamp();
    if now - entry.updated_at > TTL_DAYS * 86400 {
        return None;
    }
    Some(entry.data)
}

/// 写入缓存
pub fn write(app_dir: &std::path::Path, key: &str, data: serde_json::Value) {
    if let Ok(_) = std::fs::create_dir_all(cache_dir(app_dir)) {
        let entry = CacheEntry {
            data,
            updated_at: Utc::now().timestamp(),
        };
        if let Ok(json) = serde_json::to_string_pretty(&entry) {
            let _ = std::fs::write(entry_path(app_dir, key), json);
        }
    }
}

/// 判断缓存是否存在且未过期
#[allow(dead_code)] // 供 7 天缓存刷新策略使用
pub fn is_fresh(app_dir: &std::path::Path, key: &str) -> bool {
    read(app_dir, key).is_some()
}
