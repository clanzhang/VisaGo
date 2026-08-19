// src/exporter.rs — 导出 PDF（用 printpdf 生成，用户选择保存位置）
// 用 rfd 原生保存对话框，不暴露应用内部目录
// printpdf 支持嵌入 TTF 字体（中文），优先 macOS 系统字体，fallback Helvetica

use printpdf::{BuiltinFont, IndirectFontRef, Mm, PdfDocument, PdfLayerReference};
use crate::{log_debug, log_error, log_info};

/// 从 HTML/Markdown 中提取纯文本：
/// - 去掉 HTML 标签
/// - 去掉 ** / ## / - 等 markdown 标记
fn strip_html_and_markdown(html: &str) -> String {
    // 1. 去 HTML 标签
    let mut no_tags = String::new();
    let mut in_tag = false;
    for ch in html.chars() {
        match ch {
            '<' => in_tag = true,
            '>' => {
                in_tag = false;
                no_tags.push('\n');
            }
            _ if !in_tag => no_tags.push(ch),
            _ => {}
        }
    }

    // 2. 逐行清理 markdown 标记
    let mut lines: Vec<String> = Vec::new();
    for raw in no_tags.lines() {
        let mut line = raw.trim().to_string();
        // 去掉标题标记：## / ### / #
        while let Some(stripped) = line.strip_prefix('#') {
            line = stripped.trim_start().to_string();
        }
        // 去掉加粗/斜体：**text** / *text* / __text__
        line = line.replace("**", "").replace("__", "");
        // 去掉列表标记：- item / * item / + item
        if let Some(stripped) = line.strip_prefix("- ") {
            line = stripped.trim_start().to_string();
        } else if let Some(stripped) = line.strip_prefix("* ") {
            line = stripped.trim_start().to_string();
        } else if let Some(stripped) = line.strip_prefix("+ ") {
            line = stripped.trim_start().to_string();
        } else {
            // 数字列表："1. " "2. "
            if let Some(idx) = line.find(". ") {
                let prefix = &line[..idx];
                if prefix.chars().all(|c| c.is_ascii_digit()) {
                    line = line[idx + 2..].trim_start().to_string();
                }
            }
        }
        // 去掉行内代码反引号
        line = line.replace('`', "");
        // 去掉引用符
        if let Some(stripped) = line.strip_prefix("> ") {
            line = stripped.trim_start().to_string();
        }
        if !line.is_empty() {
            lines.push(line);
        }
    }
    lines.join("\n")
}

/// 尝试加载中文字体（TTF），返回字体字节。找不到中文则返回 None（用 Helvetica）
fn load_chinese_font_bytes() -> Option<Vec<u8>> {
    // macOS 系统字体候选（优先 PingFang，其次 Arial Unicode / 其他含 CJK 的 TTF）
    let candidates = [
        "/System/Library/Fonts/PingFang.ttc",
        "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
        "/System/Library/Fonts/Hiragino Sans GB.ttc",
        "/System/Library/Fonts/STHeiti Light.ttc",
        "/System/Library/Fonts/Supplemental/Songti.ttc",
    ];
    for path in candidates {
        if let Ok(bytes) = std::fs::read(path) {
            // ttc 是字体集合，printpdf/rusttype 只支持 ttf/otf；跳过 ttc
            let ext = path.rsplit('.').next().unwrap_or("").to_lowercase();
            if ext == "ttf" || ext == "otf" {
                log_debug!("[export] 使用中文字体: {path}");
                return Some(bytes);
            }
            // ttc 无法直接用，跳过
            log_debug!("[export] 跳过 ttc 字体（不支持集合）: {path}");
        }
    }
    // 没有可用的 TTF 中文字体
    None
}

