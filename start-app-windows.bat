@echo off
echo Starting Task Management Desktop App...
echo.

REM Start the development server in a new window
echo Starting development server...
start "Development Server" cmd /k "set NODE_ENV=development && tsx server/index.ts"

REM Wait for server to start
echo Waiting for server to start...
timeout /t 5 /nobreak >nul

REM Check if server is running and start Electron
:checkserver
curl -s http://localhost:5000 >nul 2>&1
if %errorlevel% neq 0 (
    echo Waiting for server to be ready...
    timeout /t 2 /nobreak >nul
    goto checkserver
)

echo Server is ready! Starting Electron app...
npx electron .

echo.
echo App closed. You can close the server window manually.
pause