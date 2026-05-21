@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion
cd /d "%~dp0"

title VayChat Launcher

where node >nul 2>&1
if errorlevel 1 (
  echo.
  echo [ОШИБКА] Node.js не установлен!
  echo Скачайте и установите: https://nodejs.org
  echo Потом запустите install.bat
  pause
  exit /b 1
)

if not exist "%~dp0backend\node_modules\" (
  echo Сначала запустите install.bat
  pause
  exit /b 1
)

if not exist "%~dp0frontend\node_modules\" (
  echo Сначала запустите install.bat
  pause
  exit /b 1
)

if not exist "%~dp0backend\prisma\dev.db" (
  echo Создание базы данных...
  cd /d "%~dp0backend"
  call npx prisma db push
  cd /d "%~dp0"
)

echo.
echo === Остановка старых процессов ===
call "%~dp0stop.bat"

set "LAN_IP=127.0.0.1"
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i /c:"IPv4"') do (
  set "ip=%%a"
  set "ip=!ip: =!"
  echo !ip! | findstr /r "^192\.168\. ^10\." >nul 2>&1
  if !errorlevel! equ 0 set "LAN_IP=!ip!"
)

(
echo NEXT_PUBLIC_API_URL=http://!LAN_IP!:4000
echo NEXT_PUBLIC_WS_URL=http://!LAN_IP!:4000
) > "%~dp0frontend\.env.local"

echo.
echo === Запуск API (порт 4000) ===
start "VayChat-API" cmd /k "cd /d ""%~dp0backend"" && title VayChat API && npm run dev"

timeout /t 4 /nobreak >nul

echo === Запуск сайта (порт 3000) ===
start "VayChat-Web" cmd /k "cd /d ""%~dp0frontend"" && title VayChat Web && npm run dev"

timeout /t 8 /nobreak >nul

echo.
echo ========================================
echo   ПК:      http://localhost:3000/auth
echo   ТЕЛЕФОН: http://!LAN_IP!:3000/auth
echo   API:     http://!LAN_IP!:4000/health
echo ========================================
echo.
echo Должны быть открыты 2 окна: VayChat API и VayChat Web
echo Не закрывайте их! Ошибки смотрите в этих окнах.
echo.
echo Остановка: stop.bat
echo.
pause
