$ErrorActionPreference = 'Stop'
$Endpoint = 'http://127.0.0.1:8776/mcp'
$Script:Id = 900

function Invoke-EdaApi {
    param([string]$ApiFullName, [array]$Args = @(), [int]$TimeoutMs = 45000)
    $Script:Id += 1
    $body = @{
        jsonrpc = '2.0'
        id      = $Script:Id
        method  = 'tools/call'
        params  = @{
            name      = 'api_invoke'
            arguments = @{
                apiFullName = $ApiFullName
                args        = $Args
                timeoutMs   = $TimeoutMs
            }
        }
    } | ConvertTo-Json -Depth 30 -Compress
    $response = Invoke-RestMethod -Uri $Endpoint -Method Post -Body $body -ContentType 'application/json' -TimeoutSec 60
    if ($response.error) { throw ($response.error | ConvertTo-Json -Depth 10) }
    Start-Sleep -Milliseconds 260
    $response.result.structuredContent.result
}

function Hide-Old-Graphics {
    $texts = Invoke-EdaApi 'eda.sch_PrimitiveText.getAll'
    foreach ($t in $texts) {
        $null = Invoke-EdaApi 'eda.sch_PrimitiveText.modify' @(
            $t.primitiveId,
            @{ x = -5000; y = -5000; content = ''; fontSize = 1; textColor = '#FFFFFF'; bold = $false }
        )
    }
    Write-Output "Hidden text: $($texts.Count)"

    $rects = Invoke-EdaApi 'eda.sch_PrimitiveRectangle.getAll'
    foreach ($r in $rects) {
        $null = Invoke-EdaApi 'eda.sch_PrimitiveRectangle.modify' @(
            $r.primitiveId,
            @{ topLeftX = -5000; topLeftY = -5000; width = 1; height = 1; color = '#FFFFFF'; lineWidth = 1 }
        )
    }
    Write-Output "Hidden rectangles: $($rects.Count)"

    $wires = Invoke-EdaApi 'eda.sch_PrimitiveWire.getAll'
    foreach ($w in $wires) {
        $null = Invoke-EdaApi 'eda.sch_PrimitiveWire.modify' @(
            $w.primitiveId,
            @{ line = @(-5000, -5000, -4999, -5000); color = '#FFFFFF'; lineWidth = 1 }
        )
    }
    Write-Output "Hidden wires: $($wires.Count)"
}

function Move-Components {
    $components = Invoke-EdaApi 'eda.sch_PrimitiveComponent.getAll'
    $by = @{}
    foreach ($c in $components) { if ($c.designator) { $by[$c.designator] = $c } }

    $positions = @{
        'USB1' = @{ x = 90;  y = 135; rotation = 0 }
        'U2'   = @{ x = 230; y = 135; rotation = 0 }
        'C1'   = @{ x = 95;  y = 225; rotation = 0 }
        'C2'   = @{ x = 255; y = 225; rotation = 0 }
        'R1'   = @{ x = 95;  y = 360; rotation = 0 }
        'C3'   = @{ x = 230; y = 360; rotation = 0 }
        'R2'   = @{ x = 95;  y = 430; rotation = 0 }
        'U1'   = @{ x = 525; y = 315; rotation = 0 }
        'X1'   = @{ x = 850; y = 135; rotation = 0 }
        'C4'   = @{ x = 780; y = 225; rotation = 0 }
        'C5'   = @{ x = 925; y = 225; rotation = 0 }
        'U3'   = @{ x = 850; y = 375; rotation = 0 }
        'C6'   = @{ x = 395; y = 590; rotation = 0 }
        'C7'   = @{ x = 485; y = 590; rotation = 0 }
        'C8'   = @{ x = 575; y = 590; rotation = 0 }
        'C9'   = @{ x = 665; y = 590; rotation = 0 }
        'U4'   = @{ x = 800; y = 590; rotation = 0 }
        'U5'   = @{ x = 930; y = 590; rotation = 0 }
    }

    foreach ($d in $positions.Keys) {
        if ($by.ContainsKey($d)) {
            $p = $positions[$d]
            $null = Invoke-EdaApi 'eda.sch_PrimitiveComponent.modify' @(
                $by[$d].primitiveId,
                @{ x = [double]$p.x; y = [double]$p.y; rotation = [double]$p.rotation }
            )
            Write-Output "Moved $d"
        }
    }
}

