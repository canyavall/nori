# mitmproxy Certificate Installation for PowerShell

$MITM_PATH = "C:\Users\canya\AppData\Local\Packages\PythonSoftwareFoundation.Python.3.13_qbz5n2kfra8p0\LocalCache\local-packages\Python313\Scripts"
$CERT_DIR = "$env:USERPROFILE\.mitmproxy"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "mitmproxy Certificate Installation" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if certificate already exists
if (Test-Path "$CERT_DIR\mitmproxy-ca-cert.p12") {
    Write-Host "Certificate already generated at:" -ForegroundColor Green
    Write-Host "  $CERT_DIR\mitmproxy-ca-cert.p12" -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host "Step 1: Generate certificate..." -ForegroundColor Cyan
    Write-Host "This will start mitmproxy briefly." -ForegroundColor Yellow
    Write-Host "Press Ctrl+C after a few seconds." -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press ENTER to continue"

    # Start mitmproxy to generate certificate
    & "$MITM_PATH\mitmproxy.exe"

    Write-Host ""
    Write-Host "Certificate generated!" -ForegroundColor Green
    Write-Host ""
}

Write-Host "Step 2: Install the certificate" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Opening certificate folder..." -ForegroundColor Yellow
explorer $CERT_DIR

Write-Host ""
Write-Host "MANUAL INSTALLATION:" -ForegroundColor Yellow
Write-Host "  1. Double-click: mitmproxy-ca-cert.p12"
Write-Host "  2. Password: mitmproxy"
Write-Host "  3. Store Location: Current User"
Write-Host "  4. Place in: Trusted Root Certification Authorities" -ForegroundColor Red
Write-Host "  5. Click Finish"
Write-Host ""
Write-Host "After installation, verify with:" -ForegroundColor Cyan
Write-Host "  certutil -user -verifystore Root mitmproxy" -ForegroundColor Yellow
Write-Host ""
Read-Host "Press ENTER when done"

# Verify installation
Write-Host ""
Write-Host "Verifying installation..." -ForegroundColor Cyan
certutil -user -verifystore Root mitmproxy

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "SUCCESS! Certificate installed correctly." -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "Certificate not found. Please retry the installation steps." -ForegroundColor Red
}
