@echo off
chcp 65001 >nul
echo Stopping VayChat ports 3000, 3001, 4000...
call :killport 3000
call :killport 3001
call :killport 4000
echo Done.
exit /b 0

:killport
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%~1 " ^| findstr LISTENING') do (
  taskkill /F /PID %%a >nul 2>&1
)
exit /b 0
