# Architecture

- **backend/** — FastAPI, SQLAlchemy async, JWT auth, Stripe, Mux, Expo/Web push, OpenAI
- **web/** — Next.js App Router, admin dashboard, page builder, public site
- **mobile/** — Expo Router, tabs, offline cache, push
- **infra/** — Docker Compose (Postgres, Redis, MinIO, backend, web)

Auth is JWT access + refresh. Roles: member, leader, admin, pastor.
