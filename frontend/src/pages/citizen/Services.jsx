import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import CitizenNavbar from "../../components/citizen/CitizenNavbar";
import LiveStatusBadge from "../../components/LiveStatusBadge";
import useDebouncedCallback from "../../hooks/useDebouncedCallback";
import useOfficeSocket from "../../hooks/useOfficeSocket";
import {
  getOfficeServices,
  getOfficeById,
  getQueueInfo,
} from "../../services/citizenApi";

export default function Services({ user }) {
  const navigate = useNavigate();
  const { officeId } = useParams();

  const [office, setOffice] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // serviceId -> number of WAITING tokens, kept fresh by live updates.
  const [waitingByService, setWaitingByService] = useState({});

  // Waiting counts come from the existing per-service queue endpoint.
  // A service whose request fails simply shows no count.
  const loadWaitingCounts = useCallback(
    async (serviceList) => {
      const active = serviceList.filter((item) => item.isActive !== false);

      const results = await Promise.all(
        active.map((item) =>
          getQueueInfo(officeId, item._id)
            .then((res) =>
              res.success
                ? [
                    item._id,
                    (res.queue || []).filter((t) => t.status === "WAITING")
                      .length,
                  ]
                : null
            )
            .catch(() => null)
        )
      );

      setWaitingByService((previous) => ({
        ...previous,
        ...Object.fromEntries(results.filter(Boolean)),
      }));
    },
    [officeId]
  );

  const scheduleCountRefresh = useDebouncedCallback(
    () => loadWaitingCounts(services),
    250
  );

  const socketStatus = useOfficeSocket(officeId, {
    onEvent: scheduleCountRefresh,
    onSync: scheduleCountRefresh,
  });

  useEffect(() => {
    async function loadOfficeAndServices() {
      try {
        setLoading(true);
        setError(null);

        const [officeRes, servicesRes] = await Promise.all([
          getOfficeById(officeId),
          getOfficeServices(officeId),
        ]);

        if (officeRes.success) {
          setOffice(officeRes.office);
        }

        if (servicesRes.success) {
          const loaded = servicesRes.services || [];

          setServices(loaded);
          loadWaitingCounts(loaded);
        } else {
          setError(servicesRes.message || "Failed to load services");
        }
      } catch (err) {
        console.error("Failed to load services:", err);
        setError("Could not load services for this office.");
      } finally {
        setLoading(false);
      }
    }

    if (officeId) {
      loadOfficeAndServices();
    }
  }, [officeId, loadWaitingCounts]);

  return (
    <div className="min-h-screen bg-[#f4f7f6] text-slate-900">
      {/* Existing Citizen Navbar */}
      <CitizenNavbar user={user} />

      {/* =========================================================
          HERO / OFFICE HEADER
      ========================================================= */}
      <section className="relative overflow-hidden bg-[#073b3a]">
        {/* Decorative background */}
        <div className="absolute inset-0">
          <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-teal-400/10 blur-3xl" />
          <div className="absolute right-0 top-0 h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl" />
        </div>

        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)",
            backgroundSize: "42px 42px",
          }}
        />

        <div className="relative mx-auto max-w-7xl px-4 pb-14 pt-8 sm:px-6 lg:px-8">
          {/* Back */}
          <button
            type="button"
            onClick={() => navigate("/citizen")}
            className="mb-10 flex items-center gap-2 text-sm font-medium text-teal-100 transition hover:text-white"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/5 transition group-hover:bg-white/10">
              ←
            </span>
            Back to offices
          </button>

          <div className="grid items-end gap-10 lg:grid-cols-[1fr_auto]">
            {/* Left */}
            <div className="max-w-3xl">
              {/* Official badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-teal-300/30 bg-teal-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-teal-200">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,.8)]" />
                Official Digital Portal
              </div>

              <p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-teal-300">
                {office?.name || "Government Office"}
              </p>

              <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
                Government
                <span className="block text-teal-300">services made simpler.</span>
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                Select the service you need, check the live queue, and get a
                virtual token before visiting the office.
              </p>

              {/* Quick benefits */}
              <div className="mt-8 flex flex-wrap gap-3">
                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 backdrop-blur">
                  <span className="text-teal-300">✓</span>
                  Less waiting
                </div>

                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 backdrop-blur">
                  <span className="text-teal-300">✓</span>
                  Live queue status
                </div>

                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 backdrop-blur">
                  <span className="text-teal-300">✓</span>
                  Virtual tokens
                </div>
              </div>
            </div>

            {/* Right status card */}
            <div className="w-full lg:w-[320px]">
              <div className="rounded-3xl border border-white/10 bg-white/[0.08] p-5 shadow-2xl backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-300/10 text-xl">
                      🏛️
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                        Department
                      </p>

                      <p className="mt-1 max-w-[190px] truncate text-sm font-bold text-white">
                        {office?.name || "Government Office"}
                      </p>
                    </div>
                  </div>

                  <LiveStatusBadge status={socketStatus} tone="dark" />
                </div>

                <div className="my-5 h-px bg-white/10" />

                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Available services
                </p>

                <div className="mt-2 flex items-end gap-2">
                  <span className="text-4xl font-black text-white">
                    {loading ? "—" : services.length}
                  </span>

                  <span className="mb-1 text-sm text-slate-400">
                    services
                  </span>
                </div>

                <div className="mt-5 flex items-center gap-2 text-xs text-teal-200">
                  <span className="h-2 w-2 rounded-full bg-teal-300" />
                  Choose a service to check its queue
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          MAIN CONTENT
      ========================================================= */}
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Section heading */}
        <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-teal-500" />
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">
                Select a service
              </p>
            </div>

            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              What do you need today?
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
              Choose a service below to view the current queue and get your
              virtual token.
            </p>
          </div>

          {/* Peak Hours */}
          <button
            type="button"
            onClick={() =>
              navigate(`/citizen/offices/${officeId}/crowd`)
            }
            className="group inline-flex shrink-0 items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-teal-200 hover:text-teal-700 hover:shadow-md"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
              ◷
            </span>

            View peak hours

            <span className="transition group-hover:translate-x-1">→</span>
          </button>
        </section>

        {/* =========================================================
            ERROR
        ========================================================= */}
        {error && (
          <div className="mt-8 overflow-hidden rounded-2xl border border-red-200 bg-white shadow-sm">
            <div className="border-l-4 border-red-500 bg-red-50 p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100">
                  ⚠️
                </div>

                <div>
                  <p className="font-bold text-red-800">
                    Unable to load services
                  </p>

                  <p className="mt-1 text-sm text-red-600">{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            LOADING
        ========================================================= */}
        {loading && !error && (
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="animate-pulse rounded-3xl border border-slate-200 bg-white p-6"
              >
                <div className="h-12 w-12 rounded-2xl bg-slate-200" />

                <div className="mt-6 h-6 w-3/4 rounded bg-slate-200" />

                <div className="mt-3 h-4 w-full rounded bg-slate-100" />
                <div className="mt-2 h-4 w-5/6 rounded bg-slate-100" />

                <div className="mt-6 h-7 w-24 rounded-full bg-slate-100" />

                <div className="mt-7 h-4 w-28 rounded bg-slate-200" />
              </div>
            ))}
          </div>
        )}

        {/* =========================================================
            EMPTY
        ========================================================= */}
        {!loading && !error && services.length === 0 && (
          <div className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="px-6 py-16 text-center sm:px-10">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-100 text-3xl">
                📋
              </div>

              <h3 className="mt-6 text-xl font-black text-slate-900">
                No services available
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                There are currently no active services available at this
                office. Please check again later.
              </p>

              <button
                type="button"
                onClick={() => navigate("/citizen")}
                className="mt-6 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
              >
                Return to offices
              </button>
            </div>
          </div>
        )}

        {/* =========================================================
            SERVICE CARDS
        ========================================================= */}
        {!loading && !error && services.length > 0 && (
          <section className="mt-8">
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {services.map((service, index) => {
                const unavailable = service.isActive === false;

                return (
                  <button
                    key={service._id}
                    type="button"
                    disabled={unavailable}
                    onClick={() =>
                      navigate(
                        `/citizen/offices/${officeId}/services/${service._id}/queue`
                      )
                    }
                    className={`group relative overflow-hidden rounded-3xl border bg-white p-6 text-left transition-all duration-300 ${
                      unavailable
                        ? "cursor-not-allowed border-slate-200 opacity-60"
                        : "border-slate-200 shadow-sm hover:-translate-y-1.5 hover:border-teal-200 hover:shadow-xl"
                    }`}
                  >
                    {/* Top accent */}
                    {!unavailable && (
                      <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-teal-500 via-emerald-400 to-blue-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    )}

                    {/* Card header */}
                    <div className="flex items-start justify-between">
                      <div
                        className={`flex h-14 w-14 items-center justify-center rounded-2xl text-xl ${
                          unavailable
                            ? "bg-slate-100"
                            : "bg-gradient-to-br from-teal-50 to-blue-50"
                        }`}
                      >
                        {index % 3 === 0
                          ? "📄"
                          : index % 3 === 1
                            ? "🏛️"
                            : "✓"}
                      </div>

                      {!unavailable && (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition group-hover:bg-teal-50 group-hover:text-teal-600">
                          →
                        </div>
                      )}
                    </div>

                    {/* Service name */}
                    <h3 className="mt-6 text-xl font-black tracking-tight text-slate-900">
                      {service.name}
                    </h3>

                    {/* Description */}
                    {service.description && (
                      <p className="mt-2 min-h-[48px] text-sm leading-6 text-slate-500">
                        {service.description}
                      </p>
                    )}

                    {/* Service info */}
                    <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-5">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                          Service time
                        </p>

                        <p className="mt-1 text-sm font-bold text-slate-700">
                          {service.averageServiceTime
                            ? `${service.averageServiceTime} min`
                            : "Varies"}
                        </p>

                        {!unavailable &&
                          waitingByService[service._id] !== undefined && (
                            <p className="mt-1 text-xs font-semibold text-slate-500">
                              {waitingByService[service._id]} waiting now
                            </p>
                          )}
                      </div>

                      {/* Status */}
                      {unavailable ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-500">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                          Unavailable
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Available
                        </span>
                      )}
                    </div>

                    {/* CTA */}
                    <div
                      className={`mt-5 flex items-center justify-between text-sm font-bold ${
                        unavailable
                          ? "text-slate-400"
                          : "text-teal-700"
                      }`}
                    >
                      <span>
                        {unavailable
                          ? "Currently unavailable"
                          : "Check live queue"}
                      </span>

                      {!unavailable && (
                        <span className="transition-transform duration-200 group-hover:translate-x-1">
                          →
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* =========================================================
            BOTTOM INFORMATION / TRUST SECTION
        ========================================================= */}
        {!loading && !error && services.length > 0 && (
          <section className="mt-12">
            <div className="overflow-hidden rounded-3xl bg-[#073b3a] shadow-xl">
              <div className="relative px-6 py-8 sm:px-8 sm:py-9">
                {/* Decorative circles */}
                <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-teal-400/10 blur-2xl" />
                <div className="absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-blue-400/10 blur-2xl" />

                <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-teal-300">
                      <span className="h-2 w-2 rounded-full bg-emerald-400" />
                      QueueLess
                    </div>

                    <h2 className="mt-2 text-2xl font-black text-white">
                      Save time before you visit.
                    </h2>

                    <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
                      Check queue conditions, choose your service, and arrive
                      closer to your turn instead of waiting at the office.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      navigate(`/citizen/offices/${officeId}/crowd`)
                    }
                    className="group inline-flex shrink-0 items-center justify-center gap-3 rounded-xl bg-white px-5 py-3.5 text-sm font-bold text-[#073b3a] shadow-lg transition hover:-translate-y-0.5 hover:bg-teal-50"
                  >
                    Check crowd levels
                    <span className="transition-transform group-hover:translate-x-1">
                      →
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Footer spacing */}
        <div className="h-6" />
      </main>
    </div>
  );
}