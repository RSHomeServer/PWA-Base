import { describe, expect, it } from "vitest";
import { joinPaths } from "./join-paths";

describe("joinPaths", () => {
  it("returns the base path when the route is root", () => {
    expect(joinPaths("/sites/demo", "/")).toBe("/sites/demo");
  });

  it("joins base and route segments", () => {
    expect(joinPaths("/sites/demo", "/about")).toBe("/sites/demo/about");
    expect(joinPaths("/sites/demo/", "settings")).toBe("/sites/demo/settings");
  });

  it("normalizes duplicate slashes in joined segments", () => {
    expect(joinPaths("/sites/demo", "//about")).toBe("/sites/demo/about");
  });

  it("returns root when both paths are empty", () => {
    expect(joinPaths("", "/")).toBe("/");
  });
});
