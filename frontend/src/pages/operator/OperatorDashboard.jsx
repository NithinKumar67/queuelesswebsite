import { useNavigate } from "react-router-dom";
import OperatorNavbar from "../../components/operator/OperatorNavbar";
import useOperatorQueue from "../../hooks/useOperatorQueue";

import {
  callNextToken,
  startToken,
  completeToken,
  updateCounterStatus,
} from "../../services/operatorApi";

import {
  ActionButton,
  BTN,
  CounterStatusPill,
  ErrorState,
  Notice,
  PageSkeleton,
  TokenStatusBadge,
  counterStyle,
  formatTime,
  getId,
} from "../../components/operator/OperatorUi";

function greeting() {
  const h = new Date().getHours();

  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";

  return "Good evening";
}

/* -------------------------------------------------------
   Small visual icons
------------------------------------------------------- */

function UsersIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-6 w-6"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function TicketIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-6 w-6"
    >
      <path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4V7Z" />
      <path d="M13 8v2" />
      <path d="M13 14v2" />
    </svg>
  );
}

function MonitorIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-6 w-6"
    >
      <rect x="3" y="4" width="18" height="13" rx="2" />
      <path d="M8 21h8" />
      <path d="M12 17v4" />
    </svg>
  );
}

function QueueIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-6 w-6"
    >
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h10" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-4 w-4"
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
    >
      <path d="M8 5v14" />
      <path d="M16 5v14" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-5 w-5"
    >
      <path d="M8 5v14l11-7L8 5Z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      className="h-5 w-5"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

/* -------------------------------------------------------
   Main Dashboard
------------------------------------------------------- */

