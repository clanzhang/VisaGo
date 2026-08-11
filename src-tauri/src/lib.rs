mod cache;
mod commands;
mod kimi;

#[cfg_attr(mobile, tauri::mobile_entry_point)]

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            commands::register(app);
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
