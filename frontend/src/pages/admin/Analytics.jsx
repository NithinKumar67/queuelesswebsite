import { useCallback, useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import {
  EmptyState,
  ErrorBlock,
  LoadingBlock,
  PageHeader,
  inputClass,
  labelClass,
  secondaryBtn,
} from "../../components/admin/AdminUi";
import {
  getOfficePeakHours,
  getOffices,
  getPeakHours,
  getQueueAnalytics,
} from "../../services/adminApi";

const STATUS_CARDS = [
  { key: "waitingTokens", label: "Waiting", text: "text-blue-600", bar: "bg-blue-500" },
  { key: "calledTokens", label: "Called", text: "text-purple-600", bar: "bg-purple-500" },
  { key: "servingTokens", label: "Serving", text: "text-indigo-600", bar: "bg-indigo-500" },
  { key: "completedTokens", label: "Completed", text: "text-green-600", bar: "bg-green-500" },
  { key: "skippedTokens", label: "Skipped", text: "text-orange-500", bar: "bg-orange-500" },
  { key: "cancelledTokens", label: "Cancelled", text: "text-slate-500", bar: "bg-slate-400" },
];

const hourLabel = (hour) => `${String(hour).padStart(2, "0")}:00`;

// Bar chart of { hour, tokenCount } rows, shown in hour order.
function PeakChart({ peakHours }) {
  if (peakHours.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-slate-500 font-medium">
        No token activity recorded yet.
      </p>
    );
  }

  const byHour = [...peakHours].sort((a, b) => a.hour - b.hour);
  const max = Math.max(...byHour.map((row) => row.tokenCount), 1);
  const busiest = [...peakHours].sort((a, b) => b.tokenCount - a.tokenCount)[0];

  return (
    <div>
      <p className="text-sm text-slate-600 font-medium">
        Busiest hour:{" "}
        <span className="font-semibold text-slate-900">{hourLabel(busiest.hour)}</span>{" "}
        ({busiest.tokenCount} {busiest.tokenCount === 1 ? "token" : "tokens"})
      </p>

      <div className="mt-6 overflow-x-auto pb-2">
        <div className="flex h-52 min-w-max items-end gap-3.5">
          {byHour.map((row) => (
            <div key={row.hour} className="flex h-full w-12 flex-col items-center justify-end gap-2">
              <span className="text-xs font-semibold text-slate-600">{row.tokenCount}</span>
              <div
                className="w-full max-w-8 rounded-t-xl bg-gradient-to-t from-teal-600 to-emerald-500 shadow-md shadow-teal-600/10 transition-all duration-300 hover:opacity-90"
                style={{ height: `${(row.tokenCount / max) * 100}%`, minHeight: "6px" }}
                title={`${hourLabel(row.hour)}: ${row.tokenCount} tokens`}
              />
              <span className="text-[10px] font-medium text-slate-500 sm:text-xs">{hourLabel(row.hour)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Analytics({ user }) {
  const [data, setData] = useState(null); // { queue, peakHours, offices }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [officeId, setOfficeId] = useState("");
  const [officeData, setOfficeData] = useState(null); // { office, peakHours }
  const [officeLoading, setOfficeLoading] = useState(false);
  const [officeError, setOfficeError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [queue, peakHours, offices] = await Promise.all([
        getQueueAnalytics(),
        getPeakHours(),
        getOffices(),
      ]);
      setData({ queue, peakHours, offices });
      setOfficeId((current) => current || offices[0]?._id || "");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!officeId) return;

    let cancelled = false;
    setOfficeLoading(true);
    setOfficeError("");

    getOfficePeakHours(officeId)
      .then((result) => {
        if (!cancelled) setOfficeData(result);
      })
      .catch((err) => {
        if (!cancelled) {
          setOfficeData(null);
          setOfficeError(err.message);
        }
      })
      .finally(() => {
        if (!cancelled) setOfficeLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [officeId]);

  const queue = data?.queue;

  return (
    <AdminLayout user={user}>
      <div className="relative min-h-screen -m-6 p-6 lg:p-8">
        {/* Background image overlay matching reference aesthetic */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center bg-fixed pointer-events-none opacity-25"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=2000&q=80')` }}
        />
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-slate-950/70 via-slate-900/60 to-teal-950/70 backdrop-blur-[2px] pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-xl rounded-3xl p-6 lg:p-8">
            <PageHeader
              title="Analytics Dashboard"
              description="Token totals by status and peak hours, calculated from actual token records."
              action={
                !loading && (
                  <button type="button" onClick={load} className={`${secondaryBtn} bg-white/80 backdrop-blur-md shadow-sm hover:bg-white transition-all`}>
                    Refresh
                  </button>
                )
              }
            />
          </div>

          <div className="space-y-6">
            {loading && (
              <div className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-3xl p-12 shadow-xl">
                <LoadingBlock label="Loading analytics..." />
              </div>
            )}
            {!loading && error && (
              <div className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-3xl p-12 shadow-xl">
                <ErrorBlock message={error} onRetry={load} />
              </div>
            )}

            {!loading && !error && data && (
              <>
                {/* Queue totals */}
                <section className="rounded-3xl border border-white/40 bg-white/75 backdrop-blur-xl p-6 lg:p-8 shadow-2xl">
                  <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">Queue Totals</h2>
                      <p className="mt-1 text-sm text-slate-500 font-medium">All token records across all offices</p>
                    </div>
                    <div className="text-right bg-white/60 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-slate-200/60 shadow-sm">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total tokens</p>
                      <p className="text-3xl font-extrabold text-slate-900">{queue.totalTokens}</p>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
                    {STATUS_CARDS.map((card) => (
                      <div key={card.key} className="rounded-2xl bg-white/60 backdrop-blur-md border border-slate-200/60 p-4 shadow-sm transition-all hover:bg-white/80">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{card.label}</p>
                        <p className={`mt-2 text-2xl font-extrabold ${card.text}`}>{queue[card.key] ?? 0}</p>
                      </div>
                    ))}
                  </div>

                  {queue.totalTokens > 0 && (
                    <div className="mt-8 bg-white/50 backdrop-blur-md p-6 rounded-2xl border border-slate-200/60">
                      <p className="text-sm font-semibold text-slate-800">Distribution</p>
                      <div
                        className="mt-3 flex h-3.5 overflow-hidden rounded-full bg-slate-200/70 shadow-inner"
                        role="img"
                        aria-label="Token status distribution"
                      >
                        {STATUS_CARDS.map((card) => (
                          <div
                            key={card.key}
                            className={card.bar}
                            style={{ width: `${((queue[card.key] ?? 0) / queue.totalTokens) * 100}%` }}
                            title={`${card.label}: ${queue[card.key] ?? 0}`}
                          />
                        ))}
                      </div>
                      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs font-medium text-slate-600">
                        {STATUS_CARDS.map((card) => (
                          <span key={card.key} className="flex items-center gap-2">
                            <span className={`h-3 w-3 rounded-full ${card.bar} shadow-sm`} />
                            {card.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </section>

                {/* Overall peak hours */}
                <section className="rounded-3xl border border-white/40 bg-white/75 backdrop-blur-xl p-6 lg:p-8 shadow-2xl">
                  <h2 className="text-xl font-bold text-slate-900">Peak Hours — All Offices</h2>
                  <p className="mt-1 text-sm text-slate-500 font-medium">
                    Tokens created per hour of the day, as reported by the server.
                  </p>
                  <div className="mt-6">
                    <PeakChart peakHours={data.peakHours} />
                  </div>
                </section>

                {/* Office peak hours */}
                <section className="rounded-3xl border border-white/40 bg-white/75 backdrop-blur-xl p-6 lg:p-8 shadow-2xl">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">Peak Hours by Office</h2>
                      <p className="mt-1 text-sm text-slate-500 font-medium">Select an office to see its busiest hours.</p>
                    </div>

                    {data.offices.length > 0 && (
                      <div className="w-full sm:w-72">
                        <label htmlFor="analyticsOffice" className={labelClass}>Government office</label>
                        <select
                          id="analyticsOffice"
                          value={officeId}
                          onChange={(e) => setOfficeId(e.target.value)}
                          className={`${inputClass} backdrop-blur-md bg-white/80 border-slate-200/80 focus:bg-white transition-all`}
                        >
                          {data.offices.map((office) => (
                            <option key={office._id} value={office._id}>{office.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="mt-6">
                    {data.offices.length === 0 && (
                      <EmptyState icon="🏛️" title="No offices found" />
                    )}
                    {officeLoading && <LoadingBlock label="Loading office peak hours..." />}
                    {!officeLoading && officeError && <ErrorBlock message={officeError} />}
                    {!officeLoading && !officeError && officeData && (
                      <>
                        <p className="mb-4 text-sm font-bold text-slate-800">
                          {officeData.office?.name}
                        </p>
                        <PeakChart peakHours={officeData.peakHours} />
                      </>
                    )}
                  </div>
                </section>
              </>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}