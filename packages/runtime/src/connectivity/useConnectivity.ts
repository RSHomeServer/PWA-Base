import { useEffect, useState } from "react";
import {
  getConnectivityStatus,
  subscribeConnectivity,
  type ConnectivityStatus,
} from "./connectivity.js";

export function useConnectivity(): ConnectivityStatus {
  const [status, setStatus] = useState<ConnectivityStatus>(() => getConnectivityStatus());
  useEffect(() => subscribeConnectivity(setStatus), []);
  return status;
}
