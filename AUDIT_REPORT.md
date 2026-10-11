# QueueLess - Audit, Verification and Change Report

Audit date: 2026-10-11. Original ZIPs were not modified; work was done on copies.

## 0. Scope and an important caveat
You described three *server* folders. The uploads were three folders: `backend` (Node/Express),
`mlapi` (Python/FastAPI) and `frontend` (React/Vite). I treated them as the three components.
- `backend` and `mlapi`: every source file was read.
- `frontend`: **not modified in this first pass** (see the addendum at the end for the later frontend work). I read only its contract surface
  (`package.json`, `.env.example`, `vite.config.js`, `src/services/*`, `src/hooks/useOperatorSocket.js`)
  and grepped pages for contract usage. The ~30 page/component `.jsx` files were **not** reviewed line by line.
- Seed data files (`init/data/*`) were read only partially (heads of officeData, counterData, serviceData; userData fully).

## 1. Sandbox limitation (read this before the verification section)
The sandbox has **no network access**: `npm ci`, `pip install fastapi`, and `npm audit` all failed.
There is also no MongoDB. Consequently **the backend server and the FastAPI server were never started**,
and no database/HTTP/Socket.IO/end-to-end test was run. See section 4.

## 2. Findings

### Critical / High
| # | Sev | Where | Problem | Status |
|---|---|---|---|---|
| 1 | High | `config`, `app.js`, `server.js` | `CLIENT_URL` unset made `cors` fall back to `Access-Control-Allow-Origin: *` while `credentials:true`; `SESSION_SECRET` was never validated (session store created with an undefined secret). Missing config failed with confusing errors. | Fixed: `config/env.js` validates `MONGO_URI`, `SESSION_SECRET` (>=16 chars), `CLIENT_URL` before the app loads; CORS/Socket.IO use an explicit origin list |
| 2 | High | `init/init_db.js` | Seed script deleted all users/offices/services/counters on whatever `MONGO_URI` points to, with no confirmation, left orphaned tokens, and creates an admin with a published password (`Admin@123`). | Fixed: refuses without `--confirm` and when `NODE_ENV=production`; also clears tokens; non-zero exit on failure. Demo passwords remain by design (documented) |
| 3 | High | `server.js` socket handler | Event handlers (`office:join`) were registered *after* an awaited DB lookup, so a join sent right after `connect` could be silently dropped (client callback never fires). | Fixed: handlers registered synchronously; they await the user lookup |
| 4 | High | `controllers/operator` `callNextToken` | Read-then-write: two operators/double click could be handed the same WAITING token. | Fixed: atomic `findOneAndUpdate` on `status: WAITING` |
| 5 | High | `controllers/token` `createToken` | Token number = `count + 1`; simultaneous requests collide on the unique index and returned HTTP 500. | Fixed: retry with the next number (max 5), then 503 |
| 6 | High | `controllers/analytics` | Peak-hour buckets used `$hour` in **UTC**; the offices run on IST and the frontend prints the hour as-is, so charts were shifted by 5h30m. | Fixed: `$hour` with `timezone: 'Asia/Kolkata'`. **Behaviour change:** hour values change; existing data is re-bucketed correctly |
| 7 | High | `test-token-schedule.js` | The only test **failed 3 of 7** on the original code (assumed 10:00-16:30; real defaults are 08:00-20:00). Verified by running it. | Fixed: replaced by `tests/officeSchedule.test.js` |

### Medium
| # | Where | Problem | Status |
|---|---|---|---|
| 8 | `controllers/token` `cancelToken` | Non-atomic; cancelling a CALLED/SERVING token left `counter.currentTokenId` pointing at it | Fixed (atomic update + counter released) |
| 9 | `controllers/operator` | `start/complete/skip/recall` crashed (TypeError -> 500) for operators with no office/counter | Fixed (400 with message) |
| 10 | `middleware/errorHandler` | Mongoose CastError/ValidationError/duplicate key and malformed JSON surfaced as 500; internal messages leaked | Fixed (mapped to 400/409; 5xx text hidden when `NODE_ENV=production`) |
| 11 | `server.js` | Debug logs printed session data and user ids on every socket handshake | Removed |
| 12 | `app.js` | Session cookie had no `secure`/`sameSite` control; logout cleared the cookie without matching attributes | Fixed (env-driven, defaults unchanged for local dev) |
| 13 | `server.js` | No graceful shutdown, no unhandled-rejection logging | Added SIGINT/SIGTERM shutdown |
| 14 | `schemas/service.schema.js` | Controller supports `isActive`, but Joi rejected it, so a deactivated service could never be re-activated | Added optional `isActive` (additive) |
| 15 | `models/Counter.js` | Duplicate counter numbers per office only checked in code | Added unique index `(officeId, number)`. Index build fails (logged) if existing data already has duplicates |
| 16 | `mlapi/requirements.txt` | Completely unpinned; pickle depends on the scikit-learn version | Ranges added (`scikit-learn>=1.4,<2` ...). Not hard-pinned because I cannot verify versions on your Python |

