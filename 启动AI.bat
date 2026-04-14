@echo off
chcp 65001 >nul
echo ========================================
echo   知识收藏管理系统 AI版 启动器
echo ========================================
echo.

:: 检查Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未找到Node.js
    echo 请先安装Node.js: https://nodejs.org/
    pause
    exit /b 1
)

echo [1/3] 正在安装依赖...
npm install express cors

echo.
echo [2/3] 安装完成！
echo.

echo [3/3] 启动服务器...
echo.
node server.js

pause
