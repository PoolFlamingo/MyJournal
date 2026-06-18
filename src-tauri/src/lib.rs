mod commands;
mod db;
mod state;
mod types;

use commands::entries::{entry_delete, entry_get_by_date, entry_list_month, entry_save};
use commands::fonts::{font_delete, font_list, font_read, font_register};
use commands::journals::{
    app_bootstrap, app_get_setting, app_set_setting, journal_create, journal_delete, journal_list,
    journal_lock, journal_open, journal_rename, journal_unlock,
};
use state::UnlockedJournals;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations(db::DB_URL, db::migrations())
                .build(),
        )
        .manage(UnlockedJournals::default())
        .invoke_handler(tauri::generate_handler![
            app_bootstrap,
            app_get_setting,
            app_set_setting,
            journal_list,
            journal_create,
            journal_open,
            journal_rename,
            journal_delete,
            journal_unlock,
            journal_lock,
            entry_get_by_date,
            entry_save,
            entry_delete,
            entry_list_month,
            font_register,
            font_list,
            font_read,
            font_delete,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
