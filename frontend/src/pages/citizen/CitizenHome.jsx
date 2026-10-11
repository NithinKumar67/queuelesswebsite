import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CitizenNavbar from "../../components/citizen/CitizenNavbar";
import LiveStatusBadge from "../../components/LiveStatusBadge";
import useDebouncedCallback from "../../hooks/useDebouncedCallback";
import useOfficeSocket from "../../hooks/useOfficeSocket";
import { getOffices, getMyActiveToken } from "../../services/citizenApi";
import {
  ArrowRightIcon,
  BuildingIcon,
  ClockIcon,
  LocationIcon,
  TicketIcon,
  UsersIcon,
} from "../../components/icons";

/* =========================================================
   Citizen Home
========================================================= */

export default function CitizenHome({ user }) {
  const navigate = useNavigate();

  const [offices, setOffices] = useState([]);
  const [loadingOffices, setLoadingOffices] = useState(true);
  const [officesError, setOfficesError] = useState(null);

  const [activeTokenData, setActiveTokenData] = useState(null);
  const [loadingToken, setLoadingToken] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoadingOffices(true);
        setLoadingToken(true);

        const [officesRes, activeTokenRes] = await Promise.all([
          getOffices(),
          getMyActiveToken(),
        ]);

        if (officesRes.success) {
          setOffices(officesRes.offices || []);
        } else {
          setOfficesError(
            officesRes.message || "Failed to load offices"
          );
        }

        if (activeTokenRes.success && activeTokenRes.token) {
          setActiveTokenData(activeTokenRes);
        } else {
          setActiveTokenData(null);
        }
      } catch (error) {
        console.error("Failed to load home data:", error);
        setOfficesError(
          "Network error. Could not connect to server."
        );
      } finally {
        setLoadingOffices(false);
        setLoadingToken(false);
      }
    }

    loadData();
  }, []);

  // Silent refetch used by live updates (no loading spinner, keeps the last
  // known state if the request fails).
  const refreshActiveToken = useCallback(async () => {
    try {
      const res = await getMyActiveToken();

      setActiveTokenData(res.success && res.token ? res : null);
    } catch {
      // Keep showing the last known token; the next event or reload retries.
    }
  }, []);

  const scheduleRefresh = useDebouncedCallback(refreshActiveToken, 250);

  const activeToken = activeTokenData?.token;

  // Follow the office of the citizen's active token (if they have one).
  const socketStatus = useOfficeSocket(
    activeToken?.officeId?._id || activeToken?.officeId,
    { onEvent: scheduleRefresh, onSync: scheduleRefresh }
  );

  const queuePosition = activeTokenData?.queuePosition;
  const estimatedWait = activeTokenData?.estimatedWaitTimeMinutes;

  const firstName =
    user?.name?.split(" ")?.[0] || "Citizen";

  return (
    <div className="min-h-screen bg-[#f4f8f7] text-slate-900">

      {/* =====================================================
          SYSTEM ANNOUNCEMENT
      ===================================================== */}

      <div className="bg-[#071b2d] px-4 py-2.5 text-sm text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="rounded-md bg-teal-500/20 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-teal-300">
              System Announcement
            </span>

            <span className="hidden text-slate-300 sm:block">
              Real-time queue tracking is currently active across all
              department branches.
            </span>

            <span className="text-slate-300 sm:hidden">
              Real-time queue tracking is active.
            </span>
          </div>

          <button
            type="button"
            onClick={() => navigate("/citizen")}
            className="hidden shrink-0 text-sm font-medium text-teal-300 underline-offset-4 hover:underline sm:block"
          >
            Live status →
          </button>
        </div>
      </div>

      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <CitizenNavbar user={user} />

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="relative overflow-hidden bg-[#073c3c]">

        {/* Decorative background */}
        <div className="absolute inset-0">
          <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-teal-400/20 blur-3xl" />
          <div className="absolute right-0 top-0 h-[500px] w-[500px] rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="absolute bottom-[-200px] left-[35%] h-[500px] w-[500px] rounded-full bg-emerald-400/10 blur-3xl" />

          <div className="absolute inset-0 bg-gradient-to-br from-[#073c3c] via-[#0b4c4b] to-[#092e43]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">

          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">

            {/* LEFT SIDE */}

            <div className="max-w-2xl text-white">

              <div className="inline-flex items-center gap-2 rounded-full border border-teal-300/30 bg-teal-300/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] text-teal-200">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
                Official Digital Portal
              </div>

              <p className="mt-7 text-sm font-medium text-teal-200">
                Welcome back, {firstName}
              </p>

              <h1 className="mt-3 text-5xl font-black leading-[0.98] tracking-tight sm:text-6xl lg:text-7xl">
                Skip the queue.
                <br />

                <span className="text-[#42e8d0]">
                  Save your time.
                </span>
              </h1>

              <p className="mt-7 max-w-xl text-base leading-7 text-slate-200 sm:text-lg">
                Get a virtual token before visiting a government
                office. Track your queue position and know approximately
                when your turn will arrive.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">

                <button
                  type="button"
                  onClick={() => {
                    const section =
                      document.getElementById("government-offices");

                    section?.scrollIntoView({
                      behavior: "smooth",
                    });
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0bb5a5] px-7 py-4 text-sm font-bold text-white shadow-lg shadow-teal-950/20 transition hover:-translate-y-0.5 hover:bg-[#0ac2b1]"
                >
                  Get a Token
                  <ArrowRightIcon className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    navigate("/citizen")
                  }
                  className="inline-flex items-center justify-center rounded-xl border border-teal-200/30 bg-white/5 px-7 py-4 text-sm font-bold text-white backdrop-blur transition hover:bg-white/10"
                >
                  How it works
                </button>

              </div>

              {/* Benefits */}

              <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 border-t border-white/10 pt-6 text-sm font-medium text-teal-100">
                <span className="flex items-center gap-2">
                  <span className="text-[#42e8d0]">✓</span>
                  Less waiting
                </span>

                <span className="flex items-center gap-2">
                  <span className="text-[#42e8d0]">✓</span>
                  Live queue status
                </span>

                <span className="flex items-center gap-2">
                  <span className="text-[#42e8d0]">✓</span>
                  Easy to use
                </span>
              </div>

            </div>

            {/* RIGHT SIDE — ACTIVE TOKEN CARD */}

            <div className="relative">

              <div className="absolute -inset-5 rounded-[2rem] bg-teal-300/10 blur-2xl" />

              <div className="relative overflow-hidden rounded-[2rem] border border-white/50 bg-[#f8fbfa] p-5 shadow-2xl sm:p-7">

                <div className="flex items-center justify-between">

                  <div className="flex items-center gap-3">

                    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-teal-100 bg-white text-[#087f79]">
                      <BuildingIcon className="h-6 w-6" />
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Current Queue
                      </p>

                      <p className="mt-1 text-lg font-bold text-slate-900">
                        {activeToken?.officeId?.name ||
                          "Government Service"}
                      </p>
                    </div>

                  </div>

                  <LiveStatusBadge status={socketStatus} />

                </div>

                {loadingToken ? (

                  <div className="mt-7 rounded-2xl bg-slate-100 p-10 text-center">

                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />

                    <p className="mt-3 text-sm text-slate-500">
                      Checking your queue...
                    </p>

                  </div>

                ) : activeToken ? (

                  <>
                    {/* Token */}

                    <div className="mt-7 rounded-2xl border border-slate-100 bg-white px-6 py-7 text-center shadow-sm">

                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                        Your Token
                      </p>

                      <p className="mt-2 text-6xl font-black tracking-tight text-[#087f79] sm:text-7xl">
                        {activeToken.tokenNumber}
                      </p>

                    </div>

                    {/* Stats */}

                    <div className="mt-4 grid grid-cols-2 gap-4">

                      <div className="rounded-2xl border border-teal-100 bg-teal-50/70 p-5">

                        <div className="flex items-center gap-2 text-slate-500">
                          <UsersIcon className="h-4 w-4" />

                          <p className="text-xs font-semibold">
                            People ahead
                          </p>
                        </div>

                        <p className="mt-2 text-3xl font-black text-slate-900">
                          {queuePosition
                            ? Math.max(queuePosition - 1, 0)
                            : "—"}
                        </p>

                      </div>

                      <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5">

                        <div className="flex items-center gap-2 text-slate-500">
                          <ClockIcon className="h-4 w-4" />

                          <p className="text-xs font-semibold">
                            Estimated wait
                          </p>
                        </div>

                        <p className="mt-2 text-3xl font-black text-slate-900">
                          {estimatedWait !== null &&
                          estimatedWait !== undefined
                            ? estimatedWait
                            : "—"}

                          {estimatedWait !== null &&
                            estimatedWait !== undefined && (
                              <span className="ml-1 text-sm font-semibold text-slate-500">
                                min
                              </span>
                            )}
                        </p>

                      </div>

                    </div>

                    {/* Queue progress */}

                    <div className="mt-6">

                      <div className="flex gap-2">

                        <span className="h-2 flex-1 rounded-full bg-[#078f84]" />
                        <span className="h-2 flex-1 rounded-full bg-[#11bfae]" />
                        <span className="h-2 flex-1 rounded-full bg-[#13c889]" />
                        <span className="h-2 flex-1 rounded-full bg-slate-200" />
                        <span className="h-2 flex-1 rounded-full bg-slate-200" />

                      </div>

                      <div className="mt-3 flex items-center justify-between">

                        <p className="flex items-center gap-2 text-sm font-semibold text-[#087f79]">

                          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />

                          Queue is moving normally

                        </p>

                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `/citizen/token/${activeToken._id}`
                            )
                          }
                          className="text-sm font-bold text-[#087f79] hover:underline"
                        >
                          View →
                        </button>

                      </div>

                    </div>

                  </>

                ) : (

                  /* No token */

                  <div className="mt-7">

                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">

                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-100 text-teal-700">
                        <TicketIcon className="h-7 w-7" />
                      </div>

                      <h3 className="mt-4 text-lg font-bold text-slate-900">
                        No active token
                      </h3>

                      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                        Choose a government office and get a
                        virtual token without waiting in line.
                      </p>

                      <button
                        type="button"
                        onClick={() => {
                          document
                            .getElementById("government-offices")
                            ?.scrollIntoView({
                              behavior: "smooth",
                            });
                        }}
                        className="mt-5 rounded-xl bg-[#087f79] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#066b66]"
                      >
                        Find an Office
                      </button>

                    </div>

                  </div>

                )}

              </div>

            </div>

          </div>
        </div>
      </section>

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <main
        id="government-offices"
        className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"
      >

        {/* Section Header */}

        <section>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

            <div>

              <p className="text-sm font-bold uppercase tracking-[0.15em] text-[#087f79]">
                Digital Government Services
              </p>

              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                Where do you need to go?
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                Select a government office to view available services
                and join its virtual queue.
              </p>

            </div>

            <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Live services available
            </div>

          </div>

          {/* =================================================
              ERROR
          ================================================= */}

          {officesError && (

            <div className="mt-7 rounded-2xl border border-red-200 bg-red-50 p-5">

              <div className="flex items-start gap-3">

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600">
                  !
                </div>

                <div>
                  <p className="font-bold text-red-800">
                    Unable to load offices
                  </p>

                  <p className="mt-1 text-sm text-red-700">
                    {officesError}
                  </p>
                </div>

              </div>

            </div>

          )}

          {/* =================================================
              LOADING
          ================================================= */}

          {loadingOffices && !officesError && (

            <div className="mt-7 grid gap-5 md:grid-cols-2">

              {[1, 2].map((item) => (

                <div
                  key={item}
                  className="animate-pulse rounded-3xl border border-slate-200 bg-white p-6"
                >

                  <div className="h-14 w-14 rounded-2xl bg-slate-200" />

                  <div className="mt-6 h-6 w-2/3 rounded bg-slate-200" />

                  <div className="mt-3 h-4 w-full rounded bg-slate-100" />

                  <div className="mt-2 h-4 w-4/5 rounded bg-slate-100" />

                  <div className="mt-7 h-10 w-32 rounded-xl bg-slate-200" />

                </div>

              ))}

            </div>

          )}

          {/* =================================================
              EMPTY
          ================================================= */}

          {!loadingOffices &&
            !officesError &&
            offices.length === 0 && (

              <div className="mt-7 rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                  <BuildingIcon className="h-8 w-8" />
                </div>

                <h3 className="mt-5 text-lg font-bold text-slate-900">
                  No offices available
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  There are currently no government offices
                  available for virtual queue services.
                </p>

              </div>

            )}

          {/* =================================================
              OFFICE CARDS
          ================================================= */}

          {!loadingOffices &&
            !officesError &&
            offices.length > 0 && (

              <div className="mt-7 grid gap-6 md:grid-cols-2">

                {offices.map((office, index) => {

                  const isRevenue = office.type === "REVENUE";

                  return (

                    <button
                      key={office._id}
                      type="button"
                      onClick={() =>
                        navigate(
                          `/citizen/offices/${office._id}/services`
                        )
                      }
                     className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                    >

                      {/* Top accent */}

                      <div
                        className={`h-1.5 w-full ${
                          isRevenue
                            ? "bg-gradient-to-r from-teal-500 to-cyan-400"
                            : "bg-gradient-to-r from-emerald-500 to-teal-400"
                        }`}
                      />

                      <div className="p-6 sm:p-7">

                        <div className="flex items-start justify-between">

                          <div
                            className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
                              isRevenue
                                ? "bg-teal-50 text-teal-700"
                                : "bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            <BuildingIcon className="h-7 w-7" />
                          </div>

                          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition group-hover:border-teal-200 group-hover:bg-teal-50 group-hover:text-teal-700">
                            <ArrowRightIcon className="h-5 w-5 transition group-hover:translate-x-0.5" />
                          </div>

                        </div>

                        <div className="mt-6">

                          <div className="flex items-center gap-2">

                            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                              Digital Queue
                            </span>

                          </div>

                          <h3 className="mt-3 text-2xl font-black tracking-tight text-slate-900">
                            {office.name}
                          </h3>

                          {office.description && (

                            <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">
                              {office.description}
                            </p>

                          )}

                          {(office.mandal ||
                            office.district ||
                            office.state) && (

                            <div className="mt-4 flex items-start gap-2 text-sm text-slate-500">

                              <LocationIcon className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />

                              <span>
                                {[
                                  office.mandal,
                                  office.district,
                                  office.state,
                                ]
                                  .filter(Boolean)
                                  .join(", ")}
                              </span>

                            </div>

                          )}

                        </div>

                        <div className="mt-7 flex items-center justify-between border-t border-slate-100 pt-5">

                          <span className="text-sm font-bold text-[#087f79]">
                            View available services
                          </span>

                          <ArrowRightIcon className="h-4 w-4 text-[#087f79] transition group-hover:translate-x-1" />

                        </div>

                      </div>

                    </button>

                  );

                })}

              </div>

            )}

        </section>

        {/* =====================================================
            ACTIVE TOKEN — FULL WIDTH
        ===================================================== */}

        <section className="mt-16">

          <div className="flex items-end justify-between gap-4">

            <div>

              <p className="text-sm font-bold uppercase tracking-[0.15em] text-[#087f79]">
                Your Queue
              </p>

              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                Your active token
              </h2>

            </div>

          </div>

          {loadingToken ? (

            <div className="mt-6 animate-pulse rounded-3xl border border-slate-200 bg-white p-7">

              <div className="h-7 w-40 rounded bg-slate-200" />

              <div className="mt-4 h-5 w-72 rounded bg-slate-100" />

              <div className="mt-7 grid gap-4 sm:grid-cols-2">

                <div className="h-24 rounded-2xl bg-slate-100" />
                <div className="h-24 rounded-2xl bg-slate-100" />

              </div>

            </div>

          ) : activeToken ? (

            <div className="relative mt-6 overflow-hidden rounded-3xl border border-teal-200 bg-white shadow-lg">

              {/* Header */}

              <div className="relative overflow-hidden bg-gradient-to-br from-[#075b58] via-[#087f79] to-[#08616b] px-6 py-7 text-white sm:px-8">

                <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-teal-300/10 blur-2xl" />

                <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

                  <div>

                    <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold">

                      <span className="h-2 w-2 rounded-full bg-emerald-400" />

                      {activeToken.status}

                    </div>

                    <h3 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
                      {activeToken.tokenNumber}
                    </h3>

                    <p className="mt-2 text-sm text-teal-100">
                      {activeToken.officeId?.name}{" "}
                      {activeToken.serviceId?.name
                        ? `• ${activeToken.serviceId.name}`
                        : ""}
                    </p>

                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        `/citizen/token/${activeToken._id}`
                      )
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3.5 text-sm font-bold text-[#087f79] shadow-sm transition hover:bg-teal-50"
                  >
                    Track My Token
                    <ArrowRightIcon className="h-4 w-4" />
                  </button>

                </div>

              </div>

              {/* Stats */}

              <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-7">

                <div className="rounded-2xl border border-slate-100 bg-[#f5f9f8] p-5">

                  <div className="flex items-center gap-3">

                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-100 text-teal-700">
                      <UsersIcon className="h-5 w-5" />
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-slate-500">
                        Queue position
                      </p>

                      <p className="mt-1 text-2xl font-black text-slate-900">
                        {queuePosition
                          ? `#${queuePosition}`
                          : "In Progress"}
                      </p>
                    </div>

                  </div>

                </div>

                <div className="rounded-2xl border border-slate-100 bg-[#f5f9f8] p-5">

                  <div className="flex items-center gap-3">

                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                      <ClockIcon className="h-5 w-5" />
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-slate-500">
                        Estimated waiting time
                      </p>

                      <p className="mt-1 text-2xl font-black text-slate-900">
                        {estimatedWait !== null &&
                        estimatedWait !== undefined
                          ? `${estimatedWait} min`
                          : "N/A"}
                      </p>
                    </div>

                  </div>

                </div>

              </div>

              {/* Progress */}

              <div className="px-5 pb-6 sm:px-7">

                <div className="h-2 overflow-hidden rounded-full bg-slate-100">

                  <div
                    className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-700"
                    style={{
                      width:
                        queuePosition && queuePosition > 0
                          ? `${Math.max(
                              15,
                              Math.min(
                                100,
                                100 - queuePosition * 8
                              )
                            )}%`
                          : "75%",
                    }}
                  />

                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-slate-500">

                  <span>Joined queue</span>

                  <span className="font-semibold text-emerald-600">
                    Live queue tracking
                  </span>

                  <span>Your turn</span>

                </div>

              </div>

            </div>

          ) : (

            <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

              <div className="grid items-center gap-8 p-7 sm:p-10 lg:grid-cols-[auto_1fr_auto]">

                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">

                  <TicketIcon className="h-8 w-8" />

                </div>

                <div>

                  <h3 className="text-xl font-black text-slate-900">
                    No active token right now
                  </h3>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                    Choose a government office above, select a
                    service, and get your virtual token without
                    standing in a physical queue.
                  </p>

                </div>

                <button
                  type="button"
                  onClick={() => {
                    document
                      .getElementById("government-offices")
                      ?.scrollIntoView({
                        behavior: "smooth",
                      });
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#087f79] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#066b66]"
                >
                  Get a Token
                  <ArrowRightIcon className="h-4 w-4" />
                </button>

              </div>

            </div>

          )}

        </section>

        {/* =====================================================
            BOTTOM BENEFITS
        ===================================================== */}

        <section className="mt-16 grid gap-5 md:grid-cols-3">

          <div className="rounded-2xl border border-slate-200 bg-white p-6">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
              <TicketIcon className="h-5 w-5" />
            </div>

            <h3 className="mt-5 font-bold text-slate-900">
              Get a virtual token
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Join a government service queue remotely before
              arriving at the office.
            </p>

          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <ClockIcon className="h-5 w-5" />
            </div>

            <h3 className="mt-5 font-bold text-slate-900">
              Track your waiting time
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              See your queue position and estimated waiting time
              in real time.
            </p>

          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
              <UsersIcon className="h-5 w-5" />
            </div>

            <h3 className="mt-5 font-bold text-slate-900">
              Spend less time waiting
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Arrive closer to your turn instead of spending
              unnecessary time in a crowded queue.
            </p>

          </div>

        </section>

      </main>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="mt-10 border-t border-slate-200 bg-white">

        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-7 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">

          <p>
            © {new Date().getFullYear()} QueueLess. Digital
            government queue management.
          </p>

          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Real-time queue system active
          </div>

        </div>

      </footer>

    </div>
  );
}