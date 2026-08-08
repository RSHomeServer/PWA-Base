import { describe, expect, it } from "vitest";
import { songaraDbName } from "./songaraDbName.js";

describe("songaraDbName", () => {
  it("builds a namespaced IndexedDB name", () => {
    expect(songaraDbName("hello", "local")).toBe("songara:hello:local");
    expect(songaraDbName("my-app", "cache_v2")).toBe("songara:my-app:cache_v2");
  });

  it("rejects empty or invalid segments", () => {
    expect(() => songaraDbName("", "local")).toThrow(/appId/);
    expect(() => songaraDbName("hello", "")).toThrow(/dbKey/);
    expect(() => songaraDbName("bad:id", "local")).toThrow(/appId/);
    expect(() => songaraDbName("hello", "has space")).toThrow(/dbKey/);
  });
});
