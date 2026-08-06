import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  hasPlatformNav,
  isPlatformNavActive,
  platformNavLinkProps,
  platformNavLogoUrl,
  type PlatformNavConfig,
  type PlatformNavLink,
} from "./nav.js";

const home: PlatformNavLink = {
  id: "home",
  label: "Home",
  href: "https://apps.example.com",
  external: false,
  description: "Catalogue home for the example platform.",
};

const sampleConfig: PlatformNavConfig = {
  home,
  groups: [
    {
      id: "apps",
      label: "Apps",
      blurb: "Product applications on this platform.",
      links: [
        {
          id: "hello",
          label: "Hello",
          href: "https://hello.example.com",
          external: false,
          description: "Reference solo application.",
        },
        {
          id: "docs",
          label: "Docs",
          href: "https://docs.external.example",
          external: true,
          description: "External documentation site.",
        },
      ],
    },
  ],
  logoOrigin: "https://apps.example.com",
};

describe("platform nav helpers", () => {
  it("treats missing or empty config as no mega bar", () => {
    expect(hasPlatformNav(undefined)).toBe(false);
    expect(hasPlatformNav(null)).toBe(false);
    expect(hasPlatformNav({})).toBe(false);
    expect(hasPlatformNav({ groups: [] })).toBe(false);
    expect(hasPlatformNav(sampleConfig)).toBe(true);
    expect(hasPlatformNav({ home })).toBe(true);
  });

  it("detects active origin", () => {
    expect(isPlatformNavActive(home.href, "https://apps.example.com")).toBe(true);
    expect(isPlatformNavActive(home.href, "https://hello.example.com")).toBe(false);
  });

  it("sets target blank only for external links", () => {
    expect(platformNavLinkProps(home).target).toBeUndefined();
    expect(platformNavLinkProps(sampleConfig.groups![0]!.links[1]!).target).toBe("_blank");
  });

  it("resolves logo URLs from injected logoOrigin", () => {
    expect(platformNavLogoUrl(sampleConfig.groups![0]!.links[0]!, sampleConfig)).toBe(
      "https://apps.example.com/logos/hello.svg",
    );
  });

  it("resolves same-origin logos when logoOrigin is omitted", () => {
    expect(platformNavLogoUrl(home)).toBe("/logos/home.svg");
  });
});

describe("runtime chrome source", () => {
  it("does not embed product *.songara.uk hosts", () => {
    const chromeDir = fileURLToPath(new URL(".", import.meta.url));
    const files: string[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const path = join(dir, name);
        if (statSync(path).isDirectory()) walk(path);
        else if (/\.(ts|tsx|css)$/.test(name) && !name.endsWith(".test.ts")) {
          files.push(path);
        }
      }
    };
    walk(chromeDir);
    for (const file of files) {
      const text = readFileSync(file, "utf8");
      expect(text, file).not.toMatch(/\.songara\.uk/);
    }
  });
});
