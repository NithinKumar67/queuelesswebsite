// Small shared UI pieces used by the Admin pages only.

export const labelClass = "text-sm font-semibold text-slate-700";

export const inputClass =
  "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-400";

export const primaryBtn =
  "rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-3 text-sm font-semibold text-white transition hover:from-blue-700 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-60";

export const secondaryBtn =
  "rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60";

export const dangerBtn =
  "rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60";

export const smallBtn =
  "rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60";

export const smallDangerBtn =
  "rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60";

export function PageHeader({ title, description, action }) {
  return (
    <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
          Administration
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">
          {title}
        </h1>
        {description && <p className="mt-2 text-slate-600">{description}</p>}
      </div>
      {action}
    </section>
  );
}

export function Alert({ type = "error", children, onClose }) {
  const styles =
    type === "success"
      ? "border-green-200 bg-green-50 text-green-800"
      : "border-red-200 bg-red-50 text-red-800";

  return (
    <div
      role={type === "error" ? "alert" : "status"}
      className={`flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${styles}`}
    >
      <span>{children}</span>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss"
          className="text-lg leading-none opacity-60 hover:opacity-100"
        >
          ×
        </button>
      )}
    </div>
  );
}

export function LoadingBlock({ label = "Loading..." }) {
  return (
    <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-12 text-slate-500 shadow-sm">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
      <span>{label}</span>
    </div>
  );
}

export function ErrorBlock({ message, onRetry }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
      <p className="font-semibold text-red-800">Could not load data</p>
      <p className="mt-1 text-sm text-red-700">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className={`${secondaryBtn} mt-4`}>
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ icon = "📭", title, description, action }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
      <div className="text-4xl">{icon}</div>
      <h3 className="mt-3 text-lg font-bold text-slate-900">{title}</h3>
      {description && (
        <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Modal({ title, subtitle, onClose, children }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-slate-200 p-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{title}</h2>
            {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  busy,
  error,
  onConfirm,
  onCancel,
}) {
  return (
    <Modal title={title} onClose={busy ? undefined : onCancel}>
      <div className="space-y-4 p-6">
        <p className="text-sm leading-6 text-slate-600">{message}</p>
        {error && <Alert>{error}</Alert>}
      </div>
      <div className="flex gap-3 border-t border-slate-200 p-6">
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className={`${secondaryBtn} flex-1`}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={busy}
          className={`${dangerBtn} flex-1`}
        >
          {busy ? "Please wait..." : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

const BADGE_STYLES = {
  AVAILABLE: "bg-green-100 text-green-700",
  PAUSED: "bg-amber-100 text-amber-700",
  OFFLINE: "bg-slate-200 text-slate-600",
  ACTIVE: "bg-green-100 text-green-700",
  WAITING: "bg-blue-100 text-blue-700",
  CALLED: "bg-purple-100 text-purple-700",
  SERVING: "bg-indigo-100 text-indigo-700",
};

export function StatusBadge({ status }) {
  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
        BADGE_STYLES[status] || "bg-slate-100 text-slate-600"
      }`}
    >
      {status}
    </span>
  );
}
