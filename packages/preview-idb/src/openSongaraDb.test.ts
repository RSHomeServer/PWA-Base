import { describe, expect, it } from "vitest";
import { openSongaraDb } from "./openSongaraDb.js";

describe("openSongaraDb", () => {
  it("opens a namespaced database", async () => {
    const db = await openSongaraDb({ appId: "hello", dbKey: "idb-test" });
    expect(db.name).toBe("songara:hello:idb-test");
    db.close();
  });
});
