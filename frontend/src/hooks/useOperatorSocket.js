import useDebouncedCallback from "./useDebouncedCallback";
import useOfficeSocket from "./useOfficeSocket";

// Operator pages: refetch the dashboard/queue whenever anything changes in
// their office room, and again after every (re)connect.
export default function useOperatorSocket({ officeId, onQueueChange }) {
  const refresh = useDebouncedCallback(onQueueChange, 150);

  return useOfficeSocket(officeId, {
    onEvent: refresh,
    onSync: refresh,
  });
}
