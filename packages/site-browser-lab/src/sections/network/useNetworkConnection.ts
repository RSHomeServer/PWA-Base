import { useEffect, useState } from "react";
import { getConnection, readConnectionInfo, type NetworkConnectionInfo } from "./net.js";

export function useNetworkConnection(): NetworkConnectionInfo {
  const [info, setInfo] = useState<NetworkConnectionInfo>(() => readConnectionInfo());

  useEffect(() => {
    const connection = getConnection();
    if (!connection?.addEventListener) {
      return;
    }
    const handler = () => setInfo(readConnectionInfo());
    connection.addEventListener("change", handler);
    return () => connection.removeEventListener?.("change", handler);
  }, []);

  return info;
}
