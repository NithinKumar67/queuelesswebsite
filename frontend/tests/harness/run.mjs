// Real-browser tests of the live-update code: the actual hooks and Citizen/Operator
// pages run with real React in headless Chrome. The Socket.IO server and REST
// backend are *fakes* (see stubs/ and fakeBackend.js), so this verifies the
// frontend logic (listeners, rooms, cleanup, reconnect, refresh), not the real servers.
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const bundle = readFileSync(join(here, "dist/bundle.js"), "utf8");
const CHROME = process.env.CHROME_PATH; // optional; defaults to Playwright's own browser

const INIT = `
window.__db = {
  offices: [{ _id: "off1", name: "Revenue Office", type: "REVENUE", description: "d" },
            { _id: "off2", name: "Transport Office", type: "TRANSPORT", description: "d" }],
  services: [{ _id: "svc1", name: "Income Certificate", averageServiceTime: 10, isActive: true },
             { _id: "svc2", name: "Caste Certificate", averageServiceTime: 5, isActive: true }],
  queues: { svc1: [{ tokenNumber: "T010", status: "SERVING" }, { tokenNumber: "T011", status: "WAITING" }, { tokenNumber: "T012", status: "WAITING" }], svc2: [] },
  peakHours: [{ hour: 10, tokenCount: 4 }, { hour: 11, tokenCount: 9 }],
  token: { _id: "tok1", tokenNumber: "T012", status: "WAITING", officeId: { _id: "off1", name: "Revenue Office" }, serviceId: { _id: "svc1", name: "Income Certificate" }, counterId: null },
  position: 3, wait: 20,
  tokenView() { return { token: this.token, queuePosition: this.token.status === "WAITING" ? this.position : null, estimatedWaitTimeMinutes: this.wait }; },
  opDashboard() { return { operator: { name: "Op One" }, office: { _id: "off1", name: "Revenue Office" }, counter: { _id: "c1", number: 1, name: "Counter 1", status: "ACTIVE" }, currentToken: null, stats: {} }; },
  opQueue: [],
  loggedIn: false,
  authUser: { name: "Admin One", email: "admin@x.in", role: "admin" },
};
window.__reqCount = (re) => window.__requests.filter((r) => re.test(r)).length;
`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
let browser;

async function freshPage() {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  // The pages load a decorative Unsplash image; the sandbox has no internet, so
  // ignore "resource failed to load" noise but fail on every real JS/React error.
  page.on("console", (m) => m.type() === "error" && !/Failed to load resource/.test(m.text()) && errors.push(m.text()));
  await page.setContent('<div id="root"></div>');
  await page.evaluate(INIT);
  await page.addScriptTag({ content: bundle });
  return { page, errors };
}

async function test(name, fn) {
  const { page, errors } = await freshPage();
  try {
    await fn(page);
    if (errors.length) throw new Error("browser errors: " + errors.join(" | "));
    results.push([name, true]);
    console.log("PASS", name);
  } catch (e) {
    results.push([name, false, e.message]);
    console.log("FAIL", name, "-", e.message);
  } finally {
    await page.close();
  }
}

const ok = (cond, msg) => { if (!cond) throw new Error(msg); };
const text = (page) => page.evaluate(() => document.body.innerText);
const render = (page, name, params, opts) => page.evaluate(([n, p, o]) => window.__render(n, p, o), [name, params, opts]);
const settle = () => sleep(450);
const count = (page, re) => page.evaluate((s) => window.__reqCount(new RegExp(s)), re.source);
const emit = (page, ev, payload) => page.evaluate(([e, p]) => window.__serverEmit("off1", e, p), [ev, payload]);

browser = await chromium.launch({ ...(CHROME ? { executablePath: CHROME } : {}), args: ["--no-sandbox"] });

