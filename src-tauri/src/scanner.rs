// src/scanner.rs — 递归扫描文件夹中的材料文件
use std::path::Path;

const SUPPORTED_EXT: &[&str] = &["pdf", "jpg", "jpeg", "png", "docx", "doc"];

#[derive(serde::Serialize)]
pub struct ScannedItem {
    pub path: String,
    pub name: String,
    pub file_type: String,
    pub size: u64,
}

/// 递归扫描目录，返回支持的材料文件列表
pub fn scan_folder(folder: &str) -> Result<Vec<ScannedItem>, String> {
    let root = Path::new(folder);
    if !root.is_dir() {
        return Err(format!("路径不是文件夹: {folder}"));
    }

    let mut items = Vec::new();
    let mut stack = vec![root.to_path_buf()];

    while let Some(dir) = stack.pop() {
        let entries = std::fs::read_dir(&dir).map_err(|e| format!("读取目录失败: {e}"))?;
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                stack.push(path);
            } else if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
                let ext_lower = ext.to_lowercase();
                if SUPPORTED_EXT.contains(&ext_lower.as_str()) {
                    let meta = entry.metadata().ok();
                    items.push(ScannedItem {
                        path: path.to_string_lossy().to_string(),
                        name: path
                            .file_name()
                            .map(|n| n.to_string_lossy().to_string())
                            .unwrap_or_default(),
                        file_type: if ext_lower == "jpeg" { "jpg".to_string() } else { ext_lower },
                        size: meta.map(|m| m.len()).unwrap_or(0),
                    });
                }
            }
        }
    }

    // 排序：文件名
    items.sort_by(|a, b| a.name.cmp(&b.name));
    Ok(items)
}

/// 读取文件为 base64（用于传给 Kimi 识图或提取文本）
pub fn read_file_base64(path: &str) -> Result<String, String> {
    let bytes = std::fs::read(path).map_err(|e| format!("读取文件失败: {e}"))?;
    use base64::Engine;
    Ok(base64::engine::general_purpose::STANDARD.encode(bytes))
}

/// 读取文本类文件内容（docx 提取文本）
pub fn read_text_content(path: &Path) -> String {
    // 简化：尝试按 UTF-8 读取；docx 是 zip，这里仅读取文件名的元信息
    match std::fs::read_to_string(path) {
        Ok(text) => text.chars().take(2000).collect(),
        Err(_) => String::new(),
    }
}
