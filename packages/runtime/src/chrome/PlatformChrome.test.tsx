import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ThemeProvider } from "../../../ui/src/index.js";
import { PlatformChrome } from "./PlatformChrome.js";
import type { PlatformNavConfig } from "./nav.js";

function renderChrome(props: {
  nav?: PlatformNavConfig | null;
  children?: ReactNode;
}): string {
  return renderToStaticMarkup(
    createElement(
      ThemeProvider,
      null,
      createElement(
        PlatformChrome,
        { nav: props.nav ?? null },
        props.children ?? createElement("span", null, "body"),
      ),
    ),
  );
}

const sampleNav: PlatformNavConfig = {
  home: {
    id: "home",
    label: "Homepage",
    href: "https://apps.example.com",
    external: false,
    description: "Example catalogue home.",
  },
  groups: [
    {
      id: "apps",
      label: "Apps",
      blurb: "Example applications.",
      links: [
        {
          id: "hello",
          label: "Hello",
          href: "https://hello.example.com",
          external: false,
          description: "Reference app.",
        },
      ],
    },
  ],
};

describe("PlatformChrome", () => {
  it("renders children without a mega bar when nav is omitted", () => {
    const html = renderChrome({});
    expect(html).toContain("body");
    expect(html).toContain('id="main-content"');
    expect(html).not.toContain("Platform mega menu");
    expect(html).not.toContain("Homepage");
  });

  it("renders injected nav links when config is provided", () => {
    const html = renderChrome({ nav: sampleNav });
    expect(html).toContain("Platform mega menu");
    expect(html).toContain("Homepage");
    expect(html).toContain("https://apps.example.com");
    expect(html).toContain("Hello");
    expect(html).toContain("https://hello.example.com");
  });
});
