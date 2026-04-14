@echo off
echo ==========================================
echo    知识收藏管理器 - 启动脚本
echo ==========================================
echo.

cd /d "%~dp0"

echo [1/3] 检查Node.js版本...
node --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未检测到Node.js！
    echo 请先安装Node.js: https://nodejs.org/
    echo 建议安装LTS版本(v18或v20)
    pause
    exit /b 1
)

echo [OK] Node.js已安装
echo.

echo [2/3] 检查npm...
npm --version >nul 2>&1
if errorlevel 1 (
    echo [错误] npm未找到
    pause
    exit /b 1
)

echo [OK] npm已安装
echo.

echo [3/3] 安装依赖（如已有依赖可跳过）...
echo 如需跳过安装，可以注释掉下一行
npm install

echo.
echo ==========================================
echo    启动开发服务器...
echo ==========================================
echo.
echo 启动后请访问: http://localhost:3000
echo 按 Ctrl+C 停止服务器
echo.

npm run dev

pause
