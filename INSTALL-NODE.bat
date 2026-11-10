@echo off
title Node.js Installer for Primegram
color 0B

echo ========================================
echo     NODE.JS INSTALLER FOR PRIMEGRAM
echo ========================================
echo.

REM Check if Node.js is already installed
where node >nul 2>nul
if %errorlevel% equ 0 (
    echo Node.js is already installed!
    node --version
    echo.
    echo You can now run: run-primegram.bat
    pause
    exit /b 0
)

echo Node.js is not installed. Starting installation...
echo.

REM Download Node.js installer
echo Downloading Node.js installer...
powershell -Command "Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.18.0/node-v20.18.0-x64.msi' -OutFile 'node-installer.msi'"

if exist "node-installer.msi" (
    echo Download complete!
    echo.
    echo Installing Node.js...
    echo Please accept all default settings in the installer.
    echo.
    
    REM Run the installer
    start /wait msiexec /i node-installer.msi /quiet /norestart
    
    echo Installation complete!
    echo.
    echo IMPORTANT: Please restart your computer and run run-primegram.bat
    echo.
    
) else (
    echo Download failed!
    echo.
    echo Please download Node.js manually:
    echo 1. Go to https://nodejs.org
    echo 2. Download the LTS version
    echo 3. Run the installer
    echo 4. Restart your computer
    echo.
    start https://nodejs.org
)

pause
