mod cache;
mod commands;
mod exporter;
mod kimi;
mod recognizer;
pub mod scanner;
mod store;

use commands::{
    ai_chat, check_reminders, create_profile, delete_application, delete_profile,
    export_pdf, get_active_profile_id, get_visa_data, kimi_chat, list_profiles,
    load_profile, load_settings, push_notification, recognize_file,
    refresh_visa_data, request_notification_permission, save_application,
    save_profile, save_profile_card, save_settings, scan_files, scan_folder,
    send_notification, set_active_profile_id,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_notification::init())
        .invoke_handler(tauri::generate_handler![
            ai_chat,
            kimi_chat,
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
            get_visa_data,
            refresh_visa_data,
            export_pdf,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
