use super::{
    read_installed_manifest, remove_obsolete_pack_files, validate_pack_manifest,
    ContentPackInstallSource, ContentPackManifest, ContentPackStatus,
};
use crate::{
    resources::{app_data_dir, copy_directory_overlay, hash_file, runtime_server_dir},
    state::DesktopState,
};
use futures_util::StreamExt;
use sha2::{Digest, Sha256};
use std::{
    fs,
    io::Write,
    path::Path,
    sync::{
        atomic::{AtomicBool, Ordering},
        Arc,
    },
    time::{SystemTime, UNIX_EPOCH},
};
use tauri::{AppHandle, State};

async fn download_file(
    client: &reqwest::Client,
    url: &str,
    destination: &Path,
    cancel: &AtomicBool,
) -> Result<(), String> {
    if let Some(parent) = destination.parent() {
        fs::create_dir_all(parent).map_err(|error| error.to_string())?;
    }
    let part = destination.with_extension("part");
    let existing = fs::metadata(&part)
        .map(|metadata| metadata.len())
        .unwrap_or(0);
    let mut request = client.get(url);
    if existing > 0 {
        request = request.header(reqwest::header::RANGE, format!("bytes={existing}-"));
    }
    let response = request.send().await.map_err(|error| error.to_string())?;
    if !response.status().is_success() && response.status() != reqwest::StatusCode::PARTIAL_CONTENT
    {
        return Err(format!("download failed: {} {url}", response.status()));
    }
    let append = existing > 0 && response.status() == reqwest::StatusCode::PARTIAL_CONTENT;
    let mut output = fs::OpenOptions::new()
        .create(true)
        .write(true)
        .append(append)
        .truncate(!append)
        .open(&part)
        .map_err(|error| error.to_string())?;
    let mut stream = response.bytes_stream();
    while let Some(chunk) = stream.next().await {
        if cancel.load(Ordering::Relaxed) {
            return Err("download-cancelled".to_string());
        }
        output
            .write_all(&chunk.map_err(|error| error.to_string())?)
            .map_err(|error| error.to_string())?;
    }
    fs::rename(part, destination).map_err(|error| error.to_string())
}

pub(super) fn allowed_https_url(value: &str) -> Result<reqwest::Url, String> {
    let url = reqwest::Url::parse(value).map_err(|_| "invalid-content-pack-url".to_string())?;
    if url.scheme() != "https" {
        return Err("content-pack-https-required".to_string());
    }
    let host = url
        .host_str()
        .ok_or("content-pack-host-required")?
        .to_ascii_lowercase();
    let allowlist = std::env::var("ATLAS_CONTENT_PACK_HOSTS").unwrap_or_default();
    let allowed = allowlist
        .split(',')
        .map(str::trim)
        .filter(|item| !item.is_empty())
        .any(|item| item.eq_ignore_ascii_case(&host));
    if !allowed {
        return Err("content-pack-host-not-allowlisted".to_string());
    }
    Ok(url)
}

fn copy_file_verified(
    source: &Path,
    destination: &Path,
    expected_sha256: &str,
) -> Result<(), String> {
    if let Some(parent) = destination.parent() {
        fs::create_dir_all(parent).map_err(|error| error.to_string())?;
    }
    fs::copy(source, destination).map_err(|error| error.to_string())?;
    if hash_file(destination)? != expected_sha256 {
        return Err(format!("checksum mismatch: {}", source.display()));
    }
    Ok(())
}

