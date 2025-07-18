@echo off
echo Starting development server for Windows...
echo.

REM Set environment variable for Windows
set NODE_ENV=development

REM Start the development server
echo Starting server on port 5000...
npx tsx server/index.ts

pause