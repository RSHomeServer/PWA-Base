export type ConnectivityStatus = "online" | "offline";

export function getConnectivityStatus(): ConnectivityStatus {
  return typeof navigator !== "undefined" && navigator.onLine ? "online" : "offline";
}

export function subscribeConnectivity(listener: (status: ConnectivityStatus) => void): () => void {
  const onOnline = () => listener("online");
  const onOffline = () => listener("offline");
  window.addEventListener("online", onOnline);
  window.addEventListener("offline", onOffline);
  return () => {
    window.removeEventListener("online", onOnline);
    window.removeEventListener("offline", onOffline);
  };
}
