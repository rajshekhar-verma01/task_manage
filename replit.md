# Task Management Electron Desktop Application

## Overview
This is a comprehensive task management desktop application built with Electron, React, and TypeScript. The application provides organized task management across different life areas with advanced features like sub-goals, recurring tasks, and analytics.

## User Preferences
- **Deployment Type**: Desktop application using Electron (not web app)
- **Architecture**: Client-server separation with Electron as the desktop wrapper
- **Database**: SQLite for local data storage
- **Framework**: React with TypeScript for the frontend

## Project Architecture
- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Express.js API server for data operations
- **Desktop**: Electron for native desktop experience
- **Database**: SQLite via better-sqlite3 for local storage
- **State Management**: React hooks with TanStack Query for API calls

## Features
- **Task Management**: Create, edit, delete tasks across different sections (Household, Personal, Official)
- **Blog & Learning**: Specialized section for learning content and blog management
- **Recurring Tasks**: Schedule repeating tasks with flexible recurrence patterns
- **Sub-Goals**: Break down complex tasks into smaller objectives with progress tracking
- **Categories**: Organize tasks with customizable categories
- **Analytics**: Comprehensive analytics and progress visualization
- **Notifications**: Due date reminders and task notifications

## Sections
1. **Household Work** - Daily chores, maintenance, shopping, cooking
2. **Personal Development** - Learning, exercise, reading, skill building
3. **Official Work** - Meetings, projects, reports, communication
4. **Blog & Learning** - Content creation, research, knowledge management

## Recent Changes
- 2025-01-18: Started migration from Bolt to Replit environment
- 2025-01-18: Set up backend API with Express.js and storage layer
- 2025-01-18: User confirmed preference for Electron desktop app over web app

## Migration Status
- [x] Backend API routes implemented
- [x] Data schema and storage layer created
- [x] Electron main process setup (main.js restored)
- [x] Electron preload script created (preload.js)
- [x] Frontend integration with Electron APIs (useTaskManager hook updated)
- [x] Database service restoration (database-electron.js)
- [x] System dependencies installed (glib, gtk3, xorg libraries)
- [ ] Resolve Electron runtime dependency (libgbm.so.1 missing)
- [ ] Test full Electron app functionality
- [ ] Verify all features work in desktop mode

## Current Issue (January 18, 2025)
Electron app migration is 90% complete. The main blocker is a missing system library `libgbm.so.1` that prevents Electron from launching in the Replit environment. All code has been successfully migrated and the development server is running. Working on resolving the system dependency issue.