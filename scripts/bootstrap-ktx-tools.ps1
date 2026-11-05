$ErrorActionPreference = 'Stop'
$version = '4.4.2'
$root = Resolve-Path (Join-Path $PSScriptRoot '..')
$cache = Join-Path $root "tools\asset-cache\KTX-Software-$version-Windows-x64.exe"
$install = Join-Path $root "tools\ktx\$version"
$url = "https://github.com/KhronosGroup/KTX-Software/releases/download/v$version/KTX-Software-$version-Windows-x64.exe"
New-Item -ItemType Directory -Force (Split-Path $cache), $install | Out-Null
if (-not (Test-Path -LiteralPath $cache)) { Invoke-WebRequest -Uri $url -OutFile $cache -UseBasicParsing -TimeoutSec 300 }
$sha = (Get-FileHash -LiteralPath $cache -Algorithm SHA256).Hash.ToLowerInvariant()
$ktx = Get-ChildItem -LiteralPath $install -Filter 'toktx.exe' -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
if (-not $ktx) {
  $args = @('/S', "/D=$install")
  $proc = Start-Process -FilePath $cache -ArgumentList $args -Wait -PassThru -WindowStyle Hidden
  if ($proc.ExitCode -ne 0) { throw "KTX installer failed: $($proc.ExitCode)" }
  $ktx = Get-ChildItem -LiteralPath $install -Filter 'toktx.exe' -Recurse | Select-Object -First 1
}
if (-not $ktx) { throw 'toktx.exe was not installed' }
$manifest = [ordered]@{ version=$version; source=$url; sha256=$sha; license='Apache-2.0'; executable=$ktx.FullName; installedAt=(Get-Date).ToUniversalTime().ToString('o') }
$manifestPath = Join-Path $root 'public\data\ktx-toolchain-manifest.json'
$manifest | ConvertTo-Json | Set-Content -LiteralPath $manifestPath -Encoding utf8
$basisOut = Join-Path $root 'public\basis'
New-Item -ItemType Directory -Force $basisOut | Out-Null
Copy-Item -LiteralPath (Join-Path $root 'node_modules\three\examples\jsm\libs\basis\basis_transcoder.js') -Destination $basisOut -Force
Copy-Item -LiteralPath (Join-Path $root 'node_modules\three\examples\jsm\libs\basis\basis_transcoder.wasm') -Destination $basisOut -Force
Write-Output $ktx.FullName
