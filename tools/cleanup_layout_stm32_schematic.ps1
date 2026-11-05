$ErrorActionPreference = 'Stop'

$Endpoint = 'http://127.0.0.1:8776/mcp'
$Script:Id = 700

function Invoke-JlcTool {
    param(
        [string]$ToolName,
        [hashtable]$Arguments,
        [int]$TimeoutSeconds = 60
    )
    $Script:Id += 1
    $body = @{
        jsonrpc = '2.0'
        id      = $Script:Id
        method  = 'tools/call'
        params  = @{
            name      = $ToolName
            arguments = $Arguments
        }
    } | ConvertTo-Json -Depth 30 -Compress
    $response = Invoke-RestMethod -Uri $Endpoint -Method Post -Body $body -ContentType 'application/json' -TimeoutSec $TimeoutSeconds
    if ($response.error) { throw ($response.error | ConvertTo-Json -Depth 10) }
    Start-Sleep -Milliseconds 450
    return $response.result.structuredContent
}

function Invoke-EdaApi {
    param(
        [string]$ApiFullName,
        [array]$Args = @(),
        [int]$TimeoutMs = 45000
    )
    Invoke-JlcTool -ToolName 'api_invoke' -Arguments @{
        apiFullName = $ApiFullName
        args        = $Args
        timeoutMs   = $TimeoutMs
    }
}

function Get-PrimitiveIds {
    param([string]$ApiFullName)
    $items = (Invoke-EdaApi -ApiFullName $ApiFullName -Args @()).result
    @($items | ForEach-Object { $_.primitiveId } | Where-Object { $_ })
}

function Delete-IfAny {
    param([string]$ApiFullName, [array]$Ids)
    foreach ($id in $Ids) {
        if ($id) {
            $null = Invoke-EdaApi -ApiFullName $ApiFullName -Args @($id)
        }
    }
    if ($Ids.Count -gt 0) {
        Write-Output "Deleted $($Ids.Count) with $ApiFullName"
    }
}

# Remove the bad decorative layer created in earlier attempts.
Delete-IfAny -ApiFullName 'eda.sch_PrimitiveText.delete' -Ids (Get-PrimitiveIds 'eda.sch_PrimitiveText.getAll')
Delete-IfAny -ApiFullName 'eda.sch_PrimitiveRectangle.delete' -Ids (Get-PrimitiveIds 'eda.sch_PrimitiveRectangle.getAll')
Delete-IfAny -ApiFullName 'eda.sch_PrimitiveWire.delete' -Ids (Get-PrimitiveIds 'eda.sch_PrimitiveWire.getAll')

$components = (Invoke-EdaApi -ApiFullName 'eda.sch_PrimitiveComponent.getAll' -Args @()).result
$sheet = @($components | Where-Object { $_.componentType -eq 'sheet' -or $_.component.name -like 'drawing-symbol*' })
if ($sheet.Count -gt 0) {
    Delete-IfAny -ApiFullName 'eda.sch_PrimitiveComponent.delete' -Ids @($sheet | ForEach-Object { $_.primitiveId })
}

$components = (Invoke-EdaApi -ApiFullName 'eda.sch_PrimitiveComponent.getAll' -Args @()).result
$byDesignator = @{}
foreach ($component in $components) {
    if ($component.designator) { $byDesignator[$component.designator] = $component }
}

$positions = @{
    'USB1' = @{ x = 115; y = 155; rotation = 0 }
    'U2'   = @{ x = 245; y = 155; rotation = 0 }
    'C1'   = @{ x = 115; y = 245; rotation = 0 }
    'C2'   = @{ x = 255; y = 245; rotation = 0 }
    'R1'   = @{ x = 115; y = 390; rotation = 0 }
    'C3'   = @{ x = 245; y = 390; rotation = 0 }
    'R2'   = @{ x = 115; y = 455; rotation = 0 }
    'U1'   = @{ x = 525; y = 315; rotation = 0 }
    'X1'   = @{ x = 850; y = 155; rotation = 0 }
    'C4'   = @{ x = 785; y = 245; rotation = 0 }
    'C5'   = @{ x = 925; y = 245; rotation = 0 }
    'U3'   = @{ x = 855; y = 395; rotation = 0 }
    'C6'   = @{ x = 410; y = 590; rotation = 0 }
    'C7'   = @{ x = 500; y = 590; rotation = 0 }
    'C8'   = @{ x = 590; y = 590; rotation = 0 }
    'C9'   = @{ x = 680; y = 590; rotation = 0 }
    'U4'   = @{ x = 800; y = 590; rotation = 0 }
    'U5'   = @{ x = 930; y = 590; rotation = 0 }
}

