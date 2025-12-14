# Quick test to verify mitmproxy captures HTTPS traffic

$MITM_PATH = "C:\Users\canya\AppData\Local\Packages\PythonSoftwareFoundation.Python.3.13_qbz5n2kfra8p0\LocalCache\local-packages\Python313\Scripts\mitmdump.exe"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Testing mitmproxy Capture" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This test will:" -ForegroundColor Yellow
Write-Host "  1. Start mitmproxy in background"
Write-Host "  2. Make a test HTTPS request"
Write-Host "  3. Check if request was captured"
Write-Host ""

$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"
$CAPTURE_FILE = "..\captures\test_capture_$TIMESTAMP.mitm"
New-Item -ItemType Directory -Force -Path "..\captures" | Out-Null

Write-Host "Starting mitmproxy on port 8080..." -ForegroundColor Cyan
$mitm = Start-Process -FilePath $MITM_PATH `
    -ArgumentList "-p", "8080", "--set", "save_stream_file=$CAPTURE_FILE", "--quiet" `
    -PassThru -NoNewWindow

Write-Host "mitmproxy started (PID: $($mitm.Id))" -ForegroundColor Green

# Give it time to start
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "Sending test HTTPS request through proxy..." -ForegroundColor Cyan
Write-Host "URL: https://httpbin.org/get" -ForegroundColor Yellow
Write-Host ""

# Test with curl (PowerShell's Invoke-WebRequest)
try {
    $response = Invoke-WebRequest -Uri "https://httpbin.org/get" -Proxy "http://localhost:8080" -ErrorAction Stop
    Write-Host "✅ Request successful!" -ForegroundColor Green
    Write-Host "Response preview:" -ForegroundColor Cyan
    $response.Content.Substring(0, [Math]::Min(200, $response.Content.Length))
    $success = $true
} catch {
    Write-Host "❌ Request failed!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    $success = $false
}

Write-Host ""
Write-Host "Stopping mitmproxy..." -ForegroundColor Cyan
Stop-Process -Id $mitm.Id -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Checking capture file..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if (Test-Path $CAPTURE_FILE) {
    $size = (Get-Item $CAPTURE_FILE).Length

    if ($size -gt 0) {
        Write-Host "✅ Capture file created: $(Split-Path $CAPTURE_FILE -Leaf)" -ForegroundColor Green
        Write-Host "   Size: $size bytes" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "SUCCESS! mitmproxy is capturing traffic correctly." -ForegroundColor Green
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Cyan
        Write-Host "  1. Run: python ..\scripts\analyze-capture.py $CAPTURE_FILE"
        Write-Host "  2. Check: ..\analysis\ folder for results"
    } else {
        Write-Host "⚠️ Capture file is empty" -ForegroundColor Yellow
        Write-Host "This might mean mitmproxy started but didn't capture anything" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ No capture file created" -ForegroundColor Red
    Write-Host "This means mitmproxy didn't start properly" -ForegroundColor Red
}

Write-Host ""
if (-not $success) {
    Write-Host "If the test failed, check:" -ForegroundColor Yellow
    Write-Host "  1. Certificate installed? (run install-certificate.ps1)" -ForegroundColor Red
    Write-Host "  2. Port 8080 available? (netstat -an | findstr 8080)"
    Write-Host "  3. Firewall blocking mitmproxy?"
}
