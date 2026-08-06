#!/usr/bin/env node
/**
 * Scaffold a new solo PWA (ADR-004 + ADR-005).
 *
 * Usage:
 *   pnpm new-app <name>
 *   node scripts/new-app.mjs <name>
 *
 * Creates:
 *   packages/site-<name>/
 *   apps/<name>-web/
 *   minimal Content Pack (<name>-base)
 *   catalogue + nav registration
 *
 * Does not modify Docker / Compose.
 */
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const RESERVED = new Set([
  "catalog",
  "components",
  "config",
  "controls",
  "dashboard",
  "docs",
  "docs-api",
  "export",
  "host",
  "markdown",
  "math",
  "physics",
  "platform",
  "runtime",
  "site-registry",
  "telemetry",
  "ui",
]);

const rawName = process.argv[2]?.trim();
if (!rawName || rawName.startsWith("-")) {
  console.error("Usage: pnpm new-app <name>");
  console.error("  <name> must be kebab-case (e.g. hello, recipe-box)");
  process.exit(1);
}

const name = rawName.toLowerCase();
if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(name)) {
  console.error(`Invalid name "${rawName}". Use kebab-case: letters, digits, single hyphens.`);
  process.exit(1);
}
if (RESERVED.has(name)) {
  console.error(`"${name}" is reserved. Pick another id.`);
  process.exit(1);
}

const siteDir = join(root, "packages", `site-${name}`);
const appDir = join(root, "apps", `${name}-web`);
if (existsSync(siteDir) || existsSync(appDir)) {
  console.error(`Refusing to overwrite existing paths:\n  ${relative(root, siteDir)}\n  ${relative(root, appDir)}`);
  process.exit(1);
}

const title = toTitle(name);
const camel = toCamelCase(name);
const siteExport = `${camel}Site`;
const packId = `${name}-base`;
const host = `${name}.songara.uk`;
const packageSite = `@platform/site-${name}`;
const packageWeb = `@platform/${name}-web`;
const accent = pickAccent(name);
const monogram = monogramLetters(name);
const { devPort, previewPort } = nextPorts();

function toTitle(kebab) {
  return kebab
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function toCamelCase(kebab) {
  return kebab
    .split("-")
    .map((part, i) => (i === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)))
    .join("");
}

function monogramLetters(kebab) {
  const parts = kebab.split("-");
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return parts
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join("");
}

function pickAccent(kebab) {
  const palette = ["#0f766e", "#1d4ed8", "#b45309", "#be185d", "#0e7490", "#4d7c0f", "#7c3aed"];
  let hash = 0;
  for (let i = 0; i < kebab.length; i += 1) hash = (hash * 31 + kebab.charCodeAt(i)) >>> 0;
  return palette[hash % palette.length];
}

function nextPorts() {
  const used = new Set();
  const appsRoot = join(root, "apps");
  for (const dir of readdirSync(appsRoot, { withFileTypes: true })) {
    if (!dir.isDirectory()) continue;
    const vitePath = join(appsRoot, dir.name, "vite.config.ts");
    if (!existsSync(vitePath)) continue;
    const text = readFileSync(vitePath, "utf8");
    for (const match of text.matchAll(/port:\s*(\d+)/g)) {
      used.add(Number(match[1]));
    }
  }
  let dev = 5182;
  while (used.has(dev)) dev += 1;
  let preview = dev + 1000;
  while (used.has(preview)) preview += 1;
  return { devPort: dev, previewPort: preview };
}

function write(path, contents) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, contents);
  console.log("  +", relative(root, path));
}

function insertBeforeMarker(filePath, marker, insertion, { alreadyContains } = {}) {
  const text = readFileSync(filePath, "utf8");
  if (alreadyContains && text.includes(alreadyContains)) {
    console.log("  ~", relative(root, filePath), "(already registered)");
    return;
  }
  const idx = text.indexOf(marker);
  if (idx === -1) {
    throw new Error(`Marker not found in ${relative(root, filePath)}: ${marker}`);
  }
  writeFileSync(filePath, `${text.slice(0, idx)}${insertion}${text.slice(idx)}`);
  console.log("  ~", relative(root, filePath));
}

function patchJsonDependency(filePath, depName) {
  const pkg = JSON.parse(readFileSync(filePath, "utf8"));
  pkg.dependencies ??= {};
  if (pkg.dependencies[depName]) {
    console.log("  ~", relative(root, filePath), `(${depName} already listed)`);
    return;
  }
  pkg.dependencies[depName] = "workspace:*";
  const sorted = Object.fromEntries(Object.entries(pkg.dependencies).sort(([a], [b]) => a.localeCompare(b)));
  pkg.dependencies = sorted;
  writeFileSync(filePath, `${JSON.stringify(pkg, null, 2)}\n`);
  console.log("  ~", relative(root, filePath));
}

