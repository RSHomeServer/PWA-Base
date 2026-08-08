import { describe, expect, it } from "vitest";
import { createSongaraDb } from "./createSongaraDb.js";
import { songaraDbName } from "./songaraDbName.js";

describe("createSongaraDb", () => {
  it("rejects an empty name", () => {
    expect(() =>
      createSongaraDb({
        name: "   ",
        versions: [{ version: 1, stores: { items: "++id" } }],
      }),
    ).toThrow(/name is required/);
  });

  it("opens with app-owned stores at the declared schema version", async () => {
    const name = songaraDbName("preview-dexie", `t-${Date.now()}-a`);

    const db = createSongaraDb({
      name,
      versions: [
        { version: 2, stores: { items: "++id, label" } },
        { version: 1, stores: { items: "++id" } },
      ],
    });

    await db.open();
    expect(db.name).toBe(name);
    expect(db.verno).toBe(2);
    expect(db.tables.map((t) => t.name)).toContain("items");

    const id = await db.table("items").add({ label: "alpha" });
    const row = await db.table("items").get(id);
    expect(row).toMatchObject({ label: "alpha" });

    db.close();
    await db.delete();
  });

  it("runs upgrade hooks when migrating an existing database", async () => {
    const name = songaraDbName("preview-dexie", `t-${Date.now()}-b`);
    const upgraded: number[] = [];

    const v1 = createSongaraDb({
      name,
      versions: [{ version: 1, stores: { items: "++id, title" } }],
    });
    await v1.open();
    await v1.table("items").add({ title: "seed" });
    v1.close();

    const v2 = createSongaraDb({
      name,
      versions: [
        { version: 1, stores: { items: "++id, title" } },
        {
          version: 2,
          stores: { items: "++id, title, label" },
          upgrade: async (tx) => {
            upgraded.push(2);
            await tx
              .table("items")
              .toCollection()
              .modify((row: { title?: string; label?: string }) => {
                row.label = row.title ?? "untitled";
              });
          },
        },
      ],
    });

    await v2.open();
    expect(v2.verno).toBe(2);
    expect(upgraded).toEqual([2]);

    const rows = await v2.table("items").toArray();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ title: "seed", label: "seed" });

    v2.close();
    await v2.delete();
  });
});