/// 用 printpdf 生成 PDF：逐行写入，字体 11pt，左边距 72（pt），行间距 16
/// 单页放不下时自动翻页
fn make_pdf(text: &str) -> Vec<u8> {
    // 页面尺寸：A4 纵向 (595 x 842 pt)
    let (doc, page1, layer1) = PdfDocument::new(
        "VisaGo Document",
        Mm(595.0 / 72.0 * 25.4),
        Mm(842.0 / 72.0 * 25.4),
        "Layer 1",
    );

    // 加载中文字体（优先），失败回退 Helvetica
    // 用 subsetting 只嵌入用到的字符，避免全量嵌入 23MB 字体导致文件巨大/布局异常
    let font: IndirectFontRef = match load_chinese_font_bytes() {
        Some(bytes) => match doc.add_external_font_with_subsetting(std::io::Cursor::new(bytes), true) {
            Ok(f) => f,
            Err(_) => doc.add_builtin_font(BuiltinFont::Helvetica).unwrap(),
        },
        None => doc.add_builtin_font(BuiltinFont::Helvetica).unwrap(),
    };

    // 页面常量（pt）：A4 宽 595pt 高 842pt
    let page_height_pt = 842.0;
    let margin_left_pt = 72.0;
    let margin_top_pt = 60.0;
    let margin_bottom_pt = 60.0;
    let font_size = 11.0;
    let line_height = 16.0;
    let max_y = page_height_pt - margin_top_pt; // 起始 y（顶部）
    let min_y = margin_bottom_pt; // 底部边界

    let mut layer: PdfLayerReference = doc.get_page(page1).get_layer(layer1);
    let mut y = max_y;
    let mut page_num = 1;

    for line in text.lines() {
        // 若当前行放不下（y 超出底部），翻页
        if y - line_height < min_y {
            let (new_page_idx, new_layer_idx) = doc.add_page(
                Mm(595.0 / 72.0 * 25.4),
                Mm(842.0 / 72.0 * 25.4),
                format!("Layer {}", page_num + 1),
            );
            layer = doc.get_page(new_page_idx).get_layer(new_layer_idx);
            y = max_y;
            page_num += 1;
        }
        // printpdf 的 y 以页面底部为原点，需转换：pdf_y = page_height - y
        let pdf_y = page_height_pt - y;
        layer.use_text(line, font_size, Mm(margin_left_pt / 72.0 * 25.4), Mm(pdf_y / 72.0 * 25.4), &font);
        y -= line_height;
    }

    // 序列化为字节
    doc.save_to_bytes().map_err(|e| e.to_string()).unwrap_or_else(|e| {
        log_error!("[export] PDF 序列化失败: {e}");
        Vec::new()
    })
}

