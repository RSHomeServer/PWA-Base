# Platform Preferences

Runtime-owned settings that persist across sessions and apply to every Songara app.

Storage key: `songara-platform-prefs:v1` (localStorage).

## Update preferences

| Key | Meaning |
| --- | --- |
| `autoCheckUpdates` | Poll for a newer service worker / version |
| `autoApplyUpdates` | Activate a waiting worker without prompting |
| `autoReloadOnActivate` | Hard-navigate after the new worker controls the page |
| `promptBeforeUpdate` | Show toast / chrome prompt when not auto-applying |
| `updateCheckIntervalMs` | Poll interval |

### Defaults

Mode is resolved by `detectPlatformRuntimeMode()`:

1. `import.meta.env.VITE_PLATFORM_RUNTIME_MODE` (from build env `PLATFORM_RUNTIME_MODE`)
2. else Vite `import.meta.env.DEV`
3. else production

Docker Compose defaults `PLATFORM_RUNTIME_MODE=development` so container builds get iteration-friendly prefs even though Vite `DEV` is false. Set `PLATFORM_RUNTIME_MODE=production` for a stability-first release build.

**Development**:

- Check ✓ · Apply ✓ · Reload ✓ · Prompt ✗ · interval 15s  

Optimises iteration speed when a SW is present (e.g. `vite preview` / container rebuilds). Pure Vite HMR still disables SW registration (`disabled: import.meta.env.DEV` on the controller) because there is no production worker during `vite` serve.

**Production**:

- Check ✓ · Apply ✗ · Reload ✗ · Prompt ✓ · interval 5 minutes  

Prioritises stability and explicit user choice.

If you previously opened a site before this mode was wired, clear `localStorage` key `songara-platform-prefs:v1` (or toggle any checkbox once) so stored values do not override the new defaults.

## API

```ts
import {
  loadPlatformPreferences,
  savePlatformPreferences,
  patchPlatformPreferences,
  usePlatformPreferences,
  defaultPlatformPreferences,
} from "@platform/runtime";
```

Apps must not call `registration.update()` / `skipWaiting` directly — use `useServiceWorkerUpdate` / `createServiceWorkerUpdateController`, which read these preferences.

## Front-end

The mega-bar **Update** control exposes checkboxes for the four boolean update preferences and still offers a manual **Refresh** (force reload).
