@echo off
echo Starting Task Management Desktop Application...

REM Check if we're in the right directory
if not exist "electron-main.js" (
  echo Error: electron-main.js not found
  echo Make sure you are in the project root directory
  pause
  exit /b 1
)

REM Set environment
set NODE_ENV=development

REM Start Electron with the correct entry point
echo Launching Electron...
npx electron electron-main.js

echo Application closed.
pause