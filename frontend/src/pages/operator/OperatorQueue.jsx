import { useNavigate } from "react-router-dom";

import OperatorNavbar from "../../components/operator/OperatorNavbar";
import useOperatorQueue from "../../hooks/useOperatorQueue";

import {
  callNextToken,
  startToken,
  completeToken,
  skipToken,
  recallToken,
} from "../../services/operatorApi";

import {
  ActionButton,
  CounterStatusPill,
  ErrorState,
  Notice,
  PageSkeleton,
  TokenStatusBadge,
  formatTime,
  getId,
} from "../../components/operator/OperatorUi";

/* -------------------------------------------------------
   Small visual icon component
------------------------------------------------------- */

function Icon({ children, className = "" }) {
  return (
    <span
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${className}`}
    >
      {children}
    </span>
  );
}

/* -------------------------------------------------------
   Operator Queue Page
------------------------------------------------------- */

export default function OperatorQueue({ user }) {
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

  /* -------------------------------------------------------
     Existing dashboard data
  ------------------------------------------------------- */

  const counter = dashboard?.counter;
  const office = dashboard?.office;
  const currentToken = dashboard?.currentToken;

  const currentId = getId(currentToken);

  const waiting = queue.filter((t) => t.status === "WAITING");

  const nextToken = waiting[0];

  const counterReady = counter?.status === "AVAILABLE";

  const canCallNext = counterReady && !currentToken;

  const counterName =
    counter?.name ||
    (counter?.number ? `Counter ${counter.number}` : "Service Counter");

  /* -------------------------------------------------------
     Call next hint
  ------------------------------------------------------- */

  let callNextHint = "";

  if (currentToken) {
    callNextHint = "Finish or skip the current token first.";
  } else if (!counterReady) {
    callNextHint = `Counter is ${
      counter?.status || "unavailable"
    }. Set it to Available to call tokens.`;
  }

  /* -------------------------------------------------------
     Statistics
  ------------------------------------------------------- */

  const servingCount = queue.filter(
    (token) => token.status === "SERVING"
  ).length;

  const calledCount = queue.filter(
    (token) => token.status === "CALLED"
  ).length;

  /* -------------------------------------------------------
     Main UI
  ------------------------------------------------------- */

  return (
    <div className="min-h-screen bg-[#f4f8f7] text-slate-900">
      <OperatorNavbar user={user} />

      {/* -------------------------------------------------
          Main container
      ------------------------------------------------- */}

      <main className="mx-auto max-w-[1450px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">

        {/* -------------------------------------------------
            Page Header
        ------------------------------------------------- */}

        <section className="relative overflow-hidden rounded-[28px] bg-[#071526] px-6 py-7 shadow-xl sm:px-8 lg:px-10 lg:py-9">

          {/* Decorative background */}
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-teal-400/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 left-1/3 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />

          <div className="relative flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">

            <div>
              {/* Portal badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-teal-400/30 bg-teal-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-teal-300">
                <span className="h-2 w-2 rounded-full bg-teal-400 shadow-[0_0_10px_rgba(45,212,191,0.8)]" />
                Operator Control Center
              </div>

              <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
                Manage the queue.
              </h1>

              <p className="mt-2 text-2xl font-bold text-teal-300 sm:text-3xl">
                Keep citizens moving.
              </p>

              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                Manage tokens at your assigned counter, call the next citizen,
                and keep the service flow moving in real time.
              </p>
            </div>

            {/* Live status */}
            <div className="shrink-0">
              <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-5 backdrop-blur-sm lg:min-w-[270px]">
                <div className="flex items-center justify-between gap-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                      Queue Status
                    </p>

                    <p className="mt-2 text-xl font-bold text-white">
                      Live & Active
                    </p>
                  </div>

                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-400/10">
                    <span className="h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.9)]" />
                  </div>
                </div>

                <div className="mt-4 h-px bg-white/10" />

                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-slate-400">Waiting citizens</span>
                  <span className="font-bold text-teal-300">
                    {waiting.length}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* -------------------------------------------------
            Notification
        ------------------------------------------------- */}

        <Notice
          notice={notice}
          onClose={() => setNotice(null)}
        />

        {/* -------------------------------------------------
            Loading / Error
        ------------------------------------------------- */}

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
            {/* Refresh error */}
            {error && (
              <div className="mt-5 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
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

            {/* -------------------------------------------------
                Office / Counter information
            ------------------------------------------------- */}

            <section className="mt-6 rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.05)] sm:p-6">

              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                <div className="flex items-center gap-4">

                  <Icon className="bg-teal-50 text-2xl">
                    🏛️
                  </Icon>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                      Assigned Office
                    </p>

                    <h2 className="mt-1 text-xl font-extrabold text-[#0f172a]">
                      {office?.name || "Assigned Government Office"}
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      {counterName}
                    </p>
                  </div>

                </div>

                <div className="flex items-center gap-3">
                  <div className="hidden rounded-xl bg-slate-50 px-4 py-2 text-sm text-slate-500 sm:block">
                    Counter
                  </div>

                  <CounterStatusPill status={counter?.status} />
                </div>

              </div>
            </section>

            {/* -------------------------------------------------
                Statistics
            ------------------------------------------------- */}

            <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

              {/* Waiting */}
              <div className="group rounded-[22px] border border-slate-200/80 bg-white p-5 shadow-[0_8px_25px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:shadow-lg">

                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      People Waiting
                    </p>

                    <p className="mt-2 text-3xl font-black text-[#0f172a]">
                      {waiting.length}
                    </p>
                  </div>

                  <Icon className="bg-teal-50 text-xl">
                    👥
                  </Icon>
                </div>

                <p className="mt-3 text-xs text-slate-400">
                  Citizens currently in queue
                </p>
              </div>

              {/* Current */}
              <div className="group rounded-[22px] border border-slate-200/80 bg-white p-5 shadow-[0_8px_25px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:shadow-lg">

                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      Current Token
                    </p>

                    <p className="mt-2 text-3xl font-black text-[#0f172a]">
                      {currentToken?.tokenNumber || "—"}
                    </p>
                  </div>

                  <Icon className="bg-cyan-50 text-xl">
                    🎟️
                  </Icon>
                </div>

                <p className="mt-3 text-xs text-slate-400">
                  {currentToken
                    ? currentToken.status
                    : "No active token"}
                </p>
              </div>

              {/* Serving */}
              <div className="group rounded-[22px] border border-slate-200/80 bg-white p-5 shadow-[0_8px_25px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:shadow-lg">

                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      Serving
                    </p>

                    <p className="mt-2 text-3xl font-black text-[#0f172a]">
                      {servingCount}
                    </p>
                  </div>

                  <Icon className="bg-emerald-50 text-xl">
                    ✓
                  </Icon>
                </div>

                <p className="mt-3 text-xs text-slate-400">
                  Currently being served
                </p>
              </div>

              {/* Called */}
              <div className="group rounded-[22px] border border-slate-200/80 bg-white p-5 shadow-[0_8px_25px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:shadow-lg">

                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      Called
                    </p>

                    <p className="mt-2 text-3xl font-black text-[#0f172a]">
                      {calledCount}
                    </p>
                  </div>

                  <Icon className="bg-amber-50 text-xl">
                    🔔
                  </Icon>
                </div>

                <p className="mt-3 text-xs text-slate-400">
                  Waiting to be served
                </p>
              </div>

            </section>

            {/* -------------------------------------------------
                Main Queue Control
            ------------------------------------------------- */}

            <section className="mt-6 grid gap-6 lg:grid-cols-[1.55fr_0.8fr]">

              {/* -----------------------------------------------
                  Current Token
              ----------------------------------------------- */}

              <div className="overflow-hidden rounded-[26px] border border-slate-200/80 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.06)]">

                {/* Card header */}
                <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-teal-500" />

                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">
                        Current Queue
                      </p>
                    </div>

                    <h2 className="mt-1 text-2xl font-extrabold text-[#0f172a]">
                      Current Token
                    </h2>
                  </div>

                  {currentToken && (
                    <TokenStatusBadge status={currentToken.status} />
                  )}

                </div>

                {currentToken ? (
                  <div className="p-6">

                    {/* Token display */}
                    <div className="rounded-[22px] bg-[#f2f8f7] p-6 sm:p-8">

                      <div className="flex flex-col gap-7 xl:flex-row xl:items-center xl:justify-between">

                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                            Token Number
                          </p>

                          <div className="mt-1 flex items-end gap-3">
                            <h3 className="text-6xl font-black tracking-tight text-[#087f78] sm:text-7xl">
                              {currentToken.tokenNumber}
                            </h3>

                            <span className="mb-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                              LIVE
                            </span>
                          </div>

                          <p className="mt-3 text-sm text-slate-500">
                            Citizen is currently at your counter.
                          </p>
                        </div>

                        {/* Token information */}
                        <div className="grid grid-cols-2 gap-3 sm:min-w-[370px]">

                          <div className="rounded-2xl bg-white p-4 shadow-sm">
                            <p className="text-xs text-slate-400">
                              Citizen
                            </p>

                            <p className="mt-1 truncate font-bold text-slate-900">
                              {currentToken.userId?.name || "—"}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-white p-4 shadow-sm">
                            <p className="text-xs text-slate-400">
                              Service
                            </p>

                            <p className="mt-1 truncate font-bold text-slate-900">
                              {currentToken.serviceId?.name || "—"}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-white p-4 shadow-sm">
                            <p className="text-xs text-slate-400">
                              Counter
                            </p>

                            <p className="mt-1 font-bold text-slate-900">
                              {counterName}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-white p-4 shadow-sm">
                            <p className="text-xs text-slate-400">
                              Called At
                            </p>

                            <p className="mt-1 font-bold text-slate-900">
                              {formatTime(currentToken.calledAt)}
                            </p>
                          </div>

                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">

                      {currentToken.status === "CALLED" && (
                        <ActionButton
                          className="!rounded-xl !bg-[#079b91] !px-5 !py-3 !font-bold !text-white shadow-md shadow-teal-900/10 transition hover:!bg-[#07877f] sm:col-span-2"
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
                          ▶ Start Serving
                        </ActionButton>
                      )}

                      {currentToken.status === "SERVING" && (
                        <ActionButton
                          className="!rounded-xl !bg-emerald-600 !px-5 !py-3 !font-bold !text-white shadow-md shadow-emerald-900/10 transition hover:!bg-emerald-700 sm:col-span-2"
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
                          ✓ Complete Service
                        </ActionButton>
                      )}

                      <ActionButton
                        className="!rounded-xl !border !border-slate-200 !bg-white !px-5 !py-3 !font-bold !text-slate-700 transition hover:!border-teal-200 hover:!bg-teal-50"
                        busy={busy === "recall"}
                        disabled={!!busy}
                        busyLabel="Recalling..."
                        onClick={() =>
                          runAction(
                            "recall",
                            () => recallToken(currentId),
                            "Token recalled."
                          )
                        }
                      >
                        ↻ Recall Token
                      </ActionButton>

                      {currentToken.status === "CALLED" && (
                        <ActionButton
                          className="!rounded-xl !border !border-red-200 !bg-red-50 !px-5 !py-3 !font-bold !text-red-600 transition hover:!bg-red-100"
                          busy={busy === "skip"}
                          disabled={!!busy}
                          busyLabel="Skipping..."
                          onClick={() =>
                            runAction(
                              "skip",
                              () => skipToken(currentId),
                              "Token skipped."
                            )
                          }
                        >
                          Skip Token
                        </ActionButton>
                      )}

                    </div>
                  </div>
                ) : (
                  <div className="p-6">
                    <div className="rounded-[22px] border border-dashed border-slate-300 bg-[#f7faf9] px-6 py-14 text-center">

                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
                        🎟️
                      </div>

                      <p className="mt-5 text-xl font-extrabold text-slate-800">
                        No active token
                      </p>

                      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                        {waiting.length > 0
                          ? "There are citizens waiting. Call the next token to begin serving."
                          : "No citizens are currently waiting in your queue."}
                      </p>

                    </div>
                  </div>
                )}
              </div>

              {/* -----------------------------------------------
                  Next Queue Card
              ----------------------------------------------- */}

              <div className="overflow-hidden rounded-[26px] bg-[#082027] shadow-[0_12px_40px_rgba(8,32,39,0.18)]">

                <div className="p-6 sm:p-7">

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-300">
                        Next In Queue
                      </p>

                      <h2 className="mt-1 text-2xl font-extrabold text-white">
                        Call Next
                      </h2>
                    </div>

                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-xl">
                      →
                    </div>
                  </div>

                  {nextToken ? (
                    <>

                      <div className="mt-7 rounded-[22px] border border-white/10 bg-white/[0.07] p-6">

                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                          Next Token
                        </p>

                        <h3 className="mt-1 text-5xl font-black text-teal-300">
                          {nextToken.tokenNumber}
                        </h3>

                        <p className="mt-3 text-sm text-slate-300">
                          {nextToken.serviceId?.name || "Service"}
                        </p>

                        <div className="mt-5 h-px bg-white/10" />

                        <div className="mt-4 flex justify-between text-sm">
                          <span className="text-slate-400">
                            People behind
                          </span>

                          <span className="font-bold text-white">
                            {Math.max(waiting.length - 1, 0)}
                          </span>
                        </div>

                      </div>

                      <ActionButton
                        className="mt-5 !w-full !rounded-xl !bg-teal-400 !px-5 !py-3.5 !font-extrabold !text-[#06252a] shadow-lg shadow-teal-950/20 transition hover:!bg-teal-300"
                        busy={busy === "next"}
                        disabled={!canCallNext || !!busy}
                        busyLabel="Calling..."
                        onClick={() =>
                          runAction(
                            "next",
                            callNextToken,
                            "Next token called."
                          )
                        }
                      >
                        Call {nextToken.tokenNumber}
                      </ActionButton>

                    </>
                  ) : (
                    <div className="mt-7 rounded-[22px] border border-white/10 bg-white/[0.05] p-7 text-center">

                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-xl">
                        ✓
                      </div>

                      <h3 className="mt-4 font-bold text-white">
                        Queue is empty
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-slate-400">
                        No citizens are currently waiting.
                      </p>

                    </div>
                  )}

                  {callNextHint && (
                    <div className="mt-4 rounded-xl bg-amber-400/10 px-4 py-3 text-xs leading-5 text-amber-200">
                      {callNextHint}
                    </div>
                  )}

                  {/* Queue count */}
                  <div className="mt-7 flex items-center justify-between border-t border-white/10 pt-5">
                    <span className="text-sm text-slate-400">
                      Total waiting
                    </span>

                    <span className="text-lg font-extrabold text-white">
                      {waiting.length}
                    </span>
                  </div>

                </div>
              </div>

            </section>

            {/* -------------------------------------------------
                Waiting Queue
            ------------------------------------------------- */}

            <section className="mt-6 overflow-hidden rounded-[26px] border border-slate-200/80 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.05)]">

              <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">

                <div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-teal-500" />

                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">
                      Live Queue
                    </p>
                  </div>

                  <h2 className="mt-1 text-2xl font-extrabold text-[#0f172a]">
                    Waiting Queue
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {waiting.length}{" "}
                    {waiting.length === 1 ? "citizen" : "citizens"} currently waiting
                  </p>
                </div>

                <button
                  type="button"
                  onClick={load}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700"
                >
                  ↻ Refresh Queue
                </button>

              </div>

              {waiting.length === 0 ? (
                <div className="p-6">
                  <div className="rounded-[22px] border border-dashed border-slate-300 bg-[#f7faf9] p-12 text-center">

                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
                      ✓
                    </div>

                    <p className="mt-5 font-bold text-slate-800">
                      No citizens are waiting
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      The queue is clear right now.
                    </p>

                  </div>
                </div>
              ) : (
                <div className="p-4 sm:p-6">

                  <div className="space-y-3">

                    {waiting.map((token, index) => (
                      <div
                        key={getId(token) || token.tokenNumber}
                        className={`group flex flex-col gap-4 rounded-2xl border p-4 transition sm:flex-row sm:items-center sm:justify-between ${
                          index === 0
                            ? "border-teal-200 bg-teal-50/50 shadow-sm"
                            : "border-slate-100 bg-slate-50/60 hover:border-teal-100 hover:bg-white hover:shadow-sm"
                        }`}
                      >

                        <div className="flex min-w-0 items-center gap-4">

                          {/* Position */}
                          <div
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-black ${
                              index === 0
                                ? "bg-[#079b91] text-white"
                                : "bg-white text-slate-500 shadow-sm"
                            }`}
                          >
                            {index + 1}
                          </div>

                          {/* Token */}
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">

                              <p className="text-lg font-black text-slate-900">
                                {token.tokenNumber}
                              </p>

                              {index === 0 && (
                                <span className="rounded-full bg-teal-100 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-teal-700">
                                  Next
                                </span>
                              )}

                            </div>

                            <p className="mt-1 truncate text-sm text-slate-500">
                              {token.serviceId?.name || "Service"}

                              {token.serviceId?.averageServiceTime
                                ? ` • avg. ${token.serviceId.averageServiceTime} min`
                                : ""}
                            </p>
                          </div>

                        </div>

                        {/* Right info */}
                        <div className="flex items-center justify-between gap-5 sm:justify-end">

                          <div className="text-left sm:text-right">
                            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                              Joined
                            </p>

                            <p className="mt-1 text-sm font-bold text-slate-700">
                              {formatTime(token.createdAt)}
                            </p>
                          </div>

                          <TokenStatusBadge status={token.status} />

                        </div>

                      </div>
                    ))}

                  </div>
                </div>
              )}

            </section>

            {/* -------------------------------------------------
                Bottom information / navigation
            ------------------------------------------------- */}

            <section className="mt-6 grid gap-4 md:grid-cols-3">

              <button
                type="button"
                onClick={() => navigate("/operator")}
                className="group rounded-[22px] border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md"
              >
                <div className="flex items-center gap-4">

                  <Icon className="bg-teal-50 text-xl">
                    📊
                  </Icon>

                  <div>
                    <p className="font-bold text-slate-900">
                      Dashboard
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      View operator overview
                    </p>
                  </div>

                </div>
              </button>

              <button
                type="button"
                onClick={() => navigate("/operator/counter")}
                className="group rounded-[22px] border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md"
              >
                <div className="flex items-center gap-4">

                  <Icon className="bg-cyan-50 text-xl">
                    🖥️
                  </Icon>

                  <div>
                    <p className="font-bold text-slate-900">
                      Counter Control
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Manage counter status
                    </p>
                  </div>

                </div>
              </button>

              <div className="rounded-[22px] border border-teal-100 bg-teal-50 p-5">
                <div className="flex items-start gap-4">

                  <Icon className="bg-white text-xl shadow-sm">
                    ℹ️
                  </Icon>

                  <div>
                    <p className="font-bold text-slate-900">
                      Queue handling
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-600">
                      Use Recall when a citizen needs to be called again.
                      Use Skip when the citizen does not arrive.
                    </p>
                  </div>

                </div>
              </div>

            </section>

          </>
        )}
      </main>
    </div>
  );
}