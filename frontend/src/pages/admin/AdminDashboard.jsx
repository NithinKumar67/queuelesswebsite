import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import {
  ErrorBlock,
  LoadingBlock,
  PageHeader,
} from "../../components/admin/AdminUi";
import {
  getOffices,
  getQueueAnalytics,
  getStaff,
} from "../../services/adminApi";

const QUICK_LINKS = [
  {
    title: "Offices",
    description: "View configured government offices",
    icon: "🏛️",
    path: "/admin/offices",
  },
  {
    title: "Services",
    description: "Create and manage services per office",
    icon: "📋",
    path: "/admin/services",
  },
  {
    title: "Counters",
    description: "Create and manage service counters",
    icon: "🖥️",
    path: "/admin/counters",
  },
  {
    title: "Staff",
    description: "Manage operators and their assignments",
    icon: "👥",
    path: "/admin/staff",
  },
  {
    title: "Analytics",
    description: "Queue totals and peak hours",
    icon: "📊",
    path: "/admin/analytics",
  },
];

const TOKEN_CARDS = [
  {
    key: "waitingTokens",
    label: "Waiting",
    color: "text-emerald-400",
    badgeBg: "bg-emerald-500/10 border-emerald-500/20",
  },
  {
    key: "calledTokens",
    label: "Called",
    color: "text-teal-300",
    badgeBg: "bg-teal-500/10 border-teal-500/20",
  },
  {
    key: "servingTokens",
    label: "Serving",
    color: "text-emerald-300",
    badgeBg: "bg-emerald-400/10 border-emerald-400/20",
  },
  {
    key: "completedTokens",
    label: "Completed",
    color: "text-emerald-500",
    badgeBg: "bg-emerald-600/10 border-emerald-600/20",
  },
  {
    key: "skippedTokens",
    label: "Skipped",
    color: "text-amber-400",
    badgeBg: "bg-amber-500/10 border-amber-500/20",
  },
  {
    key: "cancelledTokens",
    label: "Cancelled",
    color: "text-slate-400",
    badgeBg: "bg-slate-700/30 border-slate-700",
  },
];

export default function AdminDashboard({ user }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [offices, staff, queue] = await Promise.all([
        getOffices(),
        getStaff(),
        getQueueAnalytics(),
      ]);

      setData({
        offices,
        staff,
        queue,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const unassigned = data
    ? data.staff.filter(
        (staffMember) =>
          !staffMember.officeId || !staffMember.counterId
      ).length
    : 0;

  return (
    <AdminLayout user={user}>
      <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 font-sans">
        {/* Header Section */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-widest mb-3">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Official Digital Portal
          </div>
          <PageHeader
            title="Administration Dashboard"
            description="Overview of offices, operators and queue activity across QueueLess."
          />
        </div>

        <div className="mt-8 space-y-8">
          {loading && <LoadingBlock label="Loading dashboard..." />}

          {!loading && error && (
            <ErrorBlock message={error} onRetry={load} />
          )}

          {!loading && !error && data && (
            <>
              {/* Stat Cards Overview */}
              <section className="grid gap-5 sm:grid-cols-3">
                <div className="group relative rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md transition hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Government Offices
                  </p>
                  <p className="mt-3 text-4xl font-extrabold text-white">
                    {data.offices.length}
                  </p>
                  <p className="mt-2 text-xs text-slate-400 flex items-center gap-1">
                    <span className="text-emerald-400">✓</span> Active locations
                  </p>
                </div>

                <div className="group relative rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md transition hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Operators
                  </p>
                  <p className="mt-3 text-4xl font-extrabold text-white">
                    {data.staff.length}
                  </p>
                  {unassigned > 0 ? (
                    <p className="mt-2 text-xs font-medium text-amber-400/90 flex items-center gap-1">
                      <span>⚠️</span> {unassigned} unassigned operator(s)
                    </p>
                  ) : (
                    <p className="mt-2 text-xs text-slate-400 flex items-center gap-1">
                      <span className="text-emerald-400">✓</span> All staff assigned
                    </p>
                  )}
                </div>

                <div className="group relative rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-emerald-950/30 p-6 backdrop-blur-md shadow-lg shadow-emerald-950/20">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Total Tokens
                  </p>
                  <p className="mt-3 text-4xl font-extrabold text-emerald-400">
                    {data.queue.totalTokens}
                  </p>
                  <p className="mt-2 text-xs text-slate-400">
                    All queue token records
                  </p>
                </div>
              </section>

              {/* Live Queue Summary */}
              <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-2xl font-bold tracking-tight text-white">
                        Queue Summary
                      </h2>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        Live
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-400">
                      Tokens organized by current queue status
                    </p>
                  </div>

                  <Link
                    to="/admin/analytics"
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-800/80 px-4 py-2 text-sm font-semibold text-emerald-400 transition hover:bg-emerald-500/10 hover:text-emerald-300 border border-slate-700/50 hover:border-emerald-500/30"
                  >
                    View analytics
                    <span>→</span>
                  </Link>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
                  {TOKEN_CARDS.map((card) => (
                    <div
                      key={card.key}
                      className={`rounded-xl border p-4 backdrop-blur-sm transition-all hover:-translate-y-0.5 ${card.badgeBg}`}
                    >
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        {card.label}
                      </p>
                      <p className={`mt-2 text-3xl font-extrabold ${card.color}`}>
                        {data.queue[card.key] ?? 0}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Quick Navigation Cards */}
              <section>
                <h2 className="text-xl font-bold text-white mb-4">
                  Management Overview
                </h2>

                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {QUICK_LINKS.map((link) => (
                    <Link
                      key={link.path}
                      to={link.path}
                      className="group relative flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/60 p-6 transition-all duration-200 hover:-translate-y-1 hover:border-emerald-500/40 hover:bg-slate-900/90 hover:shadow-xl hover:shadow-emerald-500/5"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 border border-slate-700/60 text-2xl group-hover:border-emerald-500/30 group-hover:bg-emerald-500/10 transition-colors">
                            {link.icon}
                          </div>

                          <span className="text-xl text-slate-500 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-emerald-400">
                            →
                          </span>
                        </div>

                        <h3 className="mt-5 text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">
                          {link.title}
                        </h3>

                        <p className="mt-2 text-sm leading-relaxed text-slate-400">
                          {link.description}
                        </p>
                      </div>

                      <div className="mt-4 pt-4 border-t border-slate-800/60 flex items-center text-xs font-medium text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        Manage section →
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}