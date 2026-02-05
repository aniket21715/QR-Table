# Restaurant QR Order

A simple full-stack starter for a QR-based restaurant ordering system.

## Stack

- Frontend: React (Vite), Tailwind CSS, React Router
- Backend: FastAPI, SQLAlchemy
- Database: PostgreSQL
- Cache/Realtime: Redis + FastAPI WebSockets
- AI/ML: scikit-learn (simple recommendations)
- Deployment: Docker + docker-compose

## Quick Start

1. Start services with Docker:

```bash
docker compose up --build
```

2. Frontend: `http://localhost:5173`
3. Backend: `http://localhost:8000`
4. API docs: `http://localhost:8000/docs`

## Useful Paths

- Backend: `backend/`
- Frontend: `frontend/`
- Compose: `docker-compose.yml`

## Notes

- The backend uses `DATABASE_URL` to connect to Postgres.
- WebSocket endpoint is available at `/ws/orders`.
- Frontend currently uses mock data; wire it up to the API as needed.
