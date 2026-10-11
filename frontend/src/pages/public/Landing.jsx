import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar";

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      
      {/* Top Government Alert Banner (Inspired by Martin County Portal) */}
      <div className="bg-slate-900 text-teal-300 text-xs py-2 px-4 flex justify-between items-center border-b border-teal-800/40">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="bg-teal-500/20 text-teal-300 font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">
              System Announcement
            </span>
            <span>Real-time queue tracking is currently active across all department branches.</span>
          </div>
          <a href="#how-it-works" className="underline text-teal-200 hover:text-white transition">Read Details &gt;</a>
        </div>
      </div>

      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-[640px]">
        {/* Background Image with Government Portal Dark Teal Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=80"
            alt="Scenic Landscape Background"
            className="w-full h-full object-cover object-center"
          />
          {/* Deep Teal to Slate Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/90 via-teal-950/80 to-slate-900/70 backdrop-brightness-90" />
        </div>

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 z-10 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-20">

          {/* Hero Content */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-400/30 bg-teal-950/60 px-4 py-1.5 backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-widest text-teal-200">
                Official Digital Portal
              </span>
            </div>

            <h1 className="mt-6 max-w-2xl text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              Skip the queue.
              <span className="block text-teal-300 mt-1">
                Save your time.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-teal-100/90">
              Get a virtual token before visiting a government office.
              Track your queue position and know approximately when your
              turn will arrive.
            </p>

            {/* Buttons */}
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                to="/login"
                className="rounded-lg bg-teal-600 px-8 py-3.5 text-center font-bold text-white shadow-lg shadow-teal-950/50 transition hover:bg-teal-500 hover:-translate-y-0.5 active:translate-y-0"
              >
                Get a Token
              </Link>

              <a
                href="#how-it-works"
                className="rounded-lg border border-teal-300/40 bg-white/10 px-8 py-3.5 text-center font-semibold text-white backdrop-blur-md shadow-sm transition hover:bg-white/20 hover:border-teal-200"
              >
                How it works
              </a>
            </div>

            {/* Small benefits */}
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-teal-200/90 border-t border-teal-500/20 pt-6">
              <span className="flex items-center gap-1.5"><span className="text-teal-400">✓</span> Less waiting</span>
              <span className="flex items-center gap-1.5"><span className="text-teal-400">✓</span> Live queue status</span>
              <span className="flex items-center gap-1.5"><span className="text-teal-400">✓</span> Easy to use</span>
            </div>
          </div>

          {/* Queue Preview Card */}
          <div className="relative mx-auto w-full max-w-md">

            {/* Glassmorphism Outer Backdrop */}
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-teal-500/30 to-emerald-500/30 blur-xl" />

            <div className="relative rounded-2xl border border-white/20 bg-white/95 p-6 shadow-2xl backdrop-blur-xl">

              {/* Card Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-2xl border border-teal-100">
                    🏛️
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Current queue
                    </p>

                    <h2 className="font-bold text-slate-900 text-lg">
                      Service Counter
                    </h2>
                  </div>
                </div>

                <span className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Live
                </span>
              </div>

              <div className="my-6 h-px bg-slate-100" />

              {/* Token */}
              <div className="text-center rounded-xl bg-slate-50/80 p-4 border border-slate-100">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  Your Token
                </p>

                <p className="mt-1 text-6xl font-extrabold tracking-tight text-teal-700">
                  A-24
                </p>
              </div>

              {/* Stats */}
              <div className="mt-6 grid grid-cols-2 gap-4">

                <div className="rounded-xl bg-teal-50/60 p-4 border border-teal-100/60">
                  <p className="text-xs font-medium text-slate-500">
                    People ahead
                  </p>

                  <p className="mt-1 text-3xl font-bold text-slate-900">
                    8
                  </p>
                </div>

                <div className="rounded-xl bg-emerald-50/60 p-4 border border-emerald-100/60">
                  <p className="text-xs font-medium text-slate-500">
                    Estimated wait
                  </p>

                  <p className="mt-1 text-3xl font-bold text-slate-900">
                    20
                    <span className="ml-1 text-base font-normal text-slate-600">
                      min
                    </span>
                  </p>
                </div>

              </div>

              {/* Progress Bar */}
              <div className="mt-6">
                <div className="flex gap-1.5 p-1 rounded-full bg-slate-100">
                  <span className="h-2 flex-1 rounded-full bg-teal-600" />
                  <span className="h-2 flex-1 rounded-full bg-teal-500" />
                  <span className="h-2 flex-1 rounded-full bg-emerald-500" />
                  <span className="h-2 flex-1 rounded-full bg-slate-200" />
                  <span className="h-2 flex-1 rounded-full bg-slate-200" />
                </div>

                <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-teal-800">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Queue is moving normally
                </p>
              </div>

            </div>
          </div>
        </div>

       
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="bg-white pt-24 pb-20 border-b border-slate-100"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          <div className="text-center">
            <span className="rounded-full bg-teal-100 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-teal-800">
              Simple Process
            </span>

            <h2 className="mt-4 text-3xl font-extrabold text-slate-900 sm:text-4xl">
              How QueueLess{" "}
              <span className="text-teal-700">works</span>
            </h2>

            <p className="mx-auto mt-3 max-w-2xl text-slate-600">
              Get your virtual token in just a few simple steps.
            </p>
          </div>

          <div className="mt-14 grid gap-8 md:grid-cols-3">

            <Step
              number="01"
              title="Choose an office"
              description="Select the government office you need to visit."
              color="teal"
            />

            <Step
              number="02"
              title="Choose a service"
              description="Select the service you want from that office."
              color="emerald"
            />

            <Step
              number="03"
              title="Get your token"
              description="Take a virtual token and track your queue remotely."
              color="cyan"
            />

          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-slate-900">
              Everything you need to wait smarter
            </h2>

            <p className="mt-3 text-slate-600">
              QueueLess makes government office visits simpler.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">

            <Feature
              title="Virtual Token"
              description="Get your place in the queue without standing there."
              borderAccent="border-emerald-500"
              icon="🎟️"
            />

            <Feature
              title="Live Queue"
              description="See how many people are currently ahead of you."
              borderAccent="border-teal-500"
              icon="📊"
            />

            <Feature
              title="Estimated Wait"
              description="Get an approximate idea of your waiting time."
              borderAccent="border-amber-500"
              icon="⏱️"
            />

            <Feature
              title="Turn Alerts"
              description="Know when your turn is getting closer."
              borderAccent="border-teal-600"
              icon="🔔"
            />

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-teal-900 bg-slate-950 text-slate-400">
        <div className="mx-auto max-w-7xl px-4 py-8 text-center text-sm sm:px-6 lg:px-8">
          <p className="font-semibold text-slate-200">QueueLess — Smart Virtual Queue Management</p>
          <p className="mt-1 text-xs text-slate-500">Official Portal for Resident Services &amp; Online Appointment Systems</p>
        </div>
      </footer>
    </div>
  );
}


/* Step Component */

function Step({ number, title, description, color }) {
  const colors = {
    teal: "bg-teal-100 text-teal-800 border-teal-200",
    emerald: "bg-emerald-100 text-emerald-800 border-emerald-200",
    cyan: "bg-cyan-100 text-cyan-800 border-cyan-200",
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md hover:border-teal-200">
      <div className="flex items-start gap-4">

        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border font-bold text-lg ${colors[color]}`}
        >
          {number}
        </div>

        <div>
          <h3 className="text-lg font-bold text-slate-900">
            {title}
          </h3>

          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            {description}
          </p>
        </div>

      </div>
    </div>
  );
}


/* Feature Component */

function Feature({ title, description, borderAccent, icon }) {
  return (
    <div
      className={`rounded-xl border-t-4 ${borderAccent} border-x border-b border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-xl shadow-inner">
        {icon}
      </div>

      <h3 className="mt-5 font-bold text-slate-900 text-base">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        {description}
      </p>
    </div>
  );
}