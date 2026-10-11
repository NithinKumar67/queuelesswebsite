import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="border-b border-slate-100 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

        <Link
          to="/"
          className="text-2xl font-bold tracking-tight"
        >
          <span className="text-slate-900">Queue</span>
          <span className="text-blue-600">Less</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">

          <a
            href="#how-it-works"
            className="font-medium text-slate-600 transition hover:text-blue-600"
          >
            How it works
          </a>

          <Link
            to="/login"
            className="font-medium text-slate-600 transition hover:text-blue-600"
          >
            Login
          </Link>

          <Link
            to="/register"
            className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-2.5 font-semibold text-white shadow-md shadow-blue-100 transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            Register
          </Link>

        </div>

        <Link
          to="/login"
          className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white md:hidden"
        >
          Login
        </Link>

      </div>
    </nav>
  );
}