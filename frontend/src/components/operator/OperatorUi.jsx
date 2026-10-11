// Small Operator-only UI helpers shared by the three Operator pages.

export const getId = (obj) => obj?._id || obj?.id;

export function formatTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const TOKEN_STYLES = {
  WAITING: "bg-yellow-100 text-yellow-700",
  CALLED: "bg-blue-100 text-blue-700",
  SERVING: "bg-purple-100 text-purple-700",
  COMPLETED: "bg-green-100 text-green-700",
  SKIPPED: "bg-slate-200 text-slate-600",
};

export function TokenStatusBadge({ status }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold ${
        TOKEN_STYLES[status] || "bg-slate-100 text-slate-600"
      }`}
    >
      {status || "UNKNOWN"}
    </span>
  );
}

const COUNTER_STYLES = {
  AVAILABLE: {
    label: "Available",
    box: "bg-green-50",
    dot: "bg-green-500",
    text: "text-green-700",
  },
  PAUSED: {
    label: "Paused",
    box: "bg-orange-50",
    dot: "bg-orange-500",
    text: "text-orange-700",
  },
  OFFLINE: {
    label: "Offline",
    box: "bg-slate-100",
    dot: "bg-slate-400",
    text: "text-slate-600",
  },
};

export const counterStyle = (status) =>
  COUNTER_STYLES[status] || COUNTER_STYLES.OFFLINE;

export function CounterStatusPill({ status }) {
  const s = counterStyle(status);
  return (
    <div className={`flex items-center gap-2 rounded-xl px-4 py-3 ${s.box}`}>
      <span className={`h-2.5 w-2.5 rounded-full ${s.dot}`} />
      <span className={`text-sm font-semibold ${s.text}`}>
        Counter {s.label}
      </span>
    </div>
  );
}

export function Spinner({ className = "h-4 w-4" }) {
  return (
    <span
      className={`inline-block animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
      aria-hidden="true"
    />
  );
}

export function Notice({ notice, onClose }) {
  if (!notice) return null;
  const styles = {
    success: "border-green-200 bg-green-50 text-green-800",
    info: "border-blue-200 bg-blue-50 text-blue-800",
    error: "border-red-200 bg-red-50 text-red-800",
  };
  return (
    <div
      role="status"
      aria-live="polite"
      className={`mt-6 flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm font-medium ${
        styles[notice.type] || styles.info
      }`}
    >
      <span>{notice.message}</span>
      <button
        type="button"
        onClick={onClose}
        className="text-xs font-semibold opacity-70 hover:opacity-100"
        aria-label="Dismiss message"
      >
        ✕
      </button>
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
      <p className="text-lg font-bold text-red-800">
        Couldn't load operator data
      </p>
      <p className="mt-2 text-sm text-red-700">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-5 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-red-700 shadow-sm ring-1 ring-red-200 transition hover:bg-red-100"
      >
        Retry
      </button>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="mt-8 animate-pulse space-y-6" aria-label="Loading">
      <div className="h-24 rounded-2xl bg-slate-200" />
      <div className="h-56 rounded-2xl bg-slate-200" />
      <div className="h-40 rounded-2xl bg-slate-200" />
    </div>
  );
}

// Button that shows a spinner while its action is running.
export function ActionButton({
  busy,
  disabled,
  onClick,
  children,
  busyLabel = "Working...",
  className = "",
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || busy}
      aria-busy={busy}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {busy && <Spinner />}
      {busy ? busyLabel : children}
    </button>
  );
}

export const BTN = {
  primary:
    "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700",
  danger: "border border-red-200 bg-red-50 text-red-600 hover:bg-red-100",
  recall: "border border-purple-200 bg-purple-50 text-purple-600 hover:bg-purple-100",
  neutral: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
  success: "bg-green-600 text-white hover:bg-green-700",
};
