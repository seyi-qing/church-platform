# Deploy guide

## Order

1. Neon (Postgres) — get `DATABASE_URL`
2. Render (API) — root directory `backend`
3. Vercel (web) — root directory `web`

## Render env

```
SECRET_KEY=long-random
ENVIRONMENT=production
DATABASE_URL=postgresql+asyncpg://...
BACKEND_CORS_ORIGINS=["https://your-app.vercel.app"]
```

Start command:

```
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

## Vercel env

```
NEXT_PUBLIC_API_URL=https://your-api.onrender.com/api/v1
```

See README for local Docker setup.
