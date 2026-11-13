# ==============================================================================
# DS DISTRIBUTOR - WINDOWS TALLY BRIDGE SERVICE UNINSTALLER
# ==============================================================================
# Stops the background task and removes it cleanly from Windows Task Scheduler.
# ==============================================================================

[CmdletBinding()]
param (
    [string]$TaskName = "DSDistributorTallyBridge"
)

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  DS DISTRIBUTOR TALLY BRIDGE - SERVICE UNINSTALLER            " -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan

# 1. Stop background task if running
Write-Host "[INFO] Stopping task '$TaskName' if active..." -ForegroundColor Yellow
try {
    Stop-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
} catch {}

# 2. Terminate running bridgeAgent node process specific to this installation directory
try {
    Get-CimInstance Win32_Process | Where-Object { 
        $_.CommandLine -like "*bridgeAgent.js*" -and $_.CommandLine -like "*$($ScriptDir)*" 
    } | ForEach-Object {
        Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
    }
} catch {}

# 3. Unregister Scheduled Task
Write-Host "[INFO] Unregistering Scheduled Task '$TaskName'..." -ForegroundColor Yellow
try {
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction Stop
    Write-Host "[PASS] Successfully removed task '$TaskName'." -ForegroundColor Green
} catch {
    Write-Warning "Task '$TaskName' was not found or was already removed."
}

# 4. Clean up temporary runner script
$VbsRunner = Join-Path $ScriptDir "run_silent.vbs"
if (Test-Path $VbsRunner) {
    Remove-Item -Path $VbsRunner -Force -ErrorAction SilentlyContinue
}

Write-Host "Service uninstalled cleanly. (config.json has been preserved)." -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Cyan

