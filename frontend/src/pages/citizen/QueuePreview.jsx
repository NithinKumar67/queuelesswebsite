import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import CitizenNavbar from "../../components/citizen/CitizenNavbar";
import LiveStatusBadge from "../../components/LiveStatusBadge";
import useDebouncedCallback from "../../hooks/useDebouncedCallback";
import useOfficeSocket from "../../hooks/useOfficeSocket";
import {
  getQueueInfo,
  getOfficeById,
  getOfficeServices,
  createToken,
} from "../../services/citizenApi";

export default function QueuePreview({ user }) {
  const navigate = useNavigate();
  const { officeId, serviceId } = useParams();

  const [office, setOffice] = useState(null);
  const [service, setService] = useState(null);
  const [queueTokens, setQueueTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    async function loadQueuePreview() {
      try {
        setLoading(true);
        setErrorMessage(null);

        const [officeRes, servicesRes, queueRes] = await Promise.all([
          getOfficeById(officeId),
          getOfficeServices(officeId),
          getQueueInfo(officeId, serviceId),
        ]);

        if (officeRes.success) {
          setOffice(officeRes.office);
        }

        if (servicesRes.success) {
          const selected = servicesRes.services.find(
            (s) => s._id.toString() === serviceId
          );

          setService(selected || null);
        }

        if (queueRes.success) {
          setQueueTokens(queueRes.queue || []);
        } else {
          setErrorMessage(
            queueRes.message || "Failed to fetch queue data"
          );
        }
      } catch (err) {
        console.error("Queue preview load error:", err);
        setErrorMessage(
          "Network error. Could not fetch queue information."
        );
      } finally {
        setLoading(false);
      }
    }

    if (officeId && serviceId) {
      loadQueuePreview();
    }
  }, [officeId, serviceId]);

  // Live updates: refetch only the queue (office and service never change).
  // A failed refresh keeps the last known queue on screen.
  const refreshQueue = useCallback(async () => {
    try {
      const queueRes = await getQueueInfo(officeId, serviceId);

      if (queueRes.success) {
        setQueueTokens(queueRes.queue || []);
        setErrorMessage(null);
      }
    } catch {
      // Keep the last known queue; the next event or reload retries.
    }
  }, [officeId, serviceId]);

  const scheduleRefresh = useDebouncedCallback(refreshQueue, 250);

  const socketStatus = useOfficeSocket(officeId, {
    onEvent: scheduleRefresh,
    onSync: scheduleRefresh,
  });

  const peopleWaiting = queueTokens.filter(
    (t) => t.status === "WAITING"
  ).length;

  const currentServingToken =
    queueTokens.find(
      (t) => t.status === "SERVING" || t.status === "CALLED"
    )?.tokenNumber || "None";

  const avgTime = service?.averageServiceTime || 10;

  const estimatedWaitTime = Math.max(
    0,
    peopleWaiting * avgTime
  );

  const handleGenerateToken = async () => {
    try {
      setGenerating(true);
      setErrorMessage(null);

      const res = await createToken(officeId, serviceId);

      if (res.success && res.token?._id) {
        navigate(`/citizen/token/${res.token._id}`);
      } else {
        setErrorMessage(
          res.message || "Failed to generate token."
        );
      }
    } catch (err) {
      console.error("Token creation error:", err);
      setErrorMessage(
        "Error connecting to server to generate token."
      );
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f8f7] text-slate-900">

      {/* Existing Navbar */}
      <CitizenNavbar user={user} />

      {/* =====================================================
          HERO / PAGE BACKGROUND
      ====================================================== */}
      <section className="relative overflow-hidden bg-[#082f32]">

        {/* Background decoration */}
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-teal-500/10 blur-3xl" />
        <div className="absolute -right-32 top-20 h-96 w-96 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-emerald-400/5 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 pb-14 pt-8 sm:px-6 lg:px-8">

          {/* Back button */}
          <button
            type="button"
            onClick={() =>
              navigate(
                `/citizen/offices/${officeId}/services`
              )
            }
            className="group mb-10 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-teal-100 backdrop-blur-sm transition hover:border-teal-300/40 hover:bg-white/10 hover:text-white"
          >
            <span className="transition-transform group-hover:-translate-x-1">
              ←
            </span>

            Back to services
          </button>

          {/* Hero heading */}
          <div className="grid items-center gap-10 lg:grid-cols-[1fr_430px]">

            {/* LEFT */}
            <div className="max-w-2xl">

              <div className="inline-flex items-center gap-2 rounded-full border border-teal-300/30 bg-teal-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-teal-200">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]" />

                Official Digital Queue
              </div>

              <p className="mt-7 text-sm font-semibold uppercase tracking-[0.12em] text-teal-300">
                {office?.name || "Government Office"}
              </p>

              <h1 className="mt-3 text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
                Check the queue.
                <br />

                <span className="text-[#46e0c4]">
                  Save your time.
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
                See the live queue before visiting the office.
                Get an estimate of your waiting time and join
                the virtual queue when you're ready.
              </p>

              {/* Small trust indicators */}
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-teal-100">
                <div className="flex items-center gap-2">
                  <span className="text-[#46e0c4]">✓</span>
                  Live queue status
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[#46e0c4]">✓</span>
                  Virtual token
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[#46e0c4]">✓</span>
                  Real-time tracking
                </div>
              </div>
            </div>

            {/* =================================================
                MINI QUEUE PREVIEW CARD
            ================================================== */}
            <div className="relative hidden lg:block">

              <div className="absolute -inset-4 rounded-[2rem] bg-teal-400/10 blur-2xl" />

              <div className="relative rounded-[2rem] border border-white/15 bg-white p-5 shadow-2xl">

                {/* Card header */}
                <div className="flex items-center justify-between">

                  <div className="flex items-center gap-3">

                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-teal-100 bg-teal-50 text-xl">
                      🏛️
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Current Queue
                      </p>

                      <p className="mt-1 font-bold text-slate-900">
                        {service?.name || "Service Counter"}
                      </p>
                    </div>
                  </div>

                  <LiveStatusBadge status={socketStatus} />
                </div>

                {/* Wait time */}
                <div className="mt-5 rounded-2xl bg-[#f5faf9] px-5 py-7 text-center">

                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    Estimated Wait
                  </p>

                  <div className="mt-2">
                    <span className="text-5xl font-extrabold tracking-tight text-[#087f78]">
                      {estimatedWaitTime}
                    </span>

                    <span className="ml-2 text-lg font-semibold text-slate-500">
                      min
                    </span>
                  </div>
                </div>

                {/* Stats */}
                <div className="mt-4 grid grid-cols-2 gap-3">

                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-xs font-medium text-slate-500">
                      People waiting
                    </p>

                    <p className="mt-1 text-2xl font-bold text-slate-900">
                      {peopleWaiting}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-xs font-medium text-slate-500">
                      Serving now
                    </p>

                    <p className="mt-1 text-2xl font-bold text-slate-900">
                      {currentServingToken}
                    </p>
                  </div>

                </div>

                {/* Queue progress */}
                <div className="mt-5">

                  <div className="flex gap-2">
                    <span className="h-2 flex-1 rounded-full bg-[#079b91]" />
                    <span className="h-2 flex-1 rounded-full bg-[#18c6b0]" />
                    <span className="h-2 flex-1 rounded-full bg-emerald-400" />
                    <span className="h-2 flex-1 rounded-full bg-slate-200" />
                    <span className="h-2 flex-1 rounded-full bg-slate-200" />
                  </div>

                  <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-[#087f78]">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Queue is moving normally
                  </div>

                </div>

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          MAIN CONTENT
      ====================================================== */}
      <main className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* Loading */}
        {loading ? (
          <div className="mx-auto max-w-3xl rounded-[2rem] border border-slate-200 bg-white p-12 text-center shadow-sm">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
            </div>

            <h2 className="mt-5 text-lg font-bold text-slate-900">
              Checking the live queue
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Getting the latest queue information...
            </p>
          </div>
        ) : (
          <>

            {/* Error */}
            {errorMessage && (
              <div className="mx-auto mb-6 max-w-4xl rounded-2xl border border-red-200 bg-red-50 p-4 shadow-sm">
                <div className="flex items-start gap-3">

                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                    !
                  </div>

                  <div>
                    <p className="font-semibold text-red-800">
                      Unable to load queue
                    </p>

                    <p className="mt-1 text-sm text-red-700">
                      {errorMessage}
                    </p>
                  </div>

                </div>
              </div>
            )}

            {/* =================================================
                MAIN QUEUE SECTION
            ================================================== */}
            <div className="mx-auto max-w-5xl">

              {/* Section heading */}
              <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">

                <div>
                  <div className="flex items-center gap-2">

                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50">
                      📊
                    </span>

                    <p className="text-sm font-bold uppercase tracking-wider text-[#087f78]">
                      Live queue
                    </p>

                  </div>

                  <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                    {service?.name || "Service Queue"}
                  </h2>

                  <p className="mt-2 text-sm text-slate-500">
                    Current queue status for this government service
                  </p>
                </div>

                <LiveStatusBadge status={socketStatus} className="w-fit" />

              </div>

              {/* =================================================
                  BIG QUEUE CARD
              ================================================== */}
              <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_20px_60px_-30px_rgba(15,23,42,0.25)]">

                {/* Top colored strip */}
                <div className="h-1.5 bg-gradient-to-r from-[#087f78] via-[#20cbb5] to-emerald-400" />

                <div className="p-5 sm:p-8">

                  {/* Main stats */}
                  <div className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">

                    {/* Estimated wait */}
                    <div className="relative overflow-hidden rounded-[1.5rem] bg-[#082f32] p-7 sm:p-9">

                      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-teal-400/10 blur-2xl" />

                      <div className="relative">

                        <div className="flex items-center justify-between">

                          <div>
                            <p className="text-sm font-semibold text-teal-200">
                              Estimated waiting time
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              Based on the current queue
                            </p>
                          </div>

                          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-xl">
                            ⏱
                          </div>

                        </div>

                        <div className="mt-8 flex items-end gap-3">

                          <span className="text-6xl font-extrabold tracking-tight text-white sm:text-7xl">
                            {estimatedWaitTime}
                          </span>

                          <span className="mb-2 text-lg font-semibold text-teal-200">
                            minutes
                          </span>

                        </div>

                        <div className="mt-7 flex items-center gap-2 text-sm font-medium text-teal-200">
                          <span className="h-2 w-2 rounded-full bg-emerald-400" />
                          Queue is currently active
                        </div>

                      </div>
                    </div>

                    {/* People waiting */}
                    <div className="rounded-[1.5rem] border border-slate-100 bg-[#f5faf9] p-7 sm:p-8">

                      <p className="text-sm font-semibold text-slate-500">
                        People waiting
                      </p>

                      <div className="mt-4 flex items-end justify-between">

                        <span className="text-5xl font-extrabold tracking-tight text-slate-900">
                          {peopleWaiting}
                        </span>

                        <span className="mb-2 rounded-full bg-white px-3 py-1 text-xs font-bold text-[#087f78] shadow-sm">
                          In queue
                        </span>

                      </div>

                      <div className="mt-7 h-2 overflow-hidden rounded-full bg-slate-200">

                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#087f78] to-[#25cdb6]"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.max(
                                12,
                                peopleWaiting * 6
                              )
                            )}%`,
                          }}
                        />

                      </div>

                      <p className="mt-3 text-xs text-slate-500">
                        Current number of waiting tokens
                      </p>

                    </div>

                  </div>

                  {/* =================================================
                      INFORMATION CARDS
                  ================================================== */}
                  <div className="mt-5 grid gap-4 sm:grid-cols-3">

                    {/* Serving */}
                    <div className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md">

                      <div className="flex items-center justify-between">

                        <span className="text-sm font-medium text-slate-500">
                          Currently serving
                        </span>

                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-sm">
                          🎟️
                        </span>

                      </div>

                      <p className="mt-3 text-2xl font-bold text-slate-900">
                        {currentServingToken}
                      </p>

                    </div>

                    {/* Average */}
                    <div className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md">

                      <div className="flex items-center justify-between">

                        <span className="text-sm font-medium text-slate-500">
                          Service time
                        </span>

                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-sm">
                          ⏱️
                        </span>

                      </div>

                      <p className="mt-3 text-2xl font-bold text-slate-900">
                        {avgTime}
                        <span className="ml-1 text-sm font-medium text-slate-400">
                          min
                        </span>
                      </p>

                    </div>

                    {/* Status */}
                    <div className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md">

                      <div className="flex items-center justify-between">

                        <span className="text-sm font-medium text-slate-500">
                          Queue status
                        </span>

                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50">
                          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                        </span>

                      </div>

                      <p className="mt-3 text-2xl font-bold text-emerald-600">
                        Active
                      </p>

                    </div>

                  </div>

                  {/* =================================================
                      HOW IT WORKS
                  ================================================== */}
                  <div className="mt-7 rounded-2xl border border-slate-100 bg-slate-50 p-5">

                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center">

                      <div>
                        <p className="text-sm font-bold text-slate-900">
                          What happens next?
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          Join remotely and monitor your position.
                        </p>
                      </div>

                      <div className="hidden h-px flex-1 bg-slate-200 sm:block" />

                      <div className="flex flex-wrap gap-4">

                        <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white font-bold text-[#087f78] shadow-sm">
                            1
                          </span>
                          Get token
                        </div>

                        <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white font-bold text-[#087f78] shadow-sm">
                            2
                          </span>
                          Track queue
                        </div>

                        <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white font-bold text-[#087f78] shadow-sm">
                            3
                          </span>
                          Visit your counter
                        </div>

                      </div>

                    </div>
                  </div>

                  {/* =================================================
                      CTA
                  ================================================== */}
                  <div className="mt-7 rounded-[1.5rem] bg-gradient-to-r from-[#087f78] to-[#0c9e92] p-6 sm:p-7">

                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

                      <div className="text-white">

                        <p className="text-lg font-bold">
                          Ready to skip the waiting room?
                        </p>

                        <p className="mt-1 text-sm text-teal-100">
                          Get your virtual token and track your position
                          from anywhere.
                        </p>

                      </div>

                      <button
                        type="button"
                        onClick={handleGenerateToken}
                        disabled={generating}
                        className="group inline-flex items-center justify-center gap-3 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-[#087f78] shadow-lg transition hover:-translate-y-0.5 hover:bg-teal-50 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {generating
                          ? "Generating Token..."
                          : "Get Virtual Token"}

                        {!generating && (
                          <span className="transition-transform group-hover:translate-x-1">
                            →
                          </span>
                        )}
                      </button>

                    </div>
                  </div>

                  <p className="mt-4 text-center text-xs text-slate-400">
                    Your token can be tracked in real time after joining
                    the queue.
                  </p>

                </div>
              </div>

            </div>
          </>
        )}
      </main>

      {/* Bottom spacing */}
      <div className="h-10" />
    </div>
  );
}