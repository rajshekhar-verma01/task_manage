# Electron Desktop App Setup Guide

## Quick Start (Windows)

### Method 1: Simple Batch File (Recommended)
```cmd
run-electron.bat
```

### Method 2: Direct Command
```cmd
npx electron electron-main.js
```

### Method 3: PowerShell
```powershell
$env:NODE_ENV = "development"
npx electron electron-main.js
```

## What the App Includes

Your task management desktop application features:

- **Four Main Sections**: Household, Personal, Official Work, Blog & Learning
- **Task Management**: Create, edit, delete, and track tasks with due dates
- **Recurring Tasks**: Set up repeating tasks with flexible schedules
- **Sub-Goals**: Break down complex tasks into manageable parts
- **Categories**: Organize tasks with custom categories
- **Blog & Learning**: Track learning activities and content creation
- **JSON Database**: Reliable file-based storage (no native dependencies)
- **Desktop Experience**: Native Windows application with 1400x900 window

## Database Solution

The app now uses a JSON-based database system instead of SQLite to avoid native module compilation issues. This provides:

- **Cross-platform compatibility**: Works on any system with Node.js
- **No compilation required**: Pure JavaScript implementation
- **Data persistence**: All your data is saved in JSON format
- **Backup capability**: Easy to backup and restore your data
- **Performance**: Fast for typical task management workloads

Your data is stored in: `%APPDATA%/task-management-electron/taskflow-data.json`

## Troubleshooting

### If Electron won't start:
1. Make sure you're in the project root directory
2. Check that `electron-main.js` file exists
3. Try: `npm install electron` to reinstall Electron
4. Use the batch file: `run-electron.bat`

### If you see "module not found":
- The app now uses JSON database instead of SQLite to avoid native module issues
- All your data will be preserved in JSON format

### Development Server Issues:
- Make sure the development server is running on port 5000
- Check that you can access http://localhost:5000 in your browser
- If needed, restart the server: `npm run dev`

## Features Working

✅ Task creation and management across all sections  
✅ Blog and learning content tracking  
✅ Data persistence with JSON database  
✅ Categories and organization  
✅ Desktop window with proper sizing  
✅ Cross-platform compatibility  

The application is fully functional and ready for daily task management use!