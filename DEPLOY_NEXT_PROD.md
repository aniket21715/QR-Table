# Deploy Next Frontend + FastAPI Backend (Backend-First)

This runbook assumes you currently deploy from this repo with Docker Compose.

## 1) Prepare production env

1. Copy `.env.production.example` to `.env.production`.
2. Set real values:
   - `DATABASE_URL`
   - `APP_SECRET`
   - `CORS_ORIGINS=https://<frontend-domain>`
   - `FRONTEND_URL=https://<frontend-domain>`
   - `NEXT_PUBLIC_API_BASE=https://<api-domain>/api`

## 2) Backup DB

Run a PostgreSQL backup before schema changes.

## 3) Deploy backend first

Use base compose + Next override (keeps old frontend service intact):

```bash
docker compose --env-file .env.production -f docker-compose.yml -f docker-compose.next.yml up -d --build backend db redis
```

Run migrations:

```bash
docker compose --env-file .env.production -f docker-compose.yml -f docker-compose.next.yml exec backend alembic upgrade head
```

Verify backend:

```bash
curl -i https://<api-domain>/api/auth/me
```

Expected: endpoint exists (401 without token is fine).

## 4) Deploy Next frontend

```bash
docker compose --env-file .env.production -f docker-compose.yml -f docker-compose.next.yml up -d --build frontend_next
```

This runs Next app on port `3000`.

## 5) Keep rollback path live

- Keep existing Vite frontend service (`frontend`, port `5173`) running.
- Do not remove old service until smoke tests pass after cutover.

## 6) Cutover traffic

At your reverse proxy/load balancer:

1. Route frontend domain to Next service (`:3000`).
2. Keep API routing unchanged to backend (`:8000`).
3. Confirm health:
   - `/`
   - `/menu`
   - `/admin` login/signup
   - QR open flow to `/menu?...`

## 7) Rollback

If issues appear:

1. Point frontend domain back to old Vite service (`:5173`).
2. Keep backend running (API shape is backward-compatible for existing clients).

## Notes

- `NEXT_PUBLIC_API_BASE` should be stable per environment and not per owner.
- Restaurant branding is now taken from owner profile/auth flow, not required as a fixed env var.
