export interface NetworkConnectionInfo {
  supported: boolean;
  effectiveType: string;
  downlinkMbps: number | null;
  rttMs: number | null;
  saveData: boolean;
}

interface NavigatorConnection {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
  addEventListener?: (type: "change", listener: () => void) => void;
  removeEventListener?: (type: "change", listener: () => void) => void;
}

export function readConnectionInfo(): NetworkConnectionInfo {
  const nav = navigator as Navigator & {
    connection?: NavigatorConnection;
    mozConnection?: NavigatorConnection;
    webkitConnection?: NavigatorConnection;
  };
  const connection = nav.connection ?? nav.mozConnection ?? nav.webkitConnection;

  if (!connection) {
    return {
      supported: false,
      effectiveType: "unknown",
      downlinkMbps: null,
      rttMs: null,
      saveData: false,
    };
  }

  return {
    supported: true,
    effectiveType: connection.effectiveType ?? "unknown",
    downlinkMbps: typeof connection.downlink === "number" ? connection.downlink : null,
    rttMs: typeof connection.rtt === "number" ? connection.rtt : null,
    saveData: Boolean(connection.saveData),
  };
}

export function getConnection(): NavigatorConnection | undefined {
  const nav = navigator as Navigator & {
    connection?: NavigatorConnection;
    mozConnection?: NavigatorConnection;
    webkitConnection?: NavigatorConnection;
  };
  return nav.connection ?? nav.mozConnection ?? nav.webkitConnection;
}

export async function pingOnce(): Promise<number> {
  const start = performance.now();
  const url = `${location.origin}${location.pathname}?labping=${Date.now()}-${Math.random()}`;
  await fetch(url, { cache: "no-store", mode: "same-origin" });
  return performance.now() - start;
}

export interface PublicIpResult {
  ip: string;
}

export async function lookupPublicIp(timeoutMs = 5000): Promise<PublicIpResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch("https://api.ipify.org?format=json", {
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`ipify responded with ${response.status}`);
    }
    const data = (await response.json()) as PublicIpResult;
    return data;
  } finally {
    clearTimeout(timer);
  }
}

export interface WebSocketProbeResult {
  connected: boolean;
  ms: number;
}

export function probeWebsocket(timeoutMs = 3500): Promise<WebSocketProbeResult> {
  return new Promise((resolve) => {
    const protocol = location.protocol === "https:" ? "wss:" : "ws:";
    const url = `${protocol}//${location.host}/`;
    const start = performance.now();
    let settled = false;
    let socket: WebSocket;

    const finish = (connected: boolean) => {
      if (settled) return;
      settled = true;
      resolve({ connected, ms: performance.now() - start });
      try {
        socket?.close();
      } catch {
        /* already closed */
      }
    };

    const timer = setTimeout(() => finish(false), timeoutMs);

    try {
      socket = new WebSocket(url);
      socket.addEventListener("open", () => {
        clearTimeout(timer);
        finish(true);
      });
      socket.addEventListener("error", () => {
        clearTimeout(timer);
        finish(false);
      });
    } catch {
      clearTimeout(timer);
      finish(false);
    }
  });
}
