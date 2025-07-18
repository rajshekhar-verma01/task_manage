@echo off
echo ========================================
echo Task Management Desktop App - Complete Launcher
echo ========================================
echo.

REM Check if development server is running
echo Checking development server status...
node check-server.cjs
if %errorlevel% neq 0 (
    echo.
    echo Development server is not running.
    echo Please start it first with: npm run dev
    echo.
    pause
    exit /b 1
)

echo.
echo ✓ Development server is ready
echo ✓ Starting Electron desktop application...
echo.

REM Set environment variables
set NODE_ENV=development
set ELECTRON_ENABLE_LOGGING=1

REM Start Electron with configuration
node launch-with-config.cjs

echo.
echo Application closed.
pause