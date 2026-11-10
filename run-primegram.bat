@echo off
title Primegram Development Server
color 0A

echo ========================================
echo        PRIMEGRAM DEVELOPMENT SERVER
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo.
    echo Please follow these steps:
    echo 1. Go to https://nodejs.org
    echo 2. Download and install Node.js (LTS version)
    echo 3. Restart this command prompt
    echo 4. Run this script again
    echo.
    echo Opening Node.js download page...
    start https://nodejs.org
    pause
    exit /b 1
)

echo [SUCCESS] Node.js is installed
node --version
echo.

REM Check if we're in the right directory
if not exist "package.json" (
    echo [ERROR] Not in the Primegram project directory!
    echo Please navigate to: C:\Users\omeri\Downloads\liquid-prime
    pause
    exit /b 1
)

REM Install dependencies if needed
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install dependencies
        pause
        exit /b 1
    )
    echo [SUCCESS] Dependencies installed
    echo.
)

REM Start development server
echo Starting Primegram development server...
echo.
echo ========================================
echo   Primegram will be available at:
echo   http://localhost:5173
echo ========================================
echo.
echo Press Ctrl+C to stop the server
echo.

npm run dev
