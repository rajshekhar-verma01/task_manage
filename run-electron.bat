@echo off
echo Starting Electron Task Management App...

REM Check if server is running
echo Checking if development server is running...
curl -s http://localhost:5000 >nul 2>&1
if %errorlevel% neq 0 (
    echo Development server is not running.
    echo Please start the server first with: npm run dev
    echo Then run this script again.
    pause
    exit /b 1
)

echo Development server is running, starting Electron...
npx electron .

pause