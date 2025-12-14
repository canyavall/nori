@echo off
REM Add mitmproxy to PATH for current session

set MITM_SCRIPTS=C:\Users\canya\AppData\Local\Packages\PythonSoftwareFoundation.Python.3.13_qbz5n2kfra8p0\LocalCache\local-packages\Python313\Scripts

REM Add to PATH for this session
set PATH=%MITM_SCRIPTS%;%PATH%

echo ========================================
echo mitmproxy added to PATH
echo ========================================
echo.
echo You can now run:
echo   - mitmproxy
echo   - mitmdump
echo   - mitmweb
echo.
echo This is temporary. To make it permanent:
echo   1. Search "Environment Variables" in Windows
echo   2. Edit PATH for your user
echo   3. Add: %MITM_SCRIPTS%
echo.
echo ========================================

REM Start a new command prompt with PATH set
cmd /K "echo mitmproxy is now available. Try: mitmproxy --version"
