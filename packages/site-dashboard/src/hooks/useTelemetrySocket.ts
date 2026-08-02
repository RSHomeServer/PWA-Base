import { useEffect, useRef, useState } from "react";
import { telemetryWsUrl } from "../api/client.js";
import type { WsMessage } from "../api/types.js";

/**
 * Telemetry WebSocket with quiet reconnects.
 * Failed connections (telemetry down) stay Offline without spamming the console
 * beyond the browser's native first-failure message.
 */
export function useTelemetrySocket(onMessage: (msg: WsMessage) => void): {
  connected: boolean;
} {
  const [connected, setConnected] = useState(false);
  const handlerRef = useRef(onMessage);
  handlerRef.current = onMessage;

  useEffect(() => {
    let cancelled = false;
    let socket: WebSocket | null = null;
    let retryMs = 1500;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let openedOnce = false;

    const connect = () => {
      if (cancelled) return;
      // Avoid overlapping sockets from rapid reconnects.
      if (
        socket &&
        (socket.readyState === WebSocket.CONNECTING || socket.readyState === WebSocket.OPEN)
      ) {
        return;
      }

      try {
        socket = new WebSocket(telemetryWsUrl());
      } catch {
        timer = setTimeout(connect, retryMs);
        retryMs = Math.min(retryMs * 2, 30_000);
        return;
      }

      socket.onopen = () => {
        openedOnce = true;
        setConnected(true);
        retryMs = 1500;
      };
      socket.onmessage = (ev) => {
        try {
          handlerRef.current(JSON.parse(String(ev.data)) as WsMessage);
        } catch {
          // ignore malformed frames
        }
      };
      socket.onclose = () => {
        setConnected(false);
        if (!cancelled) {
          // Back off harder when we never successfully opened (telemetry likely down).
          if (!openedOnce) retryMs = Math.min(Math.max(retryMs, 5_000), 30_000);
          timer = setTimeout(connect, retryMs);
          retryMs = Math.min(retryMs * 2, 30_000);
        }
      };
      socket.onerror = () => {
        // Let onclose handle reconnect; avoid double-close races that log
        // "WebSocket is closed before the connection is established".
      };
    };

    connect();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      const s = socket;
      socket = null;
      if (s && s.readyState === WebSocket.OPEN) {
        s.close();
      } else if (s && s.readyState === WebSocket.CONNECTING) {
        // Defer close until open/error to avoid the noisy premature-close warning.
        s.onopen = () => s.close();
        s.onerror = () => undefined;
      }
    };
  }, []);

  return { connected };
}
