/** Public URL for run artifact binary content (served via telemetry proxy). */
export function artifactContentUrl(runId: string, artifactId: string): string {
  return `/telemetry/api/runs/${encodeURIComponent(runId)}/artifacts/${encodeURIComponent(artifactId)}/content`;
}
