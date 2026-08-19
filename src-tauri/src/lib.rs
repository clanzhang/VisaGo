mod cache;
mod commands;
mod exporter;
mod kimi;
pub mod log;
mod recognizer;
pub mod scanner;
mod store;

use commands::{
    ai_chat, check_reminders, create_profile, delete_application, delete_profile,
    export_pdf, get_active_profile_id, get_scanned_files, get_visa_data, kimi_chat,
    list_profiles, load_profile, load_settings, push_notification, recognize_file,
    refresh_visa_data, request_notification_permission, save_application,
    save_profile, save_profile_card, save_settings, scan_files, scan_folder,
    test_kimi_connection,
    send_notification, set_active_profile_id,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]

pub fn run() {
    use tauri::Emitter;
    use tauri::menu::{MenuBuilder, MenuItemBuilder, SubmenuBuilder};

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_notification::init())
        // macOS 应用菜单：VisaGo（偏好设置... ⌘,）+ 标准 Edit 菜单（剪贴板快捷键）+ Window 菜单
        // 关键：macOS 上 ⌘C/⌘V/⌘X/⌘A/⌘Z 由原生 Edit 菜单的 PredefinedMenuItem 派发，
        // 缺失 Edit 菜单会导致 WebView 收不到任何剪贴板快捷键（全应用无法粘贴/复制）。
        // SubmenuBuilder 的 undo/redo/cut/copy/paste/select_all/minimize 等便捷方法
        // 在 tauri 2.11 中由 shared_menu_builder! 宏生成，内部映射到 muda::PredefinedMenuItem，
        // 绑定 macOS 标准 responder action，无需手写 accelerator 与事件处理。
        .setup(|app| {
            let settings = MenuItemBuilder::with_id("open-preferences", "偏好设置...")
                .accelerator("CmdOrCtrl+,")
                .build(app)?;
            let app_menu = SubmenuBuilder::new(app, "VisaGo")
                .item(&settings)
                .separator()
                .quit()
                .build()?;
            // 标准 Edit 菜单：撤销/重做/剪切/复制/粘贴/全选 —— 恢复剪贴板快捷键
            let edit_menu = SubmenuBuilder::new(app, "Edit")
                .undo()
                .redo()
                .separator()
                .cut()
                .copy()
                .paste()
                .select_all()
                .build()?;
            // Window 菜单：最小化/缩放/全屏，保证 ⌘M / ⌘W 等窗口快捷键正常
            let window_menu = SubmenuBuilder::new(app, "Window")
                .minimize()
                .maximize()
                .fullscreen()
                .build()?;
            let menu = MenuBuilder::new(app)
                .items(&[&app_menu, &edit_menu, &window_menu])
                .build()?;
            app.set_menu(menu)?;
            Ok(())
        })
        .on_menu_event(|app, event| {
            if event.id.as_ref() == "open-preferences" {
                log_event!("[menu] 偏好设置被点击（⌘,），通知前端打开弹窗");
                let _ = app.emit("open-preferences", ());
            }
        })
        .invoke_handler(tauri::generate_handler![
            ai_chat,
            kimi_chat,
            test_kimi_connection,
            scan_folder,
            scan_files,
            recognize_file,
            list_profiles,
            create_profile,
            save_profile_card,
            delete_profile,
            get_active_profile_id,
            set_active_profile_id,
            save_profile,
            load_profile,
            check_reminders,
            push_notification,
            send_notification,
            load_settings,
            save_settings,
            request_notification_permission,
            save_application,
            delete_application,
            get_scanned_files,
            get_visa_data,
            refresh_visa_data,
            export_pdf,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
