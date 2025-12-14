@echo off
REM Windows Certificate Installation Script for mitmproxy

echo ========================================
echo mitmproxy Certificate Installation
echo ========================================
echo.

REM Set paths
set MITM_SCRIPTS=C:\Users\canya\AppData\Local\Packages\PythonSoftwareFoundation.Python.3.13_qbz5n2kfra8p0\LocalCache\local-packages\Python313\Scripts
set MITM_CERT_DIR=%USERPROFILE%\.mitmproxy

echo Step 1: Generate mitmproxy certificate...
echo This will start mitmproxy briefly to create the certificate.
echo Press Ctrl+C after a few seconds when you see the mitmproxy interface.
echo.
pause

REM Run mitmproxy to generate certificate
"%MITM_SCRIPTS%\mitmproxy.exe"

echo.
echo Step 2: Certificate generated!
echo Location: %MITM_CERT_DIR%\mitmproxy-ca-cert.p12
echo.
echo Step 3: Install the certificate
echo ========================================
echo.
echo OPTION A - Automatic (Run as Administrator):
echo   certutil -f -user -p mitmproxy -importpfx "%MITM_CERT_DIR%\mitmproxy-ca-cert.p12"
echo.
echo OPTION B - Manual (Recommended):
echo   1. Open: %MITM_CERT_DIR%\mitmproxy-ca-cert.p12
echo   2. Password: mitmproxy
echo   3. Store Location: Current User
echo   4. Place in store: Trusted Root Certification Authorities
echo   5. Click Finish
echo.
echo ========================================
echo.
echo After installation, you can verify with:
echo   certutil -user -verifystore Root mitmproxy
echo.
pause

REM Open certificate directory
explorer "%MITM_CERT_DIR%"
