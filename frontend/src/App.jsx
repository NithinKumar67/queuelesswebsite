import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import { getCurrentUser } from "./services/authApi";
import { AuthContext } from "./context/AuthContext";

import Landing from "./pages/public/Landing";
import Login from "./pages/public/Login";
import Register from "./pages/public/Register";

import CitizenHome from "./pages/citizen/CitizenHome";
import Services from "./pages/citizen/Services";
import QueuePreview from "./pages/citizen/QueuePreview";
import ActiveToken from "./pages/citizen/ActiveToken";
import PeakHours from "./pages/citizen/PeakHours";

import OperatorDashboard from "./pages/operator/OperatorDashboard";
import OperatorQueue from "./pages/operator/OperatorQueue";
import CounterControl from "./pages/operator/CounterControl";

import AdminDashboard from "./pages/admin/AdminDashboard";
import Offices from "./pages/admin/Offices";
import AdminServices from "./pages/admin/Services";
import Counters from "./pages/admin/Counters";
import Staff from "./pages/admin/Staff";
import Analytics from "./pages/admin/Analytics";

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const data = await getCurrentUser();

        if (data.user) {
          setUser(data.user);
        }
      } catch {
        // Server unreachable: continue as logged out; protected pages redirect to /login.
      } finally {
        setAuthLoading(false);
      }
    }

    checkAuth();
  }, []);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-600">Loading...</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, setUser }}>
    <Routes>
      {/* Public */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Citizen */}
      <Route path="/citizen" element={<CitizenHome user={user} />} />
      <Route
        path="/citizen/offices/:officeId/services"
        element={<Services user={user} />}
      />
      <Route
        path="/citizen/offices/:officeId/services/:serviceId/queue"
        element={<QueuePreview user={user} />}
      />
      <Route
        path="/citizen/token/:tokenId"
        element={<ActiveToken user={user} />}
      />
      <Route
        path="/citizen/offices/:officeId/crowd"
        element={<PeakHours user={user} />}
      />

      {/* Operator */}
      <Route
        path="/operator"
        element={<OperatorDashboard user={user} />}
      />
      <Route
        path="/operator/queue"
        element={<OperatorQueue user={user} />}
      />
      <Route
        path="/operator/counter"
        element={<CounterControl user={user} />}
      />

      {/* Admin */}
      <Route path="/admin" element={<AdminDashboard user={user} />} />
      <Route path="/admin/offices" element={<Offices user={user} />} />
      <Route path="/admin/services" element={<AdminServices user={user} />} />
      <Route path="/admin/counters" element={<Counters user={user} />} />
      <Route path="/admin/staff" element={<Staff user={user} />} />
      <Route path="/admin/analytics" element={<Analytics user={user} />} />
    </Routes>
    </AuthContext.Provider>
  );
}