param(
  [ValidateSet("fmt-check", "check", "test", "verify")]
  [string]$Mode = "verify"
)

$ErrorActionPreference = "Stop"
$toolchain = "E:\xuexi\tools\rustup-v186\toolchains\stable-x86_64-pc-windows-msvc\bin"
$env:RUSTUP_HOME = "E:\xuexi\tools\rustup-v186"
$env:CARGO_HOME = "E:\xuexi\tools\cargo-v186"
$env:CARGO_TARGET_DIR = "E:\xuexi\tools\cargo-target\orbit-atlas-v186"
$env:RUSTC = Join-Path $toolchain "rustc.exe"
$env:RUSTDOC = Join-Path $toolchain "rustdoc.exe"
$cargo = Join-Path $toolchain "cargo.exe"
$manifest = Join-Path $PSScriptRoot "..\src-tauri\Cargo.toml"

function Invoke-Cargo([string[]]$Arguments) {
  & $cargo @Arguments
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

if ($Mode -in @("fmt-check", "verify")) {
  Invoke-Cargo @("fmt", "--manifest-path", $manifest, "--", "--check")
}
if ($Mode -in @("check", "verify")) {
  Invoke-Cargo @("check", "--manifest-path", $manifest, "-j", "2")
}
if ($Mode -in @("test", "verify")) {
  Invoke-Cargo @("test", "--manifest-path", $manifest, "-j", "2")
}
