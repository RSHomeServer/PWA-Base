export type AppVersionInfo = {
  version: string;
  builtAt: string;
};

/** Format an ISO timestamp as `dd/mm HH:MM` in local time. */
export function formatDdMmHhMm(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const HH = String(d.getHours()).padStart(2, "0");
  const MM = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm} ${HH}:${MM}`;
}

export function getEmbeddedAppBuild(): AppVersionInfo {
  const env = import.meta.env as {
    VITE_APP_VERSION?: string;
    VITE_APP_BUILT_AT?: string;
    DEV?: boolean;
  };
  return {
    version: env.VITE_APP_VERSION || (env.DEV ? "dev" : "unknown"),
    builtAt: env.VITE_APP_BUILT_AT || new Date(0).toISOString(),
  };
}

/** Fetch published `/version.json` (cache-busted). */
export async function fetchLatestAppVersion(
  signal?: AbortSignal,
): Promise<AppVersionInfo | null> {
  try {
    const res = await fetch(`/version.json?t=${Date.now()}`, {
      cache: "no-store",
      signal,
    });
    if (!res.ok) return null;
    const body = (await res.json()) as Partial<AppVersionInfo>;
    if (!body.version || !body.builtAt) return null;
    return { version: String(body.version), builtAt: String(body.builtAt) };
  } catch {
    return null;
  }
}
