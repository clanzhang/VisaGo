// src/exporter.rs — HTML 转 PDF（本地保存）
// 简化实现：提取 HTML 中的文本内容生成 PDF；复杂排版建议走前端 jsPDF
use std::path::PathBuf;
use tauri::Manager;

fn data_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("无法获取数据目录: {e}"))?;
    let data = dir.join("exports");
    std::fs::create_dir_all(&data).map_err(|e| format!("创建导出目录失败: {e}"))?;
    Ok(data)
}

/// 从 HTML 中粗略提取可见文本
fn strip_html(html: &str) -> String {
    let mut text = String::new();
    let mut in_tag = false;
    for ch in html.chars() {
        match ch {
            '<' => in_tag = true,
            '>' => {
                in_tag = false;
                text.push('\n');
            }
            _ if !in_tag => text.push(ch),
            _ => {}
        }
    }
    // 折叠空白
    let lines: Vec<&str> = text.lines().map(|l| l.trim()).filter(|l| !l.is_empty()).collect();
    lines.join("\n")
}

/// 生成一个最小可用 PDF（含纯文本）
fn make_pdf(text: &str) -> Vec<u8> {
    let mut out: Vec<u8> = Vec::new();
    out.extend_from_slice(b"%PDF-1.4\n");
    let content = format!("BT\n/F1 12 Tf\n72 800 Td\n{}\nET\n", escape_pdf(text));
    // 简化：只写一页文本
    let objects = vec![
        format!("<< /Type /Catalog /Pages 2 0 R >>"),
        format!("<< /Type /Pages /Kids [3 0 R] /Count 1 >>"),
        format!("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>"),
        format!("<< /Length {} >>\nstream\n{}\nendstream", content.len(), content),
        format!("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"),
    ];
    let mut offset = 0usize;
    let mut xref = Vec::new();
    out.extend_from_slice(format!("{} 0 obj\n{}\nendobj\n", 1, objects[0]).as_bytes());
    for i in 0..objects.len() {
        let obj_num = i + 1;
        if obj_num > 1 {
            xref.push(offset as u32);
            let obj = format!("{} 0 obj\n{}\nendobj\n", obj_num, objects[i]);
            offset = out.len();
            out.extend_from_slice(obj.as_bytes());
        }
    }
    out.extend_from_slice(b"trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n");
    out.extend_from_slice(format!("{}\n%%EOF\n", out.len() as u32).as_bytes());
    let _ = xref;
    out
}

fn escape_pdf(text: &str) -> String {
    let mut s = String::new();
    let mut line = String::new();
    for ch in text.chars() {
        match ch {
            '(' => line.push_str("\\("),
            ')' => line.push_str("\\)"),
            '\\' => line.push_str("\\\\"),
            '\n' => {
                s.push_str(&format!("({}) Tj\nTd\n", line));
                line.clear();
            }
            c if c.is_control() => {}
            c => line.push(c),
        }
    }
    if !line.is_empty() {
        s.push_str(&format!("({}) Tj\n", line));
    }
    s
}

/// 导出 PDF（被 commands.rs 的 IPC 命令调用）
pub fn export_pdf(app: tauri::AppHandle, html: String, filename: String) -> Result<String, String> {
    let text = strip_html(&html);
    let pdf = make_pdf(&text);
    let dir = data_dir(&app)?;
    let safe_name: String = filename
        .chars()
        .filter(|c| c.is_alphanumeric() || *c == '-' || *c == '_')
        .collect();
    let path = dir.join(format!("{}.pdf", if safe_name.is_empty() { "document".to_string() } else { safe_name }));
    std::fs::write(&path, pdf).map_err(|e| format!("写 PDF 失败: {e}"))?;
    Ok(path.to_string_lossy().to_string())
}
