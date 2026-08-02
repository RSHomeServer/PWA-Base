import { Navigate, useSearchParams } from "react-router-dom";

/** Legacy Live Run / History / Prompts routes redirect into the unified History (Tasks) page. */
export function RedirectToRuns() {
  const [searchParams] = useSearchParams();
  const task = searchParams.get("task");
  const run = searchParams.get("run");
  const params = new URLSearchParams();
  if (task) params.set("task", task);
  if (run) params.set("run", run);
  const qs = params.toString();
  const to = qs ? `/?${qs}` : "/";
  return <Navigate to={to} replace />;
}
