# TaskFlow Pro - Desktop Application

A comprehensive task management desktop application built with React and Electron.

## Features

- **Four Main Sections**: Household, Personal Development, Official Work, and Blog
- **Task Management**: Todo → In Progress → Completed workflow
- **Sub-Goals**: For personal development tasks with progress tracking
- **Recurring Tasks**: Set up repeating tasks with custom intervals
- **Analytics Dashboard**: Track productivity across all sections
- **Category Management**: Custom categories for each section
- **Cross-Platform**: Available for Windows, macOS, and Linux

## Development

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Running in Development Mode
```bash
# Install dependencies
npm install

# Start the development server with Electron
npm run electron-dev
```

This will start both the Vite dev server and Electron, with hot reloading enabled.

### Building for Production

#### Build for Current Platform
```bash
npm run dist
```

#### Build for Specific Platforms
```bash
# macOS
npm run dist-mac

# Windows
npm run dist-win

# Linux
npm run dist-linux
```

### Project Structure
```
├── public/
│   ├── electron.js          # Main Electron process
│   └── icon.png            # App icon
├── src/
│   ├── components/         # React components
│   ├── hooks/             # Custom React hooks
│   ├── types/             # TypeScript type definitions
│   └── App.tsx            # Main React component
├── electron-builder.json   # Electron Builder configuration
└── package.json
```

## Application Architecture

### Main Process (Electron)
- Window management
- Application menu
- Security configurations
- Platform-specific optimizations

### Renderer Process (React)
- Task management interface
- Data persistence (localStorage)
- Analytics and reporting
- User interactions

## Data Storage

The application uses localStorage for data persistence, ensuring your tasks are saved locally on your device. Data includes:
- Tasks for all four sections
- Categories and settings
- Analytics history

## Keyboard Shortcuts

- `Ctrl/Cmd + N`: Create new task
- `Ctrl/Cmd + Q`: Quit application
- `F11`: Toggle fullscreen
- `Ctrl/Cmd + R`: Reload application

## Security Features

- Context isolation enabled
- Node integration disabled
- Web security enabled
- Prevents unauthorized window creation

## Platform-Specific Features

### Windows
- NSIS installer with desktop shortcut
- Start menu integration
- System tray support (future feature)

### macOS
- DMG installer
- Dock integration
- Native menu bar
- Universal binary (Intel + Apple Silicon)

### Linux
- AppImage and DEB packages
- Desktop file integration
- Follows Linux desktop standards

## Troubleshooting

### Development Issues
1. **Port already in use**: Change the port in `vite.config.ts`
2. **Electron won't start**: Ensure all dependencies are installed
3. **Hot reload not working**: Restart the development server

### Build Issues
1. **Missing icons**: Add proper icon files in the `public` directory
2. **Code signing**: Configure certificates for distribution
3. **Permission errors**: Run with appropriate permissions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.