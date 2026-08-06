import type { ReactNode, RefObject } from "react";
import type { BadgeVariant } from "@platform/ui";

export interface ShellDemoLink {
  href: string;
  title: string;
}

export interface ShellDemoNav {
  prev?: ShellDemoLink | null;
  next?: ShellDemoLink | null;
}

export interface LabShortcut {
  keys: string;
  label: string;
  /** Optional grouping for the help overlay, e.g. "Transport", "View". */
  category?: string;
}

export interface LabMode {
  id: string;
  label: string;
  /** Short hint shown below the tab label on wide screens. */
  description?: string;
  icon?: ReactNode;
  disabled?: boolean;
}

export interface LabTransportState {
  playing: boolean;
  speed: number;
}

export interface LabTransportHandlers {
  onPlay?: () => void;
  onPause?: () => void;
  onToggle?: () => void;
  onStep?: () => void;
  onReset?: () => void;
  onSpeedChange?: (speed: number) => void;
}

export interface LabShellProps {
  title: string;
  tagline?: string;
  badge?: string;
  badgeVariant?: BadgeVariant;
  /** Explanation shown in the educational panel. */
  about: ReactNode;
  /** Summary label for the about/details panel. */
  aboutSummary?: string;
  shortcuts: LabShortcut[];
  /** Simulation canvas or WebGL stage rendered inside the main frame. */
  children: ReactNode;
  /** Absolutely positioned HUD layered on the stage (meters, crosshairs, etc.). */
  overlay?: ReactNode;
  /** Live readouts below the workspace (frequency, FPS, particle count, etc.). */
  statusBar?: ReactNode;
  /** Parameter controls rendered in the side panel. Omit to hide the sidebar. */
  params?: ReactNode;
  paramPanelTitle?: string;
  /** Optional mode switcher tabs above the parameter panel. */
  modes?: LabMode[];
  activeMode?: string;
  onModeChange?: (modeId: string) => void;
  /** Transport handlers — play/pause/step/reset/speed. */
  transport?: LabTransportHandlers;
  playing?: boolean;
  speed?: number;
  /** Playback speed presets, e.g. [0.25, 0.5, 1, 2]. Defaults to [0.5, 1, 2]. */
  speedOptions?: number[];
  onReset?: () => void;
  onExport?: () => void;
  /** Extra controls appended to the toolbar after transport and standard actions. */
  toolbarExtra?: ReactNode;
  frameMaxWidth?: number;
  frameAspectRatio?: string;
  /** Optional external ref merged with the internal fullscreen target. */
  stageRef?: RefObject<HTMLElement | null>;
  /**
   * Notified when immersive fullscreen is entered/exited. Immersive state is also
   * exposed as `data-immersive` on the stage element.
   */
  onImmersiveChange?: (immersive: boolean) => void;
  defaultAboutOpen?: boolean;
  backHref?: string;
  backLabel?: string;
  /** Optional prev/next links below the workspace. */
  demoNav?: ShellDemoNav;
  /** Called once when the shell mounts (e.g. for analytics). */
  onMount?: () => void;
  /** Hide the shortcut hint strip below the workspace. */
  hideShortcutStrip?: boolean;
}

export interface LabToolbarProps {
  playing?: boolean;
  onTogglePlay?: () => void;
  onStep?: () => void;
  onReset?: () => void;
  onExport?: () => void;
  onFullscreen?: () => void;
  onToggleHelp?: () => void;
  helpOpen?: boolean;
  showTransport?: boolean;
  speed?: number;
  speedOptions?: number[];
  onSpeedChange?: (speed: number) => void;
  extra?: ReactNode;
  immersive?: boolean;
}

export interface LabTransportProps {
  playing: boolean;
  speed?: number;
  speedOptions?: number[];
  onToggle?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  onStep?: () => void;
  onReset?: () => void;
  onSpeedChange?: (speed: number) => void;
  compact?: boolean;
}

export interface LabParamPanelProps {
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export interface LabModeTabsProps {
  modes: LabMode[];
  activeMode: string;
  onModeChange: (modeId: string) => void;
  /** Accessible name for the tablist. */
  label?: string;
}

export interface LabHelpOverlayProps {
  shortcuts: LabShortcut[];
  open: boolean;
  onClose: () => void;
  title?: string;
}

export interface LabTooltipProps {
  label: string;
  children: ReactNode;
  /** Placement relative to the trigger. */
  placement?: "top" | "bottom";
}

export interface UseLabShortcutsOptions {
  shortcuts: LabShortcut[];
  handlers: {
    onTogglePlay?: () => void;
    onStep?: () => void;
    onReset?: () => void;
    onToggleHelp?: () => void;
    onFullscreen?: () => void;
    custom?: Record<string, (event: KeyboardEvent) => void>;
  };
  active?: boolean;
}

export interface UseLabShortcutsResult {
  showHelp: boolean;
  setShowHelp: (open: boolean) => void;
  toggleHelp: () => void;
  openHelp: () => void;
  closeHelp: () => void;
  previewShortcuts: LabShortcut[];
}

export interface RenderShortcut {
  keys: string;
  label: string;
}

export interface RenderShellProps {
  title: string;
  tagline?: string;
  badge?: string;
  badgeVariant?: BadgeVariant;
  shortcuts: RenderShortcut[];
  onReset?: () => void;
  onExport?: () => void;
  /** Extra controls rendered in the toolbar, e.g. palette picker, mode buttons. */
  toolbarExtra?: ReactNode;
  /** Absolutely positioned HUD content layered on top of the canvas frame. */
  overlay?: ReactNode;
  /** Live readouts rendered below the canvas (energy, FPS, generation, etc). */
  statusBar?: ReactNode;
  /** Explanation shown in a collapsible panel. */
  about: ReactNode;
  /** Summary label for the about/details panel. */
  aboutSummary?: string;
  frameMaxWidth?: number;
  frameAspectRatio?: string;
  /**
   * Notified whenever immersive fullscreen is entered/exited. Immersive state is also
   * exposed as `data-immersive` on the frame element.
   */
  onImmersiveChange?: (immersive: boolean) => void;
  backHref?: string;
  backLabel?: string;
  /** Optional prev/next links below the workspace. */
  demoNav?: ShellDemoNav;
  /** Called once when the shell mounts (e.g. for analytics). */
  onMount?: () => void;
  children: ReactNode;
}