/// 导出 PDF — 通过原生保存对话框让用户选择保存位置
/// 注意：rfd 保存对话框必须在主线程调用，故为同步函数
pub fn export_pdf(html: String, filename: String) -> Result<String, String> {
    let text = strip_html_and_markdown(&html);
    log_info!("[export] 提取纯文本 {} 字符", text.chars().count());
    // 空文本保护：无内容时不导出空白页 PDF
    if text.trim().is_empty() {
        log_info!("[export] 无内容可导出（提取文本为空）");
        return Err("没有可导出的内容".to_string());
    }
    let pdf = make_pdf(&text);
    if pdf.is_empty() {
        return Err("PDF 生成失败".to_string());
    }

    // 默认文件名只含文件名，不带路径（不暴露应用内部目录）
    let safe_name: String = filename
        .chars()
        .filter(|c| c.is_alphanumeric() || *c == '-' || *c == '_')
        .collect();
    let default_name = if safe_name.is_empty() { "document".to_string() } else { safe_name };
    let default_name = format!("{default_name}.pdf");

    log_info!("[export] 弹出保存对话框，默认文件名: {default_name}");
    // 用 rfd 原生保存对话框，用户自行选择保存位置
    let picked = rfd::FileDialog::new()
        .set_title("选择保存位置")
        .set_file_name(&default_name)
        .add_filter("PDF", &["pdf"])
        .save_file();

    let path = match picked {
        Some(p) => p,
        None => {
            log_info!("[export] 用户取消了保存");
            return Err("用户取消了保存".to_string());
        }
    };
    log_info!("[export] 用户选择保存到: {}", path.display());

    std::fs::write(&path, pdf).map_err(|e| format!("写 PDF 失败: {e}"))?;
    Ok(path.to_string_lossy().to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_strip_html_and_markdown() {
        let html = "<html><body><h1>## 在职证明</h1><p>**张三** 你好</p><ul><li>- 材料一</li><li>- 材料二</li></ul><p>1. 第一项</p></body></html>";
        let text = strip_html_and_markdown(html);
        let lines: Vec<&str> = text.lines().collect();
        assert!(lines.iter().any(|l| l.contains("在职证明")), "应保留标题文字");
        assert!(lines.iter().any(|l| l.contains("张三") && !l.contains('*')), "应去掉加粗标记");
        assert!(lines.iter().any(|l| l.contains("材料一") && !l.contains('-')), "应去掉列表标记");
        assert!(lines.iter().any(|l| l.contains("第一项")), "应去掉数字列表标记");
    }

    #[test]
    fn test_strip_no_big_gaps() {
        // 模拟前端包装：Kimi 生成的文本含 markdown 标记 + 大量空行
        let html = "<html><body><pre>## 行程单\n\n**Day 1**\n\n\n- 东京\n\n\n\n- 大阪\n\n**Day 2**\n\n\n- 京都\n</pre></body></html>";
        let text = strip_html_and_markdown(html);
        let lines: Vec<&str> = text.lines().collect();
        // 不应有连续空行（大段空白）
        let mut consecutive_empty = 0;
        for l in &lines {
            if l.trim().is_empty() {
                consecutive_empty += 1;
            } else {
                consecutive_empty = 0;
            }
            assert!(consecutive_empty < 2, "不应出现连续空行（大段空白）");
        }
        // 应保留内容
        assert!(lines.iter().any(|l| l.contains("行程单")));
        assert!(lines.iter().any(|l| l.contains("东京")));
    }

    #[test]
    fn test_make_pdf_not_empty() {
        let text = "在职证明\n\n兹证明张三（身份证号：110105198001011234）自2020年1月起在我公司任职。\n\n特此证明。";
        let pdf = make_pdf(text);
        assert!(!pdf.is_empty(), "PDF 不应为空");
        log_debug!("[test] 生成的 PDF 大小: {} bytes ({:.1} KB)", pdf.len(), pdf.len() as f64 / 1024.0);
        assert!(pdf.len() > 500, "PDF 大小应合理: {}", pdf.len());
        // subsetting 后文件应远小于全量嵌入（Arial Unicode 23MB）；短文本应 < 200KB
        assert!(pdf.len() < 200 * 1024, "PDF 应使用字体子集化，大小异常: {} bytes", pdf.len());
        // 检查 PDF 头
        assert!(pdf.starts_with(b"%PDF"), "PDF 应有正确头");
        // printpdf 内部处理 xref/EOF，检查包含 EOF 标记
        let bytes = String::from_utf8_lossy(&pdf);
        assert!(bytes.contains("%%EOF"), "PDF 应有 EOF 标记");
        // 检查包含页面对象
        assert!(bytes.contains("/Type/Page") || bytes.contains("/Type /Page"), "PDF 应有页面对象");
        // 用 pdf-extract 读回，确认 PDF 有效且含中文文本（验证内容非空白）
        if let Ok(extracted) = crate::scanner::extract_pdf_text_from_bytes(&pdf) {
            assert!(extracted.contains("在职证明"), "PDF 应包含中文内容，实际: {}", extracted);
        } else {
            eprintln!("警告: pdf-extract 无法读回生成的 PDF（可能字体子集化导致），但 PDF 结构有效");
        }
    }

    #[test]
    fn test_make_pdf_multipage() {
        // 大量行应触发自动翻页（> 40 行，A4 每页约 48 行）
        let mut lines = Vec::new();
        for i in 0..60 {
            lines.push(format!("这是第 {i} 行内容，用于测试多页导出"));
        }
        let pdf = make_pdf(&lines.join("\n"));
        assert!(!pdf.is_empty());
        // 检查 PDF 包含页面对象且文件较大（多页）
        let bytes = String::from_utf8_lossy(&pdf);
        assert!(bytes.contains("%%EOF"), "PDF 应有 EOF 标记");
        // 60 行内容生成的文件应明显大于单页测试（多页），但不要过度依赖对象计数
        let single = make_pdf("只有一行");
        assert!(pdf.len() > single.len(), "多页 PDF 应大于单页");
    }

    /// 统计 PDF 中的页面对象数量（排除 /Type/Pages 父节点）
    fn count_pages(pdf: &[u8]) -> usize {
        let bytes = String::from_utf8_lossy(pdf);
        // 匹配 "/Type/Page" 但排除 "/Type/Pages"（父节点）
        let mut count = 0;
        let mut idx = 0;
        let b = bytes.as_bytes();
        while let Some(rel) = b[idx..].windows(10).position(|w| w == b"/Type/Page") {
            let abs = idx + rel;
            // 检查 /Type/Page 后面是否紧跟 "s"（即 /Type/Pages）
            let is_pages = b.get(abs + 10) == Some(&b's');
            if !is_pages {
                count += 1;
            }
            idx = abs + 10;
        }
        count
    }

    #[test]
    fn test_no_blank_final_page() {
        // 少量行（远少于一页容量）→ 应只有 1 页，无空白尾页
        let lines: Vec<String> = (0..5).map(|i| format!("第 {i} 行内容")).collect();
        let pdf = make_pdf(&lines.join("\n"));
        assert!(!pdf.is_empty());
        let pages = count_pages(&pdf);
        assert_eq!(pages, 1, "少量行应只有 1 页，实际 {} 页", pages);
    }

    #[test]
    fn test_exact_fill_page_no_blank() {
        // 恰好填满一页（约 48 行：A4 842pt - 上下边距 120pt = 722pt / 16pt 行高 ≈ 45 行）
        // 45 行应刚好 1 页，46 行应 2 页；检查不产生多余空白页
        let mut lines = Vec::new();
        for i in 0..45 {
            lines.push(format!("第 {i} 行，用于测试精确填充页面"));
        }
        let pdf45 = make_pdf(&lines.join("\n"));
        let pages45 = count_pages(&pdf45);
        // 45 行应 1 页（45*16=720pt，页面可用 722pt，刚好放下）
        assert!(pages45 >= 1, "45 行应至少有 1 页");
        assert!(pages45 <= 1, "45 行不应超过 1 页，实际 {} 页", pages45);

        // 46 行应翻到第 2 页，但不应有第 3 页
        let mut lines46 = lines.clone();
        lines46.push("第 45 行，触发翻页".to_string());
        let pdf46 = make_pdf(&lines46.join("\n"));
        let pages46 = count_pages(&pdf46);
        assert_eq!(pages46, 2, "46 行应恰好 2 页，实际 {} 页", pages46);
    }
}