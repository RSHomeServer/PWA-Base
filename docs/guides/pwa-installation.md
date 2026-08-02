# PWA installation — independently hosted apps

Each application is packaged as its own Progressive Web App with a dedicated origin, manifest, and service worker. The catalogue at `apps.songara.uk` is also installable as **Songara Studio**.

## Dashboard example

The AI Development Dashboard (`dashboard.songara.uk` / local `:5180`) can be installed to your home screen or dock.

### What you get

- **Standalone window** — opens without browser chrome, scoped to the dashboard origin
- **Offline app shell** — cached UI assets via the service worker; telemetry API calls remain network-first
- **Update prompt** — when a new build is deployed, a toast offers **Reload** or **Later**

Push notifications are **not** implemented yet. The install banner mentions them as a future capability only.

### Install (desktop / Android)

1. Open the dashboard: `http://127.0.0.1:5180/` (local) or `https://dashboard.songara.uk`
2. Use the **Install app** banner when it appears, or the browser’s install icon in the address bar
3. Launch **Dashboard** from your applications menu

### Install (iOS Safari)

iOS does not fire `beforeinstallprompt`. When Safari is detected, the dashboard shows manual steps:

1. Tap **Share**
2. Choose **Add to Home Screen**
3. Open **Dashboard** from the home screen

### Dismissing the banner

**Not now** stores `dashboard:pwaInstallDismissed:v1` in `localStorage` and hides the banner until you clear site data.

### Developer notes

| Item | Location |
| ---- | -------- |
| PWA plugin + Workbox | `apps/dashboard-web/vite.config.ts` |
| Manifest icons | `apps/dashboard-web/public/icons/` (or shared assets) |
| SW update toast | `@platform/runtime` / app shell |
| Install UX | `packages/site-dashboard/src/components/InstallExperience.tsx` |

Other apps follow the same pattern under `apps/*-web`. See [solo-packaging.md](./solo-packaging.md).
