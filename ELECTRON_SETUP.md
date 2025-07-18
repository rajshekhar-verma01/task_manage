# Electron Setup Instructions

## Quick Start (Recommended)

### For Windows Users:
Due to Windows NODE_ENV issues, I've created Windows-specific scripts:

```bash
# Option 1: All-in-one script (starts server + Electron)
start-app-windows.bat

# Option 2: Manual two-step process
# Step 1: Start development server
start-dev-windows.bat
# Step 2: In another terminal, start Electron
npx electron .
```

### For Linux/Mac Users:
```bash
node start-electron.cjs
```

This will automatically:
1. Start the development server (if not already running)
2. Wait for the server to be ready
3. Launch the Electron desktop application

## Manual Package.json Setup

If you want to add the scripts to your `package.json` manually, add these scripts to the "scripts" section:

```json
{
  "scripts": {
    "dev": "cross-env NODE_ENV=development tsx server/index.ts",
    "dev-windows": "cross-env NODE_ENV=development tsx server/index.ts",
    "build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
    "start": "cross-env NODE_ENV=production node dist/index.js",
    "check": "tsc",
    "db:push": "drizzle-kit push",
    "electron": "concurrently \"npm run dev-windows\" \"wait-on http://localhost:5000 && electron .\"",
    "electron-dev": "cross-env NODE_ENV=development electron .",
    "electron-pack": "electron-builder",
    "electron-build": "npm run build && electron-builder",
    "preelectron-pack": "npm run build"
  }
}
```

Then you can run:
```bash
npm run electron
```

**Note:** I've installed `cross-env` which makes NODE_ENV work on Windows. The original `dev` script should now work too!

## Alternative Methods

### Method 1: Direct Electron Launch
If the development server is already running (`npm run dev`), you can launch Electron directly:

```bash
npx electron .
```

### Method 2: Two Terminal Approach
1. Terminal 1: Start the development server
   ```bash
   npm run dev
   ```

2. Terminal 2: Start Electron (after server is ready)
   ```bash
   npx electron .
   ```

## Main Entry Point

The application's main entry point is `main.js`, which:
- Creates the Electron window
- Initializes the SQLite database
- Sets up IPC communication
- Loads the React frontend from `http://localhost:5000`

## Database Location

The SQLite database will be created in:
- **Development**: `./data/taskflow.db`
- **Production**: User's app data directory

## Troubleshooting

### Common Issues:

1. **NODE_ENV not recognized (Windows)**:
   - ✅ **FIXED**: I've installed `cross-env` to solve this
   - Use the Windows-specific scripts: `start-dev-windows.bat` or `start-app-windows.bat`
   - The original `npm run dev` should now work too!

2. **"Cannot find module" errors**:
   - Ensure all dependencies are installed: `npm install`
   - The database service uses CommonJS syntax while the package.json specifies ES modules

3. **Database errors**:
   - Check that the `data` directory exists
   - Ensure write permissions for the database file

4. **Electron window not loading**:
   - Ensure the development server is running on port 5000
   - Check the browser console for any errors

5. **libgbm.so.1 missing (Linux)**:
   - This is a system dependency issue in some Linux environments
   - Install required graphics libraries: `sudo apt-get install libgbm-dev`

### Development Mode Features:

- **Hot Reload**: Changes to React code will automatically reload
- **DevTools**: Press `Ctrl+Shift+I` (or `Cmd+Option+I` on Mac) to open DevTools
- **Database**: Located in `./data/taskflow.db` for easy inspection

## Project Structure

```
├── main.js              # Electron main process
├── preload.js           # Electron preload script
├── start-electron.js    # Convenience startup script
├── client/              # React frontend
│   ├── src/
│   │   ├── services/
│   │   │   └── database-electron.js  # Database service
│   │   └── hooks/
│   │       └── useTaskManager.ts     # Task management hook
├── server/              # Express backend (for development)
└── data/                # SQLite database location
```

## Production Build

To create a production build:

```bash
npm run electron-build
```

This will:
1. Build the React frontend
2. Bundle the Express server
3. Create platform-specific installers using electron-builder