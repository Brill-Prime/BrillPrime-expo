# BrillPrime Expo Project

## Overview
This is an Expo React Native project that provides native app, web app, and admin panel frontend capabilities. The project has been successfully configured to run in the Replit environment.

## Recent Changes (September 4, 2025)
- Set up complete Expo project structure from GitHub import
- Configured proxy server to handle Replit's port 5000 requirement
- Installed all necessary dependencies for web, native, and admin panel development
- Set up development and production deployment configurations

## Project Architecture
- **Frontend Framework**: Expo with React Native
- **Platform Support**: iOS, Android, Web
- **Development Server**: Expo Metro bundler with proxy server for Replit compatibility
- **Port Configuration**: Proxy server on port 5000 routing to Expo on port 8081
- **Deployment**: Autoscale deployment using static export build

## Available Scripts
- `npm run start`: Start Expo development server
- `npm run dev`: Start full development environment (Expo + proxy)
- `npm run web`: Start web-only development
- `npm run android`: Start Android development
- `npm run ios`: Start iOS development
- `npm run build`: Export web build for production
- `npm run serve`: Serve production build

## Technical Configuration
- **Proxy Server**: Routes port 5000 to Expo Metro bundler for Replit compatibility
- **Metro Bundler**: Configured for web platform support
- **Development Environment**: Configured with hot reloading and debugging support
- **Production Build**: Static export for web deployment

## User Preferences
- Multi-platform development with emphasis on web accessibility
- Replit cloud development environment setup
- Automatic deployment configuration for production use