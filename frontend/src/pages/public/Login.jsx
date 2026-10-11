import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

import {
  loginUser,
  getCurrentUser,
} from "../../services/authApi";
import { useAuth } from "../../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function handleChange(event) {
    const { id, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const data = await loginUser(formData);

      if (!data.user) {
        setError(data.message || "Login failed");
        return;
      }

      // Verify the authenticated session
      const currentUser = await getCurrentUser();

      if (!currentUser.authenticated || !currentUser.user) {
        setError(
          "Login succeeded, but the session could not be verified."
        );
        return;
      }

      // Get the actual role from the verified session
      const role = currentUser.user.role;

      // Make the verified user available to every page (App only read it once at load).
      setUser(currentUser.user);

      // Redirect based on role
      if (role === "citizen") {
        navigate("/citizen", { replace: true });
      } else if (role === "operator") {
        navigate("/operator", { replace: true });
      } else if (role === "admin") {
        navigate("/admin", { replace: true });
      } else {
        setError("Unknown user role");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Unable to connect to the server");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#061b3a]">

      {/* ===================================================== */}
      {/* BACKGROUND IMAGE */}
      {/* ===================================================== */}

      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/registration.png')",
        }}
      />

      {/* Dark blue overlay */}
      <div className="absolute inset-0 bg-[#031b3d]/35" />

      {/* Gradient overlay for better readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#031b3d]/70 via-[#031b3d]/20 to-transparent" />

      {/* ===================================================== */}
      {/* HEADER */}
      {/* ===================================================== */}

      <header className="relative z-30 border-b border-white/20 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

          {/* QueueLess Logo */}
          <Link
            to="/"
            aria-label="QueueLess home"
            className="text-2xl font-extrabold tracking-tight"
          >
            <span className="text-slate-900">
              Queue
            </span>

            <span className="text-blue-600">
              Less
            </span>
          </Link>

          {/* Back to Home */}
          <Link
            to="/"
            className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 transition hover:text-blue-600"
          >
            <span>←</span>
            Back to home
          </Link>

        </div>
      </header>

      {/* ===================================================== */}
      {/* MAIN LOGIN SECTION */}
      {/* ===================================================== */}

      <main className="relative z-10 flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-10 sm:px-6 lg:justify-start lg:px-16 xl:px-24">

        <div className="w-full max-w-md">

          {/* ================================================= */}
          {/* LOGIN CARD */}
          {/* ================================================= */}

          <div className="rounded-[28px] border border-white/50 bg-white/90 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.30)] backdrop-blur-xl sm:p-8">

            {/* ================================================= */}
            {/* LOGIN HEADER */}
            {/* ================================================= */}

            <div className="mb-7 text-center">

              {/* Q Logo */}
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 text-2xl font-bold text-white shadow-lg shadow-blue-500/30">
                Q
              </div>

              {/* Heading */}
              <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-900">
                Welcome back
              </h1>

              <p className="mt-2 text-sm text-slate-600">
                Login to continue to QueueLess
              </p>

            </div>

            {/* ================================================= */}
            {/* FORM */}
            {/* ================================================= */}

            <form
              className="space-y-5"
              onSubmit={handleSubmit}
              noValidate
            >

              {/* ================================================= */}
              {/* ERROR MESSAGE */}
              {/* ================================================= */}

              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600"
                >
                  {error}
                </div>
              )}

              {/* ================================================= */}
              {/* EMAIL */}
              {/* ================================================= */}

              <div>

                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Email
                </label>

                <div className="relative">

                  <Mail
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="h-12 w-full rounded-xl border border-slate-300 bg-white/90 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />

                </div>

              </div>

              {/* ================================================= */}
              {/* PASSWORD */}
              {/* ================================================= */}

              <div>

                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Password
                </label>

                <div className="relative">

                  <Lock
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="h-12 w-full rounded-xl border border-slate-300 bg-white/90 pl-11 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />

                  {/* Show / Hide Password */}
                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((prev) => !prev)
                    }
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                    className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  >
                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>

                </div>

              </div>

              {/* ================================================= */}
              {/* LOGIN BUTTON */}
              {/* ================================================= */}

              <button
                type="submit"
                disabled={loading}
                className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-4 font-semibold text-white shadow-lg shadow-blue-500/30 transition duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-500/40 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60"
              >

                {loading ? (
                  <>
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                    Logging in...
                  </>
                ) : (
                  <>
                    Login

                    <ArrowRight
                      size={17}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </>
                )}

              </button>

            </form>

            {/* ================================================= */}
            {/* REGISTER */}
            {/* ================================================= */}

            <p className="mt-6 text-center text-sm text-slate-600">

              Don't have an account?{" "}

              <Link
                to="/register"
                className="font-semibold text-blue-600 transition hover:text-purple-600"
              >
                Register
              </Link>

            </p>

            {/* ================================================= */}
            {/* SECURITY MESSAGE */}
            {/* ================================================= */}

            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">

              <ShieldCheck size={14} />

              <span>
                Secure QueueLess access
              </span>

            </div>

          </div>

        </div>

      </main>
    </div>
  );
}