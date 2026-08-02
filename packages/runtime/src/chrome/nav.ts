/**
 * Cross-host platform navigation — shared by sidebar, mega bar, and catalogue.
 * Apps hosts mirror packages/catalog/src/entries.ts (keep in sync when adding apps).
 */

export type PlatformNavLink = {
  id: string;
  label: string;
  /** Absolute https URL */
  href: string;
  /**
   * When true, open in a new tab (external / non-platform containers).
   * Platform apps (`*.songara.uk` that mount PlatformChrome) use false.
   */
  external: boolean;
  /** Short blurb for catalogue cards */
  description: string;
};

export type PlatformNavGroup = {
  id: string;
  label: string;
  /** One-line section intro on the catalogue */
  blurb: string;
  links: readonly PlatformNavLink[];
};

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
      id: "viz",
      label: "Visual Computing",
      href: origin("viz.songara.uk"),
      external: false,
      description: "Interactive labs, canvas/WebGL, and exhibits.",
    },
    {
      id: "birthday",
      label: "Birthday",
      href: origin("birthday.songara.uk"),
      external: false,
      description: "Interactive keepsake experience with offline packs.",
    },
    {
      id: "memories",
      label: "Memories",
      href: origin("memories.songara.uk"),
      external: false,
      description: "Reusable Memory Experience Library showcase.",
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

export function isPlatformNavActive(
  href: string,
  currentOrigin: string = typeof window !== "undefined" ? window.location.origin : "",
): boolean {
  if (!currentOrigin) return false;
  try {
    return new URL(href).origin === currentOrigin;
  } catch {
    return false;
  }
}

export function platformNavLinkProps(link: PlatformNavLink): {
  href: string;
  target?: "_blank";
  rel?: string;
} {
  if (link.external) {
    return { href: link.href, target: "_blank", rel: "noopener noreferrer" };
  }
  return { href: link.href };
}

/**
 * Logos live on the catalogue host so every mega-bar (cross-host) can load them.
 * Local `/logos/` still works when already on apps.songara.uk.
 */
export const PLATFORM_LOGO_ORIGIN = "https://apps.songara.uk";

function logoBase(): string {
  if (typeof window !== "undefined" && window.location.hostname === "apps.songara.uk") {
    return "";
  }
  return PLATFORM_LOGO_ORIGIN;
}

/** Logo URL for nav/catalogue — single folder: `/logos/<id>.*`. */
export function platformNavLogoUrl(link: PlatformNavLink): string {
  return `${logoBase()}/logos/${link.id}.svg`;
}

/** Alternate raster paths when SVG is missing (used by catalogue UI). */
export function platformNavLogoCandidates(link: PlatformNavLink): readonly string[] {
  const base = logoBase();
  return [
    `${base}/logos/${link.id}.svg`,
    `${base}/logos/${link.id}.png`,
    `${base}/logos/${link.id}.webp`,
  ];
}

export {
  PLATFORM_LOGO_ACCENTS,
  platformNavLogoAccent,
  extractDominantColor,
} from "./logoAccent.js";