function Add-Text([double]$x, [double]$y, [string]$text, [int]$size = 12, [string]$color = '#1F4E79', [bool]$bold = $false) {
    $null = Invoke-EdaApi 'eda.sch_PrimitiveText.create' @($x, $y, $text, 0, $color, $null, $size, $bold, $false, $false, 6)
}

function Add-Rect([double]$x, [double]$y, [double]$w, [double]$h) {
    $null = Invoke-EdaApi 'eda.sch_PrimitiveRectangle.create' @($x, $y, $w, $h, 0, 0, '#1F4E79', $null, 2, $null, $null)
}

function Add-Wire([array]$line, [string]$net) {
    $args = @()
    $args += ,$line
    $args += $net
    $args += '#008000'
    $args += 1
    $args += $null
    $null = Invoke-EdaApi 'eda.sch_PrimitiveWire.create' $args
}

Hide-Old-Graphics
Move-Components

Add-Text 55 45 'STM32F103C8T6 Minimum System - Schematic' 18 '#0000FF' $true

Add-Rect 50 80 300 230
Add-Text 68 102 'Power Input + 3.3V' 14 '#1F4E79' $true
Add-Text 68 286 'USB Type-C, AMS1117-3.3, input/output capacitors' 10 '#555555' $false

Add-Rect 50 335 300 175
Add-Text 68 357 'Reset / Boot' 14 '#1F4E79' $true
Add-Text 68 488 'NRST pull-up, reset capacitor, BOOT0 pull-down' 10 '#555555' $false

Add-Rect 380 95 320 425
Add-Text 398 118 'MCU Core' 14 '#1F4E79' $true
Add-Text 402 496 'STM32F103C8T6, LQFP-48. Short net labels reduce crossing.' 10 '#555555' $false

Add-Rect 745 80 285 230
Add-Text 763 102 '8MHz Crystal Circuit' 14 '#1F4E79' $true
Add-Text 763 286 'X1 with two load capacitors, close to OSC pins' 10 '#555555' $false

Add-Rect 745 335 285 175
Add-Text 763 357 'SWD Download Interface' 14 '#1F4E79' $true
Add-Text 763 488 '3V3, GND, SWDIO, SWCLK, NRST' 10 '#555555' $false

Add-Rect 380 545 650 120
Add-Text 398 567 'Decoupling + I/O Headers' 14 '#1F4E79' $true
Add-Text 398 645 '0.1uF capacitors placed near VDD pins; headers for IO/test expansion.' 10 '#555555' $false

Add-Wire @(350,165,380,165) 'VDD_3V3'
Add-Text 355 150 'VDD_3V3' 10 '#008000' $true
Add-Wire @(350,205,380,205) 'GND'
Add-Text 355 190 'GND' 10 '#008000' $true
Add-Wire @(350,375,380,375) 'NRST'
Add-Text 355 360 'NRST' 10 '#008000' $true
Add-Wire @(350,435,380,435) 'BOOT0'
Add-Text 355 420 'BOOT0' 10 '#008000' $true
Add-Wire @(700,170,745,170) 'OSC_IN'
Add-Text 704 155 'OSC_IN' 10 '#008000' $true
Add-Wire @(700,220,745,220) 'OSC_OUT'
Add-Text 704 205 'OSC_OUT' 10 '#008000' $true
Add-Wire @(700,385,745,385) 'SWDIO'
Add-Text 704 370 'SWDIO' 10 '#008000' $true
Add-Wire @(700,435,745,435) 'SWCLK'
Add-Text 704 420 'SWCLK' 10 '#008000' $true

$null = Invoke-EdaApi 'eda.sch_Document.save' @() 60000
Write-Output 'Rebuilt schematic layout and saved.'
