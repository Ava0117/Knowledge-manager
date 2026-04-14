@echo off
title AI学习助手 - 服务器
color 0A
echo.
echo  ╔═══════════════════════════════════════════════════════╗
echo  ║          AI学习助手 - Node.js 学习平台                   ║
echo  ╚═══════════════════════════════════════════════════════╝
echo.

cd /d "%~dp0"

echo [1/3] 检查Node.js环境...
node --version
if %errorlevel% neq 0 (
    echo [错误] 未找到Node.js，请先安装！
    pause
    exit /b 1
)

echo.
echo [2/3] 检查依赖...
if not exist "node_modules" (
    echo 正在安装依赖...
    npm install express cors --save
)

echo.
echo [3/3] 启动服务器...
echo.
echo  服务器启动后，请访问:
echo  ================================
echo    学习平台: http://localhost:3000/learning.html
echo    知识管理: http://localhost:3000/
echo  ================================
echo.

node server.js

pause
