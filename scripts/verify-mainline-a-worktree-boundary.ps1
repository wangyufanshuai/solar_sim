[CmdletBinding()]
param(
  [ValidateSet('check', 'snapshot', 'compare')]
  [string]$Mode = 'check',
  [string]$ReceiptPath = 'docs/release/v607/mainline-a-worktree-protection-20260922.json',
  [switch]$StrictCompare
)

$ErrorActionPreference = 'Stop'

function Resolve-FromRoot {
  param([Parameter(Mandatory = $true)][string]$Path)
  $candidate = Join-Path $script:RepoRoot $Path
  return [System.IO.Path]::GetFullPath($candidate)
}

function Invoke-GitText {
  param([Parameter(Mandatory = $true)][string[]]$Arguments)
  $output = & git @Arguments 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw "git command failed ($LASTEXITCODE): git $($Arguments -join ' ')`n$($output -join "`n")"
  }
  return (($output -join "`n").TrimEnd("`r", "`n"))
}

function Get-Sha256Text {
  param([Parameter(Mandatory = $true)][string]$Text)
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($Text)
  $sha = [System.Security.Cryptography.SHA256]::Create()
  try {
    return ([BitConverter]::ToString($sha.ComputeHash($bytes))).Replace('-', '').ToLowerInvariant()
  } finally {
    $sha.Dispose()
  }
}

function Get-StatusRows {
  $raw = & git status --porcelain=v1 --untracked-files=all 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw "git status failed ($LASTEXITCODE): $($raw -join "`n")"
  }
  $rows = @($raw | ForEach-Object { [string]$_ } | Where-Object { $_.Length -gt 0 })
  return [ordered]@{
    rows = $rows
    text = ($rows -join "`n")
  }
}

function Get-StatusSummary {
  param([Parameter(Mandatory = $true)][string[]]$Rows)
  $trackedModified = 0
  $staged = 0
  $unstaged = 0
  $untracked = 0
  $deleted = 0
  foreach ($row in $Rows) {
    if ($row.StartsWith('??')) {
      $untracked++
      continue
    }
    $index = $row.Substring(0, 1)
    $worktree = $row.Substring(1, 1)
    if ($index -ne ' ') { $staged++ }
    if ($worktree -ne ' ') { $unstaged++ }
    if ($index -eq 'D' -or $worktree -eq 'D') { $deleted++ }
    if ($index -ne ' ' -or $worktree -ne ' ') { $trackedModified++ }
  }
  return [ordered]@{
    totalRows = $Rows.Count
    trackedModified = $trackedModified
    staged = $staged
    unstaged = $unstaged
    untracked = $untracked
    deleted = $deleted
  }
}

$script:RepoRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
Set-Location -LiteralPath $script:RepoRoot

$declaredRoot = $script:RepoRoot.Replace('\', '/').TrimEnd('/')
$actualRoot = (Invoke-GitText @('rev-parse', '--show-toplevel')).Replace('\', '/').TrimEnd('/')
if ($actualRoot -ne $declaredRoot) {
  throw "worktree-boundary-violation: expected $declaredRoot but git resolved $actualRoot"
}

$branch = Invoke-GitText @('branch', '--show-current')
if ($branch -ne 'codex/solar-sim-mainline-a') {
  throw "branch-boundary-violation: expected codex/solar-sim-mainline-a but received $branch"
}

$boundaryFile = Resolve-FromRoot 'docs/release/v607/mainline-a-worktree-boundary-20260914.json'
if (-not (Test-Path -LiteralPath $boundaryFile -PathType Leaf)) {
  throw "missing-boundary-receipt: $boundaryFile"
}
$boundary = Get-Content -LiteralPath $boundaryFile -Raw | ConvertFrom-Json
$baseline = [string]$boundary.localRepository.baselineCommit
if ([string]::IsNullOrWhiteSpace($baseline)) {
  throw 'boundary-receipt-missing-baseline'
}

$untrackedCache = Invoke-GitText @('config', '--local', '--get', 'core.untrackedCache')
$preloadIndex = Invoke-GitText @('config', '--local', '--get', 'core.preloadIndex')
$head = Invoke-GitText @('rev-parse', 'HEAD')
$status = Get-StatusRows
$summary = Get-StatusSummary -Rows $status.rows
$statusDigest = Get-Sha256Text -Text $status.text
$trackedFileCount = [int]((Invoke-GitText @('ls-files')) -split "`n" | Where-Object { $_.Length -gt 0 }).Count
$parentRoot = [System.IO.Path]::GetFullPath((Join-Path $script:RepoRoot '..\..'))
$parentGit = Test-Path -LiteralPath (Join-Path $parentRoot '.git')

$snapshot = [ordered]@{
  schema = 'mainline-a-worktree-protection-v1'
  generatedAt = (Get-Date).ToUniversalTime().ToString('o')
  workspace = $declaredRoot
  branch = $branch
  head = $head
  historicalBaseline = $baseline
  boundaryReceipt = 'docs/release/v607/mainline-a-worktree-boundary-20260914.json'
  trackedFileCount = $trackedFileCount
  status = $summary
  statusDigest = $statusDigest
  gitAcceleration = [ordered]@{
    coreUntrackedCache = $untrackedCache
    corePreloadIndex = $preloadIndex
    recommendation = 'Run local Git status only; do not inspect or mutate the parent repository during product verification.'
  }
  parentRepository = [ordered]@{
    path = $parentRoot.Replace('\', '/')
    hasGitDirectory = $parentGit
    mutation = 'forbidden'
    statusInspection = 'not required for local verification'
  }
  safety = [ordered]@{
    reset = 'forbidden'
    clean = 'forbidden'
    checkout = 'forbidden'
    blanketStage = 'forbidden'
    deleteUntracked = 'forbidden'
    sourceOverwrite = 'forbidden'
  }
}

switch ($Mode) {
  'check' {
    [pscustomobject]$snapshot | ConvertTo-Json -Depth 8
    exit 0
  }
  'snapshot' {
    $target = Resolve-FromRoot $ReceiptPath
    $targetDir = Split-Path -Parent $target
    New-Item -ItemType Directory -Force -Path $targetDir | Out-Null
    [pscustomobject]$snapshot | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $target -Encoding UTF8
    Write-Output "wrote $($target.Replace('\', '/'))"
    Write-Output "statusDigest=$statusDigest totalRows=$($summary.totalRows) untracked=$($summary.untracked)"
    exit 0
  }
  'compare' {
    $target = Resolve-FromRoot $ReceiptPath
    if (-not (Test-Path -LiteralPath $target -PathType Leaf)) {
      throw "missing-protection-receipt: $target"
    }
    $previous = Get-Content -LiteralPath $target -Raw | ConvertFrom-Json
    $same = [string]$previous.workspace -eq $snapshot.workspace -and
      [string]$previous.branch -eq $snapshot.branch -and
      [string]$previous.statusDigest -eq $snapshot.statusDigest
    $result = [ordered]@{
      sameStatusDigest = $same
      previousStatusDigest = [string]$previous.statusDigest
      currentStatusDigest = $statusDigest
      previousHead = [string]$previous.head
      currentHead = $head
      currentStatus = $summary
      interpretation = if ($same) { 'No working-tree status change since snapshot.' } else { 'Working-tree status changed; inspect a bounded diff. Existing changes remain protected.' }
    }
    [pscustomobject]$result | ConvertTo-Json -Depth 8
    if ($StrictCompare -and -not $same) { exit 2 }
    exit 0
  }
}
