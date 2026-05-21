@echo off
chcp 65001 >nul
cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 (
  echo.
  echo [ОШИБКА] Node.js не найден!
  echo Установите: https://nodejs.org  ^(версия 20 LTS^)
  pause
  exit /b 1
)

echo Node: & node -v
echo npm:  & npm -v
echo.

echo === Backend: npm install ===
cd /d "%~dp0backend"
call npm install
if errorlevel 1 goto fail

echo === Prisma: база данных ===
call npx prisma db push
if errorlevel 1 goto fail

echo === Frontend: npm install ===
cd /d "%~dp0frontend"
call npm install
if errorlevel 1 goto fail

echo.
echo === Установка завершена! Запустите start.bat ===
pause
exit /b 0

:fail
echo.
echo [ОШИБКА] Установка прервана.
pause
exit /b 1
