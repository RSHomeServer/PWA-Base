export {
  prepareCanvas,
  DEFAULT_CANVAS_WIDTH,
  DEFAULT_CANVAS_HEIGHT,
  DEFAULT_CANVAS_ASPECT,
  RENDER_CANVAS_WIDTH,
  RENDER_CANVAS_HEIGHT,
  RENDER_CANVAS_ASPECT,
  RENDER_SIM_GRID,
  RENDER_MAX_DPR,
  RENDER_IMMERSIVE_MAX_DPR,
} from "./canvas/setup.js";
export type { PrepareCanvasOptions } from "./canvas/setup.js";

export { default as canvasStyles } from "./canvas/canvasStyles.module.css";

export { useAnimationFrame } from "./hooks/useAnimationFrame.js";
export { useMountShimmer } from "./hooks/useMountShimmer.js";
export { useResetFeedback } from "./hooks/useResetFeedback.js";
export type { ResetFeedback } from "./hooks/useResetFeedback.js";
export { useShortcuts } from "./hooks/useShortcuts.js";
export type { ShortcutHandlers } from "./hooks/useShortcuts.js";
export { prefersReducedMotion } from "./hooks/prefersReducedMotion.js";

export { mulberry32 } from "./utils/rng.js";
export { toCanvasPoint, primaryTouch } from "./utils/pointer.js";
export type { PointerPos } from "./utils/pointer.js";
export { loadJSON, saveJSON } from "./utils/storage.js";

export { RenderShell } from "./shell/RenderShell.js";

export {
  LabShell,
  LabToolbar,
  LabTransport,
  LabParamPanel,
  LabHelpOverlay,
  LabModeTabs,
  LabTooltip,
  useLabShortcuts,
} from "./lab/index.js";

export type {
  LabShellProps,
  LabToolbarProps,
  LabTransportProps,
  LabParamPanelProps,
  LabHelpOverlayProps,
  LabModeTabsProps,
  LabTooltipProps,
  LabShortcut,
  LabMode,
  LabTransportState,
  LabTransportHandlers,
  UseLabShortcutsOptions,
  UseLabShortcutsResult,
  ShellDemoLink,
  ShellDemoNav,
  RenderShortcut,
  RenderShellProps,
} from "./lab/types.js";
