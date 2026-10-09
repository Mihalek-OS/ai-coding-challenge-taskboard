# Taskboard

Small Kanban-style project board: React + TypeScript + Vite frontend, Python FastAPI backend, SQLite storage. Runs fully locally.

## Prerequisites

- Python 3.10+ (developed on 3.12)
- Node.js 18+ and npm (developed on Node 24)

## 1. Backend (http://localhost:8000)

From the repository root:

```bash
cd backend
python -m venv .venv
# activate the virtual environment:
#   Windows PowerShell:  .venv\Scripts\Activate.ps1
#   Windows cmd:         .venv\Scripts\activate.bat
#   Git Bash:            source .venv/Scripts/activate
#   macOS / Linux:       source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --port 8000
```

- The SQLite database (`backend/tasks.db`) and the `tasks` table are created automatically on first start. No manual database setup is needed, and data survives restarts.
- API docs: http://localhost:8000/docs
- Endpoints: `GET /tasks`, `POST /tasks` (201), `PATCH /tasks/{id}`, `DELETE /tasks/{id}`. Unknown ids return 404; empty titles and invalid priority/status values return 422.

## 2. Frontend (http://localhost:5173)

In a second terminal, from the repository root:

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. The dev server proxies `/api/*` to the backend on port 8000 (see `frontend/vite.config.ts`), so start the backend first.

## Configuration

| Setting | Default | Notes |
|---|---|---|
| `TASKBOARD_DB` (env var, backend) | `backend/tasks.db` | Path of the SQLite file. Useful for an isolated/test database. |
| Backend port | `8000` | The Vite proxy in `frontend/vite.config.ts` and the CORS origins in `backend/main.py` assume `8000` and `5173`. |

No API keys or other environment settings are required.

## Tests and checks

```bash
# backend (venv active, inside backend/)
pip install -r requirements-dev.txt
pytest                       # uses a temporary database, never tasks.db

# frontend (inside frontend/)
npx tsc -b                   # type check
npm run lint
npm run build                # type check + production build
```

## Layout

```
backend/    main.py (FastAPI app + SQLite), test_main.py, requirements*.txt
frontend/   Vite React app: src/App.tsx, TaskForm.tsx, api.ts, types.ts, index.css
```

## Design system

The original Claude Design system was not available while building this app, so the UI does **not** use the official one. It uses a Claude-inspired substitute: warm off-white background, a terracotta accent, a serif font (Georgia) for headings and KPI numbers, and the system sans-serif font for body text.

All colours, fonts, spacing, radius and shadow are CSS variables in `:root` of `frontend/src/index.css`, and every component (cards, buttons, inputs, badges, columns, modal) reads from them. Switching to the official design system means replacing those variables. The favicon (`frontend/public/favicon.svg`) uses the same terracotta accent.
