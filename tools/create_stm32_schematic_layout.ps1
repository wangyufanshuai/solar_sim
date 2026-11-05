$ErrorActionPreference = 'Stop'

function Invoke-JlcTool {
  param(
    [int]$Id,
    [string]$Name,
    [hashtable]$Arguments
  )
  $body = @{
    jsonrpc = '2.0'
    id = $Id
    method = 'tools/call'
    params = @{
      name = $Name
      arguments = $Arguments
    }
  } | ConvertTo-Json -Depth 50 -Compress
  Invoke-RestMethod -Uri 'http://127.0.0.1:8776/mcp' -Method Post -Body $body -ContentType 'application/json'
}

function Invoke-Api {
  param(
    [int]$Id,
    [string]$Api,
    [object[]]$ApiArgs,
    [int]$TimeoutMs = 30000
  )
  $response = Invoke-JlcTool -Id $Id -Name 'api_invoke' -Arguments @{
    apiFullName = $Api
    args = $ApiArgs
    timeoutMs = $TimeoutMs
  }
  $response | ConvertTo-Json -Depth 20
  Start-Sleep -Milliseconds 650
}

$id = 100

# Module rectangles. Coordinates are schematic canvas units.
$modules = @(
  @{x=60; y=70; w=250; h=180; title='Power Input + Decoupling'},
  @{x=60; y=290; w=250; h=180; title='Reset / Boot'},
  @{x=370; y=80; w=330; h=380; title='STM32 Minimum System'},
  @{x=760; y=70; w=270; h=180; title='Crystal Circuit'},
  @{x=760; y=290; w=270; h=180; title='SWD Download Interface'},
  @{x=370; y=520; w=660; h=155; title='I/O Headers and Test Points'}
)

foreach ($m in $modules) {
  Invoke-Api -Id ($id++) -Api 'eda.sch_PrimitiveRectangle.create' -ApiArgs @(
    $m.x, $m.y, $m.w, $m.h, 0, 0, '#1F4E79', $null, 2, $null, $null
  )
  Invoke-Api -Id ($id++) -Api 'eda.sch_PrimitiveText.create' -ApiArgs @(
    ($m.x + 12), ($m.y + 16), $m.title, 0, '#1F4E79', $null, 18, $true, $false, $false, 7
  )
}

# Explanatory labels inside modules.
$labels = @(
  @(82,125,'USB 5V input -> AMS1117-3.3'),
  @(82,155,'10uF + 0.1uF filter caps'),
  @(82,185,'Net: VDD_3V3 / GND'),
  @(82,345,'NRST pull-up 10k + key to GND'),
  @(82,375,'BOOT0 pull-down 10k'),
  @(82,405,'Stable reset and boot state'),
  @(405,150,'U1: STM32F103C8T6 / LQFP-48'),
  @(405,185,'VDD/VSS pins with local 0.1uF caps'),
  @(405,220,'PA13/PA14: SWDIO/SWCLK'),
  @(405,255,'OSC_IN/OSC_OUT to 8MHz crystal'),
  @(405,290,'NRST and BOOT0 routed by net labels'),
  @(405,325,'Unused pins marked NC or reserved test points'),
  @(785,125,'Y1: 8MHz crystal close to MCU'),
  @(785,155,'C8/C9: 22pF load capacitors'),
  @(785,185,'PCB keepout + GND guard ring'),
  @(785,345,'J2: SWD 4/5 pin header'),
  @(785,375,'3V3, GND, SWDIO, SWCLK, NRST'),
  @(785,405,'Placed at board edge for debugging'),
  @(405,575,'Expose USART / USB / GPIO headers. Use short traces and clear net labels.')
)

foreach ($l in $labels) {
  Invoke-Api -Id ($id++) -Api 'eda.sch_PrimitiveText.create' -ApiArgs @(
    $l[0], $l[1], $l[2], 0, '#333333', $null, 13, $false, $false, $false, 7
  )
}

Invoke-Api -Id ($id++) -Api 'eda.sch_Document.save' -ApiArgs @() -TimeoutMs 30000