pub(super) async fn install_content_pack(
    app: AppHandle,
    state: State<'_, DesktopState>,
    source: ContentPackInstallSource,
) -> Result<ContentPackStatus, String> {
    let client = reqwest::Client::builder()
        .redirect(reqwest::redirect::Policy::none())
        .build()
        .map_err(|error| error.to_string())?;
    let (manifest_bytes, local_root, remote_root) = match &source {
        ContentPackInstallSource::Local { manifest_path } => {
            let path = fs::canonicalize(manifest_path)
                .map_err(|_| "content-pack-local-manifest-not-found".to_string())?;
            if path.extension().and_then(|value| value.to_str()) != Some("json") {
                return Err("content-pack-local-manifest-must-be-json".to_string());
            }
            let bytes = fs::read(&path).map_err(|error| error.to_string())?;
            (bytes, path.parent().map(Path::to_path_buf), None)
        }
        ContentPackInstallSource::Https { manifest_url } => {
            let url = allowed_https_url(manifest_url)?;
            let response = client
                .get(url.clone())
                .send()
                .await
                .map_err(|error| error.to_string())?
                .error_for_status()
                .map_err(|error| error.to_string())?;
            (
                response
                    .bytes()
                    .await
                    .map_err(|error| error.to_string())?
                    .to_vec(),
                None,
                Some(url),
            )
        }
    };
    let manifest_sha256 = hex::encode(Sha256::digest(&manifest_bytes));
    let manifest: ContentPackManifest =
        serde_json::from_slice(&manifest_bytes).map_err(|error| error.to_string())?;
    validate_pack_manifest(&manifest)?;
    let cancel = Arc::new(AtomicBool::new(false));
    state
        .downloads
        .lock()
        .insert(manifest.id.clone(), cancel.clone());
    let pack_root = app_data_dir(&app)?.join("content-packs").join(&manifest.id);
    let versions_root = pack_root.join("versions");
    let staging_root = pack_root.join(format!(".staging-{}", manifest.version));
    let final_root = versions_root.join(&manifest.version);
    if staging_root.exists() {
        fs::remove_dir_all(&staging_root).map_err(|error| error.to_string())?;
    }
    fs::create_dir_all(staging_root.join("files")).map_err(|error| error.to_string())?;
    let content_root = runtime_server_dir(&app)?.join("public");
    fs::create_dir_all(&content_root).map_err(|error| error.to_string())?;
    let required_space = manifest
        .installed_bytes
        .saturating_mul(2)
        .saturating_add(64 * 1024 * 1024);
    if fs2::available_space(&versions_root)
        .or_else(|_| fs2::available_space(&pack_root))
        .map_err(|error| error.to_string())?
        < required_space
    {
        return Err("insufficient-disk-space".to_string());
    }
    let install_result: Result<(), String> = async {
        for file in &manifest.files {
            if cancel.load(Ordering::Relaxed) {
                return Err("download-cancelled".to_string());
            }
            let destination = staging_root.join("files").join(&file.path);
            match (&local_root, &remote_root) {
                (Some(root), None) => {
                    let base = if manifest.base_url.trim().is_empty() {
                        root.clone()
                    } else {
                        let relative = Path::new(&manifest.base_url);
                        if relative.is_absolute()
                            || relative
                                .components()
                                .any(|part| !matches!(part, std::path::Component::Normal(_)))
                        {
                            return Err("unsafe-local-base-url".to_string());
                        }
                        root.join(relative)
                    };
                    let canonical_base = fs::canonicalize(&base)
                        .map_err(|_| "content-pack-local-base-not-found".to_string())?;
                    let source_file = fs::canonicalize(base.join(&file.path))
                        .map_err(|_| format!("content-pack-local-file-not-found:{}", file.path))?;
                    if !source_file.starts_with(&canonical_base) {
                        return Err("content-pack-local-file-escaped-base".to_string());
                    }
                    copy_file_verified(&source_file, &destination, &file.sha256)?;
                }
                (None, Some(manifest_url)) => {
                    let base = if manifest.base_url.trim().is_empty() {
                        manifest_url
                            .join("./")
                            .map_err(|_| "invalid-content-pack-base-url".to_string())?
                    } else {
                        allowed_https_url(&manifest.base_url)?
                    };
                    let file_url = base
                        .join(&file.path.replace('\\', "/"))
                        .map_err(|_| "invalid-content-pack-file-url".to_string())?;
                    allowed_https_url(file_url.as_str())?;
                    download_file(&client, file_url.as_str(), &destination, &cancel).await?;
                    if hash_file(&destination)? != file.sha256 {
                        return Err(format!("checksum mismatch: {}", file.path));
                    }
                }
                _ => return Err("invalid-content-pack-source".to_string()),
            }
        }
        Ok(())
    }
    .await;
    if let Err(error) = install_result {
        state.downloads.lock().remove(&manifest.id);
        let _ = fs::remove_dir_all(&staging_root);
        return Err(error);
    }
    fs::write(staging_root.join("manifest.json"), &manifest_bytes)
        .map_err(|error| error.to_string())?;
    fs::create_dir_all(&versions_root).map_err(|error| error.to_string())?;
    if final_root.exists() {
        fs::remove_dir_all(&final_root).map_err(|error| error.to_string())?;
    }
    fs::rename(&staging_root, &final_root).map_err(|error| error.to_string())?;
    let receipt_path = pack_root.join("receipt.json");
    let previous_version = fs::read_to_string(&receipt_path)
        .ok()
        .and_then(|value| serde_json::from_str::<serde_json::Value>(&value).ok())
        .and_then(|value| value.get("version")?.as_str().map(str::to_owned))
        .filter(|value| value != &manifest.version);
    if let Some(previous) = previous_version.as_ref() {
        let previous_root = versions_root.join(previous);
        if previous_root.is_dir() {
            remove_obsolete_pack_files(
                &content_root,
                &read_installed_manifest(&previous_root)?,
                &manifest,
            )?;
        }
    }
    copy_directory_overlay(&final_root.join("files"), &content_root)?;
    fs::write(&receipt_path, serde_json::json!({
        "version": manifest.version,
        "previousVersion": previous_version,
        "manifestSha256": manifest_sha256,
        "installedAtUnixMs": SystemTime::now().duration_since(UNIX_EPOCH).unwrap_or_default().as_millis(),
    }).to_string()).map_err(|error| error.to_string())?;
    state.downloads.lock().remove(&manifest.id);
    Ok(ContentPackStatus {
        id: manifest.id,
        status: "installed".to_string(),
        installed_version: Some(manifest.version),
        progress: 1.0,
        error: None,
        manifest_sha256: Some(manifest_sha256),
        rollback_version: previous_version,
    })
}
