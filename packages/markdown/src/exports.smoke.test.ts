import { describe, expect, it } from "vitest";
import { Markdown } from "./index.js";

describe("@platform/markdown public API", () => {
  it("exports Markdown component", () => {
    expect(typeof Markdown).toBe("function");
  });
});
