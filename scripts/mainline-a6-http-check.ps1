$base = 'http://127.0.0.1:3017'
$root = (Resolve-Path 'public').Path
$files = Get-ChildItem (Join-Path $root 'textures/mainline-a') -Filter '*.jpg' | Sort-Object Name
$client = [System.Net.Http.HttpClient]::new()
$rows = @()
foreach ($f in $files) {
  $rel = '/textures/mainline-a/' + $f.Name
  try {
    $resp = $client.GetAsync($base + $rel).GetAwaiter().GetResult()
    $bytes = $resp.Content.ReadAsByteArrayAsync().GetAwaiter().GetResult()
    $sha = [System.BitConverter]::ToString([System.Security.Cryptography.SHA256]::HashData($bytes)).Replace('-', '').ToLowerInvariant()
    $localSha = (Get-FileHash -LiteralPath $f.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
    $ct = if ($resp.Content.Headers.ContentType) { $resp.Content.Headers.ContentType.MediaType } else { $null }
    $matched = (([int]$resp.StatusCode -eq 200) -and ($ct -eq 'image/jpeg') -and ($bytes.Length -eq $f.Length) -and ($sha -eq $localSha))
    $rows += [pscustomobject]@{ objectId=$f.BaseName; path=$rel; status=[int]$resp.StatusCode; contentType=$ct; bytes=$bytes.Length; localBytes=$f.Length; sha256=$sha; localSha256=$localSha; matched=$matched }
  } catch {
    $rows += [pscustomobject]@{ objectId=$f.BaseName; path=$rel; status=0; error=$_.Exception.Message; matched=$false }
  }
}
$client.Dispose()
$rows | ConvertTo-Json -Depth 5
