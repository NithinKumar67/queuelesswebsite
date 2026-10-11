import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import {
  EmptyState,
  ErrorBlock,
  LoadingBlock,
  PageHeader,
  StatusBadge,
} from "../../components/admin/AdminUi";
import { getOfficeCounters, getOffices } from "../../services/adminApi";

export default function Offices({ user }) {
  const [offices, setOffices] = useState([]);
  // counters keyed by office id: { counters: [...] } or { error: "..." }
  const [countersByOffice, setCountersByOffice] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const list = await getOffices();
      setOffices(list);

      const results = await Promise.allSettled(
        list.map((office) => getOfficeCounters(office._id))
      );

      const map = {};
      list.forEach((office, index) => {
        const result = results[index];
        map[office._id] =
          result.status === "fulfilled"
            ? { counters: result.value }
            : { error: result.reason?.message || "Could not load counters" };
      });
      setCountersByOffice(map);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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
              title="Offices"
              description="Government offices configured in QueueLess. Offices are set up in the system and cannot be added or edited here."
            />
          </div>

          <div className="space-y-6">
            {loading && (
              <div className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-3xl p-12 shadow-xl">
                <LoadingBlock label="Loading offices..." />
              </div>
            )}
            {!loading && error && (
              <div className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-3xl p-12 shadow-xl">
                <ErrorBlock message={error} onRetry={load} />
              </div>
            )}

            {!loading && !error && offices.length === 0 && (
              <div className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-3xl p-12 shadow-xl">
                <EmptyState
                  icon="🏛️"
                  title="No offices found"
                  description="The backend did not return any offices."
                />
              </div>
            )}

            {!loading && !error && offices.length > 0 && (
              <div className="grid gap-6 lg:grid-cols-2">
                {offices.map((office) => {
                  const entry = countersByOffice[office._id] || {};
                  const counters = entry.counters || [];

                  return (
                    <article
                      key={office._id}
                      className="rounded-3xl border border-white/40 bg-white/75 backdrop-blur-xl p-6 lg:p-8 shadow-2xl transition-all hover:bg-white/90"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500/10 to-emerald-500/10 border border-teal-500/20 text-xl text-teal-700 shadow-sm">
                          🏛️
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-slate-900">{office.name}</h2>
                          <p className="mt-1 text-sm font-medium text-slate-500">
                            {[office.code, office.type].filter(Boolean).join(" · ")}
                          </p>
                        </div>
                      </div>

                      <div className="mt-6">
                        <h3 className="text-sm font-semibold text-slate-700">
                          Counters{entry.counters ? ` (${counters.length})` : ""}
                        </h3>

                        {entry.error && (
                          <p className="mt-2 text-sm font-medium text-red-600">{entry.error}</p>
                        )}

                        {entry.counters && counters.length === 0 && (
                          <p className="mt-2 text-sm font-medium text-slate-500">
                            No counters have been created for this office yet.
                          </p>
                        )}

                        {counters.length > 0 && (
                          <ul className="mt-3 space-y-2">
                            {counters.map((counter) => (
                              <li
                                key={counter._id}
                                className="flex items-center justify-between rounded-2xl bg-white/60 backdrop-blur-md border border-slate-200/60 px-4 py-3 shadow-sm transition-all hover:bg-white"
                              >
                                <div>
                                  <p className="text-sm font-semibold text-slate-900">
                                    {counter.name}
                                  </p>
                                  {counter.currentTokenId && (
                                    <p className="text-xs font-medium text-slate-500">
                                      Token {counter.currentTokenId.tokenNumber} ·{" "}
                                      {counter.currentTokenId.status}
                                    </p>
                                  )}
                                </div>
                                <StatusBadge status={counter.status} />
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      <div className="mt-6 flex flex-wrap gap-3">
                        <Link
                          to={`/admin/services?office=${office._id}`}
                          className="rounded-xl border border-slate-200/80 bg-white/80 backdrop-blur-md px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-white hover:shadow-sm"
                        >
                          View services
                        </Link>
                        <Link
                          to={`/admin/counters?office=${office._id}`}
                          className="rounded-xl border border-slate-200/80 bg-white/80 backdrop-blur-md px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-white hover:shadow-sm"
                        >
                          Manage counters
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}