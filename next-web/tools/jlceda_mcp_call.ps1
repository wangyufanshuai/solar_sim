param(
  [Parameter(Mandatory=$true)][int]$Id,
  [Parameter(Mandatory=$true)][string]$Tool,
  [Parameter(Mandatory=$true)][hashtable]$Arguments
)

$body = @{
  jsonrpc = '2.0'
  id = $Id
  method = 'tools/call'
  params = @{
    name = $Tool
    arguments = $Arguments
  }
} | ConvertTo-Json -Depth 40 -Compress

Invoke-RestMethod -Uri 'http://127.0.0.1:8776/mcp' -Method Post -Body $body -ContentType 'application/json' |
  ConvertTo-Json -Depth 40
