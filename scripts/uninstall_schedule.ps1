# Remove the GrantsHub scheduled task.

$ErrorActionPreference = 'Continue'
$taskName = 'GrantsHub Moldova - Daily Update'

$existing = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($existing) {
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
    Write-Host ('OK: Task "' + $taskName + '" sters.') -ForegroundColor Green
} else {
    Write-Host ('Task "' + $taskName + '" nu exista (deja sters sau nu a fost instalat).') -ForegroundColor Yellow
}
