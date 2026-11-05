mod installer;

use crate::{
    resources::{app_data_dir, copy_directory_overlay, runtime_server_dir},
    state::DesktopState,
};
use serde::{Deserialize, Serialize};
use std::{
    fs,
    path::Path,
    sync::atomic::Ordering,
    time::{SystemTime, UNIX_EPOCH},
};
use tauri::{AppHandle, State};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(super) struct ContentPackFile {
    path: String,
    bytes: u64,
    sha256: String,
    source: String,
    license: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(super) struct Compatibility {
    minimum: String,
    maximum_exclusive: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(super) struct ContentPackManifest {
    schema_version: u8,
    id: String,
    version: String,
    app_compatibility: Compatibility,
    quality_tier: String,
    compressed_bytes: u64,
    installed_bytes: u64,
    files: Vec<ContentPackFile>,
    #[serde(default)]
    base_url: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct ContentPackStatus {
    id: String,
    status: String,
    installed_version: Option<String>,
    progress: f64,
    error: Option<String>,
    manifest_sha256: Option<String>,
    rollback_version: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(
    tag = "kind",
    rename_all = "lowercase",
    rename_all_fields = "camelCase"
)]
pub(crate) enum ContentPackInstallSource {
    Local { manifest_path: String },
    Https { manifest_url: String },
}

pub(crate) const CONTENT_PACK_IDS: [&str; 6] = [
    "core",
    "planet-hd",
    "deep-sky",
    "spacecraft",
    "science-fixtures",
    "runtime-codecs",
];

fn content_pack_compatibility_version() -> Result<semver::Version, String> {
    let mut version =
        semver::Version::parse(env!("CARGO_PKG_VERSION")).map_err(|error| error.to_string())?;
    // A 1.0.0-beta desktop build consumes the 1.0.0 content-pack schema. Only
    // prerelease/build identifiers are ignored; major/minor/patch boundaries
    // and the manifest's maximum-exclusive guard remain authoritative.
    version.pre = semver::Prerelease::EMPTY;
    version.build = semver::BuildMetadata::EMPTY;
    Ok(version)
}

#[tauri::command]
pub(crate) async fn install_content_pack(
    app: AppHandle,
    state: State<'_, DesktopState>,
    source: ContentPackInstallSource,
) -> Result<ContentPackStatus, String> {
    installer::install_content_pack(app, state, source).await
}

#[tauri::command]
pub(crate) fn list_content_packs(app: AppHandle) -> Result<Vec<ContentPackStatus>, String> {
    let root = app_data_dir(&app)?.join("content-packs");
    let mut result = Vec::new();
    for id in CONTENT_PACK_IDS {
        let receipt_value = fs::read_to_string(root.join(id).join("receipt.json"))
            .ok()
            .and_then(|value| serde_json::from_str::<serde_json::Value>(&value).ok());
        let installed_version = receipt_value
            .as_ref()
            .and_then(|value| value.get("version")?.as_str().map(str::to_owned));
        let rollback_version = receipt_value
            .as_ref()
            .and_then(|value| value.get("previousVersion")?.as_str().map(str::to_owned));
        let manifest_sha256 = receipt_value
            .as_ref()
            .and_then(|value| value.get("manifestSha256")?.as_str().map(str::to_owned));
        let installed = installed_version.is_some();
        result.push(ContentPackStatus {
            id: id.to_string(),
            status: if installed {
                "installed"
            } else {
                "not-installed"
            }
            .to_string(),
            installed_version,
            progress: if installed { 1.0 } else { 0.0 },
            error: None,
            manifest_sha256,
            rollback_version,
        });
    }
    Ok(result)
}

pub(super) fn validate_pack_manifest(manifest: &ContentPackManifest) -> Result<(), String> {
    if manifest.schema_version != 1 {
        return Err("unsupported-content-pack-schema".to_string());
    }
    if !CONTENT_PACK_IDS.contains(&manifest.id.as_str()) {
        return Err("unsupported-content-pack-id".to_string());
    }
    let app_version = content_pack_compatibility_version()?;
    let minimum = semver::Version::parse(&manifest.app_compatibility.minimum)
        .map_err(|error| error.to_string())?;
    let maximum = semver::Version::parse(&manifest.app_compatibility.maximum_exclusive)
        .map_err(|error| error.to_string())?;
    if app_version < minimum || app_version >= maximum {
        return Err("content-pack-app-version-incompatible".to_string());
    }
    if manifest.files.iter().any(|file| {
        Path::new(&file.path).is_absolute()
            || Path::new(&file.path)
                .components()
                .any(|component| !matches!(component, std::path::Component::Normal(_)))
            || file.sha256.len() != 64
    }) {
        return Err("unsafe-content-pack-path-or-hash".to_string());
    }
    let declared_bytes = manifest.files.iter().try_fold(0_u64, |sum, file| {
        sum.checked_add(file.bytes)
            .ok_or("content-pack-size-overflow")
    })?;
    if declared_bytes != manifest.installed_bytes {
        return Err("content-pack-size-mismatch".to_string());
    }
    Ok(())
}

pub(super) fn remove_obsolete_pack_files(
    content_root: &Path,
    current: &ContentPackManifest,
    next: &ContentPackManifest,
) -> Result<(), String> {
    for file in &current.files {
        if next
            .files
            .iter()
            .any(|candidate| candidate.path == file.path)
        {
            continue;
        }
        let destination = content_root.join(&file.path);
        if destination.is_file() {
            fs::remove_file(destination).map_err(|error| error.to_string())?;
        }
    }
    Ok(())
}

pub(super) fn read_installed_manifest(version_root: &Path) -> Result<ContentPackManifest, String> {
    serde_json::from_slice(
        &fs::read(version_root.join("manifest.json")).map_err(|error| error.to_string())?,
    )
    .map_err(|error| error.to_string())
}

#[tauri::command]
pub(crate) fn cancel_content_pack_install(state: State<'_, DesktopState>, id: String) -> bool {
    if let Some(cancel) = state.downloads.lock().get(&id) {
        cancel.store(true, Ordering::Relaxed);
        true
    } else {
        false
    }
}

#[tauri::command]
pub(crate) fn rollback_content_pack(
    app: AppHandle,
    id: String,
) -> Result<ContentPackStatus, String> {
    if !CONTENT_PACK_IDS.contains(&id.as_str()) {
        return Err("unsupported-content-pack-id".to_string());
    }
    let pack_root = app_data_dir(&app)?.join("content-packs").join(&id);
    let receipt_path = pack_root.join("receipt.json");
    let receipt: serde_json::Value = serde_json::from_str(
        &fs::read_to_string(&receipt_path).map_err(|_| "content-pack-not-installed".to_string())?,
    )
    .map_err(|error| error.to_string())?;
    let current = receipt
        .get("version")
        .and_then(|value| value.as_str())
        .ok_or("content-pack-receipt-invalid")?
        .to_string();
    let previous = receipt
        .get("previousVersion")
        .and_then(|value| value.as_str())
        .ok_or("content-pack-rollback-unavailable")?
        .to_string();
    let previous_root = pack_root.join("versions").join(&previous).join("files");
    if !previous_root.is_dir() {
        return Err("content-pack-rollback-version-missing".to_string());
    }
    let current_version_root = pack_root.join("versions").join(&current);
    let previous_version_root = pack_root.join("versions").join(&previous);
    let content_root = runtime_server_dir(&app)?.join("public");
    remove_obsolete_pack_files(
        &content_root,
        &read_installed_manifest(&current_version_root)?,
        &read_installed_manifest(&previous_version_root)?,
    )?;
    copy_directory_overlay(&previous_root, &content_root)?;
    fs::write(&receipt_path, serde_json::json!({
        "version": previous,
        "previousVersion": current,
        "manifestSha256": receipt.get("manifestSha256").cloned().unwrap_or(serde_json::Value::Null),
        "rolledBackAtUnixMs": SystemTime::now().duration_since(UNIX_EPOCH).unwrap_or_default().as_millis(),
    }).to_string()).map_err(|error| error.to_string())?;
    Ok(ContentPackStatus {
        id,
        status: "installed".to_string(),
        installed_version: Some(previous),
        progress: 1.0,
        error: None,
        manifest_sha256: receipt
            .get("manifestSha256")
            .and_then(|value| value.as_str())
            .map(str::to_owned),
        rollback_version: Some(current),
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use installer::allowed_https_url;

    fn manifest(path: &str, bytes: u64) -> ContentPackManifest {
        ContentPackManifest {
            schema_version: 1,
            id: "core".to_string(),
            version: "1.0.0".to_string(),
            app_compatibility: Compatibility {
                minimum: "1.0.0".to_string(),
                maximum_exclusive: "2.0.0".to_string(),
            },
            quality_tier: "required".to_string(),
            compressed_bytes: 0,
            installed_bytes: bytes,
            files: vec![ContentPackFile {
                path: path.to_string(),
                bytes,
                sha256: "0".repeat(64),
                source: "test".to_string(),
                license: "test".to_string(),
            }],
            base_url: String::new(),
        }
    }

    #[test]
    fn validates_supported_pack_and_declared_size() {
        assert!(validate_pack_manifest(&manifest("data/catalog/manifest.json", 42)).is_ok());
        let mut invalid = manifest("data/catalog/manifest.json", 42);
        invalid.installed_bytes = 43;
        assert_eq!(
            validate_pack_manifest(&invalid).unwrap_err(),
            "content-pack-size-mismatch"
        );
    }

    #[test]
    fn rejects_traversal_unknown_pack_and_plain_http() {
        assert_eq!(
            validate_pack_manifest(&manifest("../outside.bin", 1)).unwrap_err(),
            "unsafe-content-pack-path-or-hash",
        );
        let mut unknown = manifest("safe.bin", 1);
        unknown.id = "unknown".to_string();
        assert_eq!(
            validate_pack_manifest(&unknown).unwrap_err(),
            "unsupported-content-pack-id"
        );
        assert_eq!(
            allowed_https_url("http://example.com/pack.json").unwrap_err(),
            "content-pack-https-required"
        );
    }

    #[test]
    fn deserializes_typed_local_install_source() {
        let source: ContentPackInstallSource = serde_json::from_value(serde_json::json!({
            "kind": "local",
            "manifestPath": "D:/packs/core.manifest.json"
        }))
        .unwrap();
        assert!(
            matches!(source, ContentPackInstallSource::Local { manifest_path } if manifest_path.ends_with("core.manifest.json"))
        );
    }
}
