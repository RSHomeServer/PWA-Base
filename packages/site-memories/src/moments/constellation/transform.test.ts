import { describe, expect, it } from "vitest";
import {
  activationOrderFromDrawOrder,
  applyTransform,
  resolveConstellation,
} from "./transform.js";
import {
  getConstellation,
  resolvePlacedInstances,
} from "../constellations/index.js";
import { findUsConfig } from "../types.js";

describe("constellation transform", () => {
  it("identity transform preserves coordinates when centre equals origin", () => {
    const origin = { x: 28, y: 25.5 };
    const p = applyTransform(
      { x: 41.45, y: 43.03 },
      origin,
      { centre: { ...origin }, rotationDeg: 0, scale: 1 },
    );
    expect(p.x).toBeCloseTo(41.45, 5);
    expect(p.y).toBeCloseTo(43.03, 5);
  });

  it("moving instance centre translates the whole constellation", () => {
    const origin = { x: 28, y: 26 };
    const local = { x: 40, y: 30 };
    const moved = applyTransform(local, origin, {
      centre: { x: 38, y: 26 },
      rotationDeg: 0,
      scale: 1,
    });
    expect(moved.x).toBeCloseTo(50, 5);
    expect(moved.y).toBeCloseTo(30, 5);
  });

  it("activationOrder drops revisits", () => {
    expect(activationOrderFromDrawOrder(["A", "B", "C", "B"])).toEqual([
      "A",
      "B",
      "C",
    ]);
  });
});

describe("leo catalog", () => {
  it("resolves without moving baseline star positions", () => {
    const leo = resolveConstellation(getConstellation("leo"));
    const regulus = leo.vertices.find((v) => v.name === "Regulus");
    expect(regulus?.x).toBeCloseTo(39, 5);
    expect(regulus?.y).toBeCloseTo(31, 5);
  });

  it("resolveConstellation identity maps xPosition→x", () => {
    const leo = resolveConstellation(getConstellation("leo"));
    for (const v of leo.vertices) {
      expect(v.x).toBe(v.xPosition);
      expect(v.y).toBe(v.yPosition);
    }
  });

  it("instance centre shift moves vertices and artwork together", () => {
    const leo = getConstellation("leo");
    const dx = 10;
    const resolved = resolveConstellation(leo, {
      centre: { x: leo.origin.x + dx, y: leo.origin.y },
      rotationDeg: 0,
      scale: 1,
    });
    const regulus = resolved.vertices.find((v) => v.name === "Regulus")!;
    expect(regulus.x).toBeCloseTo(39 + dx, 5);
    expect(regulus.y).toBeCloseTo(31, 5);
    expect(resolved.instanceCentre.x).toBeCloseTo(leo.origin.x + dx, 5);
    if (resolved.artwork && leo.artwork) {
      const artCx = resolved.artwork.x + resolved.artwork.width / 2;
      expect(artCx).toBeCloseTo(leo.artwork.centre.x + dx, 5);
    }
  });

  it("production instance resolves to supplied placement transform", () => {
    const [leo] = resolvePlacedInstances(findUsConfig.constellationInstances);
    expect(leo!.instanceCentre.x).toBeCloseTo(41.75, 5);
    expect(leo!.instanceCentre.y).toBeCloseTo(37.11, 5);
    const regulus = leo!.vertices.find((v) => v.name === "Regulus")!;
    expect(regulus.x).toBeCloseTo(56.16, 1);
    expect(regulus.y).toBeCloseTo(43.37, 1);
  });

  it("leo activation order is the configured selection order", () => {
    const leo = resolveConstellation(getConstellation("leo"));
    expect(leo.activationOrder).toEqual([
      "B",
      "C",
      "D",
      "E",
      "F",
      "G",
      "H",
      "I",
      "J",
    ]);
  });

  it("leo draw segments follow local draw order without repeated vertices", () => {
    const leo = resolveConstellation(getConstellation("leo"));
    expect(leo.drawSegments).toEqual([
      ["B", "C"],
      ["C", "D"],
      ["D", "E"],
      ["E", "F"],
      ["F", "G"],
      ["G", "H"],
      ["H", "I"],
      ["I", "J"],
    ]);
    expect(leo.drawSegments).not.toContainEqual(["J", "E"]);
  });

  it("all drawOrder uids are unique in leo source-of-truth", () => {
    const leo = getConstellation("leo");
    expect(new Set(leo.drawOrder).size).toBe(leo.drawOrder.length);
  });
});
