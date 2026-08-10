import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("howler", () => {
  class Howl {
    opts: unknown;
    constructor(opts: unknown) {
      this.opts = opts;
    }
  }
  return { Howl, Howler: {} };
});

import { Howl } from "howler";
import { createSongaraSfx } from "./createSongaraSfx.js";

describe("createSongaraSfx", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("builds a Howl with Songara defaults", () => {
    const sfx = createSongaraSfx({ src: "/packs/click.mp3", volume: 0.5 });
    expect(sfx).toBeInstanceOf(Howl);
    expect((sfx as Howl & { opts: Record<string, unknown> }).opts).toMatchObject({
      src: ["/packs/click.mp3"],
      volume: 0.5,
      html5: false,
      loop: false,
    });
  });

  it("rejects empty src", () => {
    expect(() => createSongaraSfx({ src: "" })).toThrow(/src/);
    expect(() => createSongaraSfx({ src: [] })).toThrow(/src/);
  });
});
