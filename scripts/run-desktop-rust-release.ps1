param(
  [ValidateSet("fmt-check", "check", "test", "release-check", "verify")]
  [string]$Mode = "verify"
)

$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$manifest = Join-Path $root "src-tauri\Cargo.toml"
$outputDir = Join-Path $root "dist\science"
$outputPath = Join-Path $outputDir "desktop-rust-release.json"
$startedAt = [DateTimeOffset]::UtcNow

function Invoke-RustCargo([string[]]$Arguments) {
  & rustup run stable cargo @Arguments
  if ($LASTEXITCODE -ne 0) { throw "cargo command failed: cargo $($Arguments -join ' ')" }
}

$rustcVersion = (& rustup run stable rustc --version).Trim()
if ($LASTEXITCODE -ne 0) { throw "rustc is unavailable" }
$cargoVersion = (& rustup run stable cargo --version).Trim()
if ($LASTEXITCODE -ne 0) { throw "cargo is unavailable" }

$checks = [ordered]@{ fmt = $null; check = $null; test = $null; releaseCheck = $null }
if ($Mode -in @("fmt-check", "verify")) {
  Invoke-RustCargo @("fmt", "--manifest-path", $manifest, "--", "--check"); $checks.fmt = "passed"
}
if ($Mode -in @("check", "verify")) {
  Invoke-RustCargo @("check", "--manifest-path", $manifest, "-j", "2"); $checks.check = "passed"
}
if ($Mode -in @("test", "verify")) {
  Invoke-RustCargo @("test", "--manifest-path", $manifest, "-j", "2"); $checks.test = "passed"
}
if ($Mode -in @("release-check", "verify")) {
  Invoke-RustCargo @("check", "--release", "--manifest-path", $manifest, "-j", "2"); $checks.releaseCheck = "passed"
}

$sourceLineCounts = [ordered]@{}
Get-ChildItem (Join-Path $root "src-tauri\src") -Filter "*.rs" | Sort-Object Name | ForEach-Object {
  $sourceLineCounts[$_.Name] = (Get-Content $_.FullName).Count
}
New-Item -ItemType Directory -Force $outputDir | Out-Null
$report = [ordered]@{
  version = "desktop-rust-release-verification-v1"
  releaseVersion = if ($env:ATLAS_RELEASE_VERSION) { $env:ATLAS_RELEASE_VERSION } else { "1.0.0-beta.1" }
  generatedAt = [DateTimeOffset]::UtcNow.ToString("o")
  startedAt = $startedAt.ToString("o")
  target = "x86_64-pc-windows-msvc"
  rustc = $rustcVersion
  cargo = $cargoVersion
  checks = $checks
  sourceLineCounts = $sourceLineCounts
  passed = -not ($checks.Values -contains $null)
}
[System.IO.File]::WriteAllText($outputPath, ($report | ConvertTo-Json -Depth 6), [System.Text.UTF8Encoding]::new($false))
Write-Output "desktop Rust release evidence: $outputPath"

