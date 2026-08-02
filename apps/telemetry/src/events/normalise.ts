import type { CursorHookPayload, NormalisedEvent, NormalisedEventType } from "../types.js";
import { titleFromPrompt } from "../types.js";

function asString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function eventName(raw: CursorHookPayload): string {
  return asString(raw.hook_event_name) ?? asString(raw.type) ?? "unknown";
}

function mapType(name: string): NormalisedEventType {
  switch (name) {
    case "beforeSubmitPrompt":
      return "prompt_submitted";
    case "afterAgentThought":
      return "agent_thought";
    case "afterFileEdit":
      return "file_edit";
    case "afterShellExecution":
      return "shell_execution";
    case "afterAgentResponse":
      return "agent_response";
    case "stop":
      return "run_stop";
    default:
      return "unknown";
  }
}

function summarise(type: NormalisedEventType, raw: CursorHookPayload): string {
  switch (type) {
    case "prompt_submitted":
      return titleFromPrompt(asString(raw.prompt) ?? "(empty prompt)");
    case "agent_thought":
      return (
        asString(raw.thought) ??
        asString(raw.text) ??
        asString(raw.content) ??
        "Agent thought"
      ).slice(0, 200);
    case "file_edit":
      return asString(raw.file_path) ?? asString(raw.path) ?? "File edited";
    case "shell_execution":
      return asString(raw.command) ?? "Shell command";
    case "agent_response":
      return (asString(raw.text) ?? asString(raw.content) ?? "Agent response").slice(0, 200);
    case "run_stop":
      return `Stop (${asString(raw.status) ?? "completed"})`;
    default:
      return eventName(raw);
  }
}

/**
 * Validates and normalises a Cursor hook stdin payload into a stable internal event.
 * Unknown events are kept (type `unknown`) so the timeline stays complete.
 */
export function normaliseHookPayload(input: unknown): NormalisedEvent {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("Hook payload must be a JSON object");
  }
  const raw = input as CursorHookPayload;
  const name = eventName(raw);
  const type = mapType(name);
  const timestamp = new Date().toISOString();

  return {
    type,
    timestamp,
    conversationId: asString(raw.conversation_id),
    generationId: asString(raw.generation_id),
    summary: summarise(type, raw),
    payload: { ...raw, hook_event_name: name },
  };
}

export function extractPromptText(raw: CursorHookPayload): string {
  return asString(raw.prompt) ?? "";
}

export function extractFilePath(raw: CursorHookPayload): string | null {
  return asString(raw.file_path) ?? asString(raw.path);
}

export function extractShellCommand(raw: CursorHookPayload): string | null {
  return asString(raw.command);
}

export function extractResponseText(raw: CursorHookPayload): string | null {
  return asString(raw.text) ?? asString(raw.content);
}

export function phaseForEventType(type: NormalisedEventType): string {
  switch (type) {
    case "prompt_submitted":
      return "starting";
    case "agent_thought":
      return "thinking";
    case "file_edit":
      return "editing";
    case "shell_execution":
      return "shell";
    case "agent_response":
      return "responding";
    case "run_stop":
      return "finished";
    default:
      return "active";
  }
}
