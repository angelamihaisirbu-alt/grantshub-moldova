# Register a Windows Task Scheduler entry to run update_grants.ps1 daily.
# Run once interactively to install. No admin required for user-level tasks.

$ErrorActionPreference = 'Stop'
$scriptsDir = $PSScriptRoot
if (-not $scriptsDir) { $scriptsDir = Split-Path -Parent $MyInvocation.MyCommand.Path }
$updateScript = Join-Path $scriptsDir 'update_grants.ps1'
$taskName = 'GrantsHub Moldova - Daily Update'

if (-not (Test-Path $updateScript)) {
    Write-Host "ERROR: update_grants.ps1 not found at $updateScript" -ForegroundColor Red
    exit 1
}

# Remove existing task if present
$existing = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($existing) {
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
    Write-Host "Removed existing task" -ForegroundColor Yellow
}

# Build action: run powershell.exe with our script
$psPath = (Get-Command powershell.exe).Source
$action = New-ScheduledTaskAction `
    -Execute $psPath `
    -Argument ('-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "' + $updateScript + '"')

# Daily trigger at 09:00
$trigger = New-ScheduledTaskTrigger -Daily -At '09:00'

# Settings: allow on battery, start when available if missed, require network
$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RunOnlyIfNetworkAvailable `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 10)

# Register as current user
$principal = New-ScheduledTaskPrincipal -UserId ([System.Security.Principal.WindowsIdentity]::GetCurrent().Name) -LogonType Interactive -RunLevel Limited

try {
    Register-ScheduledTask `
        -TaskName $taskName `
        -Description 'Verifica zilnic apeluri noi de granturi pe civic.md pentru GrantsHub Moldova' `
        -Action $action `
        -Trigger $trigger `
        -Settings $settings `
        -Principal $principal | Out-Null

    Write-Host ""
    Write-Host ('OK: Task "' + $taskName + '" inregistrat.') -ForegroundColor Green
    Write-Host '  - Ruleaza zilnic la 09:00 (sau cand calculatorul e disponibil daca a ratat)'
    Write-Host '  - Foloseste utilizatorul curent, nu necesita admin'
    Write-Host '  - Timeout 10 min'
    Write-Host '  - Output: scripts/run.log + scripts/last_report.txt'
    Write-Host '  - Apeluri noi: scripts/pending_calls/auto_YYYY-MM-DD.json'
    Write-Host ''
    Write-Host 'Pentru a vedea task-ul:' -ForegroundColor Cyan
    Write-Host '  Get-ScheduledTask -TaskName "GrantsHub Moldova - Daily Update"'
    Write-Host ''
    Write-Host 'Pentru a rula manual acum:' -ForegroundColor Cyan
    Write-Host '  Start-ScheduledTask -TaskName "GrantsHub Moldova - Daily Update"'
    Write-Host ''
    Write-Host 'Pentru a dezinstala:' -ForegroundColor Cyan
    Write-Host '  powershell -File scripts/uninstall_schedule.ps1'
} catch {
    Write-Host ('ERROR la inregistrare: ' + $_.Exception.Message) -ForegroundColor Red
    exit 1
}