### Low / informational
- Dead code removed: `routes/user.routes.js`, `controllers/user.controller.js` (ESM `import` syntax inside a CommonJS project; not required by any file - verified by grep; not mounted in `app.js`; would have exposed an unauthenticated user list).
  **Frontend impact:** `frontend/src/services/api.js` `createUser/getUsers` and `HealthPage.jsx` call `/api/users`; that route never existed, so those calls already returned 404. Not changed (frontend). Whether `HealthPage` is reachable was not confirmed.
- `x-powered-by` header disabled.
- `mlapi/main.py`: clearer error if the model file cannot be loaded. README path/commands corrected.
- Populates reference a non-existent `code` field on Office/Service (harmless).
- `tokenRoutes` is mounted on `/api` with router-level `requireAuth`, so unknown `/api/...` paths return 401 instead of 404 for logged-out users (harmless; left as is).

## 3. Unresolved issues / assumptions
1. **No rate limiting / `helmet`** on login/register. Adding them needs new dependencies (not added per your rules). Recommended before public launch.
2. **A user can still obtain two active tokens** with two truly simultaneous requests (existing check is read-then-write). A partial unique index on `userId` for active statuses would fix it; I did not add it because I could not test it against MongoDB.
3. Same counter can still claim two tokens on a double click (the "counter already busy" check is not atomic).
4. Deleting a counter does not unassign operators pointing at it (they then see "Assigned counter not found").
5. Sockets authenticate at connection only; a socket stays joined after the user logs out until it disconnects.
6. Operators/admins can read any token by id (`GET /api/tokens/:id`), including other offices.
7. `expirePreviousDayUnservedTokens` runs on many GETs (extra DB queries per request); fine at small scale.
8. Passwords: min 6 characters (existing rule, unchanged).
9. Frontend pages not reviewed (see section 0). The seed files were only partly read.
10. `package-lock.json` untouched; no dependencies were added or changed. Its audit status (`npm audit`) is **unknown**.
11. Assumed Node >= 20 (Express 5 / Mongoose 9 / global `fetch`); not verified from package metadata.

## 4. Verification report (only what was actually executed)

### backend
| Check | Result |
|---|---|
| `node --check` on every `.js` file (original and corrected) | Passed |
| `npm ci` / `npm audit` | **Could not run** (no network). The partial install was discarded |
| Original `test-token-schedule.js` on original code (with `mongoose` stubbed) | **Failed 3/7** (expectation mismatch described above) |
| New suite `node --test`: 22 tests (env validation, error handler, ML client with mocked `fetch`, schedule rules) | **22 passed, 0 failed.** Caveat: `officeSchedule.test.js` was run with a stand-in for the `mongoose` package, because the real one could not be installed. The tests do not touch the database, so on a normal install they should behave the same, but I did not run them that way |
| Server startup, MongoDB connection, session store, routes, Socket.IO rooms, graceful shutdown | **Not run** (no deps, no MongoDB) |
| Atomic `findOneAndUpdate` logic, `$hour` timezone aggregation, unique index, duplicate-token retry | **Reviewed by inspection only. Not executed** |

### mlapi
| Check | Result |
|---|---|
| `py_compile` of `main.py`, `generate_data.py`, `train.py` | Passed |
| `python generate_data.py` | Passed (2000 rows) |
| `python train.py` | Passed (run on a temp copy). Test MAE: baseline 14.58, linear 31.42, random forest 8.71; random forest saved. Synthetic data only |
| Load saved model and predict 3 inputs | Passed (e.g. 0 people ahead -> 0.0; values never negative) |
| FastAPI app (`uvicorn main:app`), `/predict` validation (422), `/health` | **Not run** (`fastapi` not installable offline) |
| Backend <-> mlapi live call | **Not run.** Only the backend client was tested against a mocked `fetch` |

