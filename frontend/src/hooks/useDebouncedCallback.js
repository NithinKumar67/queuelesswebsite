import { useCallback, useEffect, useRef } from "react";

// Returns a stable function that runs `callback` once after `delay` ms of
// quiet. Several socket events fired by one operator action (for example
// queue:updated + token:called) therefore cause a single refetch. Always calls
// the latest `callback`; any pending call is cancelled on unmount.
export default function useDebouncedCallback(callback, delay = 250) {
  const callbackRef = useRef(callback);
  const timerRef = useRef(null);

  useEffect(() => {
    callbackRef.current = callback;
  });

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return useCallback(
    (...args) => {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => callbackRef.current?.(...args), delay);
    },
    [delay]
  );
}
