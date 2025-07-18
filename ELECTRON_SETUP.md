# Electron Setup Instructions

## Quick Start (Recommended)

I've created a startup script for you. Simply run:

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
    "dev": "NODE_ENV=development tsx server/index.ts",
    "build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
    "start": "NODE_ENV=production node dist/index.js",
    "check": "tsc",
    "db:push": "drizzle-kit push",
    "electron": "concurrently \"npm run dev\" \"wait-on http://localhost:5000 && electron .\"",
    "electron-dev": "NODE_ENV=development electron .",
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

1. **"Cannot find module" errors**:
   - Ensure all dependencies are installed: `npm install`
   - The database service uses CommonJS syntax while the package.json specifies ES modules

2. **Database errors**:
   - Check that the `data` directory exists
   - Ensure write permissions for the database file

3. **Electron window not loading**:
   - Ensure the development server is running on port 5000
   - Check the browser console for any errors

4. **libgbm.so.1 missing (Linux)**:
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