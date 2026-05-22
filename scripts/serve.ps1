# GrantsHub Moldova — Local HTTP server (PowerShell native, no dependencies)
# Usage: powershell -ExecutionPolicy Bypass -File scripts/serve.ps1 [port]

param(
    [int]$Port = 8765
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
if (-not $root) { $root = (Get-Item $PSScriptRoot).Parent.FullName }

$mime = @{
    '.html' = 'text/html; charset=utf-8'
    '.htm'  = 'text/html; charset=utf-8'
    '.css'  = 'text/css; charset=utf-8'
    '.js'   = 'application/javascript; charset=utf-8'
    '.json' = 'application/json; charset=utf-8'
    '.svg'  = 'image/svg+xml'
    '.png'  = 'image/png'
    '.jpg'  = 'image/jpeg'
    '.jpeg' = 'image/jpeg'
    '.gif'  = 'image/gif'
    '.ico'  = 'image/x-icon'
    '.ics'  = 'text/calendar'
    '.woff' = 'font/woff'
    '.woff2'= 'font/woff2'
    '.ttf'  = 'font/ttf'
    '.txt'  = 'text/plain; charset=utf-8'
}

$listener = [System.Net.HttpListener]::new()
$prefix = "http://localhost:$Port/"
$listener.Prefixes.Add($prefix)

try {
    $listener.Start()
} catch {
    Write-Host "ERROR: nu pot porni serverul pe portul $Port. Probabil e ocupat sau lipsește permisiunea." -ForegroundColor Red
    Write-Host $_.Exception.Message
    exit 1
}

Write-Host ""
Write-Host "GrantsHub Moldova — server local pornit" -ForegroundColor Green
Write-Host "  → $prefix" -ForegroundColor Cyan
Write-Host "  Root: $root"
Write-Host "  Apasă Ctrl+C pentru oprire."
Write-Host ""

try {
    while ($listener.IsListening) {
        $ctx = $listener.GetContext()
        $req = $ctx.Request
        $res = $ctx.Response

        try {
            $relPath = $req.Url.LocalPath.TrimStart('/')
            if ([string]::IsNullOrWhiteSpace($relPath) -or $relPath.EndsWith('/')) {
                $relPath = ($relPath + 'index.html').TrimStart('/')
            }

            # Prevent path traversal
            $relPath = $relPath -replace '\.\.', ''
            $relPath = $relPath.Replace('/', [System.IO.Path]::DirectorySeparatorChar)
            $filePath = Join-Path $root $relPath

            $log = "$(Get-Date -Format 'HH:mm:ss') $($req.HttpMethod) $($req.Url.LocalPath)"

            if (Test-Path $filePath -PathType Leaf) {
                $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
                if ($mime.ContainsKey($ext)) {
                    $contentType = $mime[$ext]
                } else {
                    $contentType = 'application/octet-stream'
                }
                $bytes = [System.IO.File]::ReadAllBytes($filePath)
                $res.StatusCode = 200
                $res.ContentType = $contentType
                $res.ContentLength64 = $bytes.Length
                $res.OutputStream.Write($bytes, 0, $bytes.Length)
                Write-Host "$log  200  ($($bytes.Length) bytes)"
            } else {
                $res.StatusCode = 404
                $msg = [System.Text.Encoding]::UTF8.GetBytes("404 — $relPath")
                $res.OutputStream.Write($msg, 0, $msg.Length)
                Write-Host "$log  404" -ForegroundColor Yellow
            }
        } catch {
            $res.StatusCode = 500
            Write-Host "$log  500  $($_.Exception.Message)" -ForegroundColor Red
        } finally {
            $res.OutputStream.Close()
        }
    }
} finally {
    $listener.Stop()
    $listener.Close()
}
