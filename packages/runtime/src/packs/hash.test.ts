import { describe, expect, it } from "vitest";
import { sha256Hex, verifySha256 } from "./hash.js";
import { packBaseUrl } from "./client.js";

describe("pack hash helpers", () => {
  it("computes sha256 hex", async () => {
    const data = new TextEncoder().encode("hello").buffer;
    const hex = await sha256Hex(data);
    expect(hex).toHaveLength(64);
    expect(await verifySha256(data, `sha256:${hex}`)).toBe(true);
    expect(await verifySha256(data, hex)).toBe(true);
    expect(await verifySha256(data, "sha256:deadbeef")).toBe(false);
  });
});

describe("packBaseUrl", () => {
  it("builds static pack paths", () => {
    expect(packBaseUrl("hello", "hello-base", "1.0.0")).toBe(
      "/packs/hello/hello-base/1.0.0",
    );
  });
});
