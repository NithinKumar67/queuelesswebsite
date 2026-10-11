import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import OperatorNavbar from "../../components/operator/OperatorNavbar";
import {
  getOperatorDashboard,
  updateCounterStatus,
} from "../../services/operatorApi";
import {
  CounterStatusPill,
  ErrorState,
  Notice,
  PageSkeleton,
  Spinner,
  TokenStatusBadge,
  counterStyle,
} from "../../components/operator/OperatorUi";

const STATUS_OPTIONS = [
  {
    value: "AVAILABLE",
    label: "Available",
    shortLabel: "Ready",
    desc: "Ready to call and serve citizens.",
    dot: "bg-emerald-500",
    glow: "shadow-emerald-100",
    selected:
      "border-emerald-300 bg-emerald-50 ring-2 ring-emerald-100",
  },
  {
    value: "PAUSED",
    label: "Paused",
    shortLabel: "On break",
    desc: "Temporary break. No new tokens can be called.",
    dot: "bg-amber-500",
    glow: "shadow-amber-100",
    selected:
      "border-amber-300 bg-amber-50 ring-2 ring-amber-100",
  },
  {
    value: "OFFLINE",
    label: "Offline",
    shortLabel: "Closed",
    desc: "Counter closed. No new tokens can be called.",
    dot: "bg-slate-400",
    glow: "shadow-slate-100",
    selected:
      "border-slate-400 bg-slate-100 ring-2 ring-slate-200",
  },
];

