import { describe, expect, it } from "vitest";
import { ParticleBuffer } from "./ParticleBuffer.js";

describe("ParticleBuffer", () => {
  it("spawns packed into [0, count)", () => {
    const buf = new ParticleBuffer(4);
    expect(buf.spawn({ x: 1, y: 2, vx: 3, mass: 2 })).toBe(0);
    expect(buf.spawn({ x: 9, y: 8 })).toBe(1);
    expect(buf.count).toBe(2);
    expect(buf.x[0]).toBe(1);
    expect(buf.y[0]).toBe(2);
    expect(buf.vx[0]).toBe(3);
    expect(buf.mass[0]).toBe(2);
    expect(buf.x[1]).toBe(9);
  });

  it("returns -1 when full", () => {
    const buf = new ParticleBuffer(1);
    expect(buf.spawn()).toBe(0);
    expect(buf.spawn()).toBe(-1);
  });

  it("kill swap-removes and keeps particles packed", () => {
    const buf = new ParticleBuffer(4);
    buf.spawn({ x: 1 });
    buf.spawn({ x: 2 });
    buf.spawn({ x: 3 });
    buf.kill(0);
    expect(buf.count).toBe(2);
    expect(buf.x[0]).toBe(3);
    expect(buf.x[1]).toBe(2);
  });

  it("clearForces / addForce / integrate advance particles", () => {
    const buf = new ParticleBuffer(2);
    buf.spawn({ x: 0, y: 0, mass: 1 });
    buf.clearForces();
    buf.addForce(0, 10, 0);
    expect(buf.ax[0]).toBeCloseTo(10);
    buf.integrate(0.1);
    expect(buf.vx[0]).toBeCloseTo(1);
    expect(buf.x[0]).toBeCloseTo(0.1);
  });

  it("decrementLife and reapExpired remove dead particles", () => {
    const buf = new ParticleBuffer(3);
    buf.spawn({ life: 0.05 });
    buf.spawn({ life: 1 });
    buf.decrementLife(0.1);
    buf.reapExpired();
    expect(buf.count).toBe(1);
    expect(buf.life[0]).toBeCloseTo(0.9);
  });

  it("clear resets count without reallocating", () => {
    const buf = new ParticleBuffer(4);
    buf.spawn();
    buf.spawn();
    const xRef = buf.x;
    buf.clear();
    expect(buf.count).toBe(0);
    expect(buf.x).toBe(xRef);
  });
});
