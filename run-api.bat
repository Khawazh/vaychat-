@echo off
chcp 65001 >nul
cd /d "%~dp0backend"
title VayChat API
echo Запуск API на http://localhost:4000
npm run dev
pause
