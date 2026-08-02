import type { EventRecord } from "../api/types.js";

/** Pull the richest available body text from a stored hook payload. */
export function eventBodyFromPayload(ev: EventRecord): string | null {
  try {
    const payload = JSON.parse(ev.payloadJson) as Record<string, unknown>;
    const asString = (v: unknown): string | null =>
      typeof v === "string" && v.length > 0 ? v : null;

    switch (ev.type) {
      case "agent_thought":
        return (
          asString(payload.thought) ?? asString(payload.text) ?? asString(payload.content)
        );
      case "agent_response":
        return asString(payload.text) ?? asString(payload.content);
      case "shell_execution": {
        const command = asString(payload.command);
        const output = asString(payload.output) ?? asString(payload.stdout);
        if (command && output) return `$ ${command}\n\n${output}`;
        return command ?? output;
      }
      case "file_edit": {
        const path = asString(payload.file_path) ?? asString(payload.path);
        const edits = payload.edits;
        if (path && Array.isArray(edits) && edits.length > 0) {
          return `${path}\n${JSON.stringify(edits, null, 2)}`;
        }
        return path;
      }
      case "prompt_submitted":
        return asString(payload.prompt);
      default:
        return null;
    }
  } catch {
    return null;
  }
}

/** Prefer full payload body; fall back to the truncated summary. */
export function eventDisplayText(ev: EventRecord): string {
  return eventBodyFromPayload(ev) ?? ev.summary;
}
