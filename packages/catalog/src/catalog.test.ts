import { describe, expect, it } from "vitest";
import { getCatalogEntries } from "./entries.js";
import { resolveSites } from "./loaders.js";

describe("catalog", () => {
  it("exposes synchronous metadata with independent hosts", () => {
    const entries = getCatalogEntries();
    const ids = entries.map((e) => e.id);

    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual(
      expect.arrayContaining([
        "birthday",
        "browser-lab",
        "components",
        "dashboard",
        "docs",
        "memories",
        "stats",
        "viz",
      ]),
    );
    expect(entries.find((e) => e.id === "birthday")?.host).toBe("birthday.songara.uk");
    expect(entries.find((e) => e.id === "memories")?.host).toBe("memories.songara.uk");
    expect(entries.find((e) => e.id === "birthday")?.requiredPackIds).toEqual(["birthday-base"]);
    expect(entries.find((e) => e.id === "birthday")?.capabilities).toEqual(
      expect.arrayContaining(["offline", "media", "full-bleed", "default-topbar-collapsed"]),
    );
    expect(entries.find((e) => e.id === "viz")?.capabilities).toContain("full-bleed");
    expect(entries.every((e) => e.basePath === "/")).toBe(true);
  });

  it("resolves site definitions via dynamic import", async () => {
    const sites = await resolveSites();
    const ids = sites.map((site) => site.id);

    expect(sites).toHaveLength(getCatalogEntries().length);
    expect(ids).toEqual(expect.arrayContaining(["birthday", "memories", "viz"]));
    expect(sites.find((site) => site.id === "birthday")?.basePath).toBe("/");
    expect(sites.find((site) => site.id === "memories")?.basePath).toBe("/");
    expect(sites.find((site) => site.id === "birthday")?.requiredPackIds).toEqual([
      "birthday-base",
    ]);
    expect(sites.find((site) => site.id === "birthday")?.capabilities).toEqual(
      expect.arrayContaining(["full-bleed", "default-topbar-collapsed"]),
    );
    expect(sites.find((site) => site.id === "viz")?.capabilities).toContain("full-bleed");
    expect(sites.find((site) => site.id === "viz")?.basePath).toBe("/");
  });
});
