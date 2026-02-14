@echo off
REM Setup script for Sportify Spots Membership System (Windows)

echo.
echo 🚀 Sportify Spots Membership System - Setup Guide
echo ================================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed!
    echo Please download and install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo ✓ Node.js is installed: 
node --version
echo.

REM Install dependencies
echo 📦 Installing dependencies...
call npm install

if %ERRORLEVEL% EQU 0 (
    echo ✓ Dependencies installed successfully
) else (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo ✅ Setup completed successfully!
echo.
echo 🚀 To start the server, run:
echo    npm start
echo.
echo 📝 For development with auto-reload, run:
echo    npm run dev
echo.
echo 🧪 To run tests, run:
echo    npm test
echo.
echo 📖 See MEMBERSHIP_README.md for complete documentation
echo.
pause
