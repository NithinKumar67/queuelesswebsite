# Live-update test harness (mocked)

Runs the app's **real** Citizen/Operator pages and hooks with real React in a headless
browser, against a **fake** Socket.IO server (`stubs/socket.io-client.js`) and a **fake**
REST backend (`fakeBackend.js`, same response shapes as `backend/src/controllers`).
It verifies the frontend logic (rooms, listener cleanup, reconnect, debounce, refresh,
login state) - it does **not** test the real backend, MongoDB or Socket.IO server.

## Run
This folder is not part of the normal app build and its tools are not in `package.json`
(so `package-lock.json` is untouched). Install them once, then run:

```bash
cd frontend
npm i --no-save esbuild playwright      # --no-save keeps package.json / lockfile unchanged
npx playwright install chromium         # or: export CHROME_PATH=/path/to/chrome
npm run test:harness
```

Expected: `16/16 passed`. `dist/` is generated and git-ignored.

## What is covered
- ActiveToken shows REST data, then a live status/counter change with no reload
- one shared socket, one `office:join`, `withCredentials`, no duplicate listeners
- several events from one operator action -> a single refetch (debounce)
- React StrictMode double-mount: still one socket and no duplicate handling
- unmount: listeners removed, `office:leave` sent, connection closed
- disconnect -> "Reconnecting", reconnect -> room re-joined and stale data reconciled
- failed refresh keeps last known data; denied join leaves REST working ("Offline" badge)
- CitizenHome (no token = no socket; live position/wait; token completed clears card)
- QueuePreview (live serving token; token creation request + navigation)
- Services (live waiting count), PeakHours (refetch only on token creation)
- switching office on the shared socket; Operator page reloads once per burst
- login in the SPA publishes the user (admin page no longer bounces to /login); logout clears it
