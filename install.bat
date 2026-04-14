@echo off
echo ==========================================
echo    Knowledge Manager Installer
echo ==========================================
echo.

node --version >nul 2>&1
if not errorlevel 1 (
    echo [OK] Node.js is installed!
    node --version
    echo.
    cd /d "%~dp0knowledge-manager"
    call npm install
    call npm run dev
    pause
    exit
)

echo [Step 1/4] Downloading Node.js...
echo Please wait 1-3 minutes...
echo.

certutil -urlcache -split -f "https://npmmirror.com/mirrors/node/v20.10.0/node-v20.10.0-win-x64.zip" "%~dp0node.zip"

if exist "%~dp0node.zip" (
    echo [OK] Download complete
) else (
    echo.
    echo [ERROR] Download failed!
    echo.
    echo Please download manually:
    echo 1. Open browser
    echo 2. Go to: https://nodejs.org/dist/v20.10.0/
    echo 3. Download: node-v20.10.0-win-x64.zip
    echo 4. Rename to: node.zip
    echo 5. Put in current folder
    echo.
    pause
    exit
)

echo.
echo [Step 2/4] Extracting...
powershell -NoProfile -Command "Expand-Archive -Path '%~dp0node.zip' -DestinationPath 'C:\nodejs' -Force"

if exist "C:\nodejs\node.exe" (
    echo [OK] Extract complete
) else (
    echo [ERROR] Extract failed
    pause
    exit
)

echo.
echo [Step 3/4] Setting up environment...
setx PATH "C:\nodejs;%%PATH%%" /M >nul

echo.
echo [Step 4/4] Verifying...
set PATH=C:\nodejs;%PATH%
node --version
npm --version

echo.
echo ==========================================
echo    Installation SUCCESS!
echo ==========================================
echo.

del "%~dp0node.zip" >nul 2>&1

echo Starting Knowledge Manager...
echo.

cd /d "%~dp0knowledge-manager"
call npm install
call npm run dev

pause
