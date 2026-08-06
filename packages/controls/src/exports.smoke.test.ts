import { describe, expect, it } from "vitest";
import { ParameterPanel } from "./index.js";
import type { ParamDef } from "./index.js";

describe("@platform/controls public API", () => {
  it("exports ParameterPanel and ParamDef types resolve", () => {
    expect(typeof ParameterPanel).toBe("function");
    const defs: ParamDef[] = [
      { type: "number", id: "x", label: "X", min: 0, max: 1, step: 0.1 },
    ];
    expect(defs[0]!.id).toBe("x");
  });
});
