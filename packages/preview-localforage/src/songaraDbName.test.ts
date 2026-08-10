import { describe, expect, it } from "vitest";
import { songaraDbName } from "./songaraDbName.js";

describe("songaraDbName", () => {
  it("builds a namespaced name", () => {
    expect(songaraDbName("hello", "local")).toBe("songara:hello:local");
  });

  it("rejects empty or invalid segments", () => {
    expect(() => songaraDbName("", "local")).toThrow(/appId/);
    expect(() => songaraDbName("hello", "")).toThrow(/dbKey/);
    expect(() => songaraDbName("bad:id", "local")).toThrow(/appId/);
  });
});
