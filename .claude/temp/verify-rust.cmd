@echo off
echo ============================================
echo Rust Toolchain Verification Script
echo ============================================
echo.

echo [1/4] Checking dlltool in PATH...
where dlltool.exe
if %errorlevel% neq 0 (
    echo FAILED: dlltool.exe not found in PATH
    echo.
    echo Expected path should contain:
    echo   C:\Users\canya\.rustup\toolchains\stable-x86_64-pc-windows-gnu\lib\rustlib\x86_64-pc-windows-gnu\bin\self-contained
    echo.
    goto :end
)
echo OK: dlltool found
echo.

echo [2/4] Checking active Rust toolchain...
rustup show
echo.

echo [3/4] Testing Rust compilation...
cd /d "%~dp0..\..\app\src-tauri"
cargo check
if %errorlevel% neq 0 (
    echo FAILED: cargo check failed
    goto :end
)
echo OK: Rust compilation succeeded
echo.

echo [4/4] All checks passed!
echo.
echo You can now run: bun run tauri:dev
echo.

:end
pause
