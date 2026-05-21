@echo off
chcp 65001 >nul
cd /d "%~dp0frontend"
title VayChat Web
echo Запуск сайта на http://localhost:3000
npm run dev
pause
