@echo off
echo ========================================
echo OpenCode Quick Setup for Windows
echo ========================================
echo.

echo Step 1: Installing pnpm globally...
call npm install -g pnpm
if errorlevel 1 (
    echo ERROR: Failed to install pnpm
    pause
    exit /b 1
)
echo ✓ pnpm installed successfully
echo.

echo Step 2: Cloning fresh OpenCode...
cd /d "%~dp0"
if exist opencode-test (
    echo opencode-test directory already exists, skipping clone
) else (
    git clone https://github.com/sst/opencode.git opencode-test
    if errorlevel 1 (
        echo ERROR: Failed to clone OpenCode
        pause
        exit /b 1
    )
)
echo ✓ OpenCode cloned successfully
echo.

echo Step 3: Installing dependencies...
cd opencode-test
call pnpm install
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
echo ✓ Dependencies installed successfully
echo.

echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Set your API key:
echo    set ANTHROPIC_API_KEY=your_key_here
echo.
echo 2. Create config file opencode.json:
echo    {
echo      "model": "anthropic/claude-sonnet-4-5",
echo      "provider": "anthropic"
echo    }
echo.
echo 3. Run OpenCode:
echo    pnpm opencode
echo.
echo Press any key to exit...
pause > nul