foreach ($designator in $positions.Keys) {
    if ($byDesignator.ContainsKey($designator)) {
        $p = $positions[$designator]
        $null = Invoke-EdaApi -ApiFullName 'eda.sch_PrimitiveComponent.modify' -Args @(
            $byDesignator[$designator].primitiveId,
            @{ x = [double]$p.x; y = [double]$p.y; rotation = [double]$p.rotation }
        )
        Write-Output "Moved $designator"
    }
}

function Add-Text([double]$x, [double]$y, [string]$text, [int]$size = 13, [string]$color = '#1F4E79', [bool]$bold = $false) {
    $null = Invoke-EdaApi -ApiFullName 'eda.sch_PrimitiveText.create' -Args @($x, $y, $text, 0, $color, $null, $size, $bold, $false, $false, 6)
}

function Add-Rect([double]$x, [double]$y, [double]$w, [double]$h) {
    $null = Invoke-EdaApi -ApiFullName 'eda.sch_PrimitiveRectangle.create' -Args @($x, $y, $w, $h, 0, 0, '#1F4E79', $null, 2, $null, $null)
}

function Add-Wire([array]$line, [string]$net, [string]$color = '#008000') {
    $args = @()
    $args += ,$line
    $args += $net
    $args += $color
    $args += 1
    $args += $null
    $null = Invoke-EdaApi -ApiFullName 'eda.sch_PrimitiveWire.create' -Args $args
}

Add-Text 55 45 'STM32F103C8T6 Minimum System - Clean Schematic Layout' 18 '#0000FF' $true

Add-Rect 55 85 280 220
Add-Text 70 105 'Power Input + 3.3V Regulator' 14 '#1F4E79' $true
Add-Text 75 280 'USB5V -> AMS1117 -> VDD_3V3 / GND' 10 '#555555' $false

Add-Rect 55 345 280 155
Add-Text 70 365 'Reset / Boot' 14 '#1F4E79' $true
Add-Text 75 475 'NRST pull-up, reset capacitor, BOOT0 pull-down' 10 '#555555' $false

Add-Rect 375 105 325 410
Add-Text 395 125 'MCU Core' 14 '#1F4E79' $true
Add-Text 425 485 'VDD/VSS, NRST, BOOT0, OSC, SWD labels kept short' 10 '#555555' $false

Add-Rect 745 85 260 220
Add-Text 760 105 '8MHz Crystal' 14 '#1F4E79' $true
Add-Text 760 280 'X1 + C4/C5 close to OSC pins' 10 '#555555' $false

Add-Rect 745 345 260 155
Add-Text 760 365 'SWD Debug Interface' 14 '#1F4E79' $true
Add-Text 760 475 '3V3, GND, SWDIO, SWCLK, NRST' 10 '#555555' $false

Add-Rect 375 545 630 115
Add-Text 395 565 'Decoupling + I/O Headers' 14 '#1F4E79' $true
Add-Text 395 640 '0.1uF capacitors near VDD pins; headers reserved for IO/test points' 10 '#555555' $false

# Short named connections only; avoid long crossing wires.
Add-Wire @(335,165,375,165) 'VDD_3V3'
Add-Text 345 152 'VDD_3V3' 10 '#008000' $true
Add-Wire @(335,205,375,205) 'GND'
Add-Text 345 192 'GND' 10 '#008000' $true
Add-Wire @(335,395,375,395) 'NRST'
Add-Text 345 382 'NRST' 10 '#008000' $true
Add-Wire @(335,455,375,455) 'BOOT0'
Add-Text 345 442 'BOOT0' 10 '#008000' $true
Add-Wire @(700,165,745,165) 'OSC_IN'
Add-Text 704 152 'OSC_IN' 10 '#008000' $true
Add-Wire @(700,215,745,215) 'OSC_OUT'
Add-Text 704 202 'OSC_OUT' 10 '#008000' $true
Add-Wire @(700,395,745,395) 'SWDIO'
Add-Text 704 382 'SWDIO' 10 '#008000' $true
Add-Wire @(700,445,745,445) 'SWCLK'
Add-Text 704 432 'SWCLK' 10 '#008000' $true
Add-Wire @(700,590,745,590) 'IO_HEADER'
Add-Text 704 577 'IO / TEST' 10 '#008000' $true

$null = Invoke-EdaApi -ApiFullName 'eda.sch_Document.save' -Args @() -TimeoutMs 45000
Write-Output 'Schematic cleaned, rearranged, and saved.'
