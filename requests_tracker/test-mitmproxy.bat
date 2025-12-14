@echo off
REM Quick test to verify mitmproxy works

set MITM_PATH=C:\Users\canya\AppData\Local\Packages\PythonSoftwareFoundation.Python.3.13_qbz5n2kfra8p0\LocalCache\local-packages\Python313\Scripts

echo Testing mitmproxy installation...
echo.

"%MITM_PATH%\mitmproxy.exe" --version

echo.
echo If you see a version number above, mitmproxy is installed correctly!
echo.
echo Next steps:
echo   1. Run: scripts\install-certificate-windows.bat
echo   2. Then: python scripts\start-capture.py
echo.
pause
