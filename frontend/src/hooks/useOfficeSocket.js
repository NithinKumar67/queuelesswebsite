import { useEffect, useRef, useState } from "react";
import { acquireSocket, releaseSocket } from "../services/socket";

// Events the backend emits to the room "office:<officeId>"
// (see backend/src/controllers/token.controller.js and operator.controller.js):
//   queue:updated   { officeId, [serviceId], tokenId, tokenNumber, status }
//   token:called | token:started | token:completed | token:skipped |
//   token:recalled  { tokenNumber, counterId, status }
//   counter:updated { officeId, counterId, status }
export const QUEUE_EVENTS = [
  "queue:updated",
  "token:called",
  "token:started",
  "token:completed",
  "token:skipped",
  "token:recalled",
  "counter:updated",
];

// Subscribes the calling component to live updates of one office.
//
//   status: "idle" (no office yet) | "connecting" | "connected" |
//           "disconnected" | "error" | "unavailable" (no VITE_API_URL)
//   onEvent(payload, eventName)  called for every received event
//   onSync()                     called each time the room is (re)joined, so the
//                                page can refetch authoritative data and never
//                                stays stale after a dropped connection
//
// REST remains the source of truth: pages load their initial data over HTTP and
// treat events only as a signal to refresh it. Callbacks are read through refs,
// so passing a new function on every render does not resubscribe.
export default function useOfficeSocket(
  officeId,
  { events = QUEUE_EVENTS, onEvent, onSync } = {}
) {
  const [status, setStatus] = useState("idle");
  const onEventRef = useRef(onEvent);
  const onSyncRef = useRef(onSync);
  const eventsKey = events.join(",");

  useEffect(() => {
    onEventRef.current = onEvent;
    onSyncRef.current = onSync;
  });

  useEffect(() => {
    if (!officeId) {
      setStatus("idle");
      return undefined;
    }

    const socket = acquireSocket();

    if (!socket) {
      setStatus("unavailable");
      return undefined;
    }

    let active = true;

    // Rooms belong to one connection, so the room is joined on every connect
    // (first connect and each automatic reconnect).
    const joinRoom = () => {
      setStatus("connecting");

      socket.emit("office:join", officeId, (result) => {
        if (!active) return;

        if (result?.success) {
          setStatus("connected");
          onSyncRef.current?.();
        } else {
          setStatus("error");
        }
      });
    };

    const handleDisconnect = () => active && setStatus("disconnected");
    const handleConnectError = () => active && setStatus("disconnected");

    const eventNames = eventsKey ? eventsKey.split(",") : [];
    const handlers = eventNames.map((eventName) => {
      const handler = (payload) => onEventRef.current?.(payload, eventName);
      socket.on(eventName, handler);
      return [eventName, handler];
    });

    socket.on("connect", joinRoom);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);

    // The shared connection may already be open (another page used it).
    if (socket.connected) {
      joinRoom();
    } else {
      setStatus("connecting");
    }

    return () => {
      active = false;

      socket.off("connect", joinRoom);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
      handlers.forEach(([eventName, handler]) => socket.off(eventName, handler));

      // The connection is shared and may outlive this page: leave the room so
      // an old office does not keep sending events to the next page.
      if (socket.connected) socket.emit("office:leave", officeId);

      releaseSocket();
    };
  }, [officeId, eventsKey]);

  return status;
}
