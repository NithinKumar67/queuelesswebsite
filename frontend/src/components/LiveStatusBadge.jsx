// Small connection indicator for pages that receive live updates.
// Rendered only when the page is subscribed to an office ("idle" shows nothing)
// so a "Live" label is never displayed while the socket is not actually connected.

const STATES = {
  connected: { label: "Live", light: "bg-emerald-100 text-emerald-700", dark: "bg-emerald-400/15 text-emerald-300", dot: "bg-emerald-500" },
  connecting: { label: "Connecting…", light: "bg-amber-100 text-amber-700", dark: "bg-amber-400/15 text-amber-300", dot: "bg-amber-500" },
  disconnected: { label: "Reconnecting…", light: "bg-amber-100 text-amber-700", dark: "bg-amber-400/15 text-amber-300", dot: "bg-amber-500" },
  error: { label: "Offline", light: "bg-slate-100 text-slate-600", dark: "bg-slate-400/15 text-slate-300", dot: "bg-slate-400" },
  unavailable: { label: "Offline", light: "bg-slate-100 text-slate-600", dark: "bg-slate-400/15 text-slate-300", dot: "bg-slate-400" },
};

export default function LiveStatusBadge({ status, tone = "light", className = "" }) {
  const state = STATES[status];

  if (!state) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      title={
        status === "connected"
          ? "Receiving live updates"
          : "Live updates unavailable - the page still refreshes when you reload"
      }
      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${state[tone]} ${className}`}
    >
      <span className={`h-2 w-2 rounded-full ${state.dot}`} />
      {state.label}
    </div>
  );
}
