# Frontend Refactor and Citizen Socket.IO Report

Date: 2026-10-11. `backend/` and `mlapi/` were **not changed** in this pass.

## 1. Issues found
| Sev | Issue |
|---|---|
| High | **Login state bug.** `App` read the user once at load; `Login` never updated it. After an in-app login every page got `user = null`, so admin pages redirected back to `/login`; after logout the previous user stayed in state. Reproduced with the original code (mutation test: `/admin` then `/login`). |
| High | **No real-time code on Citizen pages.** "Live"/"Online" labels and the "Real-time tracking is active" banner were static text. |
| Medium | `OperatorDashboard` and `OperatorQueue` held identical load/action logic; the socket hook opened its own connection and logged every event; `OperatorQueue` had leftover debug `console.log`s. |
| Low | Dead code: `pages/HealthPage.jsx`, `pages/HomePage.jsx` (not routed), `services/api.js` (only used by HealthPage; called `/api/users`, which never existed), `layouts/publicLayout.jsx` (no importers). Three unused locals (`PageHeader`, `BTN`, operator `BuildingIcon`). Icons copy-pasted between pages. Repeated fetch boilerplate. Admin pages passed a `setUser` prop that nothing supplied. `citizenApi.jsx` contained no JSX. |

## 2. Pages and components modified
Citizen: `CitizenHome`, `ActiveToken`, `QueuePreview`, `Services`, `PeakHours`, `CitizenNavbar`.
Operator: `OperatorDashboard`, `OperatorQueue`, `OperatorNavbar`. Admin: `AdminLayout`, plus removal of the dead `setUser`
prop in `Analytics`, `Counters`, `Offices`, `Services`, `Staff`. Public: `Login`. Core: `App.jsx`.
Routes: the 17 routes and their pages are identical to the original (verified by diff).

## 3. Extracted / reused
- `services/socket.js` - one shared, reference-counted Socket.IO connection (`withCredentials`, closed ~300 ms after the last user leaves).
- `hooks/useOfficeSocket.js` - join/leave room, listener cleanup, status, re-join and resync on reconnect.
- `hooks/useDebouncedCallback.js` - one refetch per burst of events.
- `hooks/useOperatorQueue.js` - the logic shared by the two operator pages; `hooks/useOperatorSocket.js` now wraps `useOfficeSocket`.
- `components/LiveStatusBadge.jsx`, `components/icons.jsx` (11 icons), `context/AuthContext.jsx`.
- `services/apiClient.js` (`API_URL`, `getSocketUrl`, `requestJson`) used by `authApi.js` and `citizenApi.js`. The admin and operator services keep their own helpers on purpose (they throw on non-2xx; the citizen/auth pages rely on `success` flags).

## 4. Removed (references checked first)
`HealthPage.jsx`, `HomePage.jsx`, `services/api.js`, `layouts/publicLayout.jsx`, two empty `.gitkeep`s, three unused locals, operator debug logs, the verbose socket logging.
Remaining `console.error` calls are in catch blocks and were kept.
**Not removed:** `@mui/material`, `@emotion/react`, `@emotion/styled` are now unused, but removing them requires regenerating `package-lock.json`, which I could not do offline. Run `npm uninstall @mui/material @emotion/react @emotion/styled` locally. (`lucide-react` is still used.)

## 5. How Citizen Socket.IO works
Auth is the existing Passport session cookie (`withCredentials: true`); the socket URL is `VITE_API_URL` without `/api`.
Room: `office:<officeId>`, joined with `emit("office:join", officeId, ack)`; left with `office:leave`. Citizens may join any office room (backend rule).
Events the backend really emits to that room (read from `token.controller.js` / `operator.controller.js`):
| Event | Payload |
|---|---|
| `queue:updated` | token created/cancelled: `{officeId, serviceId, tokenId, tokenNumber, status}`; operator actions: `{officeId, tokenId, tokenNumber, status}` |
| `token:called` / `started` / `completed` / `skipped` / `recalled` | `{tokenNumber, counterId, status}` |
| `counter:updated` | `{officeId, counterId, status}` |

