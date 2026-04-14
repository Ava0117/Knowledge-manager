# AI学习助手启动脚本
$ErrorActionPreference = "SilentlyContinue"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   AI学习助手 - 服务器启动中" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$ProjectPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ProjectPath

Write-Host "[1/2] 检查依赖..." -ForegroundColor Yellow
npm install express cors --silent

Write-Host "[2/2] 启动服务器..." -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  服务器已启动！" -ForegroundColor Green
Write-Host "  访问地址: http://localhost:3000/learning.html" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

node server.js

Read-Host "按回车键退出"
