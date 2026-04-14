@echo off
chcp 65001 >nul
echo ==========================================
echo    Node.js 一键安装脚本
echo ==========================================
echo.

:: 检查是否已安装
node --version >nul 2>&1
if not errorlevel 1 (
    echo [✓] Node.js 已安装: 
    node --version
    echo.
    echo 现在启动知识管理器...
    timeout /t 2 /nobreak >nul
    cd /d "%~dp0"
    npm run dev
    pause
    exit
)

echo [1/4] 正在下载Node.js...
echo 这可能需要几分钟，请耐心等待...
echo.

:: 使用PowerShell下载
powershell -Command "& {$client = New-Object System.Net.WebClient; $client.DownloadFile('https://npmmirror.com/mirrors/node/v20.10.0/node-v20.10.0-win-x64.zip', 'node.zip')}"

if exist node.zip (
    echo [✓] 下载完成！
) else (
    echo [错误] 下载失败，请检查网络连接
    pause
    exit
)

echo.
echo [2/4] 正在解压...
powershell -Command "Expand-Archive -Path 'node.zip' -DestinationPath 'C:\nodejs' -Force"

if exist "C:\nodejs\node.exe" (
    echo [✓] 解压完成！
) else (
    echo [错误] 解压失败
    pause
    exit
)

echo.
echo [3/4] 正在配置环境变量...
setx PATH "C:\nodejs;%PATH%" /M >nul

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

:: 清理临时文件
del node.zip 2>nul

echo 正在启动知识管理器（约需等待1分钟）...
echo.
cd /d "%~dp0"
npm install
npm run dev

pause
