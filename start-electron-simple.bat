@echo off
echo Starting Electron app for Windows...
echo.

REM Set environment variable for Windows
set NODE_ENV=development

REM Start Electron
echo Starting Electron application...
npx electron .

pause