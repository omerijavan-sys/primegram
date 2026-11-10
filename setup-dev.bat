@echo off
echo Setting up Primegram Development Environment...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js is not installed. Downloading Node.js...
    
    REM Download Node.js
    echo Downloading Node.js installer...
    powershell -Command "Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.18.0/node-v20.18.0-x64.msi' -OutFile 'node-installer.msi'"
    
    echo Please run node-installer.msi to install Node.js, then restart this script.
    echo.
    pause
    exit /b 1
)

echo Node.js is already installed.
echo Installing dependencies...
npm install

echo.
echo Starting development server...
echo The app will be available at: http://localhost:5173
echo.
npm run dev