Payloads are used only as a signal. Every page loads its initial data over REST and, on an event (debounced 250 ms) or after every (re)join, refetches the authoritative data through the existing endpoints:
- `CitizenHome` / `ActiveToken`: join the office of the active token; refetch `GET /tokens/my-active` or `/tokens/:id` (status, counter, queue position, ML wait time). Silent refresh: no spinner, last data kept if a refresh fails.
- `QueuePreview`: refetches the service queue. Token creation still calls `POST /tokens` and opens `/citizen/token/:id`, which shows the token number, position and wait time from the backend.
- `Services`: shows a new small "N waiting now" per service (from the existing queue endpoint), updated live.
- `PeakHours`: refetches only on `queue:updated` with `status: "WAITING"` (token creation; the only time the counts change), debounce 1 s.
- Lifecycle: listeners removed and room left on unmount; one connection total; reconnect re-joins and resyncs; badge shows Live / Connecting / Reconnecting / Offline; REST keeps working when the socket is down.

## 6. Backend changes
None. Gaps noted, not changed: counter edits by an admin and the day-rollover expiry of old tokens emit no event (pages catch up on the next event or reconnect); payloads include other users' `tokenId`/`tokenNumber`; operators' `queue:updated` has no `serviceId` (hence refetch instead of patching state).

## 7. Preserved
All routes, pages, layouts, forms, tables, admin/operator behaviour and API endpoints (13 citizen+auth endpoints identical, verified by diff). Visible changes: static "Live"/"Online" labels now reflect the real connection (hidden when no office is followed), the Services card has a waiting-count line, the ActiveToken banner text reflects connection state.

## 8. Tests actually executed
| Check | Result |
|---|---|
| esbuild transform of every frontend `.js/.jsx` | passed |
| esbuild bundle of `src/main.jsx` (all local imports resolve; npm packages externalised) | passed |
| TypeScript check of the JS for undefined names / unused locals | none left (3 found and removed); other TS noise is missing module types in the sandbox |
| Route table and endpoint set vs original | identical |
| **Browser harness (MOCKED)**: real pages/hooks, real React, headless Chrome, fake socket server + fake REST: **16/16 passed** | passed |
| Harness sensitivity: removed listener cleanup -> 1 failure; removed reconnect re-join -> 11 failures; removed the Login fix -> the login test failed with `/admin` then `/login` | detected as expected |
| Backend `node --test` (22 tests; `mongoose` stubbed as before) | 22/22 |
| mlapi `py_compile` | passed |

## 9. NOT executed / limitations
- `npm ci`, `npm run build` (Vite), `npm run lint` (oxlint): sandbox has no network; the substitutes above are not equivalent.
- No test against the real backend, MongoDB or Socket.IO server; **no live Citizen-to-Operator run**. The harness only proves the frontend logic against fakes.
- No visual/responsive check in a real browser; admin pages were not reviewed line by line beyond shared pieces.
- Left as is: citizen pages have no logged-out redirect (they show an API error); `ActiveToken` loads an external Unsplash image; `QueuePreview` estimates wait locally (people x avg time) while `ActiveToken` shows the backend/ML estimate.

## 10. Commands (run locally)
```bash
# 1 mlapi
cd mlapi && pip install -r requirements.txt && python generate_data.py && python train.py
uvicorn main:app --port 8000
# 2 backend
cd backend && npm ci && cp .env.example .env   # fill MONGO_URI, SESSION_SECRET, CLIENT_URL
npm test && npm start
# 3 frontend
cd frontend && npm ci && cp .env.example .env  # VITE_API_URL=http://localhost:5000/api
npm run lint && npm run build && npm run dev
npm i --no-save esbuild playwright && npx playwright install chromium && npm run test:harness   # 16 mocked tests
```
Manual live check: log in as a citizen in one browser and an operator in another; create a token, then call next / start / complete as the operator and watch the citizen's `ActiveToken`, `QueuePreview`, `Services` and `CitizenHome` update without reload. Stop the backend and restart it to see "Reconnecting" then "Live".
