import { describe, expect, it } from "vitest";
import { createSongaraLocalforage } from "./createSongaraLocalforage.js";

describe("createSongaraLocalforage", () => {
  it("creates a namespaced instance and round-trips a value", async () => {
    const store = createSongaraLocalforage({
      appId: "hello",
      storeName: "prefs",
    });
    expect(store.config().name).toBe("songara:hello:localforage");
    await store.setItem("theme", "dark");
    expect(await store.getItem("theme")).toBe("dark");
    await store.clear();
  });

  it("rejects empty storeName", () => {
    expect(() =>
      createSongaraLocalforage({ appId: "hello", storeName: "" }),
    ).toThrow(/storeName/);
  });
});
