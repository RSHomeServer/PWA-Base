import { describe, expect, it } from "vitest";
import { SpatialHash2D } from "./SpatialHash2D.js";

describe("SpatialHash2D", () => {
  it("rebuilds and finds nearby particles via queryRadius", () => {
    const hash = new SpatialHash2D(8, 1);
    const x = new Float32Array([0.1, 0.2, 5.0, 5.1]);
    const y = new Float32Array([0.1, 0.3, 5.0, 5.2]);
    hash.rebuild(x, y, 4);

    const nearOrigin: number[] = [];
    hash.queryRadius(0, 0, 1.5, (i) => {
      nearOrigin.push(i);
    });
    expect(nearOrigin).toContain(0);
    expect(nearOrigin).toContain(1);
    expect(nearOrigin).not.toContain(2);
    expect(nearOrigin).not.toContain(3);

    const nearFar: number[] = [];
    hash.queryRadius(5, 5, 1.5, (i) => {
      nearFar.push(i);
    });
    expect(nearFar).toContain(2);
    expect(nearFar).toContain(3);
  });

  it("queryCell visits only that cell's bucket entries", () => {
    const hash = new SpatialHash2D(4, 1);
    const x = new Float32Array([0.5, 2.5]);
    const y = new Float32Array([0.5, 2.5]);
    hash.rebuild(x, y, 2);

    const hits: number[] = [];
    hash.queryCell(0, 0, (i) => hits.push(i));
    expect(hits).toContain(0);
  });

  it("rebuild with count 0 clears active entries", () => {
    const hash = new SpatialHash2D(4, 1);
    const x = new Float32Array([1, 2]);
    const y = new Float32Array([1, 2]);
    hash.rebuild(x, y, 2);
    hash.rebuild(x, y, 0);
    expect(hash.count).toBe(0);
    const hits: number[] = [];
    hash.queryRadius(1, 1, 10, (i) => hits.push(i));
    expect(hits).toEqual([]);
  });
});
