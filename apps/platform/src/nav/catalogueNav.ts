/**
 * Songara catalogue navigation — product data for the host until T0.4 deletes it.
 * Injected into PlatformChrome; not part of @platform/runtime defaults.
 */

import type {
  PlatformNavConfig,
  PlatformNavGroup,
  PlatformNavLink,
} from "@platform/runtime";

const origin = (host: string) => `https://${host}`;

/** Catalogue home */
export const PLATFORM_HOME: PlatformNavLink = {
  id: "home",
  label: "Homepage",
  href: origin("apps.songara.uk"),
  external: false,
  description: "Songara Studio catalogue — jump to every service and app.",
};

/** Media stack (lscr.io / existing containers — new tab) */
export const PLATFORM_NAV_MEDIA: PlatformNavGroup = {
  id: "media",
  label: "Media",
  blurb: "Requests, libraries, indexers, and file access.",
  links: [
    {
      id: "qbt",
      label: "Qbittorrent",
      href: origin("qbt.songara.uk"),
      external: true,
      description: "Torrent client for downloads and transfers.",
    },
    {
      id: "overseerr",
      label: "Overseerr",
      href: origin("overseerr.songara.uk"),
      external: true,
      description: "Request movies and TV for the media stack.",
    },
    {
      id: "radarr",
      label: "Radarr (Movies)",
      href: origin("radarr.songara.uk"),
      external: true,
      description: "Movie collection management and automation.",
    },
    {
      id: "sonarr",
      label: "Sonarr (TV)",
      href: origin("sonarr.songara.uk"),
      external: true,
      description: "TV series library management and automation.",
    },
    {
      id: "lidarr",
      label: "Lidarr (Music)",
      href: origin("lidarr.songara.uk"),
      external: true,
      description: "Music library management and automation.",
    },
    {
      id: "prowlarr",
      label: "Prowlarr",
      href: origin("prowlarr.songara.uk"),
      external: true,
      description: "Indexer manager for the *arr suite.",
    },
    {
      id: "filebrowser",
      label: "Filebrowser",
      href: origin("filebrowser.songara.uk"),
      external: true,
      description: "Browse and manage files on storage.",
    },
  ],
};

/** Monitoring stack — new tab */
export const PLATFORM_NAV_MONITORING: PlatformNavGroup = {
  id: "monitoring",
  label: "Monitoring",
  blurb: "Logs, containers, uptime, and host metrics.",
  links: [
    {
      id: "dozzle",
      label: "Dozzle",
      href: origin("dozzle.songara.uk"),
      external: true,
      description: "Live Docker container logs in the browser.",
    },
    {
      id: "portainer",
      label: "Portainer",
      href: origin("portainer.songara.uk"),
      external: true,
      description: "Docker and compose management UI.",
    },
    {
      id: "kuma",
      label: "Kuma",
      href: origin("kuma.songara.uk"),
      external: true,
      description: "Uptime monitoring and status checks.",
    },
    {
      id: "netdata",
      label: "Netdata",
      href: origin("netdata.songara.uk"),
      external: true,
      description: "Real-time infrastructure metrics.",
    },
  ],
};

/** Workspace tools — new tab */
export const PLATFORM_NAV_WORKSPACE: PlatformNavGroup = {
  id: "workspace",
  label: "Workspace",
  blurb: "Browsers, remote desktops, and notes.",
  links: [
    {
      id: "chrome",
      label: "Chrome",
      href: origin("chatgpt.songara.uk"),
      external: true,
      description: "Remote Chrome workspace (chatgpt.songara.uk).",
    },
    {
      id: "guacamole",
      label: "Guacamole",
      href: origin("guacamole.songara.uk"),
      external: true,
      description: "Browser-based remote desktop gateway.",
    },
    {
      id: "notes",
      label: "Notes",
      href: origin("notes.songara.uk"),
      external: true,
      description: "Personal and shared notes.",
    },
  ],
};

/**
 * Independently hosted platform applications (same-tab; each mounts PlatformChrome).
 * Hosts must stay aligned with packages/catalog/src/entries.ts.
 */
export const PLATFORM_NAV_APPS: PlatformNavGroup = {
  id: "apps",
  label: "Apps",
  blurb: "Songara Studio applications — each on its own host with PWA support.",
  links: [
    {
      id: "components",
      label: "Components",
      href: origin("components.songara.uk"),
      external: false,
      description: "Living design-system catalogue and primitives.",
    },
    {
      id: "docs",
      label: "Documents",
      href: origin("docs.songara.uk"),
      external: false,
      description: "Architecture, guides, and platform strategy docs.",
    },
    {
      id: "stats",
      label: "Statistical Analysis",
      href: origin("stats.songara.uk"),
      external: false,
      description: "Hypothesis tests, regression, and CSV workflows.",
    },
    {
      id: "browser-lab",
      label: "Browser Lab",
      href: origin("browser-lab.songara.uk"),
      external: false,
      description: "Capability probes, gauges, and benchmarks.",
    },
    {
      id: "hello",
      label: "Hello",
      href: origin("hello.songara.uk"),
      external: false,
      description: "Hello — scaffolded with pnpm new-app.",
    },
    {
      id: "dashboard",
      label: "AI Development Dashboard",
      href: origin("dashboard.songara.uk"),
      external: false,
      description: "Cursor Tasks, Runs, ops, and notifications.",
    },
  ],
};

export const PLATFORM_NAV_GROUPS: readonly PlatformNavGroup[] = [
  PLATFORM_NAV_MEDIA,
  PLATFORM_NAV_MONITORING,
  PLATFORM_NAV_WORKSPACE,
  PLATFORM_NAV_APPS,
];

export const PLATFORM_LOGO_ORIGIN = "https://apps.songara.uk";

/** Fallback accents when canvas sampling is unavailable (CORS / SSR). */
export const PLATFORM_LOGO_ACCENTS: Readonly<Record<string, string>> = {
  home: "#0d7a72",
  qbt: "#2f67ba",
  overseerr: "#6366f1",
  radarr: "#ffcb3d",
  sonarr: "#2596be",
  lidarr: "#629e48",
  prowlarr: "#e66001",
  filebrowser: "#006498",
  dozzle: "#2496ed",
  portainer: "#13bef9",
  kuma: "#5cdd8b",
  netdata: "#00ab44",
  chrome: "#4285f4",
  guacamole: "#d22128",
  notes: "#a16207",
  components: "#0d7a72",
  docs: "#0f766e",
  stats: "#1d4ed8",
  "browser-lab": "#0e7490",
  hello: "#0f766e",
  dashboard: "#134e4a",
};

export const CATALOGUE_NAV: PlatformNavConfig = {
  home: PLATFORM_HOME,
  groups: PLATFORM_NAV_GROUPS,
  logoOrigin: PLATFORM_LOGO_ORIGIN,
  logoLocalHostname: "apps.songara.uk",
  logoAccents: PLATFORM_LOGO_ACCENTS,
};
