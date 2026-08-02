import { useCallback, useState } from "react";
import { Button } from "@platform/ui";
import { lookupPublicIp } from "./net.js";
import styles from "./PublicIpLookup.module.css";

type State = { status: "idle" | "loading" | "done" | "error"; ip?: string; error?: string };

export function PublicIpLookup() {
  const [state, setState] = useState<State>({ status: "idle" });

  const run = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const result = await lookupPublicIp();
      setState({ status: "done", ip: result.ip });
    } catch {
      setState({
        status: "error",
        error:
          "Lookup unavailable — the request may be blocked by an extension, network policy, or offline state.",
      });
    }
  }, []);

  return (
    <div className={styles.wrap}>
      <div>
        <p className={styles.label}>Public IP address</p>
        <p className={`lab-mono ${styles.value}`}>
          {state.status === "loading"
            ? "Looking up…"
            : state.status === "done"
              ? state.ip
              : state.status === "error"
                ? "Unavailable"
                : "Not requested"}
        </p>
        {state.status === "error" ? <p className={styles.hint}>{state.error}</p> : null}
      </div>
      <Button
        type="button"
        size="sm"
        variant="secondary"
        onClick={run}
        disabled={state.status === "loading"}
      >
        {state.status === "loading" ? "Looking up…" : "Look up public IP"}
      </Button>
    </div>
  );
}
