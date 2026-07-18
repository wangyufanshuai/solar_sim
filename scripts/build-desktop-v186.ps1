$ErrorActionPreference = "Stop"

$toolchain = "E:\xuexi\tools\rustup-v186\toolchains\stable-x86_64-pc-windows-msvc\bin"
$env:RUSTUP_HOME = "E:\xuexi\tools\rustup-v186"
$env:CARGO_HOME = "E:\xuexi\tools\cargo-v186"
$env:CARGO_TARGET_DIR = "E:\xuexi\tools\cargo-target\orbit-atlas-v186"
$env:CARGO_BUILD_JOBS = "2"
$env:RUSTC = Join-Path $toolchain "rustc.exe"
$env:RUSTDOC = Join-Path $toolchain "rustdoc.exe"

npm run desktop:stage:v186
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

npx tauri build --config src-tauri/tauri.v186.conf.json --bundles nsis,msi
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
