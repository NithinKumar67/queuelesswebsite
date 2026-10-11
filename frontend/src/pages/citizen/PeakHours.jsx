import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import CitizenNavbar from "../../components/citizen/CitizenNavbar";
import useDebouncedCallback from "../../hooks/useDebouncedCallback";
import useOfficeSocket from "../../hooks/useOfficeSocket";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CalendarIcon,
  ChartIcon,
  ClockIcon,
  InfoIcon,
  SparkIcon,
} from "../../components/icons";
import {
  getOfficePeakHours,
  getOfficeById,
} from "../../services/citizenApi";

/* =========================================================
   PEAK HOURS PAGE
========================================================= */

export default function PeakHours({ user }) {
  const navigate = useNavigate();
  const { officeId } = useParams();

  const [office, setOffice] = useState(null);
  const [peakHoursData, setPeakHoursData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* -------------------------------------------------------
     Live updates
     Peak hours count every token created per hour, so only a
     newly created token changes them. The backend emits that as
     queue:updated with status WAITING (token.controller.js
     createToken); the other events are ignored here.
  ------------------------------------------------------- */

  const refreshPeakHours = useCallback(async () => {
    try {
      const peakRes = await getOfficePeakHours(officeId);

      if (peakRes.success) {
        setPeakHoursData(peakRes.peakHours || []);
      }
    } catch {
      // Keep the last known data; the next event or reload retries.
    }
  }, [officeId]);

  const scheduleRefresh = useDebouncedCallback(refreshPeakHours, 1000);

  useOfficeSocket(officeId, {
    events: ["queue:updated"],
    onEvent: (payload) => {
      if (payload?.status === "WAITING") scheduleRefresh();
    },
    onSync: scheduleRefresh,
  });

  /* -------------------------------------------------------
     Existing API functionality - unchanged
  ------------------------------------------------------- */

  useEffect(() => {
    async function loadPeakHours() {
      try {
        setLoading(true);
        setError(null);

        const [officeRes, peakRes] = await Promise.all([
          getOfficeById(officeId),
          getOfficePeakHours(officeId),
        ]);

        if (officeRes.success) {
          setOffice(officeRes.office);
        }

        if (peakRes.success) {
          setPeakHoursData(peakRes.peakHours || []);
        } else {
          setError(peakRes.message || "Failed to load peak hours");
        }
      } catch (err) {
        console.error("Error loading peak hours:", err);
        setError("Network error loading peak hours data.");
      } finally {
        setLoading(false);
      }
    }

    if (officeId) {
      loadPeakHours();
    }
  }, [officeId]);

  /* -------------------------------------------------------
     Existing helper - unchanged
  ------------------------------------------------------- */

  function formatHourSlot(hourInt) {
    const h = Number(hourInt);

    const startPeriod = h >= 12 ? "PM" : "AM";
    const start12 = h % 12 === 0 ? 12 : h % 12;

    const nextH = (h + 1) % 24;
    const endPeriod = nextH >= 12 ? "PM" : "AM";
    const end12 = nextH % 12 === 0 ? 12 : nextH % 12;

    return `${start12}:00 ${startPeriod} – ${end12}:00 ${endPeriod}`;
  }

  /* -------------------------------------------------------
     Existing crowd calculation - unchanged
  ------------------------------------------------------- */

  function getCrowdLevel(count) {
    if (count <= 5) {
      return {
        level: "Low",
        color: "green",
        bg: "bg-emerald-50 text-emerald-700",
        dot: "bg-emerald-500",
      };
    }

    if (count <= 12) {
      return {
        level: "Moderate",
        color: "yellow",
        bg: "bg-amber-50 text-amber-700",
        dot: "bg-amber-500",
      };
    }

    return {
      level: "High",
      color: "red",
      bg: "bg-red-50 text-red-700",
      dot: "bg-red-500",
    };
  }

  /* -------------------------------------------------------
     Existing lowest slot functionality
  ------------------------------------------------------- */

  const lowestSlot = peakHoursData.length
    ? [...peakHoursData].sort((a, b) => a.tokenCount - b.tokenCount)[0]
    : null;

  /* -------------------------------------------------------
     UI helper values
  ------------------------------------------------------- */

  const maxTokens = useMemo(() => {
    if (!peakHoursData.length) return 1;

    return Math.max(
      ...peakHoursData.map((slot) => Number(slot.tokenCount) || 0),
      1
    );
  }, [peakHoursData]);

  const totalTokens = useMemo(() => {
    return peakHoursData.reduce(
      (total, slot) => total + (Number(slot.tokenCount) || 0),
      0
    );
  }, [peakHoursData]);

  const averageTokens = useMemo(() => {
    if (!peakHoursData.length) return 0;

    return Math.round(totalTokens / peakHoursData.length);
  }, [peakHoursData, totalTokens]);

  const highCrowdSlots = useMemo(() => {
    return peakHoursData.filter(
      (slot) => Number(slot.tokenCount) > 12
    ).length;
  }, [peakHoursData]);

  return (
    <div className="min-h-screen bg-[#f4f7f7] text-slate-900">
      {/* =====================================================
          TOP ANNOUNCEMENT
      ===================================================== */}

      <div className="border-b border-[#153b3a] bg-[#0b2528]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2.5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-teal-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              System active
            </span>

            <p className="hidden text-xs font-medium text-slate-300 sm:block">
              Real-time queue insights are available for this government
              office.
            </p>
          </div>

          <span className="hidden text-xs font-semibold text-teal-300 sm:block">
            Official citizen portal
          </span>
        </div>
      </div>

      {/* Existing navbar */}
      <CitizenNavbar user={user} />

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="relative overflow-hidden bg-[#0c3433]">
        {/* Background decoration */}
        <div className="absolute inset-0">
          <div className="absolute -left-24 -top-32 h-96 w-96 rounded-full bg-teal-400/10 blur-3xl" />
          <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="absolute bottom-0 left-1/2 h-72 w-72 rounded-full bg-emerald-300/5 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
          {/* Back */}
          <button
            type="button"
            onClick={() =>
              navigate(`/citizen/offices/${officeId}/services`)
            }
            className="mb-8 inline-flex items-center gap-2 rounded-lg text-sm font-semibold text-slate-300 transition hover:text-white"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to services
          </button>

          <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            {/* Hero text */}
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-teal-400/30 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-teal-200 backdrop-blur">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Crowd intelligence
              </div>

              <p className="mt-6 text-sm font-semibold text-teal-200">
                {office?.name || "Government Office"}
              </p>

              <h1 className="mt-2 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                Plan your visit.
                <span className="block text-teal-300">
                  Avoid the crowd.
                </span>
              </h1>

              <p className="mt-5 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
                View historical queue activity and identify periods with lower
                token volume before you visit the office.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() =>
                    navigate(`/citizen/offices/${officeId}/services`)
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-teal-400 px-6 py-3.5 text-sm font-bold text-[#073c3b] shadow-lg shadow-teal-950/20 transition hover:-translate-y-0.5 hover:bg-teal-300"
                >
                  Select a service
                  <ArrowRightIcon className="h-4 w-4" />
                </button>

                <div className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3.5 text-sm font-medium text-slate-300 backdrop-blur">
                  <ChartIcon className="h-4 w-4 text-teal-300" />
                  Historical activity
                </div>
              </div>
            </div>

            {/* Hero summary card */}
            <div className="relative">
              <div className="absolute -inset-4 rounded-[2rem] bg-teal-400/10 blur-2xl" />

              <div className="relative overflow-hidden rounded-[1.75rem] border border-white/20 bg-[#f8fbfa] shadow-2xl">
                <div className="border-b border-slate-200 px-6 py-5 sm:px-7">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-teal-100 bg-teal-50 text-[#087c78]">
                        <ChartIcon />
                      </div>

                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                          Queue overview
                        </p>

                        <p className="mt-0.5 font-bold text-slate-900">
                          Office activity
                        </p>
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      Data available
                    </span>
                  </div>
                </div>

                <div className="p-6 sm:p-7">
                  {loading ? (
                    <div className="space-y-4">
                      <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
                      <div className="grid grid-cols-2 gap-3">
                        <div className="h-20 animate-pulse rounded-2xl bg-slate-100" />
                        <div className="h-20 animate-pulse rounded-2xl bg-slate-100" />
                      </div>
                    </div>
                  ) : error ? (
                    <div className="rounded-2xl bg-red-50 p-5 text-sm font-medium text-red-700">
                      Unable to load queue insights.
                    </div>
                  ) : lowestSlot ? (
                    <>
                      <div className="rounded-2xl border border-teal-100 bg-[#edf8f6] p-5">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[#087c78]">
                          <SparkIcon className="h-4 w-4" />
                          Recommended
                        </div>

                        <p className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900">
                          {formatHourSlot(lowestSlot.hour)}
                        </p>

                        <p className="mt-1 text-sm text-slate-600">
                          {lowestSlot.tokenCount} historical tokens
                        </p>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="rounded-2xl border border-slate-200 bg-white p-4">
                          <p className="text-xs font-semibold text-slate-500">
                            Average activity
                          </p>

                          <p className="mt-1 text-2xl font-extrabold text-slate-900">
                            {averageTokens}
                          </p>

                          <p className="text-[11px] text-slate-500">
                            tokens / hour
                          </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-4">
                          <p className="text-xs font-semibold text-slate-500">
                            High crowd slots
                          </p>

                          <p className="mt-1 text-2xl font-extrabold text-slate-900">
                            {highCrowdSlots}
                          </p>

                          <p className="text-[11px] text-slate-500">
                            above 12 tokens
                          </p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="py-6 text-center">
                      <ChartIcon className="mx-auto h-8 w-8 text-slate-300" />

                      <p className="mt-3 text-sm font-semibold text-slate-700">
                        No activity data yet
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Historical queue data will appear here.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        {/* Page intro */}
        <section>
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#087c78]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#087c78]" />
                Crowd forecast
              </div>

              <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
                Understand the queue
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                Use historical activity to choose a time that may have a lower
                number of tokens.
              </p>
            </div>

            {!loading && !error && peakHoursData.length > 0 && (
              <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm">
                <CalendarIcon className="h-4 w-4 text-[#087c78]" />
                {peakHoursData.length} time slots
              </div>
            )}
          </div>
        </section>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <section className="mt-8 rounded-3xl border border-red-200 bg-red-50 p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-100 font-bold text-red-600">
                !
              </div>

              <div>
                <h3 className="font-bold text-red-900">
                  Unable to load crowd information
                </h3>

                <p className="mt-1 text-sm leading-6 text-red-700">
                  {error}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* =================================================
            LOADING
        ================================================= */}

        {loading && !error && (
          <section className="mt-8">
            <div className="grid gap-5 sm:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5"
                >
                  <div className="h-3 w-20 rounded bg-slate-200" />
                  <div className="mt-4 h-5 w-32 rounded bg-slate-200" />
                  <div className="mt-2 h-3 w-24 rounded bg-slate-100" />
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="h-6 w-40 animate-pulse rounded bg-slate-200" />
              <div className="mt-2 h-4 w-64 animate-pulse rounded bg-slate-100" />

              <div className="mt-8 space-y-4">
                {[1, 2, 3, 4].map((item) => (
                  <div
                    key={item}
                    className="h-20 animate-pulse rounded-2xl bg-slate-100"
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* =================================================
            DATA CONTENT
        ================================================= */}

        {!loading && !error && (
          <>
            {/* Legend */}
            <section className="mt-8">
              <div className="grid gap-3 sm:grid-cols-3">
                {/* Low */}
                <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                      <span className="h-3 w-3 rounded-full bg-emerald-500" />
                    </div>

                    <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-600">
                      Low
                    </span>
                  </div>

                  <p className="mt-4 font-bold text-slate-900">
                    5 tokens or fewer
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Lower activity and potentially shorter waiting periods.
                  </p>
                </div>

                {/* Moderate */}
                <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                      <span className="h-3 w-3 rounded-full bg-amber-500" />
                    </div>

                    <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-amber-600">
                      Moderate
                    </span>
                  </div>

                  <p className="mt-4 font-bold text-slate-900">
                    6–12 tokens
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Typical activity with an average expected wait.
                  </p>
                </div>

                {/* High */}
                <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
                      <span className="h-3 w-3 rounded-full bg-red-500" />
                    </div>

                    <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-red-600">
                      High
                    </span>
                  </div>

                  <p className="mt-4 font-bold text-slate-900">
                    More than 12
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Higher activity that may result in longer waiting periods.
                  </p>
                </div>
              </div>
            </section>

            {/* =================================================
                HOURLY ACTIVITY
            ================================================= */}

            <section className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              {/* Header */}
              <div className="border-b border-slate-200 px-6 py-6 sm:px-8">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eaf7f5] text-[#087c78]">
                        <ChartIcon />
                      </div>

                      <div>
                        <h2 className="text-xl font-extrabold text-slate-900">
                          Hourly activity
                        </h2>

                        <p className="mt-0.5 text-sm text-slate-500">
                          Historical tokens generated by hour
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
                    <InfoIcon className="text-slate-400" />
                    Historical data
                  </div>
                </div>
              </div>

              {/* Empty state */}
              {peakHoursData.length === 0 ? (
                <div className="px-6 py-16 text-center sm:px-8">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                    <ChartIcon className="h-7 w-7" />
                  </div>

                  <h3 className="mt-5 font-bold text-slate-900">
                    No historical activity recorded
                  </h3>

                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                    There is not enough historical queue data for this office
                    yet. Activity insights will appear here once data is
                    available.
                  </p>
                </div>
              ) : (
                <div className="p-5 sm:p-8">
                  {/* Visual bar chart */}
                  <div className="hidden rounded-2xl border border-slate-100 bg-[#f8fbfa] p-6 lg:block">
                    <div className="mb-6 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                          Activity pattern
                        </p>

                        <p className="mt-1 text-sm text-slate-600">
                          Taller bars indicate higher historical token volume.
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-xs text-slate-500">
                          Total recorded
                        </p>

                        <p className="text-lg font-extrabold text-slate-900">
                          {totalTokens}
                        </p>
                      </div>
                    </div>

                    <div className="flex h-52 items-end gap-3 overflow-x-auto pb-8">
                      {peakHoursData.map((slot) => {
                        const meta = getCrowdLevel(slot.tokenCount);

                        const height = Math.max(
                          8,
                          (Number(slot.tokenCount) / maxTokens) * 100
                        );

                        return (
                          <div
                            key={slot.hour}
                            className="group flex min-w-[58px] flex-1 flex-col items-center justify-end"
                          >
                            <div className="relative mb-2">
                              <div className="absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#0b2528] px-2.5 py-1.5 text-[10px] font-semibold text-white shadow-lg group-hover:block">
                                {slot.tokenCount} tokens
                              </div>

                              <div
                                className={`w-8 rounded-t-lg transition-all duration-300 group-hover:w-9 ${
                                  meta.color === "green"
                                    ? "bg-emerald-400"
                                    : meta.color === "yellow"
                                    ? "bg-amber-400"
                                    : "bg-red-400"
                                }`}
                                style={{
                                  height: `${height}%`,
                                  minHeight: "8px",
                                }}
                              />
                            </div>

                            <span className="whitespace-nowrap text-[9px] font-semibold text-slate-400">
                              {Number(slot.hour) % 12 === 0
                                ? 12
                                : Number(slot.hour) % 12}
                              {Number(slot.hour) >= 12 ? " PM" : " AM"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Detailed rows */}
                  <div className="mt-5 space-y-3">
                    {peakHoursData.map((slot) => {
                      const meta = getCrowdLevel(slot.tokenCount);

                      const progress = Math.min(
                        100,
                        (Number(slot.tokenCount) / maxTokens) * 100
                      );

                      return (
                        <div
                          key={slot.hour}
                          className="group rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:border-slate-200 hover:bg-white hover:shadow-sm sm:p-5"
                        >
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                            {/* Time */}
                            <div className="flex min-w-[190px] items-center gap-3">
                              <div
                                className={`h-2.5 w-2.5 rounded-full ${meta.dot}`}
                              />

                              <div>
                                <p className="font-bold text-slate-900">
                                  {formatHourSlot(slot.hour)}
                                </p>

                                <p className="mt-0.5 text-xs text-slate-500">
                                  Hourly activity
                                </p>
                              </div>
                            </div>

                            {/* Progress */}
                            <div className="flex-1">
                              <div className="mb-2 flex items-center justify-between">
                                <span className="text-xs font-semibold text-slate-500">
                                  Queue volume
                                </span>

                                <span className="text-xs font-bold text-slate-700">
                                  {slot.tokenCount} tokens
                                </span>
                              </div>

                              <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    meta.color === "green"
                                      ? "bg-emerald-400"
                                      : meta.color === "yellow"
                                      ? "bg-amber-400"
                                      : "bg-red-400"
                                  }`}
                                  style={{
                                    width: `${Math.max(progress, 4)}%`,
                                  }}
                                />
                              </div>
                            </div>

                            {/* Level */}
                            <span
                              className={`w-fit shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${meta.bg}`}
                            >
                              {meta.level}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>

            {/* =================================================
                RECOMMENDATION
            ================================================= */}

            {lowestSlot && (
              <section className="relative mt-8 overflow-hidden rounded-3xl bg-[#0b2528] shadow-xl">
                {/* Decorative circles */}
                <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-teal-400/10 blur-2xl" />

                <div className="absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-cyan-400/5 blur-2xl" />

                <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center lg:p-10">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-teal-400/20 bg-teal-400/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-teal-300">
                      <SparkIcon className="h-3.5 w-3.5" />
                      Suggested time
                    </div>

                    <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                      Consider visiting around{" "}
                      <span className="text-teal-300">
                        {formatHourSlot(lowestSlot.hour)}
                      </span>
                    </h2>

                    <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                      This period historically records the lowest token volume
                      in the available data, with {lowestSlot.tokenCount}{" "}
                      tokens recorded.
                    </p>

                    <div className="mt-5 flex flex-wrap gap-3">
                      <div className="inline-flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-xs font-semibold text-slate-300">
                        <span className="h-2 w-2 rounded-full bg-emerald-400" />
                        Lower historical activity
                      </div>

                      <div className="inline-flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-xs font-semibold text-slate-300">
                        <ClockIcon className="h-4 w-4 text-teal-300" />
                        Plan ahead
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      navigate(`/citizen/offices/${officeId}/services`)
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-400 px-6 py-3.5 text-sm font-bold text-[#073c3b] transition hover:bg-teal-300 lg:min-w-[190px]"
                  >
                    Select a service
                    <ArrowRightIcon className="h-4 w-4" />
                  </button>
                </div>
              </section>
            )}

            {/* =================================================
                INFORMATION NOTE
            ================================================= */}

            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                <InfoIcon />
              </div>

              <div>
                <p className="text-sm font-bold text-slate-800">
                  About this information
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Crowd levels are based on historical token activity. Actual
                  waiting times may vary depending on service duration, staff
                  availability, and the number of citizens arriving at the
                  office.
                </p>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}