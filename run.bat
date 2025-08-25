@echo off
echo COLR Identify - Color Picker Application
echo =====================================
echo.

:: Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH.
    echo Please download and install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm is not installed or not in PATH.
    echo Please reinstall Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: Check if node_modules exists
if not exist "node_modules\" (
    echo Installing dependencies...
    echo.
    npm install
    if %errorlevel% neq 0 (
        echo.
        echo ERROR: Failed to install dependencies.
        echo Please check your internet connection and try again.
        echo.
        pause
        exit /b 1
    )
)

echo Starting COLR Identify...
echo.
npm start

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to start the application.
    echo Please check the console output above for details.
    echo.
    pause
)
