# Capture Claude Code request with Node.js certificate fix

$MITM_PATH = "C:\Users\canya\AppData\Local\Packages\PythonSoftwareFoundation.Python.3.13_qbz5n2kfra8p0\LocalCache\local-packages\Python313\Scripts\mitmdump.exe"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Capturing Claude Code Request" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"
$CAPTURE_FILE = "..\captures\claude_$TIMESTAMP.mitm"
New-Item -ItemType Directory -Force -Path "..\captures" | Out-Null

Write-Host "Starting mitmproxy..." -ForegroundColor Cyan
$mitm = Start-Process -FilePath $MITM_PATH `
    -ArgumentList "-p", "8080", "--set", "save_stream_file=$CAPTURE_FILE", "--quiet" `
    -PassThru -NoNewWindow

Write-Host "Waiting for mitmproxy to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "Running Claude Code..." -ForegroundColor Cyan
Write-Host ""

# CRITICAL: Disable SSL verification for Node.js
$env:HTTPS_PROXY = 'http://localhost:8080'
$env:NODE_TLS_REJECT_UNAUTHORIZED = '0'  # This allows Node.js to accept the mitmproxy cert

Write-Host "Running: claude -p 'Say hello in one word'" -ForegroundColor Yellow

# Run with timeout
$job = Start-Job -ScriptBlock {
    param($proxy)
    $env:HTTPS_PROXY = $proxy
    $env:NODE_TLS_REJECT_UNAUTHORIZED = '0'
    & claude -p "Say hello in one word" 2>&1
} -ArgumentList 'http://localhost:8080'

# Wait up to 30 seconds
$completed = Wait-Job -Job $job -Timeout 30

if ($completed) {
    $output = Receive-Job -Job $job
    Write-Host ""
    Write-Host "Claude Response:" -ForegroundColor Green
    Write-Host $output
} else {
    Write-Host "⚠️ Claude Code timed out (30s)" -ForegroundColor Yellow
    Stop-Job -Job $job
}

Remove-Job -Job $job -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "Stopping mitmproxy..." -ForegroundColor Cyan
Start-Sleep -Seconds 2
Stop-Process -Id $mitm.Id -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Results" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if (Test-Path $CAPTURE_FILE) {
    $size = (Get-Item $CAPTURE_FILE).Length

    Write-Host "Capture file: $(Split-Path $CAPTURE_FILE -Leaf)" -ForegroundColor Yellow
    Write-Host "Size: $size bytes" -ForegroundColor Yellow

    if ($size -gt 0) {
        Write-Host "✅ SUCCESS - Captured API request!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Analyzing..." -ForegroundColor Cyan
        python ..\scripts\analyze-capture.py $CAPTURE_FILE
    } else {
        Write-Host "❌ FAILED - No data captured" -ForegroundColor Red
        Write-Host ""
        Write-Host "Possible reasons:" -ForegroundColor Yellow
        Write-Host "  1. Claude Code doesn't accept NODE_TLS_REJECT_UNAUTHORIZED"
        Write-Host "  2. Need to add mitmproxy cert to Node.js cert store"
        Write-Host "  3. Claude Code bypasses proxy"
    }
} else {
    Write-Host "❌ No capture file created" -ForegroundColor Red
}

Write-Host ""
Write-Host "Capture file location: $CAPTURE_FILE" -ForegroundColor Cyan
