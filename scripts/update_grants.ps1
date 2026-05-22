# GrantsHub Moldova - Daily auto-update job
# Detects new grant calls on civic.md and writes candidate JSON for admin review.
# Closed-call hiding is handled automatically by app.js (TODAY = new Date()).

$ErrorActionPreference = 'Continue'

$scriptsDir = $PSScriptRoot
if (-not $scriptsDir) { $scriptsDir = Split-Path -Parent $MyInvocation.MyCommand.Path }
$root = Split-Path -Parent $scriptsDir
$dataFile = Join-Path $root 'data.js'
$logFile = Join-Path $scriptsDir 'run.log'
$reportFile = Join-Path $scriptsDir 'last_report.txt'
$pendingDir = Join-Path $scriptsDir 'pending_calls'

if (-not (Test-Path $pendingDir)) {
    New-Item -ItemType Directory -Path $pendingDir -Force | Out-Null
}

$now = Get-Date
$today = $now.ToString('yyyy-MM-dd')

function Write-Log {
    param([string]$Message, [string]$Level = 'INFO')
    $line = '[' + $now.ToString('yyyy-MM-dd HH:mm:ss') + '] [' + $Level + '] ' + $Message
    Add-Content -Path $logFile -Value $line -Encoding utf8
    Write-Host $line
}

Write-Log '=== Run started ==='

# ---------- Step 1: Read data.js, get existing URLs ----------
if (-not (Test-Path $dataFile)) {
    Write-Log "data.js not found at $dataFile" 'ERROR'
    exit 1
}

$dataContent = Get-Content $dataFile -Raw -Encoding utf8
$urlMatches = [regex]::Matches($dataContent, 'url:\s*"([^"]+)"')
$existingUrls = @($urlMatches | ForEach-Object { $_.Groups[1].Value.ToLower() })
Write-Log ("Loaded " + $existingUrls.Count + " existing URLs from data.js")

# Count calls past their deadline (for reporting only)
$callBlocks = [regex]::Matches(
    $dataContent,
    'deadline:\s*"(\d{4}-\d{2}-\d{2})"[^}]*deadlineType:\s*"([^"]+)"',
    [System.Text.RegularExpressions.RegexOptions]::Singleline
)
$expiredCount = 0
$activeCount = 0
foreach ($m in $callBlocks) {
    $deadline = [datetime]::ParseExact($m.Groups[1].Value, 'yyyy-MM-dd', $null)
    $type = $m.Groups[2].Value
    if ($type -eq 'fixed' -and $deadline -lt $now) {
        $expiredCount++
    } else {
        $activeCount++
    }
}
Write-Log ("Status snapshot: " + $activeCount + " active, " + $expiredCount + " auto-closed (hidden by frontend)")

# ---------- Step 2: Fetch civic.md ----------
$civicUrl = 'https://civic.md/anunturi/granturi.html'
$html = $null
try {
    $resp = Invoke-WebRequest -Uri $civicUrl -UseBasicParsing -TimeoutSec 30 -Headers @{ 'User-Agent' = 'GrantsHubMoldova/1.0 (+local)' }
    $html = $resp.Content
    Write-Log ("Fetched civic.md (" + $html.Length + " bytes)")
} catch {
    Write-Log ("Fetch civic.md failed: " + $_.Exception.Message) 'ERROR'
}

