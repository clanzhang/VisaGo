// src/exporter.rs — HTML 转 PDF（用户选择保存位置）
// 用 rfd 原生保存对话框，不暴露应用内部目录

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

/// 导出 PDF — 通过原生保存对话框让用户选择保存位置
/// 注意：rfd 保存对话框必须在主线程调用，故为同步函数
pub fn export_pdf(html: String, filename: String) -> Result<String, String> {
    let text = strip_html(&html);
    let pdf = make_pdf(&text);

    // 默认文件名只含文件名，不带路径（不暴露应用内部目录）
    let safe_name: String = filename
        .chars()
        .filter(|c| c.is_alphanumeric() || *c == '-' || *c == '_')
        .collect();
    let default_name = if safe_name.is_empty() { "document".to_string() } else { safe_name };
    let default_name = format!("{default_name}.pdf");

    println!("[export] 弹出保存对话框，默认文件名: {default_name}");
    // 用 rfd 原生保存对话框，用户自行选择保存位置
    let picked = rfd::FileDialog::new()
        .set_title("选择保存位置")
        .set_file_name(&default_name)
        .add_filter("PDF", &["pdf"])
        .save_file();

    let path = match picked {
        Some(p) => p,
        None => {
            println!("[export] 用户取消了保存");
            return Err("用户取消了保存".to_string());
        }
    };
    println!("[export] 用户选择保存到: {}", path.display());

    std::fs::write(&path, pdf).map_err(|e| format!("写 PDF 失败: {e}"))?;
    Ok(path.to_string_lossy().to_string())
}
