import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import CitizenNavbar from "../../components/citizen/CitizenNavbar";
import { getTokenDetails, cancelToken } from "../../services/citizenApi";
import useDebouncedCallback from "../../hooks/useDebouncedCallback";
import useOfficeSocket from "../../hooks/useOfficeSocket";

export default function ActiveToken({ user }) {
  const navigate = useNavigate();
  const { tokenId } = useParams();

  const [tokenData, setTokenData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState(null);

  // Only the newest response may update the screen (a slow earlier request
  // must not overwrite a newer one).
  const latestRequest = useRef(0);

  // `silent` refreshes (triggered by live updates) keep the current screen:
  // no spinner, and a failed refresh keeps the last known token on screen.
  const fetchDetails = useCallback(
    async ({ silent = false } = {}) => {
      const requestId = ++latestRequest.current;

      try {
        if (!silent) {
          setLoading(true);
          setError(null);
        }

        const res = await getTokenDetails(tokenId);

        if (requestId !== latestRequest.current) return;

        if (res.success && res.token) {
          setTokenData(res);
          setError(null);
        } else if (!silent) {
          setError(res.message || "Failed to load token details");
        }
      } catch {
        if (!silent && requestId === latestRequest.current) {
          setError("Network error. Could not load token details.");
        }
      } finally {
        if (!silent && requestId === latestRequest.current) {
          setLoading(false);
        }
      }
    },
    [tokenId]
  );

  useEffect(() => {
    if (tokenId) {
      fetchDetails();
    }
  }, [tokenId, fetchDetails]);

  // Live updates: any queue/token/counter event in the token's office may change
  // this token's status, position or wait time, so refetch the authoritative
  // data instead of guessing it from the event payload.
  const scheduleRefresh = useDebouncedCallback(
    () => fetchDetails({ silent: true }),
    250
  );

  const socketStatus = useOfficeSocket(
    tokenData?.token?.officeId?._id || tokenData?.token?.officeId,
    { onEvent: scheduleRefresh, onSync: scheduleRefresh }
  );

  const handleCancel = async () => {
    if (!window.confirm("Are you sure you want to cancel your token?")) {
      return;
    }

    try {
      setCancelling(true);
      const res = await cancelToken(tokenId);

      if (res.success) {
        alert("Token cancelled successfully.");
        navigate("/citizen");
      } else {
        alert(res.message || "Failed to cancel token.");
      }
    } catch (err) {
      console.error("Cancel error:", err);
      alert("Network error while cancelling token.");
    } finally {
      setCancelling(false);
    }
  };

  const token = tokenData?.token;
  const queuePosition = tokenData?.queuePosition;
  const estimatedWaitTime = tokenData?.estimatedWaitTimeMinutes;
  const peopleAhead = Math.max(0, (queuePosition || 1) - 1);

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-fixed relative text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-white"
      style={{
        backgroundImage: `linear-gradient(to bottom, rgba(5, 30, 25, 0.88), rgba(10, 45, 35, 0.95)), url('https://images.unsplash.com/photo-1542224566-6e85f2e6772f?q=80&w=2000&auto=format&fit=crop')`
      }}
    >
      {/* Top Banner Context matching reference */}
      <div className="w-full bg-slate-950/80 backdrop-blur-md text-emerald-400 px-6 py-2 text-xs font-medium flex justify-between items-center border-b border-emerald-500/20">
        <div className="flex items-center gap-2">
          <span className="bg-emerald-500 text-slate-950 font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">
            Live Portal
          </span>
          <span className="hidden sm:inline text-slate-300">
            {socketStatus === "connected"
              ? "Real-time queue tracking is currently active."
              : "Reconnecting to live updates - this page also refreshes when you reload."}
          </span>
        </div>
      </div>

      {/* Citizen Navbar */}
      <CitizenNavbar user={user} />

      {/* Main Container */}
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8 w-full flex-1 relative z-10">
        {/* Back */}
        <button
          type="button"
          onClick={() => navigate("/citizen")}
          className="mb-8 text-sm font-semibold text-emerald-300 transition hover:text-emerald-200 flex items-center gap-1.5"
        >
          ← Back to home
        </button>

        {loading ? (
          <div className="mt-10 rounded-3xl border border-white/20 bg-slate-900/90 backdrop-blur-xl p-12 text-center shadow-2xl">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
            <p className="mt-4 text-slate-300">Loading virtual token...</p>
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-rose-500/30 bg-rose-950/80 backdrop-blur-xl p-8 text-center text-rose-200 shadow-2xl">
            <h2 className="text-xl font-bold">Error</h2>
            <p className="mt-2 text-sm text-rose-300">{error}</p>
            <button
              type="button"
              onClick={() => navigate("/citizen")}
              className="mt-6 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 shadow-lg"
            >
              Return Home
            </button>
          </div>
        ) : !token ? (
          <div className="rounded-3xl border border-white/20 bg-slate-900/90 backdrop-blur-xl p-8 text-center text-slate-300 shadow-2xl">
            Token not found.
          </div>
        ) : (
          <>
            {/* Heading */}
            <div className="text-center">
              <span
                className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider backdrop-blur-md border ${
                  token.status === "WAITING"
                    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                    : token.status === "CALLED" || token.status === "SERVING"
                    ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                    : "bg-slate-800/80 border-slate-700 text-slate-300"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    token.status === "WAITING"
                      ? "bg-emerald-400 animate-pulse"
                      : token.status === "CALLED" || token.status === "SERVING"
                      ? "bg-emerald-400 animate-ping"
                      : "bg-slate-400"
                  }`}
                />
                Status: {token.status}
              </span>

              <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Your Virtual Token
              </h1>

              <p className="mt-2 text-sm text-slate-300 font-medium">
                {token.officeId?.name} · {token.serviceId?.name}
              </p>
            </div>

            {/* Token Card */}
            <div className="mx-auto mt-8 max-w-2xl rounded-3xl border border-white/20 bg-slate-900/90 backdrop-blur-xl p-6 shadow-2xl sm:p-8 text-slate-100 flex flex-col gap-6">
              {/* Token number */}
              <div className="rounded-2xl bg-slate-950/60 border border-white/10 py-8 text-center flex flex-col items-center justify-center gap-2">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                  Token Number
                </p>

                <p className="text-6xl sm:text-7xl font-black tracking-tight text-emerald-400">
                  {token.tokenNumber}
                </p>

                <span className="mt-2 inline-block rounded-full bg-emerald-500/20 border border-emerald-500/30 px-4 py-1 text-xs font-semibold text-emerald-300 uppercase">
                  {token.status}
                </span>
              </div>

              {/* Main stats */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-950/40 border border-white/10 p-5 text-center flex flex-col justify-center">
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">People ahead</p>

                  <p className="mt-1 text-3xl sm:text-4xl font-extrabold text-white">
                    {token.status === "WAITING" ? peopleAhead : 0}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    people waiting before you
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-950/40 border border-white/10 p-5 text-center flex flex-col justify-center">
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Estimated wait</p>

                  <p className="mt-1 text-3xl sm:text-4xl font-extrabold text-emerald-400">
                    {estimatedWaitTime !== null && estimatedWaitTime !== undefined
                      ? estimatedWaitTime
                      : 0}
                    <span className="ml-1 text-base font-normal text-slate-400">min</span>
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    approximate waiting time
                  </p>
                </div>
              </div>

              {/* Counter info */}
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-5 text-center">
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Assigned Counter</p>
                <p className="mt-1 text-lg font-bold text-white">
                  {token.counterId?.number
                    ? `Counter #${token.counterId.number}`
                    : "Will be assigned when called"}
                </p>
              </div>

              {/* Cancel Button */}
              {["WAITING", "CALLED"].includes(token.status) && (
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="w-full rounded-xl border border-rose-500/30 bg-rose-600/10 px-6 py-3.5 font-semibold text-rose-300 transition hover:bg-rose-600/20 hover:border-rose-500/50 disabled:cursor-not-allowed disabled:opacity-60 shadow-lg"
                >
                  {cancelling ? "Cancelling..." : "Cancel Token"}
                </button>
              )}
            </div>

            {/* Notice */}
            <div className="mx-auto mt-6 max-w-2xl rounded-2xl border border-emerald-500/30 bg-emerald-950/40 backdrop-blur-md p-4 text-center text-sm text-emerald-300 font-medium shadow-lg">
              Please arrive at the office before your turn is called.
            </div>
          </>
        )}
      </main>
    </div>
  );
}