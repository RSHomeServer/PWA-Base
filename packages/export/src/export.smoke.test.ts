import { describe, expect, it } from "vitest";
import { downloadBlob, downloadCanvasPng, downloadText } from "./index.js";

describe("@platform/export public API", () => {
  it("exports download helpers", () => {
    expect(typeof downloadText).toBe("function");
    expect(typeof downloadBlob).toBe("function");
    expect(typeof downloadCanvasPng).toBe("function");
  });
});
