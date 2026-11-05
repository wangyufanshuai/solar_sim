$ErrorActionPreference = 'Stop'
$root = Resolve-Path (Join-Path $PSScriptRoot '..')
$toolManifest = Get-Content -Raw (Join-Path $root 'public\data\ktx-toolchain-manifest.json') | ConvertFrom-Json
$toktx = $toolManifest.executable
if (-not (Test-Path -LiteralPath $toktx)) { throw 'Run npm run bootstrap:ktx-tools first' }
$textureRoot = Join-Path $root 'public\textures'
$textureRootFull = [IO.Path]::GetFullPath($textureRoot).TrimEnd('\')
$outputRoot = Join-Path $textureRoot 'ktx2'
New-Item -ItemType Directory -Force $outputRoot | Out-Null
$files = Get-ChildItem -LiteralPath $textureRoot -Recurse -File | Where-Object { $_.Extension -match '^\.(jpg|jpeg|png)$' -and $_.FullName -notmatch '\\sky\\|\\ktx2\\' -and $_.BaseName -match 'earth|moon|mars|jupiter|saturn|mercury' }
$assets = @()
foreach ($file in $files) {
  $sourceFull = [IO.Path]::GetFullPath($file.FullName)
  if (-not $sourceFull.StartsWith($textureRootFull + '\', [StringComparison]::OrdinalIgnoreCase)) {
    throw "Texture escaped the expected root: $sourceFull"
  }
  $relative = $sourceFull.Substring($textureRootFull.Length + 1).Replace('\','/')
  $safe = ($relative -replace '[^A-Za-z0-9._-]', '_') -replace '\.(jpg|jpeg|png)$', '.ktx2'
  $dest = Join-Path $outputRoot $safe
  $linear = $file.BaseName -match 'normal|roughness|alpha|mask|opacity'
  if (-not (Test-Path -LiteralPath $dest) -or (Get-Item -LiteralPath $dest).LastWriteTimeUtc -lt $file.LastWriteTimeUtc) {
    $args = @('--t2','--genmipmap','--threads','2')
    if ($linear) { $args += @('--encode','uastc','--uastc_quality','2','--zcmp','12','--assign_oetf','linear') }
    else { $args += @('--encode','etc1s','--qlevel','180','--assign_oetf','srgb') }
    $args += @($dest,$file.FullName)
    & $toktx @args
    if ($LASTEXITCODE -ne 0) { throw "toktx failed for $relative" }
  }
  $assets += [ordered]@{ source='/textures/'+$relative; ktx2='/textures/ktx2/'+[IO.Path]::GetFileName($dest); mode=if($linear){'uastc-zstd'}else{'etc1s'}; sourceBytes=$file.Length; ktx2Bytes=(Get-Item $dest).Length; sha256=(Get-FileHash $dest -Algorithm SHA256).Hash.ToLowerInvariant() }
}
$manifest=[ordered]@{version='v126-planet-ktx2-pipeline';generatedAt=(Get-Date).ToUniversalTime().ToString('o');assetCount=$assets.Count;runtimePolicy='ktx2-preferred-jpg-png-fallback-v9-sky-unchanged';tool=$toolManifest;assets=$assets}
$manifest | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath (Join-Path $root 'public\data\planet-textures-v2.json') -Encoding utf8
Write-Output "KTX2 assets: $($assets.Count)"
