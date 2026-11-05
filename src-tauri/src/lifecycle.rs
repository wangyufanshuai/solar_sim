use crate::state::DesktopState;

#[cfg(not(debug_assertions))]
use crate::resources::{app_data_dir, copy_directory_overlay, runtime_server_dir};
#[cfg(not(debug_assertions))]
use sha2::{Digest, Sha256};
#[cfg(not(debug_assertions))]
use std::{
    fs,
    net::{TcpListener, TcpStream},
    path::PathBuf,
    process::{Command, Stdio},
    sync::atomic::{AtomicBool, Ordering},
    thread,
    time::{Duration, SystemTime, UNIX_EPOCH},
};
#[cfg(not(debug_assertions))]
use tauri::{AppHandle, Manager};

#[cfg(not(debug_assertions))]
fn reserve_port() -> Result<u16, String> {
    let listener = TcpListener::bind(("127.0.0.1", 0)).map_err(|error| error.to_string())?;
    listener
        .local_addr()
        .map(|address| address.port())
        .map_err(|error| error.to_string())
}

#[cfg(not(debug_assertions))]
fn runtime_token(port: u16) -> String {
    let mut hash = Sha256::new();
    hash.update(port.to_le_bytes());
    hash.update(std::process::id().to_le_bytes());
    hash.update(
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_nanos()
            .to_le_bytes(),
    );
    hex::encode(hash.finalize())
}

#[cfg(not(debug_assertions))]
struct StartingGuard<'a>(&'a AtomicBool);

#[cfg(not(debug_assertions))]
impl Drop for StartingGuard<'_> {
    fn drop(&mut self) {
        self.0.store(false, Ordering::Release);
    }
}

#[cfg(not(debug_assertions))]
fn rotate_runtime_log(log_path: &std::path::Path) -> Result<(), String> {
    const ROTATE_AT_BYTES: u64 = 8 * 1024 * 1024;
    if fs::metadata(log_path)
        .map(|metadata| metadata.len() < ROTATE_AT_BYTES)
        .unwrap_or(true)
    {
        return Ok(());
    }
    for index in (1..=3).rev() {
        let source = if index == 1 {
            log_path.to_path_buf()
        } else {
            log_path.with_file_name(format!("runtime-server.log.{}", index - 1))
        };
        let destination = log_path.with_file_name(format!("runtime-server.log.{index}"));
        if destination.exists() {
            fs::remove_file(&destination).map_err(|error| error.to_string())?;
        }
        if source.exists() {
            fs::rename(source, destination).map_err(|error| error.to_string())?;
        }
    }
    Ok(())
}

pub(crate) fn stop_next_server(state: &DesktopState) {
    if let Some(mut child) = state.server.lock().take() {
        let _ = child.kill();
        let _ = child.wait();
    }
}

#[cfg(not(debug_assertions))]
pub(crate) fn start_next_server(app: &AppHandle, state: &DesktopState) -> Result<String, String> {
    if state.server.lock().is_some() {
        return Err("runtime-server-already-running".into());
    }
    if state
        .server_starting
        .compare_exchange(false, true, Ordering::AcqRel, Ordering::Acquire)
        .is_err()
    {
        return Err("runtime-server-start-already-in-progress".into());
    }
    let _starting_guard = StartingGuard(&state.server_starting);
    let resources = app
        .path()
        .resource_dir()
        .map_err(|error| error.to_string())?;
    let node = std::env::var("ATLAS_NODE_PATH")
        .map(PathBuf::from)
        .unwrap_or_else(|_| resources.join("runtime/node.exe"));
    let packaged_server = resources.join("server");
    let writable_server = runtime_server_dir(app)?;
    copy_directory_overlay(&packaged_server, &writable_server)?;
    let server = writable_server.join("server.js");
    let server_bootstrap = writable_server.join("atlas-server-bootstrap.mjs");
    let logs = app_data_dir(app)?.join("logs");
    fs::create_dir_all(&logs).map_err(|error| error.to_string())?;
    let log_path = logs.join("runtime-server.log");
    rotate_runtime_log(&log_path)?;
    let mut last_error = "runtime-server-start-failed".to_string();
    for attempt in 1..=5 {
        let port = reserve_port()?;
        let token = runtime_token(port);
        let stdout = fs::OpenOptions::new()
            .create(true)
            .append(true)
            .open(&log_path)
            .map_err(|error| error.to_string())?;
        let stderr = stdout.try_clone().map_err(|error| error.to_string())?;
        let mut child = Command::new(&node)
            .arg(&server_bootstrap)
            .arg(&server)
            .current_dir(&writable_server)
            .env("HOSTNAME", "127.0.0.1")
            .env("PORT", port.to_string())
            .env("ATLAS_DESKTOP_TOKEN", &token)
            .env("ATLAS_CONTENT_ROOT", writable_server.join("public"))
            .stdout(Stdio::from(stdout))
            .stderr(Stdio::from(stderr))
            .spawn()
            .map_err(|error| error.to_string())?;
        let address = format!("127.0.0.1:{port}")
            .parse()
            .map_err(|_| "invalid-runtime-address")?;
        let deadline = SystemTime::now() + Duration::from_secs(12);
        loop {
            if TcpStream::connect_timeout(&address, Duration::from_millis(250)).is_ok() {
                *state.server.lock() = Some(child);
                return Ok(format!("http://127.0.0.1:{port}/?desktopToken={token}"));
            }
            if let Some(status) = child.try_wait().map_err(|error| error.to_string())? {
                last_error =
                    format!("runtime-server-exited-before-ready:attempt={attempt}:status={status}");
                break;
            }
            if SystemTime::now() >= deadline {
                let _ = child.kill();
                let _ = child.wait();
                last_error = format!(
                    "runtime-server-readiness-timeout:attempt={attempt}:log={}",
                    log_path.display()
                );
                break;
            }
            thread::sleep(Duration::from_millis(100));
        }
    }
    Err(last_error)
}
