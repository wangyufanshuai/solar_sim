<#
  Orbit Atlas - 阶段 0 工程止血脚本
  默认只统计、不改任何文件。加 -Apply 才执行。

  用法（在 next-web 目录下的 PowerShell 里）：
    powershell -ExecutionPolicy Bypass -File scripts\cleanup-phase0.ps1          # 只看报告
    powershell -ExecutionPolicy Bypass -File scripts\cleanup-phase0.ps1 -Apply   # 执行

  -Apply 会做三件事：
    1. 删除可再生的 Next 构建产物目录 .next-*（保留 .next 和 KeepBuildDirs 里列出的目录）。
       这些目录都能用 npm run build 重新生成，不含源码。
    2. 把根目录散落的日志、截图和 off 文件移动到 _archive\root-artifacts\（移动，不删除）。
    3. 往 .gitignore 追加构建产物、日志、截图等规则（已存在的规则不重复写）。
  脚本不会碰 app\、science\、data\、docs\、node_modules\ 及任何源码。
#>
param(
  [switch]$Apply,
  [string[]]$KeepBuildDirs = @('.next', '.next-atlas-lite-current')
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root
if (-not (Test-Path (Join-Path $root 'package.json'))) { throw "没有在 $root 找到 package.json，请把脚本放在 next-web\scripts\ 下运行。" }

function Get-SizeBytes([string]$path) {
  $sum = (Get-ChildItem -LiteralPath $path -Recurse -File -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
  if ($null -eq $sum) { return 0 } else { return [int64]$sum }
}
function Format-Size([int64]$b) { if ($b -ge 1GB) { '{0:N2} GB' -f ($b / 1GB) } else { '{0:N1} MB' -f ($b / 1MB) } }

$drive = (Get-Item $root).PSDrive
Write-Host ("项目目录: {0}" -f $root)
Write-Host ("{0}: 盘剩余 {1}" -f $drive.Name, (Format-Size ([int64]$drive.Free)))
Write-Host ''

# 1. 构建产物目录
$buildDirs = Get-ChildItem -LiteralPath $root -Directory -Force | Where-Object { $_.Name -like '.next*' -and ($KeepBuildDirs -notcontains $_.Name) }
$total = [int64]0
Write-Host "== 1. 可删除的构建产物目录 ($($buildDirs.Count) 个) =="
foreach ($d in $buildDirs) {
  $s = Get-SizeBytes $d.FullName; $total += $s
  Write-Host ("  {0,12}  {1}" -f (Format-Size $s), $d.Name)
}
Write-Host ("  合计 {0}" -f (Format-Size $total))
Write-Host ("  保留: {0}" -f ($KeepBuildDirs -join ', '))
Write-Host ''

# 2. 根目录散落文件
$loosePatterns = @('*.log', '*.err', '*.out', '*.png', 'off', 'Untitled')
$loose = Get-ChildItem -LiteralPath $root -File -Force | Where-Object {
  $n = $_.Name; ($loosePatterns | Where-Object { $n -like $_ }).Count -gt 0
}
$looseTotal = [int64](($loose | Measure-Object Length -Sum).Sum)
Write-Host ("== 2. 根目录要归档的散落文件 ({0} 个, {1}) -> _archive\root-artifacts\ ==" -f $loose.Count, (Format-Size $looseTotal))
$loose | Sort-Object Length -Descending | Select-Object -First 15 | ForEach-Object { Write-Host ("  {0,12}  {1}" -f (Format-Size $_.Length), $_.Name) }
if ($loose.Count -gt 15) { Write-Host "  ...（其余省略）" }
Write-Host ''

# 3. 仅报告：其它体积较大的目录，不处理
Write-Host '== 3. 仅报告（不处理），供你判断 =='
foreach ($n in @('.cache', 'tmp', 'tmp-old-2315', 'test-results', 'output', 'dist', 'source-cache', 'exa-results', '.venv-science', 'docs\release')) {
  $p = Join-Path $root $n
  if (Test-Path $p) { Write-Host ("  {0,12}  {1}" -f (Format-Size (Get-SizeBytes $p)), $n) }
}
Write-Host ''

$ignoreRules = @(
  '# --- phase0 cleanup ---',
  '/.next*/', '/dist/', '/test-results/', '/output/', '/tmp/', '/tmp-old-*/', '/_archive/',
  '/.playwright-cli/', '/.playwright-mcp/', '/.cache/', '/.venv-science/',
  '__pycache__/', '*.pyc', '/*.log', '/*.err', '/*.out', '/*.png', '/off'
)

if (-not $Apply) {
  Write-Host '这是预览，没有改动任何文件。确认后加 -Apply 重新运行。' -ForegroundColor Yellow
  exit 0
}

Write-Host '开始执行...' -ForegroundColor Cyan
foreach ($d in $buildDirs) {
  Write-Host ("  删除 {0}" -f $d.Name)
  Remove-Item -LiteralPath $d.FullName -Recurse -Force
}
$arch = Join-Path $root '_archive\root-artifacts'
New-Item -ItemType Directory -Force -Path $arch | Out-Null
foreach ($f in $loose) { Move-Item -LiteralPath $f.FullName -Destination $arch -Force }
Write-Host ("  已移动 {0} 个散落文件到 _archive\root-artifacts\" -f $loose.Count)

$gi = Join-Path $root '.gitignore'
$existing = if (Test-Path $gi) { Get-Content $gi } else { @() }
$add = $ignoreRules | Where-Object { $existing -notcontains $_ }
if ($add.Count -gt 0) { Add-Content -Path $gi -Value ("`r`n" + ($add -join "`r`n")) -Encoding UTF8; Write-Host ("  .gitignore 追加 {0} 条规则" -f $add.Count) }

$drive = (Get-Item $root).PSDrive
Write-Host ("完成。{0}: 盘剩余 {1}" -f $drive.Name, (Format-Size ([int64]$drive.Free))) -ForegroundColor Green
Write-Host '下一步：git add -A ; git commit -m "phase0: baseline before cleanup"'