export default function CounterControl({ user }) {
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyStatus, setBusyStatus] = useState(null);
  const [notice, setNotice] = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await getOperatorDashboard();
      setDashboard(data.dashboard);
      setError("");
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function changeStatus(status) {
    if (busyStatus || status === dashboard?.counter?.status) return;

    setBusyStatus(status);
    setNotice(null);

    try {
      const res = await updateCounterStatus(status);

      setNotice({
        type: "success",
        message: res?.message || "Counter status updated.",
      });

      await load();
    } catch (err) {
      setNotice({
        type: "error",
        message: err.message,
      });
    } finally {
      setBusyStatus(null);
    }
  }

  const counter = dashboard?.counter;
  const office = dashboard?.office;
  const currentToken = dashboard?.currentToken;

  const counterName =
    counter?.name ||
    (counter?.number ? `Counter ${counter.number}` : "Counter");

  const style = counterStyle(counter?.status);

  const currentStatus =
    STATUS_OPTIONS.find((item) => item.value === counter?.status) ||
    STATUS_OPTIONS[0];

  return (
    <div className="min-h-screen bg-[#f4f7f7]">
      <OperatorNavbar user={user} />

      <main className="relative overflow-hidden">
        {/* Decorative background */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-40 -top-40 h-96 w-96 rounded-full bg-teal-100/40 blur-3xl" />
          <div className="absolute -left-40 top-[420px] h-96 w-96 rounded-full bg-blue-100/30 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* ================= HEADER ================= */}
          <section className="relative overflow-hidden rounded-[28px] bg-[#0c2430] px-6 py-8 shadow-xl sm:px-8 lg:px-10">
            {/* Header decorative shapes */}
            <div className="absolute -right-20 -top-32 h-80 w-80 rounded-full bg-teal-500/10 blur-2xl" />
            <div className="absolute right-20 bottom-[-120px] h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />

            <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-teal-400/30 bg-teal-400/10 px-3.5 py-1.5">
                  <span className="h-2 w-2 rounded-full bg-teal-300 shadow-[0_0_10px_rgba(94,234,212,0.8)]" />
                  <span className="text-xs font-bold uppercase tracking-[0.16em] text-teal-200">
                    Operator Portal
                  </span>
                </div>

                <h1 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
                  Counter Control
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                  Manage your assigned service counter, control availability,
                  and stay ready to serve citizens efficiently.
                </p>
              </div>

              {/* Live counter status */}
              {!loading && dashboard && (
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 backdrop-blur">
                  <span
                    className={`h-3 w-3 rounded-full ${currentStatus.dot}`}
                  />

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Current status
                    </p>

                    <p className="mt-0.5 font-semibold text-white">
                      {currentStatus.label}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>

          <div className="mt-5">
            <Notice
              notice={notice}
              onClose={() => setNotice(null)}
            />
          </div>

          {/* ================= LOADING ================= */}
          {loading ? (
            <div className="mt-6">
              <PageSkeleton />
            </div>
          ) : error && !dashboard ? (
            <div className="mt-6">
              <ErrorState
                message={error}
                onRetry={() => {
                  setLoading(true);
                  load();
                }}
              />
            </div>
          ) : (
            <>
              {/* ================= COUNTER HERO ================= */}
              <section className="mt-6 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
                <div className="relative p-6 sm:p-8">
                  <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-teal-50 blur-3xl" />

                  <div className="relative flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-5">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#dff8f4] to-[#dff1ff] text-2xl shadow-inner">
                        🏛️
                      </div>

                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                          Assigned Service Counter
                        </p>

                        <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                          {counterName}
                        </h2>

                        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                          <span>{office?.name || "Government Office"}</span>

                          {counter?.number != null && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span>
                                Counter No. {counter.number}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="hidden h-10 w-px bg-slate-200 sm:block" />

                      <CounterStatusPill status={counter?.status} />
                    </div>
                  </div>
                </div>

                {/* Quick statistics */}
                <div className="grid border-t border-slate-100 sm:grid-cols-3">
                  <div className="border-b border-slate-100 p-5 sm:border-b-0 sm:border-r">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      People Waiting
                    </p>

                    <p className="mt-1 text-3xl font-bold text-slate-900">
                      {dashboard?.waitingCount ?? 0}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Citizens currently in queue
                    </p>
                  </div>

                  <div className="border-b border-slate-100 p-5 sm:border-b-0 sm:border-r">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Current Token
                    </p>

                    <p className="mt-1 text-3xl font-bold text-teal-700">
                      {currentToken?.tokenNumber || "—"}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Currently assigned
                    </p>
                  </div>

                  <div className="p-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Counter Status
                    </p>

                    <div className="mt-2 flex items-center gap-2">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${currentStatus.dot}`}
                      />

                      <p className="font-bold text-slate-900">
                        {currentStatus.label}
                      </p>
                    </div>

                    <p className="mt-1 text-xs text-slate-500">
                      Service availability
                    </p>
                  </div>
                </div>
              </section>

              {/* ================= MAIN CONTENT ================= */}
              <section className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                {/* ================= STATUS CONTROL ================= */}
                <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-100 px-6 py-6 sm:px-8">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-600">
                          Availability
                        </p>

                        <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                          Counter Status
                        </h2>

                        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                          Choose whether your counter is ready to receive and
                          serve new citizens.
                        </p>
                      </div>

                      <div className="hidden h-12 w-12 items-center justify-center rounded-xl bg-slate-50 sm:flex">
                        <span className="text-xl">◉</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 sm:p-8">
                    {/* Current status banner */}
                    <div
                      className={`rounded-2xl p-5 ${style.box}`}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`mt-1.5 h-3 w-3 shrink-0 rounded-full ${style.dot}`}
                        />

                        <div>
                          <p className={`font-bold ${style.text}`}>
                            Counter is {style.label}
                          </p>

                          <p className={`mt-1 text-sm leading-5 ${style.text}`}>
                            {counter?.status === "AVAILABLE"
                              ? "You can call and serve citizens."
                              : "You cannot call new tokens until the counter is Available."}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Status options */}
                    <div
                      className="mt-6 space-y-3"
                      role="radiogroup"
                      aria-label="Counter status"
                    >
                      {STATUS_OPTIONS.map((opt) => {
                        const selected =
                          counter?.status === opt.value;

                        const isBusy =
                          busyStatus === opt.value;

                        return (
                          <button
                            key={opt.value}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            disabled={!!busyStatus || selected}
                            onClick={() =>
                              changeStatus(opt.value)
                            }
                            className={`group flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all duration-200 disabled:cursor-not-allowed ${
                              selected
                                ? `${opt.selected} shadow-sm`
                                : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm disabled:opacity-60"
                            }`}
                          >
                            <span
                              className={`h-3 w-3 shrink-0 rounded-full ${opt.dot} ${
                                selected
                                  ? "ring-4 ring-white"
                                  : ""
                              }`}
                            />

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-slate-900">
                                  {opt.label}
                                </p>

                                {selected && (
                                  <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500 shadow-sm">
                                    Current
                                  </span>
                                )}
                              </div>

                              <p className="mt-0.5 text-xs leading-5 text-slate-500">
                                {opt.desc}
                              </p>
                            </div>

                            {isBusy ? (
                              <Spinner />
                            ) : (
                              <span
                                className={`text-lg transition-transform ${
                                  selected
                                    ? "text-slate-400"
                                    : "text-slate-300 group-hover:translate-x-1 group-hover:text-teal-600"
                                }`}
                              >
                                →
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* ================= INFORMATION ================= */}
                <div className="space-y-6">
                  <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-600">
                      Assignment
                    </p>

                    <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                      Counter Information
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Details about your current service assignment.
                    </p>

                    <dl className="mt-6 divide-y divide-slate-100 rounded-2xl border border-slate-100 bg-slate-50/70">
                      <div className="flex items-center justify-between gap-4 px-4 py-4">
                        <dt className="text-sm text-slate-500">
                          Counter
                        </dt>

                        <dd className="text-right text-sm font-bold text-slate-900">
                          {counterName}
                        </dd>
                      </div>

                      {counter?.number != null && (
                        <div className="flex items-center justify-between gap-4 px-4 py-4">
                          <dt className="text-sm text-slate-500">
                            Counter number
                          </dt>

                          <dd className="text-sm font-bold text-slate-900">
                            {counter.number}
                          </dd>
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-4 px-4 py-4">
                        <dt className="text-sm text-slate-500">
                          Office
                        </dt>

                        <dd className="max-w-[55%] text-right text-sm font-bold text-slate-900">
                          {office?.name || "—"}
                        </dd>
                      </div>

                      <div className="flex items-center justify-between gap-4 px-4 py-4">
                        <dt className="text-sm text-slate-500">
                          People waiting
                        </dt>

                        <dd className="text-sm font-bold text-teal-700">
                          {dashboard?.waitingCount ?? 0}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  {/* Current token */}
                  <div className="relative overflow-hidden rounded-[28px] bg-[#0c2430] p-6 shadow-lg sm:p-7">
                    <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-teal-400/10 blur-2xl" />

                    <div className="relative">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-300">
                            Live Service
                          </p>

                          <h3 className="mt-1 text-xl font-bold text-white">
                            Current Token
                          </h3>
                        </div>

                        <span className="flex items-center gap-2 rounded-full bg-emerald-400/10 px-3 py-1.5 text-xs font-bold text-emerald-300">
                          <span className="h-2 w-2 rounded-full bg-emerald-400" />
                          Live
                        </span>
                      </div>

                      {currentToken ? (
                        <div className="mt-6">
                          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5">
                            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                              Serving
                            </p>

                            <div className="mt-1 flex items-end justify-between gap-4">
                              <div>
                                <p className="text-4xl font-bold tracking-tight text-white">
                                  {currentToken.tokenNumber}
                                </p>

                                <p className="mt-1 text-sm text-slate-400">
                                  {currentToken.serviceId?.name ||
                                    "Service"}
                                </p>
                              </div>

                              <TokenStatusBadge
                                status={currentToken.status}
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-6 rounded-2xl border border-dashed border-white/15 bg-white/[0.04] p-6 text-center">
                          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-xl">
                            —
                          </div>

                          <p className="mt-3 font-semibold text-white">
                            No active token
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            No citizen is currently assigned to this counter.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              {/* ================= BOTTOM INFO ================= */}
              <section className="mt-6 rounded-[24px] border border-slate-200 bg-white px-6 py-5 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                      ✓
                    </div>

                    <div>
                      <p className="font-semibold text-slate-900">
                        Counter assignments are centrally managed
                      </p>

                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Contact your administrator if you need your office,
                        counter, or service assignment changed.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate("/operator/queue")}
                    className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700"
                  >
                    ← Queue Management
                  </button>
                </div>
              </section>

              {/* ================= FOOTER STATUS ================= */}
              <div className="flex items-center justify-center gap-2 py-7 text-xs text-slate-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                QueueLess Government Service Network
                <span className="text-slate-300">•</span>
                Secure operator access
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}