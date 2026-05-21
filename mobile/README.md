# ВайЧат — Android (Expo)

## Требования
- Node.js 20+
- [Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent) на Android
- ПК и телефон в одной Wi‑Fi
- Запущен `backend` (`npm run dev` в папке backend)

## Запуск

```powershell
cd mobile
npm install
npx expo start
```

Отсканируйте QR в Expo Go.

## Настройка API
На экране входа укажите IP ПК: `192.168.x.x:4000` (см. вывод `start.ps1`).

## Сборка APK (позже)

```bash
npx expo prebuild
cd android && ./gradlew assembleRelease
```
