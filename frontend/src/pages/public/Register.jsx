import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

import { registerUser } from "../../services/authApi";

export default function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const data = await registerUser({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
      });

      if (!data.user) {
        setError(data.message || "Registration failed");
        return;
      }

      navigate("/login");
    } catch (error) {
      console.error("Registration error:", error);
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

      {/* Gradient overlay */}
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
      {/* REGISTRATION SECTION */}
      {/* ===================================================== */}

      <main className="relative z-10 flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8 sm:px-6 lg:justify-start lg:px-16 xl:px-24">

        <div className="w-full max-w-md">

          {/* ================================================= */}
          {/* REGISTRATION CARD */}
          {/* ================================================= */}

          <div className="rounded-[28px] border border-white/50 bg-white/90 p-6 shadow-[0_25px_80px_rgba(0,0,0,0.30)] backdrop-blur-xl sm:p-8">

            {/* ================================================= */}
            {/* HEADER / LOGO */}
            {/* ================================================= */}

            <div className="mb-6 text-center">

              {/* Q Logo */}
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 text-2xl font-bold text-white shadow-lg shadow-blue-500/30">
                Q
              </div>

              <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-900">
                Create your account
              </h1>

              <p className="mt-2 text-sm text-slate-600">
                Join QueueLess and skip the waiting line
              </p>

            </div>

            {/* ================================================= */}
            {/* FORM */}
            {/* ================================================= */}

            <form
              className="space-y-4"
              onSubmit={handleSubmit}
              noValidate
            >

              {/* ================================================= */}
              {/* ERROR */}
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
              {/* FULL NAME */}
              {/* ================================================= */}

              <div>

                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Full name
                </label>

                <div className="relative">

                  <User
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="name"
                    type="text"
                    autoComplete="name"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white/90 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />

                </div>

              </div>

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
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white/90 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />

                </div>

              </div>

              {/* ================================================= */}
              {/* PHONE */}
              {/* ================================================= */}

              <div>

                <label
                  htmlFor="phone"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Phone
                </label>

                <div className="relative">

                  <Phone
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="Enter your phone number"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white/90 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
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
                    autoComplete="new-password"
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white/90 pl-11 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />

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
              {/* CONFIRM PASSWORD */}
              {/* ================================================= */}

              <div>

                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Confirm password
                </label>

                <div className="relative">

                  <Lock
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="confirmPassword"
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    autoComplete="new-password"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white/90 pl-11 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword((prev) => !prev)
                    }
                    aria-label={
                      showConfirmPassword
                        ? "Hide confirm password"
                        : "Show confirm password"
                    }
                    className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>

                </div>

              </div>

              {/* ================================================= */}
              {/* CREATE ACCOUNT BUTTON */}
              {/* ================================================= */}

              <button
                type="submit"
                disabled={loading}
                className="group mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-4 font-semibold text-white shadow-lg shadow-blue-500/30 transition duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-500/40 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60"
              >

                {loading ? (
                  <>
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                    Creating Account...
                  </>
                ) : (
                  <>
                    Create Account

                    <ArrowRight
                      size={17}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </>
                )}

              </button>

            </form>

            {/* ================================================= */}
            {/* LOGIN LINK */}
            {/* ================================================= */}

            <p className="mt-5 text-center text-sm text-slate-600">

              Already have an account?{" "}

              <Link
                to="/login"
                className="font-semibold text-blue-600 transition hover:text-purple-600"
              >
                Login
              </Link>

            </p>

            {/* ================================================= */}
            {/* SECURITY MESSAGE */}
            {/* ================================================= */}

            <div className="mt-5 flex items-center justify-center gap-2 text-xs text-slate-400">

              <ShieldCheck size={14} />

              <span>
                Secure QueueLess account creation
              </span>

            </div>

          </div>

        </div>

      </main>
    </div>
  );
}