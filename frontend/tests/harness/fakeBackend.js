// In-page fake of the REST API, returning the same response shapes as
// backend/src/controllers/*. Tests change window.__db to simulate server state.
window.__requests = [];
window.__failFetch = false;

const json = (body, status = 200) =>
  Promise.resolve({ ok: status < 400, status, json: () => Promise.resolve(body) });

window.fetch = (url, options = {}) => {
  const path = String(url).replace("http://api.test/api", "");
  const method = options.method || "GET";
  window.__requests.push(`${method} ${path}`);
  const db = window.__db;

  if (window.__failFetch && method === "GET") return Promise.reject(new TypeError("Failed to fetch"));

  let m;
  if (path === "/auth/me")
    return json(db.loggedIn ? { authenticated: true, user: db.authUser } : { authenticated: false, user: null });
  if (path === "/auth/login" && method === "POST") {
    db.loggedIn = true;
    return json({ success: true, user: db.authUser });
  }
  if (path === "/auth/logout" && method === "POST") {
    db.loggedIn = false;
    return json({ success: true });
  }
  if (path === "/offices") return json({ success: true, offices: db.offices });
  if ((m = path.match(/^\/offices\/([^/]+)\/services\/([^/]+)\/queue$/)))
    return json({ success: true, queue: db.queues[m[2]] || [] });
  if ((m = path.match(/^\/offices\/([^/]+)\/services$/)))
    return json({ success: true, services: db.services });
  if ((m = path.match(/^\/offices\/([^/]+)\/analytics\/peak-hours$/)))
    return json({ success: true, peakHours: db.peakHours });
  if ((m = path.match(/^\/offices\/([^/]+)$/)))
    return json({ success: true, office: db.offices.find((o) => o._id === m[1]) });
  if (path === "/tokens/my-active")
    return json(db.token ? { success: true, ...db.tokenView() } : { success: true, token: null });
  if (path === "/tokens" && method === "POST") {
    db.createdWith = JSON.parse(options.body);
    return json({ success: true, token: { _id: "tok1", tokenNumber: "T013" } }, 201);
  }
  if ((m = path.match(/^\/tokens\/([^/]+)\/cancel$/))) {
    db.token.status = "CANCELLED";
    return json({ success: true });
  }
  if ((m = path.match(/^\/tokens\/([^/]+)$/)))
    return json({ success: true, ...db.tokenView() });
  if (path === "/operator/dashboard") return json({ success: true, dashboard: db.opDashboard() });
  if (path === "/operator/queue") return json({ success: true, queue: db.opQueue });
  return json({ success: false, message: `unhandled ${method} ${path}` }, 404);
};
