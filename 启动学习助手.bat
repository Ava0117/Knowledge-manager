@echo off
title AI学习助手 - 知识管理器
color 0A
echo ==========================================
echo    AI学习助手 - Node.js 后端服务
echo ==========================================
echo.

cd /d "%~dp0"

echo [1/3] 检查Node.js环境...
node --version
if %errorlevel% neq 0 (
    echo [错误] 未找到Node.js，请先安装Node.js
    pause
    exit /b 1
)

echo.
echo [2/3] 安装依赖（如果需要）...
if not exist "node_modules" (
    echo 正在安装依赖，请稍候...
    call npm install
)

echo.
echo [3/3] 启动开发服务器...
echo ==========================================
echo.
echo 服务启动后，请访问:
echo   http://localhost:3000
echo.
echo 学习助手: learning.html
echo 知识管理: index.html
echo.
echo 按 Ctrl+C 停止服务
echo ==========================================
echo.

npm run dev

pause
