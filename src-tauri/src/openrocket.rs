use crate::resources::app_data_dir;
use std::{fs, process::Command};
use tauri::AppHandle;

#[tauri::command]
pub(crate) fn import_openrocket(app: AppHandle, source_path: String) -> Result<String, String> {
    let source =
        fs::canonicalize(source_path).map_err(|_| "openrocket-import-not-found".to_string())?;
    if !source.is_file() {
        return Err("openrocket-import-not-file".to_string());
    }
    let extension = source
        .extension()
        .and_then(|value| value.to_str())
        .unwrap_or("")
        .to_ascii_lowercase();
    if !["ork", "csv", "json"].contains(&extension.as_str()) {
        return Err("unsupported-openrocket-import".to_string());
    }
    let imports = app_data_dir(&app)?.join("openrocket-imports");
    fs::create_dir_all(&imports).map_err(|error| error.to_string())?;
    let destination = imports.join(source.file_name().ok_or("invalid-source-path")?);
    fs::copy(&source, &destination).map_err(|error| error.to_string())?;
    Ok(destination.to_string_lossy().into_owned())
}

#[tauri::command]
pub(crate) fn launch_openrocket(file_path: Option<String>) -> Result<(), String> {
    let configured = std::env::var("ATLAS_OPENROCKET_PATH")
        .unwrap_or_else(|_| "D:\\86137\\OpenRocket\\OpenRocket.exe".to_string());
    let executable =
        fs::canonicalize(&configured).map_err(|_| "configured-openrocket-not-found".to_string())?;
    if executable
        .file_name()
        .and_then(|value| value.to_str())
        .map(|value| value.eq_ignore_ascii_case("OpenRocket.exe"))
        != Some(true)
    {
        return Err("openrocket-executable-not-allowlisted".to_string());
    }
    let mut command = Command::new(executable);
    if let Some(file) = file_path {
        let input = fs::canonicalize(file).map_err(|_| "openrocket-file-not-found".to_string())?;
        let extension = input
            .extension()
            .and_then(|value| value.to_str())
            .unwrap_or("")
            .to_ascii_lowercase();
        if !["ork", "csv", "json"].contains(&extension.as_str()) {
            return Err("unsupported-openrocket-launch-input".to_string());
        }
        command.arg(input);
    }
    command.spawn().map_err(|error| error.to_string())?;
    Ok(())
}
