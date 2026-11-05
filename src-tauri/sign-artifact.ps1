param([Parameter(Mandatory = $true)][string]$ArtifactPath)

$ErrorActionPreference = "Stop"
$required = @(
  "AZURE_CLIENT_ID",
  "AZURE_CLIENT_SECRET",
  "AZURE_TENANT_ID",
  "ATLAS_AZURE_ARTIFACT_SIGNING_ENDPOINT",
  "ATLAS_AZURE_ARTIFACT_SIGNING_ACCOUNT",
  "ATLAS_AZURE_ARTIFACT_SIGNING_PROFILE"
)
$missing = @($required | Where-Object { -not [Environment]::GetEnvironmentVariable($_) })
if ($missing.Count -gt 0) { throw "Azure Artifact Signing environment is incomplete: $($missing -join ', ')" }

$artifact = Resolve-Path -LiteralPath $ArtifactPath -ErrorAction Stop
$signer = Get-Command artifact-signing-cli -ErrorAction Stop
& $signer.Source `
  -e $env:ATLAS_AZURE_ARTIFACT_SIGNING_ENDPOINT `
  -a $env:ATLAS_AZURE_ARTIFACT_SIGNING_ACCOUNT `
  -c $env:ATLAS_AZURE_ARTIFACT_SIGNING_PROFILE `
  -d "Orbit Atlas" `
  $artifact.Path
if ($LASTEXITCODE -ne 0) { throw "Azure Artifact Signing failed for $($artifact.Path)" }

