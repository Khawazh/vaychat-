# Архитектура ВайЧат

## Обзор

Monorepo с разделением **API** (backend) и **Web** (frontend). Архитектура следует принципам Clean Architecture и готова к выделению микросервисов.

```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│   Next.js   │────▶│   Nginx     │────▶│  Express API │
│  (Frontend) │     │  (Proxy)    │     │  + Socket.io │
└─────────────┘     └─────────────┘     └──────┬───────┘
                                               │
                    ┌──────────────────────────┼──────────────────────────┐
                    ▼                          ▼                          ▼
              PostgreSQL                   Redis                    (S3 Phase 2)
              (Prisma ORM)            (cache, pub/sub, typing)
```

## Backend — слои

```
backend/src/
├── config/          # env, валидация
├── lib/             # prisma, redis
├── middleware/      # auth, errors, rate limit
├── modules/         # доменные модули (Clean Architecture)
│   ├── auth/        # OTP, JWT, сессии
│   ├── users/       # профиль, поиск
│   ├── chats/       # private, group, channel
│   ├── messages/    # CRUD, reactions, pin
│   └── admin/       # бан, логи, аналитика
├── socket/          # realtime WebSocket
├── utils/           # jwt, otp
├── app.ts           # Express setup
└── index.ts         # HTTP + Socket.io bootstrap
```

### Микросервисная готовность

| Текущий модуль | Будущий сервис |
|----------------|----------------|
| auth | auth-service |
| users | user-service |
| chats + messages | chat-service |
| socket | realtime-gateway |
| admin | admin-service |
| media (Phase 2) | media-service |

## WebSocket события

| Событие | Направление | Описание |
|---------|-------------|----------|
| `chat:join` | C→S | Подписка на комнату чата |
| `message:send` | C→S | Отправка сообщения |
| `message:new` | S→C | Новое сообщение в чате |
| `typing:start/stop` | C→S | Индикатор набора |
| `typing:update` | S→C | Кто печатает |
| `message:read` | C→S | Прочитано |
| `user:online/offline` | S→C | Статус пользователя |

Redis Adapter обеспечивает горизонтальное масштабирование Socket.io на нескольких инстансах API.

## База данных

- **users** — профиль, статус, E2E public key
- **otp_codes** — одноразовые коды
- **device_sessions** — refresh tokens, устройства
- **chats** — PRIVATE | GROUP | CHANNEL
- **messages** — текст, медиа, reply, forward, edit history
- **message_reads** — статус прочтения
- **message_reactions** — эмодзи-реакции
- **pinned_messages** — закреплённые
- **admin_logs** — аудит админки

## Безопасность (MVP)

- JWT access (15m) + refresh (7d)
- Rate limiting на `/api/*`
- Helmet, CORS
- OTP rate limit в Redis
- `encryptedContent` поле для E2E (Phase 2: libsignal)
- bcrypt для refresh token hash

## Frontend

```
frontend/src/
├── app/             # Next.js App Router
│   ├── page.tsx     # Landing + Splash
│   ├── auth/        # OTP login
│   └── app/         # Messenger shell
├── components/      # UI, chat, layout
├── lib/             # api, socket, utils
└── store/           # Zustand auth state
```

## Дизайн-система

| Token | Value | Использование |
|-------|-------|---------------|
| white | #FFFFFF | Светлый фон |
| green | #0F8F3D | Primary, кнопки, акценты |
| red | #D11F1F | CTA, badge, солнце лого |
| dark | #0F1115 | Тёмная тема |

## Roadmap

1. **MVP** ✅ — структура, API, WS, UI, Docker
2. **Phase 2** — S3 медиа, WebRTC звонки, push (FCM)
3. **Phase 3** — E2E (Signal Protocol), микросервисы, K8s
4. **Phase 4** — React Native mobile
