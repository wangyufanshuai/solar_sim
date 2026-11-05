#[cfg(not(debug_assertions))]
use crate::lifecycle::start_next_server;
use crate::{lifecycle::stop_next_server, state::DesktopState};
use tauri::Manager;

pub(crate) fn run() {
    tauri::Builder::default()
        .manage(DesktopState::default())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_single_instance::init(|app, _, _| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.set_focus();
            }
        }))
        .setup(|_app| {
            #[cfg(not(debug_assertions))]
            {
                let state = _app.state::<DesktopState>();
                let url =
                    start_next_server(_app.handle(), &state).map_err(std::io::Error::other)?;
                if let Some(window) = _app.get_webview_window("main") {
                    window
                        .navigate(url.parse().map_err(std::io::Error::other)?)
                        .map_err(std::io::Error::other)?;
                }
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            crate::shell::get_runtime_info,
            crate::catalog::search_catalog,
            crate::catalog::get_catalog_object,
            crate::content_packs::list_content_packs,
            crate::content_packs::install_content_pack,
            crate::content_packs::cancel_content_pack_install,
            crate::content_packs::rollback_content_pack,
            crate::openrocket::import_openrocket,
            crate::openrocket::launch_openrocket,
            crate::shell::open_log_directory
        ])
        .build(tauri::generate_context!())
        .expect("failed to build Orbit Atlas desktop shell")
        .run(|app, event| {
            if matches!(
                event,
                tauri::RunEvent::Exit | tauri::RunEvent::ExitRequested { .. }
            ) {
                stop_next_server(&app.state::<DesktopState>());
            }
        });
}
