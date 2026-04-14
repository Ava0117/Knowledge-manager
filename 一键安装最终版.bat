@echo off
chcp 936 >nul
echo ==========================================
echo    Node.js 一键安装脚本
echo ==========================================
echo.

node --version >nul 2>&1
if not errorlevel 1 (
    echo [OK] Node.js 已安装!
    node --version
    echo.
    cd /d "%~dp0knowledge-manager"
    call npm install
    call npm run dev
    pause
    exit
)

echo [步骤1/4] 下载Node.js (约50MB，需要等待1-3分钟)
echo.

certutil -urlcache -split -f "https://npmmirror.com/mirrors/node/v20.10.0/node-v20.10.0-win-x64.zip" "%~dp0node.zip"

if exist "%~dp0node.zip" (
    echo [OK] 下载完成
) else (
    echo.
    echo [错误] 下载失败!
    echo.
    echo 请手动下载:
    echo 1. 打开浏览器
    echo 2. 访问: https://nodejs.org/dist/v20.10.0/
    echo 3. 下载: node-v20.10.0-win-x64.zip
    echo 4. 把下载的文件放到当前文件夹,命名为: node.zip
    echo.
    pause
    exit
)

echo.
echo [步骤2/4] 解压文件...
powershell -NoProfile -Command "Expand-Archive -Path '%~dp0node.zip' -DestinationPath 'C:\nodejs' -Force"

if exist "C:\nodejs\node.exe" (
    echo [OK] 解压完成
) else (
    echo [错误] 解压失败
    pause
    exit
)

echo.
echo [步骤3/4] 配置环境变量...
setx PATH "C:\nodejs;%%PATH%%" /M >nul

echo.
echo [步骤4/4] 验证安装...
set PATH=C:\nodejs;%PATH%
node --version
npm --version

echo.
echo ==========================================
echo    安装成功！
echo ==========================================
echo.
echo 正在清理并启动...
echo.

del "%~dp0node.zip" >nul 2>&1

cd /d "%~dp0knowledge-manager"
call npm install
call npm run dev

pause