await test("ActiveToken: REST data shown, then live status change without reload", async (page) => {
  await render(page, "ActiveToken", { tokenId: "tok1" });
  await settle();
  let t = await text(page);
  ok(t.includes("T012") && t.includes("WAITING"), "initial token not shown");
  ok(t.includes("Will be assigned when called"), "counter placeholder missing");
  await page.evaluate(() => { const d = window.__db; d.token.status = "CALLED"; d.token.counterId = { number: 4 }; });
  await emit(page, "queue:updated", { officeId: "off1", tokenId: "tok1", tokenNumber: "T012", status: "CALLED" });
  await emit(page, "token:called", { tokenNumber: "T012", counterId: "c4", status: "CALLED" });
  await settle();
  t = await text(page);
  ok(t.includes("CALLED") && t.includes("Counter #4"), "live update not reflected: " + t.slice(0, 200));
  await page.evaluate(() => { window.__db.token.status = "COMPLETED"; });
  await emit(page, "queue:updated", { status: "COMPLETED" });
  await settle();
  t = await text(page);
  ok(t.includes("COMPLETED") && !t.includes("Cancel Token"), "completed state / cancel button wrong");
});

await test("One shared socket, joined to the right room once, no duplicate listeners", async (page) => {
  await render(page, "ActiveToken", { tokenId: "tok1" });
  await settle();
  const info = await page.evaluate(() => ({
    sockets: window.__sockets.length,
    listeners: window.__sockets[0].listenerCount(),
    joins: window.__sockets[0].emitted.filter((e) => e[0] === "office:join").map((e) => e[1]),
    rooms: [...window.__sockets[0].rooms],
    credentials: window.__sockets[0].options.withCredentials,
    url: window.__sockets[0].url,
  }));
  ok(info.sockets === 1, "sockets=" + info.sockets);
  ok(info.listeners === 10, "listeners=" + info.listeners);
  ok(JSON.stringify(info.joins) === '["off1"]', "joins=" + JSON.stringify(info.joins));
  ok(info.rooms[0] === "off1", "not in room");
  ok(info.credentials === true && info.url === "http://api.test", "url/credentials " + info.url);
});

await test("Several events from one action cause ONE refetch (debounce)", async (page) => {
  await render(page, "ActiveToken", { tokenId: "tok1" });
  await settle();
  const before = await count(page, /^GET \/tokens\/tok1$/);
  for (const ev of ["queue:updated", "token:called", "counter:updated", "queue:updated"]) await emit(page, ev, {});
  await settle();
  const after = await count(page, /^GET \/tokens\/tok1$/);
  ok(after - before === 1, `refetches=${after - before}`);
});

await test("React StrictMode (double mount): still 1 socket, no duplicate listeners/refetches", async (page) => {
  await render(page, "ActiveToken", { tokenId: "tok1" }, { strict: true });
  await settle();
  const info = await page.evaluate(() => ({ n: window.__sockets.length, l: window.__sockets[0].listenerCount(), closed: window.__sockets[0].closedByClient }));
  ok(info.n === 1 && info.l === 10 && !info.closed, JSON.stringify(info));
  const before = await count(page, /^GET \/tokens\/tok1$/);
  await emit(page, "queue:updated", {});
  await settle();
  ok((await count(page, /^GET \/tokens\/tok1$/)) - before === 1, "duplicate handling");
});

await test("Unmount: listeners removed, room left, connection closed", async (page) => {
  await render(page, "ActiveToken", { tokenId: "tok1" });
  await settle();
  await page.evaluate(() => window.__unmount());
  await sleep(600);
  const info = await page.evaluate(() => { const s = window.__sockets[0]; return { closed: s.closedByClient, l: s.listenerCount(), left: s.emitted.some((e) => e[0] === "office:leave" && e[1] === "off1") }; });
  ok(info.closed && info.l === 0 && info.left, JSON.stringify(info));
  const before = await count(page, /GET/);
  await emit(page, "queue:updated", {});
  await settle();
  ok((await count(page, /GET/)) === before, "event handled after unmount");
});