function logoSvg(id, letters, color) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="${id}">
  <rect width="64" height="64" rx="14" fill="${color}"/>
  <text x="32" y="38" text-anchor="middle" font-family="ui-sans-serif,system-ui,sans-serif" font-size="20" font-weight="700" fill="#fff">${letters}</text>
</svg>
`;
}

function appIconSvg(color) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-label="${title}">
  <rect width="512" height="512" rx="96" fill="${color}"/>
  <circle cx="256" cy="220" r="72" fill="#fafaf9" opacity="0.95"/>
  <rect x="152" y="320" width="208" height="48" rx="24" fill="#fafaf9" opacity="0.85"/>
</svg>
`;
}

console.log(`Scaffolding PWA "${name}" (${title})…`);

// --- site package -----------------------------------------------------------

write(
  join(siteDir, "package.json"),
  `${JSON.stringify(
    {
      name: packageSite,
      version: "0.0.0",
      private: true,
      description: `${title} application site package`,
      type: "module",
      exports: {
        ".": {
          types: "./src/index.ts",
          import: "./src/index.ts",
          default: "./src/index.ts",
        },
      },
      main: "./src/index.ts",
      types: "./src/index.ts",
      files: ["src", "content"],
      scripts: {
        typecheck: "tsc --noEmit -p tsconfig.json",
        "pack:sync": `node ../../scripts/sync-content-pack.mjs ${name} ${packId}`,
      },
      dependencies: {
        "@platform/runtime": "workspace:*",
        "@platform/site-registry": "workspace:*",
        "@platform/ui": "workspace:*",
      },
      peerDependencies: {
        react: "^19.0.0",
        "react-dom": "^19.0.0",
      },
      devDependencies: {
        "@platform/config": "workspace:*",
        "@types/react": "catalog:",
        "@types/react-dom": "catalog:",
        react: "catalog:",
        "react-dom": "catalog:",
        typescript: "catalog:",
      },
    },
    null,
    2,
  )}\n`,
);

write(
  join(siteDir, "tsconfig.json"),
  `${JSON.stringify(
    {
      extends: "@platform/config/tsconfig.react.json",
      compilerOptions: { rootDir: "src" },
      include: ["src"],
    },
    null,
    2,
  )}\n`,
);

write(
  join(siteDir, "src/vite-env.d.ts"),
  `interface ImportMetaEnv {
  readonly DEV?: boolean;
  readonly VITE_APP_VERSION?: string;
  readonly VITE_APP_BUILT_AT?: string;
  readonly [key: string]: string | boolean | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
`,
);

write(
  join(siteDir, "src/css.d.ts"),
  `declare module "*.module.css" {
  const classes: { readonly [key: string]: string };
  export default classes;
}
`,
);

write(
  join(siteDir, "src/pages/HomePage.module.css"),
  `.page {
  max-width: 40rem;
  margin: 0 auto;
  padding: 2.5rem 1.5rem 4rem;
}

.eyebrow {
  margin: 0 0 0.5rem;
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.65;
}

.title {
  margin: 0 0 0.75rem;
  font-size: clamp(1.75rem, 4vw, 2.25rem);
  line-height: 1.15;
}

.body {
  margin: 0;
  line-height: 1.55;
  opacity: 0.9;
}

.meta {
  margin: 1.5rem 0 0;
  font-size: 0.85rem;
  opacity: 0.65;
}
`,
);

write(
  join(siteDir, "src/pages/HomePage.tsx"),
  `import { useEffect, useState } from "react";
import {
  PackReadyGate,
  getPackEntryText,
} from "@platform/runtime";
import styles from "./HomePage.module.css";

const APP_ID = "${name}";
const PACK_ID = "${packId}";

type Welcome = {
  title?: string;
  message?: string;
};

function HelloContent() {
  const [welcome, setWelcome] = useState<Welcome | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const text = await getPackEntryText(APP_ID, PACK_ID, "meta/welcome.json");
      if (cancelled || !text) return;
      try {
        setWelcome(JSON.parse(text) as Welcome);
      } catch {
        setWelcome({ title: "${title}", message: "Hello World" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className={styles.page}>
      <p className={styles.eyebrow}>${packageWeb}</p>
      <h1 className={styles.title}>{welcome?.title ?? "${title}"}</h1>
      <p className={styles.body}>{welcome?.message ?? "Loading content pack…"}</p>
      <p className={styles.meta}>
        Pack <code>{PACK_ID}</code> · scaffolded with <code>pnpm new-app</code>
      </p>
    </main>
  );
}

export function HomePage() {
  return (
    <PackReadyGate
      appId={APP_ID}
      packIds={[PACK_ID]}
      copy={{
        preparingTitle: "Preparing ${title}",
        preparingBody: "Installing the base content pack…",
        preparingDetail: "Fetching Hello World content…",
        errorTitle: "${title} could not finish installing",
        errorHint: "Check that Content Packs are available under {packsRoot}, then reload.",
      }}
    >
      <HelloContent />
    </PackReadyGate>
  );
}
`,
);

