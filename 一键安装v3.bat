@echo off
chcp 936 >nul
echo ==========================================
echo    Node.js 一键安装脚本 v3
echo ==========================================
echo.

node --version >nul 2>&1
if not errorlevel 1 (
    echo [OK] Node.js 已安装
    node --version
    echo.
    cd /d "%~dp0knowledge-manager"
    call npm install
    call npm run dev
    pause
    exit
)

echo [1/4] 正在下载Node.js...
echo.

curl -L -o "%~dp0node.zip" "https://npmmirror.com/mirrors/node/v20.10.0/node-v20.10.0-win-x64.zip"

if exist "%~dp0node.zip" (
    echo [OK] 下载完成
) else (
    echo [错误] 下载失败
    pause
    exit
)

echo.
echo [2/4] 正在解压...
powershell -NoProfile -Command "Expand-Archive -Path '%~dp0node.zip' -DestinationPath 'C:\nodejs' -Force"

if exist "C:\nodejs\node.exe" (
    echo [OK] 解压完成
)

echo.
echo [3/4] 配置环境变量...
setx PATH "C:\nodejs;%%PATH%%" /M >nul

echo.
echo [4/4] 验证...
set PATH=C:\nodejs;%PATH%
node --version
npm --version

echo.
echo ==========================================
echo    安装成功！
echo ==========================================
echo.

del "%~dp0node.zip" >nul 2>&1

echo 正在启动知识管理器...
cd /d "%~dp0knowledge-manager"
call npm install
call npm run dev

pause