await test("Reconnect: shows reconnecting, re-joins room and reconciles stale data", async (page) => {
  await render(page, "ActiveToken", { tokenId: "tok1" });
  await settle();
  await page.evaluate(() => window.__sockets[0]._drop());
  await settle();
  ok((await text(page)).includes("Reconnecting"), "no reconnecting message");
  await page.evaluate(() => { window.__db.token.status = "CALLED"; }); // changed while offline
  await page.evaluate(() => window.__sockets[0]._restore());
  await settle();
  const t = await text(page);
  const joins = await page.evaluate(() => window.__sockets[0].emitted.filter((e) => e[0] === "office:join").length);
  ok(joins === 2, "joins=" + joins);
  ok(t.includes("CALLED") && t.includes("Real-time queue tracking"), "not reconciled after reconnect");
});

await test("Refresh failure keeps last known data (no error screen)", async (page) => {
  await render(page, "ActiveToken", { tokenId: "tok1" });
  await settle();
  await page.evaluate(() => { window.__failFetch = true; });
  await emit(page, "queue:updated", {});
  await settle();
  const t = await text(page);
  ok(t.includes("T012") && !t.includes("Network error"), "error shown / data lost");
});

await test("Join denied: REST page still works, badge shows Offline", async (page) => {
  await page.evaluate(() => { window.__joinDenied = true; });
  await render(page, "CitizenHome", {});
  await settle();
  const t = await text(page);
  ok(t.includes("T012"), "token not shown over REST");
  const badge = await page.evaluate(() => document.querySelector("[role=status]")?.innerText);
  ok(badge === "Offline", "badge=" + badge);
});

await test("CitizenHome: no token -> no socket; with token -> live position update", async (page) => {
  await page.evaluate(() => { window.__db.token = null; });
  await render(page, "CitizenHome", {});
  await settle();
  ok((await page.evaluate(() => window.__sockets.length)) === 0, "socket opened without a token");
  ok(!(await page.evaluate(() => document.querySelector("[role=status]"))), "badge shown while idle");
  await page.close().catch(() => {});
});

await test("CitizenHome: live queue position / wait time", async (page) => {
  await render(page, "CitizenHome", {});
  await settle();
  let badge = await page.evaluate(() => document.querySelector("[role=status]")?.innerText);
  ok(badge === "Live", "badge=" + badge);
  ok((await text(page)).includes("20 min"), "initial wait missing");
  await page.evaluate(() => { window.__db.position = 1; window.__db.wait = 0; });
  await emit(page, "queue:updated", {});
  await settle();
  const t = await text(page);
  ok(t.includes("0 min") && !t.includes("20 min"), "wait not updated");
  await page.evaluate(() => { window.__db.token.status = "COMPLETED"; window.__db.token = null; });
  await emit(page, "queue:updated", { status: "COMPLETED" });
  await settle();
  ok((await text(page)).includes("No active token right now"), "completed token not cleared");
});

await test("QueuePreview: live serving token; token creation navigates to the new token", async (page) => {
  await render(page, "QueuePreview", { officeId: "off1", serviceId: "svc1" });
  await settle();
  ok(!(await text(page)).includes("T011"), "T011 should not be serving yet");
  await page.evaluate(() => { window.__db.queues.svc1 = [{ tokenNumber: "T010", status: "COMPLETED" }, { tokenNumber: "T011", status: "SERVING" }, { tokenNumber: "T012", status: "WAITING" }]; });
  await emit(page, "queue:updated", { tokenNumber: "T010", status: "COMPLETED" });
  await settle();
  ok((await text(page)).includes("T011"), "serving token not updated live");
  await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => /Get Virtual Token/.test(b.innerText)).click());
  await settle();
  const nav = await page.evaluate(() => ({ nav: window.__nav, body: window.__db.createdWith }));
  ok(nav.nav.includes("/citizen/token/tok1"), "no navigation: " + JSON.stringify(nav.nav));
  ok(nav.body.officeId === "off1" && nav.body.serviceId === "svc1", "wrong create body");
});

