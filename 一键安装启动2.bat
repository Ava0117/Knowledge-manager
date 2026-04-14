@echo off
chcp 936 >nul
echo ==========================================
echo    Node.js 一键安装脚本
echo ==========================================
echo.

node --version >nul 2>&1
if not errorlevel 1 (
    echo [OK] Node.js 已安装: 
    node --version
    echo.
    echo 现在启动知识管理器...
    timeout /t 2 >nul
    cd /d "%~dp0"
    call npm install
    call npm run dev
    pause
    exit
)

echo [1/4] 正在下载Node.js...
echo 下载需要几分钟，请耐心等待...
echo.

bitsadmin /transfer myDownloadJob /download /priority normal "https://npmmirror.com/mirrors/node/v20.10.0/node-v20.10.0-win-x64.zip" "%~dp0node.zip"

if exist "%~dp0node.zip" (
    echo [OK] 下载完成
) else (
    echo [错误] 下载失败，请检查网络
    echo 或者手动下载: 
    echo https://npmmirror.com/mirrors/node/v20.10.0/node-v20.10.0-win-x64.zip
    echo 把文件保存到当前文件夹，命名为 node.zip
    pause
    exit
)

echo.
echo [2/4] 正在解压...
powershell -NoProfile -Command "Expand-Archive -Path '%~dp0node.zip' -DestinationPath 'C:\nodejs' -Force"

if exist "C:\nodejs\node.exe" (
    echo [OK] 解压完成
) else (
    echo [错误] 解压失败
    pause
    exit
)

echo.
echo [3/4] 配置环境变量...
setx PATH "C:\nodejs;%%PATH%%" /M >nul

echo.
echo [4/4] 验证安装...
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
echo.
cd /d "%~dp0knowledge-manager"
call npm install
call npm run dev

pause
