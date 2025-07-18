# Quick Start for Windows Users

Since you're encountering NODE_ENV issues, here are the simplest ways to run your Electron task management app:

## Method 1: Direct Node.js Script (Recommended)
```bash
node start-server.cjs
```
Then in another terminal:
```bash
npx electron .
```

## Method 2: Windows Batch File
```bash
start-dev-windows.bat
```
Then in another terminal:
```bash
npx electron .
```

## Method 3: Manual Commands
```bash
# Set environment and start server directly
npx tsx server/index.ts
```
Then in another terminal:
```bash
npx electron .
```

## Method 4: PowerShell
```powershell
# In PowerShell
$env:NODE_ENV = "development"
npx tsx server/index.ts
```
Then in another terminal:
```bash
npx electron .
```

## What You'll See

1. **First terminal**: Server starting message and "serving on port 5000"
2. **Second terminal**: Electron window opens with your task management app

## Troubleshooting

If you still get NODE_ENV errors:
- Make sure you have Node.js installed
- Try running: `npm install -g tsx` to install tsx globally
- Use the direct Node.js script (`node start-server.cjs`) which sets the environment variable programmatically

## Your App Features

Once running, you'll have:
- Task management across Household, Personal, and Official sections
- Blog & Learning content management
- SQLite database with time tracking and analytics
- Native desktop experience with modern UI