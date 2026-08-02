import { describe, expect, it } from "vitest";
import { ChladniField } from "./ChladniField.js";

describe("ChladniField", () => {
  it("orders rectangular eigenvalues by mode number", () => {
    const field = new ChladniField(32);
    field.setPlate("rect", 12, 12, 6);
    const low = field.eigenvalue({ n: 1, m: 1 });
    const high = field.eigenvalue({ n: 5, m: 7 });
    expect(high).toBeGreaterThan(low);
  });

  it("places nodal energy minima on the plate center for a symmetric drive", () => {
    const field = new ChladniField(64);
    field.setPlate("rect", 12, 12, 6);
    field.setPrimaryMode({ n: 3, m: 5 });
    field.setSources([{ x: 0, y: 0 }]);
    field.recompute();
    // Mode (3,5) has a node through the plate center; the mid-axes are also
    // nodal for this antisymmetric free-plate shape, so probe an antinode off-axis.
    const node = field.sampleEnergy(0, 0);
    const antinode = field.sampleEnergy(2.5, 1.5);
    expect(node).toBeCloseTo(0, 5);
    expect(antinode).toBeGreaterThan(node + 0.1);
  });
});
