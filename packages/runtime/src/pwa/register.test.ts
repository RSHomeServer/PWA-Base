import { describe, expect, it } from "vitest";
import { resolveServiceWorkerScriptUrl } from "./register.js";

describe("resolveServiceWorkerScriptUrl", () => {
  const page = "https://birthday.songara.uk/";

  it("resolves against a root base href without throwing", () => {
    expect(resolveServiceWorkerScriptUrl("/", page)).toBe("/sw.js");
  });

  it("resolves when base href is empty", () => {
    expect(resolveServiceWorkerScriptUrl("", page)).toBe("/sw.js");
  });

  it("respects a subdirectory base", () => {
    expect(resolveServiceWorkerScriptUrl("/app/", "https://example.com/app/")).toBe(
      "/app/sw.js",
    );
  });

  it("accepts an absolute base URL", () => {
    expect(
      resolveServiceWorkerScriptUrl("https://viz.songara.uk/", page),
    ).toBe("/sw.js");
  });
});
