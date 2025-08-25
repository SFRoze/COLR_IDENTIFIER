@echo off
echo =====================================
echo COLR Identify - Color Picker Setup
echo =====================================
echo.

:: Check if running as administrator
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo NOTE: Not running as administrator. This is OK for local installation.
    echo.
)

:: Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js is not installed. 
    echo.
    echo Please follow these steps:
    echo 1. Go to https://nodejs.org/
    echo 2. Download the Windows Installer (.msi)
    echo 3. Run the installer with default settings
    echo 4. Restart this script after installation
    echo.
    echo Opening Node.js website...
    start https://nodejs.org/
    pause
    exit /b 1
) else (
    echo ✓ Node.js is installed
    node --version
)

:: Check npm
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ✗ npm is not available
    echo Please reinstall Node.js
    pause
    exit /b 1
) else (
    echo ✓ npm is available
    npm --version
)

echo.
echo Installing COLR Identify dependencies...
echo.

npm install
if %errorlevel% neq 0 (
    echo.
    echo ✗ Installation failed
    echo Please check your internet connection and try again.
    pause
    exit /b 1
)

echo.
echo =====================================
echo ✓ Installation completed successfully!
echo =====================================
echo.
echo To run COLR Identify:
echo   1. Double-click 'run.bat'
echo   2. Or open PowerShell here and type: npm start
echo.
echo Features:
echo   • Pick colors from screen with Ctrl+Shift+C
echo   • Support for HEX, RGB, HSV, HSL formats
echo   • Interactive color sliders
echo   • Copy colors to clipboard
echo   • Color history tracking
echo.
pause
