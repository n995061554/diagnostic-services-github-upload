# ==============================================================================
# DS DISTRIBUTOR - WINDOWS TALLY BRIDGE BACKGROUND SERVICE INSTALLER
# ==============================================================================
# Installs the Office Tally Bridge Agent as a persistent Windows Background Task:
# - Starts automatically when Windows boots (AtStartup)
# - Automatically restarts on failure
# - Logs activity to logs\bridge_service.log
# - Does not require third-party service wrappers (uses native Windows Task Scheduler)
# ==============================================================================

[CmdletBinding()]
param (
    [string]$TaskName = "DSDistributorTallyBridge"
)

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  DS DISTRIBUTOR TALLY BRIDGE - SERVICE INSTALLER              " -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan

# 1. Administrator Check
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Warning "Administrator privileges recommended. Attempting to register for current user..."
}

# 2. Verify config.json exists
$ConfigPath = Join-Path $ScriptDir "config.json"
if (-not (Test-Path $ConfigPath)) {
    Write-Error "Missing config.json! Please run setup-bridge.bat first to pair this office computer."
    exit 1
}

# 3. Ensure logs directory exists
$LogDir = Join-Path $ScriptDir "logs"
if (-not (Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
}
$LogFile = Join-Path $LogDir "bridge_service.log"

# 4. Locate Node.js executable
$NodePath = (Get-Command node -ErrorAction SilentlyContinue).Source
if (-not $NodePath) {
    Write-Error "Node.js executable not found in system PATH. Install Node.js from https://nodejs.org/"
    exit 1
}

# 5. Build/verify dist directory
$AgentJs = Join-Path $ScriptDir "dist\bridgeAgent.js"
if (-not (Test-Path $AgentJs)) {
    Write-Host "[INFO] Building TypeScript files to dist/..." -ForegroundColor Yellow
    & npx --yes tsc -p (Join-Path $ScriptDir "tsconfig.json")
}

# 6. Prepare Service Runner Command with absolute paths and SYSTEM permissions
if ($isAdmin) {
    try {
        # Ensure NT AUTHORITY\SYSTEM has read/write permissions to bridge folder and logs
        icacls $ScriptDir /grant "SYSTEM:(OI)(CI)F" /T /Q | Out-Null
    } catch {}
}

$VbsRunner = Join-Path $ScriptDir "run_silent.vbs"
$EscapedNode = $NodePath.Replace('\', '\\')
$EscapedAgent = $AgentJs.Replace('\', '\\')
$EscapedLogs = $LogFile.Replace('\', '\\')
$VbsContent = @"
Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "$($ScriptDir.Replace('\', '\\'))"
WshShell.Run "cmd /c ""$EscapedNode"" ""$EscapedAgent"" >> ""$EscapedLogs"" 2>&1", 0, False
"@
Set-Content -Path $VbsRunner -Value $VbsContent -Encoding ASCII

# 7. Register Windows Scheduled Task
Write-Host "[INFO] Registering Windows Scheduled Task: '$TaskName'..." -ForegroundColor Yellow

# Unregister existing task if present
try {
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
} catch {}

$Action = New-ScheduledTaskAction -Execute "wscript.exe" -Argument "`"$VbsRunner`"" -WorkingDirectory $ScriptDir
$TriggerAtStartup = New-ScheduledTaskTrigger -AtStartup
$TriggerAtLogon = New-ScheduledTaskTrigger -AtLogOn

$Settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -RestartCount 999 `
    -RestartInterval (New-TimeSpan -Minutes 1) `
    -ExecutionTimeLimit (New-TimeSpan -Days 0) `
    -Priority 4

if ($isAdmin) {
    Register-ScheduledTask `
        -TaskName $TaskName `
        -Action $Action `
        -Trigger @($TriggerAtStartup, $TriggerAtLogon) `
        -Settings $Settings `
        -User "NT AUTHORITY\SYSTEM" `
        -RunLevel Highest | Out-Null
} else {
    Register-ScheduledTask `
        -TaskName $TaskName `
        -Action $Action `
        -Trigger $TriggerAtLogon `
        -Settings $Settings | Out-Null
}

# 8. Start the Task
Write-Host "[INFO] Starting background task..." -ForegroundColor Yellow
Start-ScheduledTask -TaskName $TaskName

Start-Sleep -Seconds 2
$TaskStatus = (Get-ScheduledTask -TaskName $TaskName).State
Write-Host "[PASS] Service Task '$TaskName' is now registered and state is: $TaskStatus" -ForegroundColor Green
Write-Host "       Live logs: $LogFile" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Cyan

