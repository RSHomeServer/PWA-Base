export type {
  ContentPackEntry,
  ContentPackManifest,
  PackInstallProgress,
  PackInstallResult,
  PackClientOptions,
} from "./packs/types.js";
export {
  packBaseUrl,
  fetchPackManifest,
  installContentPack,
  ensureRequiredPacks,
  isPackActive,
  readActivePackVersion,
  getPackEntryText,
  getPackEntryUrl,
} from "./packs/client.js";
export { sha256Hex, verifySha256 } from "./packs/hash.js";
export type { ConnectivityStatus } from "./connectivity/types.js";
export { getConnectivityStatus, subscribeConnectivity } from "./connectivity/connectivity.js";
export { useConnectivity } from "./connectivity/useConnectivity.js";
export type { ServiceWorkerUpdateController } from "./pwa/register.js";
export { createServiceWorkerUpdateController } from "./pwa/register.js";
export { useServiceWorkerUpdate } from "./pwa/useServiceWorkerUpdate.js";
export { PwaUpdateToast } from "./pwa/PwaUpdateToast.js";
export type { PwaUpdateToastProps } from "./pwa/PwaUpdateToast.js";
export {
  formatDdMmHhMm,
  fetchLatestAppVersion,
  getEmbeddedAppBuild,
} from "./pwa/version.js";
export type { AppVersionInfo } from "./pwa/version.js";
export {
  PLATFORM_PREFERENCES_KEY,
  defaultPlatformPreferences,
  detectPlatformRuntimeMode,
} from "./preferences/types.js";
export type {
  PlatformPreferences,
  PlatformUpdatePreferences,
  PlatformRuntimeMode,
} from "./preferences/types.js";
export {
  loadPlatformPreferences,
  savePlatformPreferences,
  patchPlatformPreferences,
  subscribePlatformPreferences,
  normalisePlatformPreferences,
} from "./preferences/store.js";
export { usePlatformPreferences } from "./preferences/usePlatformPreferences.js";
export { useAppReady } from "./packs/useAppReady.js";
export type { AppReadyState } from "./packs/useAppReady.js";
export { PackReadyGate } from "./packs/PackReadyGate.js";
export type {
  PackReadyGateProps,
  PackReadyGateCopy,
  PackReadyGateClassNames,
} from "./packs/PackReadyGate.js";
export { SoloSiteApp, soloRoutePath } from "./solo/SoloSiteApp.js";
export { PlatformChrome } from "./chrome/PlatformChrome.js";
export type { PlatformChromeProps } from "./chrome/PlatformChrome.js";
export {
  PLATFORM_HOME,
  PLATFORM_NAV_GROUPS,
  PLATFORM_NAV_APPS,
  PLATFORM_NAV_MEDIA,
  PLATFORM_NAV_MONITORING,
  PLATFORM_NAV_WORKSPACE,
  isPlatformNavActive,
  platformNavLinkProps,
  platformNavLogoUrl,
  platformNavLogoCandidates,
  platformNavLogoAccent,
  PLATFORM_LOGO_ACCENTS,
  PLATFORM_LOGO_ORIGIN,
  extractDominantColor,
} from "./chrome/nav.js";
export { NavLogoChip } from "./chrome/NavLogoChip.js";
export type { NavLogoChipProps } from "./chrome/NavLogoChip.js";
export type { PlatformNavGroup, PlatformNavLink } from "./chrome/nav.js";
