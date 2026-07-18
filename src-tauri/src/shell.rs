use crate::{
    content_packs::CONTENT_PACK_IDS,
    resources::{app_data_dir, catalog_path},
};
use serde::Serialize;
use std::{fs, process::Command};
use tauri::AppHandle;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct RuntimeInfo {
    platform: &'static str,
    architecture: &'static str,
    app_version: &'static str,
    cross_origin_isolation_required: bool,
    catalog_backend: String,
    content_pack_backend: &'static str,
    desktop_release_profile: &'static str,
    runtime_bundle_version: &'static str,
    content_pack_count: usize,
}

#[tauri::command]
pub(crate) fn get_runtime_info(app: AppHandle) -> Result<RuntimeInfo, String> {
    let sqlite_available = catalog_path(&app)?.is_file();
    Ok(RuntimeInfo {
        platform: std::env::consts::OS,
        architecture: std::env::consts::ARCH,
        app_version: env!("CARGO_PKG_VERSION"),
        cross_origin_isolation_required: true,
        catalog_backend: if sqlite_available {
            "sqlite-fts5"
        } else {
            "web-worker-shards"
        }
        .to_string(),
        content_pack_backend: "versioned-sha256-atomic-rollback",
        desktop_release_profile: "desktop-compact",
        runtime_bundle_version: "v186-desktop-compact",
        content_pack_count: CONTENT_PACK_IDS.len(),
    })
}

#[tauri::command]
pub(crate) fn open_log_directory(app: AppHandle) -> Result<(), String> {
    let logs = app_data_dir(&app)?.join("logs");
    fs::create_dir_all(&logs).map_err(|error| error.to_string())?;
    Command::new("explorer.exe")
        .arg(&logs)
        .spawn()
        .map_err(|error| error.to_string())?;
    Ok(())
}
