// Test double for socket.io-client. The real library needs a server; this one
// lets tests play the server: deliver events to sockets that joined a room,
// drop and restore the connection, and inspect listeners / emitted messages.
const sockets = [];
window.__sockets = sockets;

class FakeSocket {
  constructor(url, options) {
    this.url = url;
    this.options = options;
    this.connected = false;
    this.listeners = new Map();
    this.rooms = new Set();
    this.emitted = [];
    this.closedByClient = false;
    sockets.push(this);
    setTimeout(() => this._open(), 10);
  }
  on(event, fn) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event).add(fn);
    return this;
  }
  off(event, fn) {
    this.listeners.get(event)?.delete(fn);
    return this;
  }
  emit(event, ...args) {
    const callback = typeof args[args.length - 1] === "function" ? args.pop() : null;
    this.emitted.push([event, ...args]);
    if (!this.connected) return this;
    if (event === "office:join") {
      setTimeout(() => {
        if (!this.connected) return;
        if (window.__joinDenied) return callback?.({ success: false, message: "denied" });
        this.rooms.add(args[0]);
        callback?.({ success: true, officeId: args[0] });
      }, 5);
    }
    if (event === "office:leave") {
      this.rooms.delete(args[0]);
      callback?.({ success: true });
    }
    return this;
  }
  _fire(event, ...args) {
    [...(this.listeners.get(event) || [])].forEach((fn) => fn(...args));
  }
  _open() {
    if (this.closedByClient) return;
    this.connected = true;
    this._fire("connect");
  }
  disconnect() {
    this.connected = false;
    this.closedByClient = true;
    this.rooms.clear();
  }
  listenerCount() {
    let n = 0;
    this.listeners.forEach((set) => (n += set.size));
    return n;
  }
  // --- controls used by tests
  _drop() {
    this.connected = false;
    this.rooms.clear();
    this._fire("disconnect", "transport close");
  }
  _restore() {
    this.connected = true;
    this._fire("connect");
  }
}

export const io = (url, options) => new FakeSocket(url, options);

// Server -> clients that joined the office room.
window.__serverEmit = (officeId, event, payload) =>
  sockets.forEach((s) => s.connected && s.rooms.has(officeId) && s._fire(event, payload));
