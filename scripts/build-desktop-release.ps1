param([switch]$Signed)

$ErrorActionPreference = "Stop"
$rustc = (& rustup which rustc).Trim()
if ($LASTEXITCODE -ne 0 -or -not (Test-Path $rustc)) { throw "rustc is unavailable" }
$toolchain = Split-Path $rustc
$env:PATH = "$toolchain;$env:PATH"
$env:CARGO_BUILD_JOBS = "2"

if (-not $env:ATLAS_RELEASE_VERSION) { $env:ATLAS_RELEASE_VERSION = "1.0.0-beta.1" }
$tauriArgs = @("tauri", "build", "--bundles", "nsis,msi")
$enableSigning = $Signed -or $env:ATLAS_ENABLE_AZURE_ARTIFACT_SIGNING -eq "1"
if ($enableSigning) {
  $required = @(
    "AZURE_CLIENT_ID",
    "AZURE_CLIENT_SECRET",
    "AZURE_TENANT_ID",
    "ATLAS_AZURE_ARTIFACT_SIGNING_ENDPOINT",
    "ATLAS_AZURE_ARTIFACT_SIGNING_ACCOUNT",
    "ATLAS_AZURE_ARTIFACT_SIGNING_PROFILE"
  )
  $missing = @($required | Where-Object { -not [Environment]::GetEnvironmentVariable($_) })
  if ($missing.Count -gt 0) { throw "Azure Artifact Signing preflight failed; missing environment variables: $($missing -join ', ')" }
  $tauriArgs += @("--config", "src-tauri/tauri.artifact-signing.conf.json")
}

& npx @tauriArgs
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