### frontend
Not built, linted, or run (no network for dependencies; not in scope for changes).

### End-to-end
**No end-to-end test of any kind was performed.**

## 5. Change log
| File | Change | Compatibility |
|---|---|---|
| `backend/src/config/env.js` | NEW: env validation, origin list, cookie options | `MONGO_URI`, `SESSION_SECRET`, `CLIENT_URL` now required at startup |
| `backend/src/server.js` | env check first; sync socket handlers; removed debug logs; graceful shutdown | Socket events/payloads unchanged |
| `backend/src/app.js` | explicit CORS origins, cookie options, trust proxy, `x-powered-by` off | Cookie defaults for local dev unchanged (`lax`, not secure) |
| `backend/src/middleware/errorHandler.js` | error mapping, production-safe messages | Error body shape `{success:false,message}` unchanged |
| `backend/src/controllers/auth.controller.js` | logout clears cookie with matching options | none |
| `backend/src/controllers/token.controller.js` | token-number retry; atomic cancel + release counter | none |
| `backend/src/controllers/operator.controller.js` | atomic call-next; unassigned-operator guards | none |
| `backend/src/controllers/analytics.controller.js` | peak hours bucketed in IST | `hour` values shift to IST (the intended meaning) |
| `backend/src/schemas/service.schema.js` | optional `isActive` | additive |
| `backend/src/models/Counter.js` | unique `(officeId, number)` index | may log an index error if data has duplicates |
| `backend/src/init/init_db.js` | confirm flag, production refusal, clear tokens, exit code | seeding now needs `npm run seed -- --confirm` |
| `backend/package.json` | scripts `seed`, `test` added (no dependency changes) | lockfile still valid |
| `backend/.env.example`, `.gitignore` | all variables documented; `*.log` ignored | - |
| `backend/tests/*.test.js` (4 files) | NEW tests | - |
| `backend/test-token-schedule.js` | REMOVED (failing; replaced by `tests/officeSchedule.test.js`) | - |
| `backend/src/routes/user.routes.js`, `controllers/user.controller.js` | REMOVED (dead, ESM in CJS, unmounted) | `/api/users` never existed |
| `mlapi/main.py`, `requirements.txt`, `README.md` | clearer model-load error; version ranges; README fixes | `/predict` contract unchanged |
| `README.md`, `AUDIT_REPORT.md` (root) | NEW | - |
| `frontend/` | no changes | - |

Counts: backend 51 files in original -> 13 modified, 5 added, 3 removed. mlapi 6 files -> 3 modified. frontend 56 files -> 0 changed.

## 6. Deployment-readiness: **Not ready for deployment (conditionally ready after the steps below)**
Why: the servers were never started and nothing was tested against MongoDB, Socket.IO, or a live FastAPI process,
so I cannot claim it works end to end. The fixes are targeted and syntax-checked, and the logic tests that could run did pass,
but that is not deployment evidence.

To reach "conditionally ready":
1. On a machine with network: `npm ci`, `npm test`, `npm audit`, then start all three servers and click through
   register -> login -> create token -> operator call/start/complete -> cancel, with two browsers to check Socket.IO updates.
2. Run two simultaneous `POST /api/tokens` and two simultaneous `POST /api/operator/tokens/next` against a test database.
3. Confirm peak-hours now line up with IST.
4. Set `NODE_ENV=production`, strong `SESSION_SECRET`, correct `CLIENT_URL`, cookie settings for your hosting layout.
5. Decide on rate limiting (item 1 of section 3).


---
## Addendum - frontend pass (2026-10-11)
The frontend was audited, refactored and given Citizen Socket.IO integration. Full details, evidence and
limits are in `FRONTEND_REFACTOR_REPORT.md`. Effect on this report:
- `backend/` and `mlapi/` are byte-for-byte unchanged by this pass; no backend change was needed.
- The earlier note that `/api/users` was called by the frontend is resolved: the unreachable `HealthPage`
  and its `services/api.js` were removed.
- Deployment-readiness is unchanged: **Not ready for deployment** until the servers have been started and
  tested end to end on a networked machine (still never done; the sandbox has no network).
