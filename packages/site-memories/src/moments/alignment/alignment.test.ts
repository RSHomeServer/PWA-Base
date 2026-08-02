import { describe, expect, it } from "vitest";
import {
  createAlignmentInstance,
  deriveGraphEdgesFromDrawOrder,
  exportAlignmentConfig,
} from "./model.js";
import { resolveConstellation } from "../constellation/index.js";

describe("alignment model", () => {
  it("derives unique undirected graph edges from draw order", () => {
    expect(deriveGraphEdgesFromDrawOrder(["A", "B", "C", "B", "D"])).toEqual([
      ["A", "B"],
      ["B", "C"],
      ["B", "D"],
    ]);
  });

  it("export includes both definition and instance", () => {
    const row = createAlignmentInstance("leo");
    row.instance.transform.scale = 1.1;
    row.instance.transform.centre.x = 40;
    const exported = exportAlignmentConfig(row.definition, row.instance);
    expect(exported.definition).toMatchObject({
      id: "leo",
      displayName: "Leo",
      origin: expect.objectContaining({ x: expect.any(Number) }),
      vertices: expect.any(Array),
      graphEdges: expect.any(Array),
      drawOrder: expect.any(Array),
      artwork: expect.objectContaining({ image: expect.any(String) }),
    });
    expect(exported.definition).not.toHaveProperty("transform");
    expect(exported.instance).toEqual({
      definitionId: "leo",
      transform: {
        centre: { x: 40, y: row.instance.transform.centre.y },
        rotationDeg: 0,
        scale: 1.1,
      },
    });
    expect(exported).not.toHaveProperty("activationOrder");
  });

  it("instance transform flows through shared resolveConstellation", () => {
    const row = createAlignmentInstance("leo");
    const originX = row.definition.origin.x;
    row.instance.transform.centre.x = originX + 5;
    const resolved = resolveConstellation(
      row.definition,
      row.instance.transform,
    );
    const regulus = resolved.vertices.find((v) => v.name === "Regulus")!;
    expect(regulus.x).toBeCloseTo(39 + 5, 5);
    expect(resolved.instanceCentre.x).toBeCloseTo(originX + 5, 5);
  });

  it("two instances can share a definition id with independent transforms", () => {
    const a = createAlignmentInstance("leo");
    const b = createAlignmentInstance("leo");
    b.instance.transform.centre.x = a.instance.transform.centre.x + 20;
    const ra = resolveConstellation(a.definition, a.instance.transform);
    const rb = resolveConstellation(b.definition, b.instance.transform);
    expect(a.instance.definitionId).toBe(b.instance.definitionId);
    expect(ra.instanceCentre.x).not.toBeCloseTo(rb.instanceCentre.x, 5);
  });
});
