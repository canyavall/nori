# Quick start script for PowerShell

$MITM_PATH = "C:\Users\canya\AppData\Local\Packages\PythonSoftwareFoundation.Python.3.13_qbz5n2kfra8p0\LocalCache\local-packages\Python313\Scripts\mitmproxy.exe"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Claude Code Request Capture" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Starting mitmproxy on port 8080..." -ForegroundColor Yellow
Write-Host ""
Write-Host "In ANOTHER PowerShell window, run:" -ForegroundColor Cyan
Write-Host "  `$env:HTTPS_PROXY='http://localhost:8080'" -ForegroundColor Yellow
Write-Host "  claude -p `"your prompt here`"" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press 'q' to quit and save capture" -ForegroundColor Red
Write-Host ""

# Find the latest capture file or create new one
$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"
$CAPTURE_FILE = "captures\claude_requests_$TIMESTAMP.mitm"

New-Item -ItemType Directory -Force -Path "captures" | Out-Null

# Start mitmproxy
& $MITM_PATH `
  -p 8080 `
  --set flow_detail=3 `
  --set "save_stream_file=$CAPTURE_FILE" `
  --set stream_large_bodies=1m `
  --set "view_filter=~d api.anthropic.com"

Write-Host ""
Write-Host "Capture saved to: $CAPTURE_FILE" -ForegroundColor Green
Write-Host ""
Write-Host "To analyze:" -ForegroundColor Cyan
Write-Host "  python scripts\analyze-capture.py $CAPTURE_FILE" -ForegroundColor Yellow
