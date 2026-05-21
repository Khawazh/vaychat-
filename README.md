# ВайЧат (VaiChat)

Современный масштабируемый мессенджер с архитектурой, готовой к микросервисам.

## Стек

| Слой | Технологии |
|------|------------|
| Frontend | Next.js 15, React 19, TailwindCSS, Framer Motion |
| Backend | Node.js, Express, Socket.io, Prisma, PostgreSQL, Redis |
| Auth | JWT access/refresh, OTP по телефону |
| Deploy | Docker, Nginx, VPS Linux |

## Структура

```
VayChat/
├── backend/          # REST API + WebSocket
├── frontend/         # Next.js web app
├── nginx/            # Reverse proxy
├── docker-compose.yml
└── .env.example
```

## Быстрый старт (Windows, без Docker)

### Запуск (3 шага)

1. **`install.bat`** — один раз (установка зависимостей)
2. **`start.bat`** — каждый раз (запуск)
3. Открыть http://localhost:3000/auth

Если не стартует:
- **`stop.bat`** — остановить всё
- **`run-api.bat`** и **`run-web.bat`** — запуск по отдельности (окна не закроются с ошибкой)

PowerShell `start.ps1` — только если разрешены скрипты; иначе только `.bat`.

**Или вручную (2 терминала):**
```powershell
# Терминал 1
cd backend
npm install
npx prisma db push
npm run dev

# Терминал 2
cd frontend
npm install
npm run dev
```

Открой: **http://localhost:3000/auth**

### Телефон (Android / iPhone) — браузер
1. Запустите `.\start.ps1` — в консоли будет **ТЕЛЕФОН: http://192.168.x.x:3000/auth**
2. Телефон и ПК в **одной Wi‑Fi**
3. Откройте этот адрес в Chrome
4. Меню → **«Установить приложение»** / «Добавить на главный экран» (PWA)

### Android — приложение (Expo)
```powershell
cd mobile
npm install
npx expo start
```
Сканируйте QR в **Expo Go**. На экране входа: IP ПК `192.168.x.x:4000`.

### Вход
1. Номер: `79991234567`
2. «Получить код» — код появится на экране (зелёная плашка)
3. «Войти»

### Если «не работает»
- Проект в **OneDrive** — не удаляйте папку `node_modules/.cache/vaychat-next`
- Сайт только на **http://localhost:3000** (не 3001)
- API должен отвечать: http://localhost:4000/health
- Закройте лишние `node` и запустите `.\start.ps1` снова

## Docker (опционально)

```bash
cp .env.example .env
docker compose up -d postgres redis
```

- API: http://localhost:4000
- Web: http://localhost:3000
- Health: http://localhost:4000/health

## Дизайн

Палитра флага Ингушетии: белый `#FFFFFF`, зелёный `#0F8F3D`, красный `#D11F1F`, тёмный `#0F1115`.

## MVP → Scale

1. **MVP** (текущий): auth OTP, чаты, сообщения, realtime, UI
2. **Phase 2**: медиа S3, push, E2E keys
3. **Phase 3**: микросервисы (auth, chat, media, notification)
