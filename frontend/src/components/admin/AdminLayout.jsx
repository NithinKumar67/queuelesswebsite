import { useState } from "react";
import { Link, NavLink, Navigate, useNavigate } from "react-router-dom";
import { logoutUser } from "../../services/authApi";
import { useAuth } from "../../context/AuthContext";

const NAV_ITEMS = [
  { label: "Dashboard", path: "/admin", end: true },
  { label: "Offices", path: "/admin/offices" },
  { label: "Services", path: "/admin/services" },
  { label: "Counters", path: "/admin/counters" },
  { label: "Staff", path: "/admin/staff" },
  { label: "Analytics", path: "/admin/analytics" },
];

const navLinkClass = ({ isActive }) =>
  `whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition ${
    isActive
      ? "bg-blue-50 text-blue-700"
      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
  }`;

export default function AdminLayout({ user, children }) {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  async function handleLogout() {
    setLoggingOut(true);
    setLogoutError("");

    try {
      await logoutUser();
      setUser(null);
      navigate("/login", { replace: true });
    } catch {
      setLogoutError("Logout failed. Please try again.");
      setLoggingOut(false);
    }
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-slate-900">
            Access denied
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            This area is only available to administrators.
          </p>

          <Link
            to={user.role === "operator" ? "/operator" : "/citizen"}
            className="mt-5 inline-block rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-3 text-sm font-semibold text-white"
          >
            Go to my dashboard
          </Link>
        </div>
      </div>
    );
  }

  const initial = (user.name || user.email || "A")
    .charAt(0)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <Link
              to="/admin"
              className="text-2xl font-bold tracking-tight"
            >
              <span className="text-slate-900">Queue</span>
              <span className="text-blue-600">Less</span>
            </Link>

            <nav
              className="hidden items-center gap-1 lg:flex"
              aria-label="Admin"
            >
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
                  className={navLinkClass}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              className="flex items-center gap-3 rounded-xl px-3 py-2 transition hover:bg-slate-100"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-purple-100 font-semibold text-blue-600">
                {initial}
              </div>

              <div className="hidden text-left sm:block">
                <p className="text-sm font-semibold text-slate-900">
                  {user.name}
                </p>

                <p className="text-xs capitalize text-slate-500">
                  {user.role === "admin" ? "Administrator" : user.role}
                </p>
              </div>

              <span className="text-xs text-slate-400">▼</span>
            </button>

            {menuOpen && (
              <>
                <button
                  type="button"
                  aria-label="Close menu"
                  className="fixed inset-0 z-40 cursor-default"
                  onClick={() => setMenuOpen(false)}
                />

                <div
                  role="menu"
                  className="absolute right-0 z-50 mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-purple-100 text-lg font-semibold text-blue-600">
                      {initial}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">
                        {user.name}
                      </p>

                      <p className="truncate text-sm text-slate-500">
                        {user.email}
                      </p>

                      <span className="mt-1 inline-block rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                        Administrator
                      </span>
                    </div>
                  </div>

                  {logoutError && (
                    <p className="mt-3 text-sm text-red-600">
                      {logoutError}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="mt-4 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                  >
                    {loggingOut ? "Logging out..." : "Log out"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <nav
          className="flex gap-1 overflow-x-auto border-t border-slate-100 px-4 py-2 lg:hidden"
          aria-label="Admin"
        >
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={navLinkClass}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}