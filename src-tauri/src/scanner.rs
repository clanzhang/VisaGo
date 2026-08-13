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

/// 从 PDF 提取文本（使用 pdf-extract）
pub fn extract_pdf_text(path: &str) -> Result<String, String> {
    println!("[extract] 开始提取 PDF 文本: {path}");
    let data = std::fs::read(path).map_err(|e| format!("读取 PDF 失败: {e}"))?;
    extract_pdf_text_from_bytes(&data)
}

/// 从 PDF 字节提取文本（供文本型 PDF 识别与测试验证）
pub fn extract_pdf_text_from_bytes(data: &[u8]) -> Result<String, String> {
    let text = pdf_extract::extract_text_from_mem(data).map_err(|e| {
        println!("[extract] PDF 文本提取失败: {e}");
        format!("PDF 文本提取失败: {e}")
    })?;
    let cleaned: String = text.chars().filter(|c| !c.is_control() || *c == '\n' || *c == '\t').collect();
    let trimmed = cleaned.trim().to_string();
    println!("[extract] PDF 文本长度: {} 字符", trimmed.chars().count());
    if trimmed.is_empty() {
        println!("[extract] 警告: PDF 无文本层（可能是扫描件/图片型 PDF）");
    }
    Ok(trimmed)
}

/// 扫描件 PDF（无文本层）：用 macOS sips 渲染首页为 PNG，返回 base64
/// 供 Kimi 识图。sips 为 macOS 自带工具，无需额外系统依赖。
pub fn render_pdf_to_png(path: &str) -> Result<String, String> {
    use std::process::Command;
    // 输出到临时文件
    let out = std::env::temp_dir().join(format!("visago_render_{}.png", std::process::id()));
    let out_str = out.to_string_lossy().to_string();

    let status = Command::new("sips")
        .args(["-s", "format", "png", path, "--out", &out_str])
        .output()
        .map_err(|e| format!("调用 sips 失败: {e}（sips 仅 macOS 可用）"))?;

    if !status.status.success() {
        let stderr = String::from_utf8_lossy(&status.stderr).to_string();
        return Err(format!("sips 渲染失败: {}", stderr.trim()));
    }

    let bytes = std::fs::read(&out_str).map_err(|e| format!("读取渲染结果失败: {e}"))?;
    // 清理临时文件
    let _ = std::fs::remove_file(&out_str);

    use base64::Engine;
    Ok(base64::engine::general_purpose::STANDARD.encode(bytes))
}

/// 从 DOCX 提取文本（docx 是 zip，解压 word/document.xml 并剥离 XML 标签）
pub fn extract_docx_text(path: &str) -> Result<String, String> {
    println!("[extract] 开始提取 DOCX 文本: {path}");
    let data = std::fs::read(path).map_err(|e| format!("读取 DOCX 失败: {e}"))?;
    // 解析 zip 目录，找到 word/document.xml
    let mut cursor = std::io::Cursor::new(&data);
    let mut archive = zip::ZipArchive::new(&mut cursor)
        .map_err(|e| format!("DOCX 不是有效的 zip: {e}"))?;

    let mut doc_xml = String::new();
    for i in 0..archive.len() {
        let mut file = archive.by_index(i).map_err(|e| e.to_string())?;
        let name = file.name().to_string();
        if name == "word/document.xml" {
            let mut content = String::new();
            use std::io::Read;
            file.read_to_string(&mut content).map_err(|e| format!("读取 document.xml 失败: {e}"))?;
            doc_xml = content;
            break;
        }
    }

    if doc_xml.is_empty() {
        println!("[extract] DOCX 中未找到 word/document.xml");
        return Err("DOCX 中未找到文档内容".to_string());
    }

    // 提取 <w:t> 标签内的文本
    let mut text = String::new();
    for part in doc_xml.split("<w:t") {
        if let Some(start) = part.find('>') {
            let inner = &part[start + 1..];
            if let Some(end) = inner.find("</w:t>") {
                text.push_str(&inner[..end]);
                text.push(' ');
            }
        }
    }
    let trimmed = text.trim().to_string();
    println!("[extract] DOCX 文本长度: {} 字符", trimmed.chars().count());
    if trimmed.is_empty() {
        println!("[extract] 警告: DOCX 提取文本为空");
    }
    Ok(trimmed)
}
