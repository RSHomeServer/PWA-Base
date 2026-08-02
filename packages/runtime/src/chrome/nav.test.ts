import { describe, expect, it } from "vitest";
import {
  PLATFORM_HOME,
  PLATFORM_NAV_APPS,
  PLATFORM_NAV_GROUPS,
  PLATFORM_NAV_MEDIA,
  isPlatformNavActive,
  platformNavLinkProps,
  platformNavLogoUrl,
} from "./nav.js";

describe("platform nav", () => {
  it("lists expected groups in order", () => {
    expect(PLATFORM_NAV_GROUPS.map((g) => g.id)).toEqual([
      "media",
      "monitoring",
      "workspace",
      "apps",
    ]);
  });

  it("includes blurbs and descriptions for catalogue cards", () => {
    for (const group of PLATFORM_NAV_GROUPS) {
      expect(group.blurb.length).toBeGreaterThan(8);
      for (const link of group.links) {
        expect(link.description.length).toBeGreaterThan(8);
      }
    }
  });

  it("marks media links external and apps internal", () => {
    expect(PLATFORM_NAV_MEDIA.links.every((l) => l.external)).toBe(true);
    expect(PLATFORM_NAV_APPS.links.every((l) => !l.external)).toBe(true);
  });

  it("maps qbittorrent to qbt host and chrome to chatgpt host", () => {
    expect(PLATFORM_NAV_MEDIA.links.find((l) => l.id === "qbt")?.href).toBe(
      "https://qbt.songara.uk",
    );
    const chrome = PLATFORM_NAV_GROUPS.find((g) => g.id === "workspace")?.links.find(
      (l) => l.id === "chrome",
    );
    expect(chrome?.href).toBe("https://chatgpt.songara.uk");
  });

  it("detects active origin", () => {
    expect(isPlatformNavActive(PLATFORM_HOME.href, "https://apps.songara.uk")).toBe(true);
    expect(isPlatformNavActive(PLATFORM_HOME.href, "https://viz.songara.uk")).toBe(false);
  });

  it("sets target blank only for external links", () => {
    expect(platformNavLinkProps(PLATFORM_HOME).target).toBeUndefined();
    expect(platformNavLinkProps(PLATFORM_NAV_MEDIA.links[0]!).target).toBe("_blank");
  });

  it("resolves logo URLs for apps and externals", () => {
    expect(platformNavLogoUrl(PLATFORM_NAV_APPS.links[0]!)).toBe(
      "https://apps.songara.uk/logos/components.svg",
    );
    expect(platformNavLogoUrl(PLATFORM_NAV_MEDIA.links[0]!)).toBe(
      "https://apps.songara.uk/logos/qbt.svg",
    );
  });
});