export default function OperatorDashboard({ user }) {
  const navigate = useNavigate();

  const {
    dashboard,
    queue,
    loading,
    setLoading,
    error,
    busy,
    notice,
    setNotice,
    load,
    runAction,
  } = useOperatorQueue();

  const operator = dashboard?.operator;
  const office = dashboard?.office;
  const counter = dashboard?.counter;
  const currentToken = dashboard?.currentToken;

  const currentId = getId(currentToken);

  const waiting = queue.filter((t) => t.status === "WAITING");

  const counterStatus = counter?.status;

  const counterName =
    counter?.name ||
    (counter?.number ? `Counter ${counter.number}` : "Counter");

  const operatorName =
    operator?.name ||
    user?.name ||
    "Operator";

  const isAvailable = counterStatus === "AVAILABLE";

  const statusStyle = counterStyle(counterStatus);

  const stats = [
    {
      label: "People Waiting",
      value: dashboard?.waitingCount ?? waiting.length,
      description: "Citizens waiting in queue",
      icon: <UsersIcon />,
    },
    {
      label: "Current Token",
      value: currentToken?.tokenNumber || "—",
      description: currentToken
        ? `${currentToken.status.toLowerCase()} at counter`
        : "No active token",
      icon: <TicketIcon />,
    },
    {
      label: "Counter Status",
      value: statusStyle.label,
      description: counterName,
      icon: <MonitorIcon />,
    },
    {
      label: "Active Tokens",
      value: queue.length,
      description: "Waiting, called or serving",
      icon: <QueueIcon />,
    },
    {
      label: "Tokens Served Today",
      value: dashboard?.servedTodayCount ?? 0,
      description: "Completed at your counter today",
      icon: <CheckIcon />,
    },
  ];

  return (
    <div className="min-h-screen bg-[#f4f8f8] text-slate-900">

      <OperatorNavbar user={user || operator} />

      {/* =====================================================
          PREMIUM HEADER / HERO
      ===================================================== */}

      <section className="relative overflow-hidden bg-[#073d3b]">

        {/* Background decorative shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -left-32 -top-40 h-[420px] w-[420px] rounded-full bg-teal-400/10 blur-3xl" />
          <div className="absolute right-0 top-0 h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-3xl" />
          <div className="absolute bottom-[-180px] left-[35%] h-[400px] w-[400px] rounded-full bg-cyan-400/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">

          {/* Portal badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-300/30 bg-teal-300/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-teal-200">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
            Operator Control Portal
          </div>

          <div className="mt-7 grid gap-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">

            {/* Hero text */}
            <div>
              <p className="text-sm font-semibold text-teal-200">
                {office?.name || "Government Service Office"}
              </p>

              <h1 className="mt-3 max-w-3xl text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
                {greeting()},
                <span className="block text-teal-300">
                  {operatorName}.
                </span>
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-200 sm:text-lg">
                Manage your service counter, call citizens and keep the
                government queue moving smoothly.
              </p>

              {/* Live indicator */}
              <div className="mt-7 flex flex-wrap items-center gap-3">

                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-200">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                  Queue system live
                </div>

                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200">
                  <MonitorIcon />
                  {counterName}
                </div>

              </div>
            </div>

            {/* Status card */}
            <div className="rounded-3xl border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur-xl">

              <div className="flex items-start justify-between gap-4">

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Counter status
                  </p>

                  <h2 className="mt-2 text-2xl font-bold text-white">
                    {counterName}
                  </h2>
                </div>

                <CounterStatusPill status={counterStatus} />
              </div>

              <div className="mt-5 border-t border-white/10 pt-5">

                <p className="text-xs uppercase tracking-wider text-slate-400">
                  Citizens waiting
                </p>

                <div className="mt-1 flex items-end justify-between">
                  <p className="text-5xl font-black text-white">
                    {dashboard?.waitingCount ?? waiting.length}
                  </p>

                  <div className="flex items-center gap-2 pb-2 text-sm font-semibold text-emerald-300">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    Live
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        <Notice
          notice={notice}
          onClose={() => setNotice(null)}
        />

        {loading ? (

          <PageSkeleton />

        ) : error && !dashboard ? (

          <ErrorState
            message={error}
            onRetry={() => {
              setLoading(true);
              load();
            }}
          />

        ) : (

          <>

            {error && (
              <div className="mb-6 flex items-center justify-between rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
                <span>
                  Couldn't refresh: {error}
                </span>

                <button
                  type="button"
                  onClick={load}
                  className="font-bold underline"
                >
                  Retry
                </button>
              </div>
            )}

            {/* =================================================
                STAT CARDS
            ================================================= */}

            <section className="-mt-1 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">

              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.05)] transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                >

                  <div className="flex items-start justify-between">

                    <div>
                      <p className="text-sm font-medium text-slate-500">
                        {stat.label}
                      </p>

                      <p className="mt-2 text-3xl font-black tracking-tight text-slate-900">
                        {stat.value}
                      </p>
                    </div>

                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-teal-50 to-blue-50 text-teal-700 transition group-hover:scale-105">
                      {stat.icon}
                    </div>

                  </div>

                  <p className="mt-3 text-xs text-slate-500">
                    {stat.description}
                  </p>

                </div>
              ))}

            </section>

            {/* =================================================
                CURRENT TOKEN + QUICK ACTIONS
            ================================================= */}

            <section className="mt-6 grid gap-6 lg:grid-cols-[1.55fr_0.75fr]">

              {/* CURRENT TOKEN */}
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_10px_40px_rgba(15,23,42,0.06)]">

                {/* Card header */}
                <div className="flex flex-col gap-4 border-b border-slate-100 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">

                  <div>
                    <div className="flex items-center gap-2">

                      <span className="h-2.5 w-2.5 rounded-full bg-teal-500" />

                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                        Active Service
                      </p>

                    </div>

                    <h2 className="mt-2 text-2xl font-black text-slate-900">
                      Current Token
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Token currently assigned to your counter
                    </p>
                  </div>

                  {currentToken && (
                    <TokenStatusBadge
                      status={currentToken.status}
                    />
                  )}

                </div>

                {/* Token body */}
                {currentToken ? (

                  <div className="p-6 sm:p-7">

                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#073d3b] via-[#075e5a] to-[#075985] p-6 text-white shadow-xl sm:p-8">

                      {/* decorative */}
                      <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-teal-300/10" />
                      <div className="absolute -bottom-20 left-1/3 h-52 w-52 rounded-full bg-blue-300/10" />

                      <div className="relative grid gap-8 md:grid-cols-[0.85fr_1.15fr] md:items-center">

                        {/* Token number */}
                        <div>

                          <p className="text-sm font-medium text-teal-200">
                            NOW SERVING
                          </p>

                          <p className="mt-2 text-7xl font-black tracking-tight text-white sm:text-8xl">
                            {currentToken.tokenNumber}
                          </p>

                          <div className="mt-4 flex items-center gap-2 text-sm text-emerald-200">
                            <span className="h-2 w-2 rounded-full bg-emerald-400" />
                            {currentToken.status === "SERVING"
                              ? "Service in progress"
                              : "Citizen called"}
                          </div>

                        </div>

                        {/* Token information */}
                        <div className="grid grid-cols-2 gap-3">

                          <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                            <p className="text-xs text-slate-300">
                              Citizen
                            </p>

                            <p className="mt-1 truncate font-bold text-white">
                              {currentToken.userId?.name || "—"}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                            <p className="text-xs text-slate-300">
                              Counter
                            </p>

                            <p className="mt-1 truncate font-bold text-white">
                              {counterName}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                            <p className="text-xs text-slate-300">
                              Service
                            </p>

                            <p className="mt-1 truncate font-bold text-white">
                              {currentToken.serviceId?.name || "—"}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                            <p className="text-xs text-slate-300">
                              {currentToken.status === "SERVING"
                                ? "Started"
                                : "Called"}
                            </p>

                            <p className="mt-1 font-bold text-white">
                              {formatTime(
                                currentToken.status === "SERVING"
                                  ? currentToken.startedAt
                                  : currentToken.calledAt
                              )}
                            </p>
                          </div>

                        </div>

                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-5 grid gap-3 sm:grid-cols-3">

                      {!currentToken && (
                        <ActionButton
                          className={`${BTN.primary} rounded-xl`}
                          busy={busy === "next"}
                          disabled={
                            !isAvailable ||
                            waiting.length === 0 ||
                            !!busy
                          }
                          busyLabel="Calling..."
                          onClick={() =>
                            runAction(
                              "next",
                              callNextToken,
                              "Next token called."
                            )
                          }
                        >
                          Call Next
                        </ActionButton>
                      )}

                      {currentToken?.status === "CALLED" && (
                        <ActionButton
                          className={`${BTN.primary} rounded-xl`}
                          busy={busy === "start"}
                          disabled={!!busy}
                          busyLabel="Starting..."
                          onClick={() =>
                            runAction(
                              "start",
                              () => startToken(currentId),
                              "Service started."
                            )
                          }
                        >
                          Start Serving
                        </ActionButton>
                      )}

                      {currentToken?.status === "SERVING" && (
                        <ActionButton
                          className={`${BTN.success} rounded-xl`}
                          busy={busy === "complete"}
                          disabled={!!busy}
                          busyLabel="Completing..."
                          onClick={() =>
                            runAction(
                              "complete",
                              () => completeToken(currentId),
                              "Token completed."
                            )
                          }
                        >
                          Complete Token
                        </ActionButton>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          navigate("/operator/queue")
                        }
                        className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700"
                      >
                        Manage Queue
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          navigate("/operator/counter")
                        }
                        className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                      >
                        Counter Control
                      </button>

                    </div>

                    {!currentToken && !isAvailable && (
                      <div className="mt-4 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
                        Counter is{" "}
                        {counterStyle(counterStatus)
                          .label
                          .toLowerCase()}
                        . Set the counter to Available to
                        call tokens.
                      </div>
                    )}

                  </div>

                ) : (

                  /* Empty token */
                  <div className="p-6 sm:p-7">

                    <div className="rounded-3xl border border-dashed border-slate-300 bg-[#f7faf9] p-10 text-center">

                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-teal-600 shadow-sm">
                        <TicketIcon />
                      </div>

                      <h3 className="mt-5 text-xl font-black text-slate-900">
                        No active token
                      </h3>

                      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                        {waiting.length > 0
                          ? `${waiting.length} citizen${
                              waiting.length === 1 ? "" : "s"
                            } waiting. Call the next citizen when ready.`
                          : "There are currently no citizens waiting in your queue."}
                      </p>

                      <button
                        type="button"
                        disabled={
                          !isAvailable ||
                          waiting.length === 0 ||
                          !!busy
                        }
                        onClick={() =>
                          runAction(
                            "next",
                            callNextToken,
                            "Next token called."
                          )
                        }
                        className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-teal-600/20 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Call Next Citizen
                        <ArrowRightIcon />
                      </button>

                    </div>

                  </div>
                )}

              </div>

              {/* QUICK ACTIONS */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_10px_40px_rgba(15,23,42,0.06)]">

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-600">
                    Workspace
                  </p>

                  <h2 className="mt-2 text-2xl font-black text-slate-900">
                    Quick Actions
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Common controls for your counter.
                  </p>
                </div>

                <div className="mt-6 space-y-3">

                  {/* Queue */}
                  <button
                    type="button"
                    onClick={() =>
                      navigate("/operator/queue")
                    }
                    className="group flex w-full items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-teal-200 hover:bg-teal-50"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 transition group-hover:bg-teal-100">
                      <TicketIcon />
                    </span>

                    <span className="flex-1">
                      <span className="block font-bold text-slate-900">
                        View Queue
                      </span>

                      <span className="mt-0.5 block text-xs text-slate-500">
                        Manage waiting citizens
                      </span>
                    </span>

                    <ArrowRightIcon />
                  </button>

                  {/* Counter */}
                  <button
                    type="button"
                    onClick={() =>
                      navigate("/operator/counter")
                    }
                    className="group flex w-full items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                      <MonitorIcon />
                    </span>

                    <span className="flex-1">
                      <span className="block font-bold text-slate-900">
                        Counter Control
                      </span>

                      <span className="mt-0.5 block text-xs text-slate-500">
                        Manage counter availability
                      </span>
                    </span>

                    <ArrowRightIcon />
                  </button>

                  {/* Pause / Resume */}
                  <button
                    type="button"
                    disabled={!!busy}
                    onClick={() =>
                      runAction(
                        "status",
                        () =>
                          updateCounterStatus(
                            isAvailable
                              ? "PAUSED"
                              : "AVAILABLE"
                          ),
                        isAvailable
                          ? "Counter paused."
                          : "Counter is available."
                      )
                    }
                    className="group flex w-full items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-orange-200 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                      {isAvailable ? (
                        <PauseIcon />
                      ) : (
                        <PlayIcon />
                      )}
                    </span>

                    <span className="flex-1">
                      <span className="block font-bold text-slate-900">
                        {busy === "status"
                          ? "Updating..."
                          : isAvailable
                          ? "Pause Counter"
                          : "Set Available"}
                      </span>

                      <span className="mt-0.5 block text-xs text-slate-500">
                        {isAvailable
                          ? "Temporarily stop serving"
                          : "Resume serving citizens"}
                      </span>
                    </span>

                    <ArrowRightIcon />
                  </button>

                </div>

                {/* Counter status */}
                <div className="mt-6 rounded-2xl bg-[#f5f9f8] p-4">

                  <div className="flex items-center gap-3">

                    <span
                      className={`h-3 w-3 rounded-full ${
                        isAvailable
                          ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                          : "bg-orange-400"
                      }`}
                    />

                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        {statusStyle.label}
                      </p>

                      <p className="text-xs text-slate-500">
                        {counterName}
                      </p>
                    </div>

                  </div>

                </div>

              </div>

            </section>

            {/* =================================================
                QUEUE OVERVIEW
            ================================================= */}

            <section className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_10px_40px_rgba(15,23,42,0.05)]">

              <div className="flex flex-col gap-4 border-b border-slate-100 p-6 sm:flex-row sm:items-center sm:justify-between">

                <div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-teal-500" />

                    <p className="text-xs font-bold uppercase tracking-[0.15em] text-teal-600">
                      Live Queue
                    </p>
                  </div>

                  <h2 className="mt-2 text-2xl font-black text-slate-900">
                    Queue Overview
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Next citizens waiting in your office.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    navigate("/operator/queue")
                  }
                  className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700 sm:self-auto"
                >
                  View full queue
                  <ArrowRightIcon />
                </button>

              </div>

              {waiting.length === 0 ? (

                <div className="p-8">

                  <div className="rounded-2xl border border-dashed border-slate-300 bg-[#f8faf9] p-10 text-center">

                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-teal-600 shadow-sm">
                      <UsersIcon />
                    </div>

                    <h3 className="mt-4 font-bold text-slate-900">
                      Queue is clear
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      No citizens are currently waiting.
                    </p>

                  </div>

                </div>

              ) : (

                <div className="overflow-x-auto">

                  <table className="w-full min-w-[700px]">

                    <thead>
                      <tr className="bg-[#f7faf9] text-left text-xs font-bold uppercase tracking-wider text-slate-500">

                        <th className="px-6 py-4">
                          Token
                        </th>

                        <th className="px-6 py-4">
                          Service
                        </th>

                        <th className="px-6 py-4">
                          Position
                        </th>

                        <th className="px-6 py-4">
                          Joined
                        </th>

                        <th className="px-6 py-4">
                          Status
                        </th>

                      </tr>
                    </thead>

                    <tbody>

                      {waiting.slice(0, 5).map((t, i) => (

                        <tr
                          key={
                            getId(t) ||
                            t.tokenNumber
                          }
                          className="border-t border-slate-100 transition hover:bg-teal-50/40"
                        >

                          <td className="px-6 py-5">

                            <div className="flex items-center gap-3">

                              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 font-black text-teal-700">
                                {i + 1}
                              </span>

                              <span className="font-black text-slate-900">
                                {t.tokenNumber}
                              </span>

                            </div>

                          </td>

                          <td className="px-6 py-5 text-sm font-medium text-slate-600">
                            {t.serviceId?.name || "—"}
                          </td>

                          <td className="px-6 py-5">

                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                              #{i + 1}
                            </span>

                          </td>

                          <td className="px-6 py-5 text-sm text-slate-500">
                            {formatTime(t.createdAt)}
                          </td>

                          <td className="px-6 py-5">
                            <TokenStatusBadge
                              status={t.status}
                            />
                          </td>

                        </tr>

                      ))}

                    </tbody>

                  </table>

                </div>

              )}

            </section>

            {/* =================================================
                FOOTER STATUS
            ================================================= */}

            <section className="mt-6 flex flex-col gap-4 rounded-2xl border border-teal-100 bg-gradient-to-r from-teal-50 to-blue-50 p-5 sm:flex-row sm:items-center sm:justify-between">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-teal-600 shadow-sm">
                  <CheckIcon />
                </div>

                <div>
                  <p className="font-bold text-slate-900">
                    QueueLess Operator System
                  </p>

                  <p className="text-xs text-slate-500">
                    Real-time queue management is active.
                  </p>
                </div>

              </div>

              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                System operational
              </div>

            </section>

          </>

        )}

      </main>
    </div>
  );
}
