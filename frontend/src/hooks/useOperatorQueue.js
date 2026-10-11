import { useCallback, useEffect, useState } from "react";
import { getId } from "../components/operator/OperatorUi";
import {
  getOperatorDashboard,
  getOperatorQueue,
} from "../services/operatorApi";
import useOperatorSocket from "./useOperatorSocket";

// Data and actions shared by OperatorDashboard and OperatorQueue (the two pages
// previously carried identical copies of this logic): loads the dashboard and
// queue, keeps them fresh through the office socket room, and runs operator
// actions with a busy flag and a success/info/error notice.
export default function useOperatorQueue() {
  const [dashboard, setDashboard] = useState(null);
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(null);
  const [notice, setNotice] = useState(null);

  const load = useCallback(async () => {
    try {
      const [dash, q] = await Promise.all([
        getOperatorDashboard(),
        getOperatorQueue(),
      ]);

      setDashboard(dash.dashboard);
      setQueue(q.queue || []);
      setError("");
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Keep the data in sync with live queue events.
  useOperatorSocket({
    officeId: getId(dashboard?.office),
    onQueueChange: load,
  });

  async function runAction(key, fn, successFallback) {
    if (busy) return;

    setBusy(key);
    setNotice(null);

    try {
      const res = await fn();

      if (res && res.success === false) {
        setNotice({
          type: "info",
          message: res.message || "Nothing to do.",
        });
      } else {
        setNotice({
          type: "success",
          message: res?.message || successFallback,
        });
      }

      await load();
    } catch (err) {
      setNotice({
        type: "error",
        message: err.message,
      });

      await load();
    } finally {
      setBusy(null);
    }
  }

  return {
    dashboard,
    queue,
    loading,
    setLoading,
    error,
    busy,
    notice,
    setNotice,
    load,
    runAction,
  };
}
