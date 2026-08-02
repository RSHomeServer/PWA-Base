import { describe, expect, it } from "vitest";
import { previewAlignTransform } from "./previewAlign.js";

describe("previewAlignTransform", () => {
  it("maps a full-frame bbox to identity-scale when fromRect is the viewport", () => {
    const viewport = { width: 1000, height: 800 };
    const fromRect = { left: 0, top: 0, width: 1000, height: 800 };
    const bbox = { x: 0, y: 0, width: 1, height: 1 };
    const t = previewAlignTransform(fromRect, bbox, viewport);
    expect(t.scale).toBeCloseTo(1, 5);
    expect(t.tx).toBeCloseTo(0, 5);
    expect(t.ty).toBeCloseTo(0, 5);
  });

  it("scales up when the crop starts smaller than its destination region", () => {
    const viewport = { width: 1000, height: 1000 };
    const fromRect = { left: 100, top: 100, width: 200, height: 200 };
    const bbox = { x: 0.25, y: 0.25, width: 0.5, height: 0.5 };
    const t = previewAlignTransform(fromRect, bbox, viewport);
    // region is 500×500; from is 200×200 → scale 0.4
    expect(t.scale).toBeCloseTo(0.4, 5);
    expect(t.tx).toBeCloseTo(0, 5);
    expect(t.ty).toBeCloseTo(0, 5);
  });
});
