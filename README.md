# Church Platform

All-in-one church platform: website, ChMS, giving, livestream, mobile app, analytics, push notifications, and AI pastoral tools.

## Quick start

```bash
cp .env.example .env
# Set SECRET_KEY
docker compose -f infra/docker-compose.yml up --build
```

- API: http://localhost:8000/docs
- Web: http://localhost:3000
- Admin: http://localhost:3000/admin/login

```bash
docker compose -f infra/docker-compose.yml exec backend python -m scripts.create_superuser
```

## Stack

- Backend: FastAPI + PostgreSQL + Redis
- Web: Next.js + Tailwind
- Mobile: Expo (React Native)
- Giving: Stripe
- Livestream: Mux (optional) + YouTube fallback
- Push: Expo + Web Push (VAPID)

See `docs/DEPLOY.md` for production deployment.
