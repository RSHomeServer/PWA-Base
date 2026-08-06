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
        "components",
        "dashboard",
        "docs",
      ]),
    );
    expect(entries.every((e) => e.basePath === "/")).toBe(true);
  });

  it("resolves site definitions via dynamic import", async () => {
    const sites = await resolveSites();
    const ids = sites.map((site) => site.id);

    expect(sites).toHaveLength(getCatalogEntries().length);
    expect(ids).toEqual(expect.arrayContaining(["hello"]));
  });
});
