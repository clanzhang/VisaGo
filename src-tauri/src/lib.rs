mod cache;
mod commands;
mod exporter;
mod kimi;
mod recognizer;
pub mod scanner;
mod store;

use commands::{
    ai_chat, export_pdf, get_visa_data, kimi_chat, load_profile, recognize_file,
    refresh_visa_data, save_profile, scan_folder,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            ai_chat,
            kimi_chat,
            scan_folder,
            recognize_file,
            save_profile,
            load_profile,
            get_visa_data,
            refresh_visa_data,
            export_pdf,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
