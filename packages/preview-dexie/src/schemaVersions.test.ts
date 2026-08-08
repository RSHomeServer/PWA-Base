import { describe, expect, it } from "vitest";
import {
  sortSchemaVersions,
  type SongaraSchemaVersion,
} from "./schemaVersions.js";

describe("sortSchemaVersions", () => {
  it("sorts ascending without mutating the input", () => {
    const versions: SongaraSchemaVersion[] = [
      { version: 2, stores: { notes: "id, title" } },
      { version: 1, stores: { notes: "id" } },
    ];
    const sorted = sortSchemaVersions(versions);
    expect(sorted.map((v) => v.version)).toEqual([1, 2]);
    expect(versions.map((v) => v.version)).toEqual([2, 1]);
  });

  it("rejects empty, duplicate, and non-positive versions", () => {
    expect(() => sortSchemaVersions([])).toThrow(/at least one/);
    expect(() =>
      sortSchemaVersions([
        { version: 1, stores: { a: "id" } },
        { version: 1, stores: { a: "id, name" } },
      ]),
    ).toThrow(/duplicate/);
    expect(() =>
      sortSchemaVersions([{ version: 0, stores: { a: "id" } }]),
    ).toThrow(/positive integer/);
  });
});
