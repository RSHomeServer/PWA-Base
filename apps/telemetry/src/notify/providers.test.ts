import { describe, expect, it, vi } from "vitest";
import {
  NoopProvider,
  NtfyProvider,
  buildNotificationPayload,
  formatRuntime,
  resolveProvider,
} from "./providers.js";
import type { PromptRecord, RunRecord, SettingsRecord } from "../types.js";

const settings: SettingsRecord = {
  sqlitePath: ":memory:",
  notificationProvider: "ntfy",
  ntfyServer: "https://ntfy.sh",
  ntfyTopic: "test-topic",
};

const run: RunRecord = {
  id: "r1",
  promptId: "p1",
  taskId: "t1",
  startedAt: "2026-01-01T00:00:00.000Z",
  finishedAt: "2026-01-01T00:02:05.000Z",
  durationMs: 125_000,
  status: "completed",
  summary: "All green.",
  completionSummary: null,
  conversationId: null,
  generationId: null,
  phase: "finished",
  latestShell: null,
  latestFile: null,
  completionKind: "automatic",
  manualCompletionReason: null,
  manualCompletionNote: null,
  lifecycleReason: null,
  idleMs: null,
  needsReview: false,
};

const prompt: PromptRecord = {
  id: "p1",
  prompt: "Do the thing",
  title: "Do the thing",
  createdAt: "2026-01-01T00:00:00.000Z",
  conversationId: null,
  model: null,
};

describe("notification abstraction", () => {
  it("formats runtime and payload", () => {
    expect(formatRuntime(125_000)).toBe("2m 05s");
    const payload = buildNotificationPayload(run, prompt);
    expect(payload.promptTitle).toBe("Do the thing");
    expect(payload.status).toBe("completed");
  });

  it("resolves providers without hardcoding call sites", () => {
    expect(resolveProvider(settings)).toBeInstanceOf(NtfyProvider);
    expect(resolveProvider({ ...settings, notificationProvider: "none" })).toBeInstanceOf(
      NoopProvider,
    );
  });

  it("ntfy provider posts to configured server/topic", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    const provider = new NtfyProvider();
    const result = await provider.send(buildNotificationPayload(run, prompt), settings);
    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url] = fetchMock.mock.calls[0]!;
    expect(url).toBe("https://ntfy.sh/test-topic");
    vi.unstubAllGlobals();
  });
});