write(
  join(siteDir, "src/index.ts"),
  `import { defineSite, SITE_CAPABILITY } from "@platform/site-registry/contract";
import { HomePage } from "./pages/HomePage.js";

export const ${siteExport} = defineSite({
  id: "${name}",
  basePath: "/",
  title: "${title}",
  requiredPackIds: ["${packId}"],
  capabilities: [SITE_CAPABILITY.offline],
  routes: [{ path: "", component: HomePage }],
});
`,
);

write(
  join(siteDir, "content", packId, "1.0.0", "meta", "welcome.json"),
  `${JSON.stringify(
    {
      title: "Hello World",
      message: `Welcome to ${title}. This text ships in the ${packId} Content Pack.`,
      schemaVersion: 1,
    },
    null,
    2,
  )}\n`,
);

write(
  join(siteDir, "content", packId, "current.json"),
  `${JSON.stringify({ version: "1.0.0" }, null, 2)}\n`,
);

write(
  join(siteDir, "content", packId, "1.0.0", "README.md"),
  `# ${packId} 1.0.0

Edit \`meta/welcome.json\`, then run:

\`\`\`bash
pnpm content-pack:sync -- ${name} ${packId}
\`\`\`
`,
);

// --- web packaging ----------------------------------------------------------

write(
  join(appDir, "package.json"),
  `${JSON.stringify(
    {
      name: packageWeb,
      version: "0.0.0",
      private: true,
      description: `Solo packaging entry for ${title}`,
      type: "module",
      scripts: {
        dev: "vite",
        build: "tsc -b && vite build",
        preview: "vite preview",
        typecheck: "tsc -b --noEmit",
      },
      dependencies: {
        "@platform/runtime": "workspace:*",
        [packageSite]: "workspace:*",
        "@platform/ui": "workspace:*",
        react: "catalog:",
        "react-dom": "catalog:",
        "react-router-dom": "catalog:",
      },
      devDependencies: {
        "@platform/config": "workspace:*",
        "@types/node": "catalog:",
        "@types/react": "catalog:",
        "@types/react-dom": "catalog:",
        "@vitejs/plugin-react": "catalog:",
        typescript: "catalog:",
        vite: "catalog:",
        "vite-plugin-pwa": "catalog:",
      },
    },
    null,
    2,
  )}\n`,
);

write(
  join(appDir, "tsconfig.json"),
  `${JSON.stringify(
    {
      files: [],
      references: [{ path: "./tsconfig.app.json" }, { path: "./tsconfig.node.json" }],
    },
    null,
    2,
  )}\n`,
);

write(
  join(appDir, "tsconfig.app.json"),
  `${JSON.stringify(
    {
      extends: "@platform/config/tsconfig.react.json",
      compilerOptions: {
        composite: true,
        tsBuildInfoFile: "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
        rootDir: "src",
        outDir: "dist-types",
      },
      include: ["src"],
    },
    null,
    2,
  )}\n`,
);

write(
  join(appDir, "tsconfig.node.json"),
  `${JSON.stringify(
    {
      extends: "@platform/config/tsconfig.node.json",
      compilerOptions: {
        composite: true,
        tsBuildInfoFile: "./node_modules/.tmp/tsconfig.node.tsbuildinfo",
        rootDir: ".",
        outDir: "./dist-node",
      },
      include: ["vite.config.ts"],
    },
    null,
    2,
  )}\n`,
);

