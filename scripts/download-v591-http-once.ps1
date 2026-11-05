param(
  [Parameter(Mandatory = $true)][string]$Url,
  [Parameter(Mandatory = $true)][string]$OutputPath,
  [Parameter(Mandatory = $true)][string]$Accept
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Net.Http
$uri = [Uri]$Url
if ($uri.Scheme -ne "https" -or $uri.Host -ne "api.github.com" -or $uri.UserInfo -or -not $uri.AbsolutePath.StartsWith("/repos/nasa/NASA-3D-Resources/git/blobs/")) {
  throw "v591-system-http-url-policy:$Url"
}
$handler = [System.Net.Http.HttpClientHandler]::new()
$handler.AllowAutoRedirect = $false
$client = [System.Net.Http.HttpClient]::new($handler)
$client.Timeout = [TimeSpan]::FromMinutes(10)
$client.DefaultRequestHeaders.UserAgent.ParseAdd("Orbit-Atlas-v591-NASA-3D-git-blob-acquisition/1.0")
$client.DefaultRequestHeaders.Accept.ParseAdd($Accept)
try {
  $response = $client.GetAsync($uri).GetAwaiter().GetResult()
  $finalUri = $response.RequestMessage.RequestUri.AbsoluteUri
  $location = if ($response.Headers.Location) { $response.Headers.Location.AbsoluteUri } else { $null }
  $bytes = $response.Content.ReadAsByteArrayAsync().GetAwaiter().GetResult()
  [IO.File]::WriteAllBytes($OutputPath, $bytes)
  [pscustomobject]@{
    status = [int]$response.StatusCode
    finalUrl = $finalUri
    location = $location
    contentType = if ($response.Content.Headers.ContentType) { $response.Content.Headers.ContentType.MediaType } else { "unreported" }
    bytes = $bytes.Length
  } | ConvertTo-Json -Compress
} finally {
  $client.Dispose()
  $handler.Dispose()
}
