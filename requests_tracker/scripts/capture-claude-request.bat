@echo off
REM Windows batch script for easy Claude Code capturing

echo ========================================
echo Claude Code Request Capture Helper
echo ========================================
echo.

REM Check if prompt provided
if "%~1"=="" (
    echo Usage: capture-claude-request.bat "your prompt here"
    echo Example: capture-claude-request.bat "Explain how CLAUDE.md works"
    exit /b 1
)

REM Set proxy
set HTTPS_PROXY=http://localhost:8080

echo Running: claude -p "%~1"
echo Through proxy: %HTTPS_PROXY%
echo.

REM Run Claude Code through proxy
claude -p "%~1"

echo.
echo Request captured! Check mitmproxy window for details.