await test("Services: live waiting count per service", async (page) => {
  await render(page, "Services", { officeId: "off1" });
  await settle();
  let t = await text(page);
  ok(t.includes("2 waiting now") && t.includes("0 waiting now"), "initial counts: " + t.slice(-300));
  await page.evaluate(() => window.__db.queues.svc2.push({ tokenNumber: "T020", status: "WAITING" }));
  await emit(page, "queue:updated", {});
  await settle();
  t = await text(page);
  ok(t.includes("1 waiting now"), "count not updated live");
});

await test("PeakHours: refetches only when a token is created (status WAITING)", async (page) => {
  await render(page, "PeakHours", { officeId: "off1" });
  await sleep(1500); // let the post-join sync refetch (1s debounce) finish first
  const base = await count(page, /peak-hours/);
  await emit(page, "queue:updated", { status: "CANCELLED" });
  await emit(page, "token:called", { status: "CALLED" });
  await sleep(1400);
  ok((await count(page, /peak-hours/)) === base, "refetched for a non-creation event");
  await page.evaluate(() => { window.__db.peakHours = [{ hour: 10, tokenCount: 4 }, { hour: 11, tokenCount: 17 }]; });
  await emit(page, "queue:updated", { status: "WAITING" });
  await emit(page, "queue:updated", { status: "WAITING" });
  await sleep(1400);
  ok((await count(page, /peak-hours/)) === base + 1, "creation event should refetch once");
  ok((await text(page)).includes("17"), "new count not displayed");
});

await test("Switching office on the shared socket leaves the old room and joins the new one", async (page) => {
  await render(page, "PeakHours", { officeId: "off1" });
  await settle();
  await render(page, "PeakHours", { officeId: "off2" });
  await settle();
  const info = await page.evaluate(() => ({ n: window.__sockets.length, rooms: [...window.__sockets[0].rooms], ev: window.__sockets[0].emitted.map((e) => e[0] + ":" + e[1]) }));
  ok(info.n === 1 && info.rooms.length === 1 && info.rooms[0] === "off2", JSON.stringify(info));
  ok(info.ev.includes("office:leave:off1"), "did not leave old room");
});

await test("Operator page: events trigger a single reload of dashboard + queue", async (page) => {
  await render(page, "OperatorQueue", {});
  await settle();
  ok((await text(page)).includes("Revenue Office") || (await text(page)).length > 50, "operator page empty");
  const d0 = await count(page, /GET \/operator\/dashboard/);
  const q0 = await count(page, /GET \/operator\/queue/);
  for (const ev of ["queue:updated", "token:called", "counter:updated"]) await emit(page, ev, {});
  await settle();
  ok((await count(page, /GET \/operator\/dashboard/)) - d0 === 1, "dashboard reloads != 1");
  ok((await count(page, /GET \/operator\/queue/)) - q0 === 1, "queue reloads != 1");
});

await test("Login in the SPA publishes the user: admin page opens instead of bouncing back to /login", async (page) => {
  await render(page, "App", {}, { path: "/login" });
  await settle();
  await page.fill("#email", "admin@x.in");
  await page.fill("#password", "secret123");
  await page.evaluate(() => document.querySelector("form").requestSubmit());
  await settle();
  const state = await page.evaluate(() => ({ path: window.__path, nav: window.__nav }));
  ok(state.path === "/admin", "ended at " + state.path + " via " + JSON.stringify(state.nav));
  const t = await text(page);
  ok(t.includes("Staff") && !t.includes("Access denied"), "admin layout not rendered");
  // logout clears the user so the next visitor does not inherit it
  await page.evaluate(() => document.querySelector("button[aria-expanded]").click()); // open account menu
  await sleep(100);
  await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => /^Log out$/.test(b.innerText.trim())).click());
  await settle();
  ok((await page.evaluate(() => window.__path)) === "/login", "logout did not redirect");
  await page.evaluate(() => window.__render("App", {}, { path: "/admin" }));
  await settle();
  ok((await page.evaluate(() => window.__path)) === "/login", "stale user kept after logout (admin page opened)");
});

await browser.close();
const failed = results.filter((r) => !r[1]);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
