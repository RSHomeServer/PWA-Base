import { describe, expect, it } from "vitest";
import { resolveToneTransport } from "./resolveToneTransport.js";

describe("resolveToneTransport", () => {
  it("stops suggested transport when reduced", () => {
    expect(resolveToneTransport(true)).toEqual({ shouldRun: false });
  });

  it("allows transport otherwise", () => {
    expect(resolveToneTransport(false)).toEqual({ shouldRun: true });
  });
});
