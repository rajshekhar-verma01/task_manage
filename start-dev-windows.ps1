# PowerShell script to start development server
Write-Host "Starting development server for Windows..."
$env:NODE_ENV = "development"
tsx server/index.ts