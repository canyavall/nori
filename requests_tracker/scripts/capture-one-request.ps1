# Capture a single Claude Code request automatically

$MITM_PATH = "C:\Users\canya\AppData\Local\Packages\PythonSoftwareFoundation.Python.3.13_qbz5n2kfra8p0\LocalCache\local-packages\Python313\Scripts\mitmdump.exe"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Capturing Single Claude Code Request" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"
$CAPTURE_FILE = "..\captures\claude_single_$TIMESTAMP.mitm"
New-Item -ItemType Directory -Force -Path "..\captures" | Out-Null

Write-Host "Starting mitmproxy in background..." -ForegroundColor Cyan
$mitm = Start-Process -FilePath $MITM_PATH `
    -ArgumentList "-p", "8080", "--set", "save_stream_file=$CAPTURE_FILE", "--quiet" `
    -PassThru -NoNewWindow -RedirectStandardOutput "$env:TEMP\mitm.log" -RedirectStandardError "$env:TEMP\mitm_err.log"

Write-Host "Waiting for mitmproxy to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "Running Claude Code with simple prompt..." -ForegroundColor Cyan
Write-Host "Command: claude -p 'Say hello in one word'" -ForegroundColor Yellow
Write-Host ""

# Set proxy and run claude
$env:HTTPS_PROXY = 'http://localhost:8080'
try {
    $output = & claude -p "Say hello in one word" 2>&1
    Write-Host "Claude Output:" -ForegroundColor Green
    Write-Host $output
} catch {
    Write-Host "Error running Claude: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Stopping mitmproxy..." -ForegroundColor Cyan
Start-Sleep -Seconds 2
Stop-Process -Id $mitm.Id -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Checking Capture" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if (Test-Path $CAPTURE_FILE) {
    $size = (Get-Item $CAPTURE_FILE).Length

    if ($size -gt 0) {
        Write-Host "✅ Captured Claude Code request!" -ForegroundColor Green
        Write-Host "   File: $(Split-Path $CAPTURE_FILE -Leaf)" -ForegroundColor Yellow
        Write-Host "   Size: $size bytes" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Analyzing capture..." -ForegroundColor Cyan
        Write-Host ""

        # Run analysis
        python ..\scripts\analyze-capture.py $CAPTURE_FILE

    } else {
        Write-Host "⚠️ Capture file is empty" -ForegroundColor Yellow
        Write-Host "Claude might not have made an API request" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ No capture file created" -ForegroundColor Red
}
