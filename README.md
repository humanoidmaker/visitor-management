# GatePass - Visitor Management System

Visitor management with photo capture, digital pass generation, host notification, visitor logs, and blacklist management.

## Tech Stack
- Backend: Python FastAPI + Motor (async MongoDB)
- Frontend: React 18 + Vite + TypeScript + Tailwind CSS
- Database: MongoDB

## Setup
```bash
docker-compose up
# Or:
cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload
cd frontend && npm install && npm run dev
```

## Seed Data
```bash
cd backend && python -m scripts.seed_admin && python -m scripts.seed_sample_data
```

## Login
- Admin: admin@visitor.local / admin123
