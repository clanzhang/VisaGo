// tests/scanner_test.rs — 验证 scanner 模块
use visago_lib::scanner;

#[test]
fn test_scan_folder_recursive() {
    let result = scanner::scan_folder("/tmp/visa-test-files").expect("扫描失败");
    // 应有 5 个支持的文件（passport.pdf, idcard.jpg, bank.png, work.docx, sub/hukou.pdf）
    // readme.txt 应被排除
    let names: Vec<String> = result.iter().map(|i| i.name.clone()).collect();
    assert_eq!(names.len(), 5, "应找到 5 个文件，实际: {:?}", names);
    assert!(names.contains(&"passport.pdf".to_string()));
    assert!(names.contains(&"idcard.jpg".to_string()));
    assert!(names.contains(&"bank.png".to_string()));
    assert!(names.contains(&"work.docx".to_string()));
    assert!(names.contains(&"hukou.pdf".to_string()));
    assert!(!names.contains(&"readme.txt".to_string()), "txt 应被排除");
}

#[test]
fn test_scan_folder_nonexistent() {
    let result = scanner::scan_folder("/tmp/does-not-exist");
    assert!(result.is_err(), "不存在的路径应报错");
}
