@echo off
echo ================================
echo Windows Electron App Launcher
echo ================================
echo.

echo Step 1: Starting development server...
echo Please wait while the server starts...
echo.

REM Kill any existing processes on port 5000
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5000" ^| find "LISTENING"') do taskkill /PID %%a /F >nul 2>&1

REM Start the simple server
start "Development Server" /MIN cmd /k "node start-simple.js"

echo Waiting for server to start...
timeout /t 5 /nobreak >nul

REM Check if server is running
:checkserver
ping -n 2 127.0.0.1 >nul
curl -s http://localhost:5000/api/health >nul 2>&1
if %errorlevel% neq 0 (
    echo Still waiting for server...
    timeout /t 2 /nobreak >nul
    goto checkserver
)

echo.
echo ✓ Server is ready!
echo.
echo Step 2: Starting Electron desktop application...
echo.

npx electron .

echo.
echo App closed. You can close the server window manually.
echo Press any key to exit...
pause >nul