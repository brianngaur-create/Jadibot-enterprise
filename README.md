# JadiBot Enterprise

Multi-tenant WhatsApp bot SaaS platform — a monorepo containing a Next.js dashboard and a production-grade Node.js/Express backend with a Baileys-powered multi-session WhatsApp engine.

```
jadibot/
├── apps/
│   ├── web/      # Next.js 15 / React 19 dashboard (the existing frontend)
│   └── server/   # Express + TypeScript backend (REST + Socket.IO + Baileys)
├── docker-compose.yml   # Postgres + Redis for local development
└── package.json         # npm workspaces root
```

## Architecture

**Backend (`apps/server`)** — layered (controller → service → repository → Prisma):

- **Auth**: JWT access/refresh token rotation, RBAC (USER / ADMIN / SUPER_ADMIN) + granular permissions, bcrypt, HttpOnly refresh cookie, audit log.
- **WhatsApp engine**: Baileys `SessionManager` running an independent connection per bot — QR & pairing-code linking, auto-reconnect with exponential backoff, on-disk credential persistence, recovery on boot.
- **Command / plugin / event loaders**: dynamic command registry (representative set ported from the legacy bot) with a message-context dispatcher.
- **Realtime**: Socket.IO namespaces (`/bots`, `/sessions`) with JWT handshake auth; engine events (qr, pairing_code, status, ready, message, log) forwarded to the owning user's room.
- **Infra**: PostgreSQL (Prisma ORM, 20 tables), Redis + BullMQ (repeatable maintenance jobs), Pino structured logging, Helmet/CORS/compression/rate-limit, Zod request validation, global error & response envelope, Swagger docs.

**Frontend (`apps/web`)** — the Next.js dashboard, now wired to the real backend through a typed service layer (`src/lib/api/services.ts`) and a `useResource` data hook; auth runs against the real `/auth` endpoints. No mock data remains.

## Prerequisites

- **Node.js >= 22** (LTS) and npm >= 10
- **Docker** (for local Postgres + Redis) — or your own Postgres 16 / Redis 7

## Quick start

```bash
# 1. Install all workspace dependencies (from repo root)
npm install

# 2. Start Postgres + Redis
docker compose up -d

# 3. Configure environment
cp apps/server/.env.example apps/server/.env
cp apps/web/.env.example   apps/web/.env.local
#   For a real deployment, replace the JWT/secret placeholders with strong values:
#   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# 4. Apply database migrations and seed demo data
npm run prisma:deploy --workspace apps/server
npm run prisma:seed   --workspace apps/server

# 5. Run both apps (in two terminals)
npm run dev:server   # http://localhost:4000  (API at /api, docs at /api/docs)
npm run dev:web      # http://localhost:3000
```

### Seeded accounts

| Role  | Email                  | Password      |
|-------|------------------------|---------------|
| Admin | `admin@jadibot.local`  | `Admin#12345` |
| Demo  | `demo@jadibot.local`   | `Demo#12345`  |

## Useful commands

Run from the repo root:

| Command | Description |
|---------|-------------|
| `npm run dev:web` / `npm run dev:server` | Start each app in watch mode |
| `npm run build:web` / `npm run build:server` | Production build per app |
| `npm run lint` | Lint both apps |
| `npm run typecheck` | Type-check both apps |
| `npm run prisma:migrate --workspace apps/server` | Create/apply a dev migration |
| `npm run prisma:deploy --workspace apps/server` | Apply migrations (CI/prod) |
| `npm run prisma:seed --workspace apps/server` | Seed demo data |
| `docker compose up -d` / `docker compose down` | Start/stop Postgres + Redis |

## API contract

- REST base URL: `http://localhost:4000/api`
- Interactive docs (Swagger UI): `http://localhost:4000/api/docs`
- OpenAPI JSON: `http://localhost:4000/api/openapi.json`
- Socket.IO: `http://localhost:4000` (namespaces `/bots`, `/sessions`; pass the access token via the `auth.token` handshake field)

Every response uses the envelope `{ success, message, data, meta }`.

## Environment variables

See `apps/server/.env.example` and `apps/web/.env.example` for the full, documented list. Key values:

- `DATABASE_URL` — `postgresql://jadibot:jadibot@localhost:5432/jadibot?schema=public`
- `REDIS_URL` — `redis://localhost:6379`
- `API_PREFIX` — `/api` (must match the frontend's `NEXT_PUBLIC_API_URL`)
- `NEXT_PUBLIC_API_URL` — `http://localhost:4000/api`
- `NEXT_PUBLIC_SOCKET_URL` — `http://localhost:4000`

> **Note**: This is a Phase 1 foundation — the full enterprise spec (every AI provider, every downloader, the complete legacy command set, exhaustive tests) is intentionally out of scope. The architecture, auth, multi-session engine, realtime layer, and end-to-end frontend wiring are production-grade and ready to extend.
