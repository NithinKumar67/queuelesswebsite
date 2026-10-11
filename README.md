# QueueLess

Three folders, three processes. The backend is the only one that touches the database.

| Folder | What it is | Runtime | Default port |
|---|---|---|---|
| `backend/`  | REST API + Socket.IO (Express 5, MongoDB/Mongoose, Passport sessions) | Node.js 20+ | 5000 |
| `mlapi/`    | Wait-time prediction service (FastAPI + scikit-learn) | Python 3.11+ | 8000 |
| `frontend/` | Web app (React + Vite) | Node.js 20+ | 5173 |

```
frontend  --HTTP /api + Socket.IO (cookies)-->  backend  --HTTP POST /predict-->  mlapi
                                                    |
                                                 MongoDB
```

`mlapi` is optional at runtime: if it is down the backend falls back to the
mathematical estimate `peopleAhead x avgServiceTime / activeCounters`.

## Prerequisites
Node.js 20+, Python 3.11+, a MongoDB database (Atlas or local).

## Setup
1. **mlapi**
   ```
   cd mlapi
   pip install -r requirements.txt
   python generate_data.py      # synthetic data -> data/queue_data.csv
   python train.py              # trains + saves model/wait_time_model.pkl
   ```
2. **backend**
   ```
   cd backend
   npm ci
   cp .env.example .env         # then fill in the REQUIRED values
   npm run seed -- --confirm    # OPTIONAL, local/throwaway DB only: ERASES data, adds demo data
   ```
3. **frontend**
   ```
   cd frontend
   npm ci
   cp .env.example .env         # VITE_API_URL=http://localhost:5000/api
   ```

## Environment variables
| Server | Variable | Required | Default / notes |
|---|---|---|---|
| backend | `MONGO_URI` | **yes** | MongoDB connection string |
| backend | `SESSION_SECRET` | **yes** | 16+ random characters |
| backend | `CLIENT_URL` | **yes** | Frontend origin(s) for CORS + Socket.IO, comma-separated |
| backend | `PORT` | no | 5000 |
| backend | `ML_API_URL` | no | `http://127.0.0.1:8000` |
| backend | `NODE_ENV` | no | set `production` when deployed |
| backend | `COOKIE_SECURE`, `COOKIE_SAMESITE` | no | `false` / `lax`; use `true` / `none` for a frontend on a different HTTPS site |
| backend | `TRUST_PROXY` | no | number of proxy hops when behind a proxy |
| mlapi | *(none)* | - | host/port are `uvicorn` flags |
| frontend | `VITE_API_URL` | **yes** | backend URL **including** `/api`; Socket.IO URL is derived from it |

The backend refuses to start, with a clear message, if a required variable is missing.
Never commit `.env` files (they are git-ignored).

## Production deployment checklist
- Copy `backend/.env.production.example` to your deployment environment as the backend `.env` and replace the placeholders.
- Copy `frontend/.env.production.example` to your deployment environment as the frontend `.env` and point `VITE_API_URL` at your deployed API origin.
- Use production hostnames rather than `localhost` and configure HTTPS for the frontend, API, and ML service.
- Set `COOKIE_SECURE=true` and `COOKIE_SAMESITE=none` when the frontend and backend are on different HTTPS domains.
- Set `TRUST_PROXY=1` (or the correct reverse-proxy hop count) when the app sits behind nginx, Cloudflare, Render, Railway, or similar.
- Deploy a MongoDB instance and set `MONGO_URI` to the production database connection string.
- Keep the ML service running; if it is unavailable, the backend falls back to a formula, but model accuracy will be worse.
- Build the frontend for production with `npm run build` and serve the generated static assets behind your web server or platform.

## Start order
1. `mlapi`:    `uvicorn main:app --port 8000`   (production: add `--host 0.0.0.0`, no `--reload`)
2. `backend`:  `npm start`  (development: `npm run dev`)
3. `frontend`: `npm run dev`

## Health checks
- backend: `GET http://localhost:5000/api/health` -> `{ success, message, database: "connected" }`
- mlapi:   `GET http://localhost:8000/health` -> `{ "status": "ok" }`
- frontend: open http://localhost:5173

## Tests
- backend: `cd backend && npm test` (Node's built-in test runner, no extra dependencies;
  covers schedule rules, ML fallback, error handler, env validation - no database needed)
- mlapi: `python generate_data.py && python train.py` (prints baseline vs model metrics)
- frontend: `npm run lint` and `npm run build`; live-update behaviour tests (mocked, need
  `npm i --no-save esbuild playwright`): `npm run test:harness` (see `frontend/tests/harness/README.md`)

## Demo accounts created by `npm run seed -- --confirm`
These use well-known passwords (see `backend/src/init/data/userData.js`). Use on local/dev
databases only; the seed script refuses to run when `NODE_ENV=production`.

## Live updates (Citizen pages)
Citizen pages receive Socket.IO events for their office and refetch the authoritative data over REST:
`CitizenHome`/`ActiveToken` (the office of the active token), `QueuePreview`, `Services`, `PeakHours`.
One shared connection (`frontend/src/services/socket.js`) uses the session cookie; if the socket is down
the pages keep working over REST and show a "Reconnecting…/Offline" badge.

See `AUDIT_REPORT.md` (backend/mlapi audit and frontend addendum) and `FRONTEND_REFACTOR_REPORT.md`
for findings, verification evidence and open issues.