write(
  join(appDir, "vite.config.ts"),
  `import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { appVersionPlugin } from "@platform/config/vite-app-version";
import { defineConfig } from "vite";

export default defineConfig({
  base: "/",
  plugins: [
    appVersionPlugin(),
    react(),
    VitePWA({
      registerType: "prompt",
      injectRegister: false,
      includeAssets: ["icons/icon.svg"],
      manifest: {
        name: "${title}",
        short_name: "${title}",
        description: "${title} — scaffolded PWA",
        start_url: "/",
        scope: "/",
        display: "standalone",
        theme_color: "${accent}",
        background_color: "#fafaf9",
        icons: [
          {
            src: "/icons/icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any",
          },
        ],
      },
      workbox: {
        navigateFallback: "/index.html",
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2,json}"],
        runtimeCaching: [
          {
            urlPattern: /^\\/packs\\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "content-packs",
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  server: {
    host: "127.0.0.1",
    port: ${devPort},
  },
  preview: {
    host: "127.0.0.1",
    port: ${previewPort},
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});
`,
);

write(
  join(appDir, "index.html"),
  `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <meta name="theme-color" content="${accent}" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-title" content="${title}" />
    <title>${title}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`,
);

write(
  join(appDir, "src/vite-env.d.ts"),
  `/// <reference types="vite/client" />
`,
);

write(
  join(appDir, "src/main.tsx"),
  `import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "@platform/ui/tokens.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element #root was not found.");
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
`,
);

write(
  join(appDir, "src/App.tsx"),
  `import { ${siteExport} } from "${packageSite}";
import { SoloSiteApp } from "@platform/runtime";
import { ThemeProvider } from "@platform/ui";
import { BrowserRouter } from "react-router-dom";

export function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <SoloSiteApp site={${siteExport}} />
      </BrowserRouter>
    </ThemeProvider>
  );
}
`,
);

write(join(appDir, "public/icons/icon.svg"), appIconSvg(accent));

// --- registrations ----------------------------------------------------------

insertBeforeMarker(
  join(root, "packages/catalog/src/entries.ts"),
  `  {
    id: "dashboard",`,
  `  {
    id: "${name}",
    basePath: "/",
    host: "${host}",
    title: "${title}",
    requiredPackIds: ["${packId}"],
    capabilities: ["offline"],
  },
`,
  { alreadyContains: `id: "${name}"` },
);

  // Prefer unquoted keys for simple ids; quoted keys for kebab-case.
  const loaderKey = /^[a-z][a-z0-9]*$/.test(name) ? name : `"${name}"`;
  insertBeforeMarker(
  join(root, "packages/catalog/src/loaders.ts"),
  `  dashboard: () => import("@platform/site-dashboard")`,
  `  ${loaderKey}: () => import("${packageSite}").then((m) => m.${siteExport}),
`,
  { alreadyContains: `import("${packageSite}")` },
);

patchJsonDependency(join(root, "packages/catalog/package.json"), packageSite);

insertBeforeMarker(
  join(root, "apps/platform/src/nav/catalogueNav.ts"),
  `    {
      id: "dashboard",
      label: "AI Development Dashboard",`,
  `    {
      id: "${name}",
      label: "${title}",
      href: origin("${host}"),
      external: false,
      description: "${title} — scaffolded with pnpm new-app.",
    },
`,
  { alreadyContains: `id: "${name}"` },
);

const accentKey = /^[a-z][a-z0-9]*$/.test(name) ? name : `"${name}"`;
insertBeforeMarker(
  join(root, "apps/platform/src/nav/catalogueNav.ts"),
  `  dashboard: "#134e4a",`,
  `  ${accentKey}: "${accent}",
`,
  { alreadyContains: `${accentKey}:` },
);

write(join(root, "apps/platform/public/logos", `${name}.svg`), logoSvg(name, monogram, accent));

// --- install + pack sync ----------------------------------------------------

console.log("\nInstalling workspace links…");
const install = spawnSync("corepack", ["pnpm", "install"], {
  cwd: root,
  stdio: "inherit",
  shell: false,
});
if (install.status !== 0) {
  console.warn("pnpm install failed — run it manually, then sync the pack.");
} else {
  console.log("\nSyncing Content Pack…");
  const sync = spawnSync(
    process.execPath,
    [join(root, "scripts/sync-content-pack.mjs"), name, packId, "1.0.0"],
    { cwd: root, stdio: "inherit" },
  );
  if (sync.status !== 0) {
    console.warn("Pack sync failed — run: pnpm content-pack:sync --", name, packId, "1.0.0");
  }
}

console.log(`
Done.

  Site:  packages/site-${name}
  App:   apps/${name}-web
  Pack:  ${packId}@1.0.0
  Host:  ${host} (catalogue metadata)

Next:
  pnpm --filter ${packageWeb} dev     # http://127.0.0.1:${devPort}
  pnpm --filter ${packageWeb} build

Docker / Traefik hosting is not scaffolded — add a Compose service when you deploy.
`);
