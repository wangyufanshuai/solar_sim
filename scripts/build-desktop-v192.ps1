$ErrorActionPreference = "Stop"
$rustc = (& rustup which rustc).Trim()
if ($LASTEXITCODE -ne 0 -or -not (Test-Path $rustc)) { throw "rustc is unavailable" }
$toolchain = Split-Path $rustc
$env:PATH = "$toolchain;$env:PATH"
$env:CARGO_BUILD_JOBS = "2"

npx tauri build --config src-tauri/tauri.v192.conf.json --bundles nsis,msi
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
