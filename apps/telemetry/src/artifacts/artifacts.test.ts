import { mkdtempSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { openStore } from "../db/store.js";
import { TelemetryService } from "../service.js";
import { ArtifactFsStore } from "./fs-store.js";

const dirs: string[] = [];

afterEach(() => {
  for (const d of dirs.splice(0)) {
    rmSync(d, { recursive: true, force: true });
  }
});

function setup() {
  const dir = mkdtempSync(join(tmpdir(), "tel-art-"));
  dirs.push(dir);
  const store = openStore(join(dir, "t.sqlite"));
  const artifactsFs = new ArtifactFsStore(join(dir, "run-artifacts"));
  const service = new TelemetryService(store, () => undefined, undefined, artifactsFs);
  store.insertPrompt({
    id: "p1",
    prompt: "test",
    title: "Test",
    createdAt: new Date().toISOString(),
    conversationId: null,
    model: null,
  });
  store.insertTask({
    id: "t1",
    title: "Test",
    promptText: "test",
    conversationId: null,
    createdAt: new Date().toISOString(),
    startedAt: new Date().toISOString(),
    finishedAt: new Date().toISOString(),
    durationMs: 1000,
    status: "completed",
    completionSummary: null,
    completionKind: "automatic",
    manualCompletionReason: null,
    manualCompletionNote: null,
    completionReason: "all_runs_terminal_with_summary",
    needsReview: false,
  });
  store.insertRun({
    id: "r1",
    promptId: "p1",
    taskId: "t1",
    startedAt: new Date().toISOString(),
    finishedAt: new Date().toISOString(),
    durationMs: 1000,
    status: "completed",
    summary: "done",
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
  });
  return { dir, store, service, artifactsFs };
}

describe("run artifacts", () => {
  it("persists screenshot metadata and bytes on disk", () => {
    const { service, dir } = setup();
    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      "base64",
    );
    const artifact = service.addArtifact("r1", {
      kind: "screenshot",
      pageKey: "history",
      pageLabel: "History",
      phase: "after",
      filename: "history-after.png",
      mimeType: "image/png",
      caption: "History after",
      bytes: png,
    });
    expect(artifact).not.toBeNull();
    expect(artifact!.relativePath).toBe("r1/history-after.png");
    expect(existsSync(join(dir, "run-artifacts", "r1", "history-after.png"))).toBe(true);

    const listed = service.listArtifacts("r1");
    expect(listed).toHaveLength(1);
    expect(listed[0]!.pageKey).toBe("history");

    const packed = service.readArtifactBytes(artifact!.id);
    expect(packed?.bytes.equals(png)).toBe(true);

    const detail = service.getRunDetail("r1");
    expect(detail?.artifacts).toHaveLength(1);
  });

  it("refuses to overwrite an existing after screenshot", () => {
    const { service } = setup();
    const png = Buffer.from([1, 2, 3, 4]);
    service.addArtifact("r1", {
      kind: "screenshot",
      pageKey: "history",
      pageLabel: "History",
      phase: "after",
      filename: "history-after.png",
      mimeType: "image/png",
      bytes: png,
    });
    expect(() =>
      service.addArtifact("r1", {
        kind: "screenshot",
        pageKey: "history",
        pageLabel: "History",
        phase: "after",
        filename: "history-after-2.png",
        mimeType: "image/png",
        bytes: Buffer.from([9, 9]),
      }),
    ).toThrow(/refusing overwrite/);
  });

  it("allows before then after for the same page", () => {
    const { service } = setup();
    service.addArtifact("r1", {
      kind: "screenshot",
      pageKey: "history",
      pageLabel: "History",
      phase: "before",
      filename: "history-before.png",
      mimeType: "image/png",
      bytes: Buffer.from([1]),
    });
    const after = service.addArtifact("r1", {
      kind: "screenshot",
      pageKey: "history",
      pageLabel: "History",
      phase: "after",
      filename: "history-after.png",
      mimeType: "image/png",
      bytes: Buffer.from([2]),
    });
    expect(after?.phase).toBe("after");
    expect(service.listArtifacts("r1")).toHaveLength(2);
  });

  it("deletes a run and removes on-disk artifacts", () => {
    const { service, dir } = setup();
    service.addArtifact("r1", {
      kind: "screenshot",
      pageKey: "history",
      pageLabel: "History",
      phase: "after",
      filename: "history-after.png",
      mimeType: "image/png",
      bytes: Buffer.from([1, 2, 3]),
    });
    expect(existsSync(join(dir, "run-artifacts", "r1", "history-after.png"))).toBe(true);
    expect(service.deleteRun("r1")).toBe(true);
    expect(service.getRunDetail("r1")).toBeNull();
    expect(existsSync(join(dir, "run-artifacts", "r1"))).toBe(false);
  });
});