# ---------- Step 3: Parse entries ----------
$newCalls = @()
if ($html) {
    $entryPattern = '<a[^>]+href="(/anunturi/granturi/[^"#?]+\.html)"[^>]*>\s*([^<]+?)\s*</a>'
    $matches = [regex]::Matches($html, $entryPattern)
    Write-Log ("Detected " + $matches.Count + " <a> entries on civic.md")

    $seenUrls = @{}
    foreach ($m in $matches) {
        $relUrl = $m.Groups[1].Value
        $title = ($m.Groups[2].Value -replace '\s+', ' ').Trim()
        if ($title.Length -lt 12) { continue }
        if ($title -match '^(Granturi|Anunturi|Acasa|Mai mult)') { continue }
        $fullUrl = 'https://civic.md' + $relUrl
        $key = $fullUrl.ToLower()
        if ($seenUrls.ContainsKey($key)) { continue }
        $seenUrls[$key] = $true
        if ($existingUrls -contains $key) { continue }

        # Generate slug ID
        $slug = $title.ToLower() -replace '[^\w]+', '-' -replace '-+', '-'
        $slug = $slug.Trim('-')
        if ($slug.Length -gt 50) { $slug = $slug.Substring(0, 50).TrimEnd('-') }
        $callId = 'auto-' + $slug + '-' + $today

        $newCalls += [PSCustomObject]@{
            id = $callId
            title = $title
            funderId = 'auto'
            type = 'Grant'
            opensOn = $today
            deadline = $now.AddDays(30).ToString('yyyy-MM-dd')
            deadlineType = 'expected'
            deadlineNote = 'AUTO-DETECTAT - deadline neconfirmat, verifica pe pagina sursei'
            audiences = @('ONG')
            topics = @()
            url = $fullUrl
            description = 'Auto-detectat de pe civic.md la ' + $today + '. Necesita revizuire manuala in admin.'
            budgetTotal = ''
            budgetPerProject = ''
            eligibility = @('AUTO-DETECTAT - necesita completare manuala din pagina sursei')
            verified = $today
            verifiedSource = 'scripts/update_grants.ps1 (civic.md)'
            autoDetected = $true
        }
    }
    Write-Log ("Identified " + $newCalls.Count + " candidate new calls")
}

# ---------- Step 4: Write pending JSON ----------
$outFile = $null
if ($newCalls.Count -gt 0) {
    $outFile = Join-Path $pendingDir ('auto_' + $today + '.json')
    $jsonOut = [ordered]@{
        CALLS = $newCalls
        FUNDERS = [ordered]@{
            auto = [ordered]@{
                id = 'auto'
                name = 'Auto-detectat (necesita clasificare)'
                short = 'AUTO'
                logoColor = 'yellow'
                origin = 'Fundatie'
                originLabel = 'Sursa: civic.md auto-scraper'
                description = 'Apel detectat automat. Clasifica finantatorul real in admin.'
                website = 'https://civic.md'
            }
        }
    }
    $jsonText = $jsonOut | ConvertTo-Json -Depth 10
    [System.IO.File]::WriteAllText($outFile, $jsonText, (New-Object System.Text.UTF8Encoding $true))
    Write-Log ("Wrote " + $newCalls.Count + " candidates to " + $outFile)
}

# ---------- Step 5: Write human-readable report ----------
$report = "GrantsHub Moldova - Auto-update report" + "`r`n"
$report += "=======================================" + "`r`n"
$report += "Run: " + $now.ToString('yyyy-MM-dd HH:mm:ss') + "`r`n`r`n"
$report += "Status updates (auto-handled by frontend):" + "`r`n"
$report += "  - Active calls in data.js: " + $activeCount + "`r`n"
$report += "  - Past-deadline calls (hidden automatically): " + $expiredCount + "`r`n`r`n"
$report += "New candidate calls detected on civic.md: " + $newCalls.Count + "`r`n"

if ($newCalls.Count -gt 0) {
    $report += "`r`nAction required:" + "`r`n"
    $report += "  1. Open admin.html in browser" + "`r`n"
    $report += "  2. Click 'Import JSON'" + "`r`n"
    $report += "  3. Select scripts/pending_calls/auto_" + $today + ".json" + "`r`n"
    $report += "  4. Review and edit each call (set real deadline, eligibility, etc.)" + "`r`n`r`n"
    $report += "Detected:" + "`r`n"
    foreach ($n in $newCalls) {
        $report += "  - " + $n.title + "`r`n"
        $report += "    " + $n.url + "`r`n"
    }
} else {
    $report += "`r`nNo new calls to review."
}

[System.IO.File]::WriteAllText($reportFile, $report, (New-Object System.Text.UTF8Encoding $true))
Write-Log ("Report written: " + $reportFile)
Write-Log '=== Run finished ==='
