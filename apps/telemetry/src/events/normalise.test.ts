import { describe, expect, it } from "vitest";
import { normaliseHookPayload, phaseForEventType } from "./normalise.js";

describe("normaliseHookPayload", () => {
  it("maps beforeSubmitPrompt into prompt_submitted", () => {
    const event = normaliseHookPayload({
      hook_event_name: "beforeSubmitPrompt",
      conversation_id: "c1",
      generation_id: "g1",
      prompt: "Build the telemetry foundation\nwith SQLite",
    });
    expect(event.type).toBe("prompt_submitted");
    expect(event.conversationId).toBe("c1");
    expect(event.summary).toBe("Build the telemetry foundation");
  });

  it("maps shell and file events", () => {
    expect(
      normaliseHookPayload({
        hook_event_name: "afterShellExecution",
        command: "pnpm test",
      }).type,
    ).toBe("shell_execution");
    expect(
      normaliseHookPayload({
        hook_event_name: "afterFileEdit",
        file_path: "apps/telemetry/src/cli.ts",
      }).summary,
    ).toBe("apps/telemetry/src/cli.ts");
  });

  it("keeps unknown events without throwing", () => {
    const event = normaliseHookPayload({ hook_event_name: "preCompact" });
    expect(event.type).toBe("unknown");
  });

  it("rejects non-objects", () => {
    expect(() => normaliseHookPayload(null)).toThrow(/JSON object/);
  });
});

describe("phaseForEventType", () => {
  it("returns human phases", () => {
    expect(phaseForEventType("agent_thought")).toBe("thinking");
    expect(phaseForEventType("shell_execution")).toBe("shell");
  });
});
