# Запуск ВайЧат — ПК + телефон в одной Wi‑Fi сети
#
# Если ошибка "выполнение сценариев отключено" — используйте:
#   start.bat
# или один раз в PowerShell (от администратора):
#   Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
#
$root = $PSScriptRoot

# Локальный IP для телефона
$ip = (
  Get-NetIPAddress -AddressFamily IPv4 |
  Where-Object { $_.IPAddress -match '^192\.168\.|^10\.' -and $_.PrefixOrigin -ne 'WellKnown' } |
  Select-Object -First 1 -ExpandProperty IPAddress
)
if (-not $ip) { $ip = '127.0.0.1' }

Write-Host "`n=== ВайЧат: остановка портов 3000, 3001, 4000 ===" -ForegroundColor Yellow
foreach ($port in 3000, 3001, 4000) {
  Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty OwningProcess -Unique |
    ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }
}
Start-Sleep -Seconds 1

# .env.local для frontend (опционально; API и так берёт hostname с телефона)
$envLocal = @"
NEXT_PUBLIC_API_URL=http://${ip}:4000
NEXT_PUBLIC_WS_URL=http://${ip}:4000
"@
Set-Content -Path "$root\frontend\.env.local" -Value $envLocal -Encoding UTF8

Write-Host "`n=== Backend :4000 (доступен в сети) ===" -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\backend'; npm run dev"
Start-Sleep -Seconds 3

Write-Host "=== Frontend :3000 (0.0.0.0) ===" -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\frontend'; npm run dev"
Start-Sleep -Seconds 6

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  ПК:      http://localhost:3000/auth"
Write-Host "  ТЕЛЕФОН: http://${ip}:3000/auth" -ForegroundColor Yellow
Write-Host "  API:     http://${ip}:4000/health"
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`nТелефон и ПК должны быть в одной Wi-Fi."
Write-Host "Android: Chrome -> адрес выше -> 'Установить приложение' (PWA)`n"
