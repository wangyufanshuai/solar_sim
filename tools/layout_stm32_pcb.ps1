$ErrorActionPreference = 'Stop'

$Endpoint = 'http://127.0.0.1:8776/mcp'
$Script:NextId = 400

function Invoke-JlcTool {
    param(
        [string]$ToolName,
        [hashtable]$Arguments,
        [int]$TimeoutSeconds = 60
    )

    $Script:NextId += 1
    $body = @{
        jsonrpc = '2.0'
        id      = $Script:NextId
        method  = 'tools/call'
        params  = @{
            name      = $ToolName
            arguments = $Arguments
        }
    } | ConvertTo-Json -Depth 30 -Compress

    $response = Invoke-RestMethod -Uri $Endpoint -Method Post -Body $body -ContentType 'application/json' -TimeoutSec $TimeoutSeconds
    if ($response.error) {
        throw ($response.error | ConvertTo-Json -Depth 10)
    }
    Start-Sleep -Milliseconds 350
    return $response.result.structuredContent
}

function Invoke-EdaApi {
    param(
        [string]$ApiFullName,
        [array]$Args = @(),
        [int]$TimeoutMs = 45000
    )
    return Invoke-JlcTool -ToolName 'api_invoke' -Arguments @{
        apiFullName = $ApiFullName
        args        = $Args
        timeoutMs   = $TimeoutMs
    }
}

$components = (Invoke-EdaApi -ApiFullName 'eda.pcb_PrimitiveComponent.getAll' -Args @()).result
$byDesignator = @{}
foreach ($component in $components) {
    $byDesignator[$component.designator] = $component
}

$target = @{
    'USB1' = @{ x = 500;  y = -1020; rotation = 0 }
    'U2'   = @{ x = 790;  y = -1010; rotation = 0 }
    'C1'   = @{ x = 430;  y = -820;  rotation = 0 }
    'C2'   = @{ x = 940;  y = -900;  rotation = 0 }
    'C3'   = @{ x = 905;  y = -740;  rotation = 0 }
    'R1'   = @{ x = 620;  y = -660;  rotation = 90 }
    'R2'   = @{ x = 760;  y = -660;  rotation = 90 }
    'U1'   = @{ x = 1420; y = -720;  rotation = 0 }
    'C6'   = @{ x = 1030; y = -415;  rotation = 0 }
    'C7'   = @{ x = 1180; y = -415;  rotation = 0 }
    'C8'   = @{ x = 1620; y = -415;  rotation = 0 }
    'C9'   = @{ x = 1770; y = -415;  rotation = 0 }
    'C4'   = @{ x = 1920; y = -720;  rotation = 0 }
    'X1'   = @{ x = 2110; y = -900;  rotation = 0 }
    'C5'   = @{ x = 2300; y = -720;  rotation = 0 }
    'U3'   = @{ x = 2360; y = -430;  rotation = 0 }
    'U4'   = @{ x = 1430; y = -170;  rotation = 0 }
    'U5'   = @{ x = 2180; y = -170;  rotation = 0 }
}

foreach ($name in $target.Keys) {
    if (-not $byDesignator.ContainsKey($name)) {
        Write-Warning "Missing component $name"
        continue
    }
    $component = $byDesignator[$name]
    $property = @{
        x        = [double]$target[$name].x
        y        = [double]$target[$name].y
        rotation = [double]$target[$name].rotation
    }
    $null = Invoke-EdaApi -ApiFullName 'eda.pcb_PrimitiveComponent.modify' -Args @($component.primitiveId, $property)
    Write-Output "Moved $name"
}

# Board outline, layer 11 is the board outline layer in this project.
$outlineLayer = 11
$outlineWidth = 8
$left = 250
$right = 2550
$top = -1250
$bottom = -40
$outline = @(
    @($left, $top, $right, $top),
    @($right, $top, $right, $bottom),
    @($right, $bottom, $left, $bottom),
    @($left, $bottom, $left, $top)
)
foreach ($line in $outline) {
    $null = Invoke-EdaApi -ApiFullName 'eda.pcb_PrimitiveLine.create' -Args @('', $outlineLayer, $line[0], $line[1], $line[2], $line[3], $outlineWidth, $false)
    Write-Output "Board outline segment $($line -join ',')"
}

# Top silkscreen annotations. Layer 3 is top silkscreen in this project.
$silkLayer = 3
$labels = @(
    @{ x = 360;  y = -1185; text = 'USB + 3V3 Power' },
    @{ x = 1180; y = -1110; text = 'STM32F103C8T6 Minimum System' },
    @{ x = 1910; y = -1060; text = '8MHz Crystal' },
    @{ x = 1270; y = -280;  text = 'SWD / BOOT / IO Headers' }
)
foreach ($label in $labels) {
    $null = Invoke-EdaApi -ApiFullName 'eda.pcb_PrimitiveString.create' -Args @($silkLayer, $label.x, $label.y, $label.text, 'Arial', 42, 5, 0, 0, $false, 0, $false, $false)
    Write-Output "Label $($label.text)"
}

$null = Invoke-EdaApi -ApiFullName 'eda.pcb_Document.navigateToRegion' -Args @($left, $right, $top, $bottom)
$save = Invoke-EdaApi -ApiFullName 'eda.pcb_Document.save' -Args @('d78ba0304a1af6bf') -TimeoutMs 45000
Write-Output "PCB save result: $($save.result)"
