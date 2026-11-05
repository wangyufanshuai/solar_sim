$ErrorActionPreference = 'Stop'

function Invoke-JlcTool {
  param([int]$Id, [string]$Name, [hashtable]$Arguments)
  $body = @{
    jsonrpc = '2.0'
    id = $Id
    method = 'tools/call'
    params = @{ name = $Name; arguments = $Arguments }
  } | ConvertTo-Json -Depth 50 -Compress
  Invoke-RestMethod -Uri 'http://127.0.0.1:8776/mcp' -Method Post -Body $body -ContentType 'application/json'
}

function Invoke-Api {
  param([int]$Id, [string]$Api, [object[]]$ApiArgs, [int]$TimeoutMs = 30000)
  $response = Invoke-JlcTool -Id $Id -Name 'api_invoke' -Arguments @{
    apiFullName = $Api
    args = $ApiArgs
    timeoutMs = $TimeoutMs
  }
  $response | ConvertTo-Json -Depth 12
  Start-Sleep -Milliseconds 850
}

function Add-Component {
  param([int]$Id, [string]$Uuid, [string]$Lib, [double]$X, [double]$Y, [double]$Rot = 0)
  Invoke-Api -Id $Id -Api 'eda.sch_PrimitiveComponent.create' -ApiArgs @(
    @{ uuid = $Uuid; libraryUuid = $Lib }, $X, $Y, $null, $Rot, $false, $true, $true
  ) -TimeoutMs 45000
}

function Add-Text {
  param([int]$Id, [double]$X, [double]$Y, [string]$Content, [int]$Size = 12, [string]$Color = '#333333', [bool]$Bold = $false)
  Invoke-Api -Id $Id -Api 'eda.sch_PrimitiveText.create' -ApiArgs @(
    $X, $Y, $Content, 0, $Color, $null, $Size, $Bold, $false, $false, 7
  )
}

function Add-Wire {
  param([int]$Id, [object[]]$Line, [string]$Net, [string]$Color = '#008000')
  Invoke-Api -Id $Id -Api 'eda.sch_PrimitiveWire.create' -ApiArgs @(
    $Line, $Net, $Color, 1, $null
  )
}

$lib = '0819f05c4eef4c71ace90d822a990e87'
$stm32 = 'accfc2f6010745268febab2459577079'
$ldo = '9f9c6cb41c7449fd8acf96aceed2661a'
$usb = 'fafc5d2de09d4595b0cc7abedc0530e6'
$crystal = 'a423a0e649794332836c7a3ea363cede'
$res10k = 'b948db94476e4027ac8953235755ec96'
$cap100n = '96b39256cc3f4d80bd3b503deb4f3328'
$header4 = 'e14f47d111e94149ad7f534deed868f3'

$id = 200

# Main components
Add-Component -Id ($id++) -Uuid $stm32 -Lib $lib -X 500 -Y 230
Add-Text -Id ($id++) -X 500 -Y 450 -Content 'U1 STM32F103C8T6, LQFP-48' -Size 13 -Color '#000080' -Bold $true

Add-Component -Id ($id++) -Uuid $usb -Lib $lib -X 95 -Y 140
Add-Component -Id ($id++) -Uuid $ldo -Lib $lib -X 205 -Y 140
Add-Component -Id ($id++) -Uuid $cap100n -Lib $lib -X 95 -Y 205
Add-Component -Id ($id++) -Uuid $cap100n -Lib $lib -X 235 -Y 205
Add-Text -Id ($id++) -X 80 -Y 230 -Content 'CIN/COUT: input and 3V3 filter' -Size 11

Add-Component -Id ($id++) -Uuid $res10k -Lib $lib -X 105 -Y 365
Add-Component -Id ($id++) -Uuid $cap100n -Lib $lib -X 205 -Y 365
Add-Text -Id ($id++) -X 82 -Y 430 -Content 'NRST: 10k pull-up + key/cap reset' -Size 11
Add-Component -Id ($id++) -Uuid $res10k -Lib $lib -X 105 -Y 415
Add-Text -Id ($id++) -X 82 -Y 452 -Content 'BOOT0: 10k pull-down' -Size 11

Add-Component -Id ($id++) -Uuid $crystal -Lib $lib -X 850 -Y 150
Add-Component -Id ($id++) -Uuid $cap100n -Lib $lib -X 810 -Y 205
Add-Component -Id ($id++) -Uuid $cap100n -Lib $lib -X 910 -Y 205
Add-Text -Id ($id++) -X 785 -Y 225 -Content 'C8/C9 footprint shown; assign 22pF in BOM' -Size 11

Add-Component -Id ($id++) -Uuid $header4 -Lib $lib -X 850 -Y 365
Add-Text -Id ($id++) -X 785 -Y 430 -Content 'SWD header: 3V3 GND SWDIO SWCLK NRST' -Size 11

# Decoupling and headers
foreach ($xy in @(@(420,590),@(500,590),@(580,590),@(660,590))) {
  Add-Component -Id ($id++) -Uuid $cap100n -Lib $lib -X $xy[0] -Y $xy[1]
}
Add-Component -Id ($id++) -Uuid $header4 -Lib $lib -X 790 -Y 590
Add-Component -Id ($id++) -Uuid $header4 -Lib $lib -X 910 -Y 590

# Named wire stubs for clear net identity. These are deliberately short to avoid accidental wrong-pin connections.
$wires = @(
  @{line=@(235,140,350,140); net='VDD_3V3'; label='VDD_3V3'; x=260; y=122},
  @{line=@(235,180,350,180); net='GND'; label='GND'; x=275; y=184},
  @{line=@(245,365,360,365); net='NRST'; label='NRST'; x=270; y=347},
  @{line=@(245,415,360,415); net='BOOT0'; label='BOOT0'; x=270; y=397},
  @{line=@(760,150,710,150); net='OSC_IN'; label='OSC_IN'; x=710; y=132},
  @{line=@(760,180,710,180); net='OSC_OUT'; label='OSC_OUT'; x=710; y=184},
  @{line=@(820,365,710,365); net='SWDIO'; label='SWDIO'; x=710; y=347},
  @{line=@(820,395,710,395); net='SWCLK'; label='SWCLK'; x=710; y=397},
  @{line=@(420,625,700,625); net='VDD_3V3'; label='local decoupling caps near VDD pins'; x=430; y=650}
)

foreach ($w in $wires) {
  Add-Wire -Id ($id++) -Line $w.line -Net $w.net
  Add-Text -Id ($id++) -X $w.x -Y $w.y -Content $w.label -Size 10 -Color '#008000' -Bold $true
}

Add-Text -Id ($id++) -X 385 -Y 35 -Content 'STM32F103C8T6 Minimum System Schematic - modular midterm drawing' -Size 18 -Color '#000000' -Bold $true
Invoke-Api -Id ($id++) -Api 'eda.sch_Document.save' -ApiArgs @() -TimeoutMs 45000
