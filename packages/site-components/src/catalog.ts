export const COMPONENTS_BASE_PATH = "";

export interface ComponentEntry {
  id: string;
  path: string;
  title: string;
  summary: string;
  category: "Actions" | "Layout" | "Forms" | "Feedback" | "Theme";
  purpose: string;
  props: string[];
  states: string[];
  files: string[];
  whereUsed: string[];
  screenshots: string[];
  recentlyUpdated: string | null;
}

export const components: ComponentEntry[] = [
  {
    id: "button",
    path: "/button",
    title: "Button",
    summary: "Primary and secondary actions with two size options.",
    category: "Actions",
    purpose: "Primary and secondary actions; prefer a single primary button per view.",
    props: ["variant", "size", "type", "disabled"],
    states: ["default", "disabled"],
    files: ["packages/ui/src/components/Button.tsx"],
    whereUsed: ["Dashboard actions", "Settings forms"],
    screenshots: ["Preview on catalogue card", "Live playground on /components/button"],
    recentlyUpdated: null,
  },
  {
    id: "icon-button",
    path: "/icon-button",
    title: "IconButton",
    summary: "Compact icon-only controls with required accessible labels.",
    category: "Actions",
    purpose: "Icon-only controls for toolbars and compact actions; label is required for accessibility.",
    props: ["label", "variant", "size"],
    states: ["default", "ghost", "subtle", "outline"],
    files: ["packages/ui/src/components/IconButton.tsx"],
    whereUsed: ["Toolbar actions", "Dialog close controls"],
    screenshots: ["Preview on catalogue card", "Live examples on /components/icon-button"],
    recentlyUpdated: null,
  },
  {
    id: "stack",
    path: "/stack",
    title: "Stack",
    summary: "Flex layout primitive for spacing and alignment.",
    category: "Layout",
    purpose: "Flexbox layout primitive for vertical or horizontal spacing and alignment.",
    props: ["direction", "gap", "align", "justify", "as"],
    states: ["column", "row"],
    files: ["packages/ui/src/components/Stack.tsx"],
    whereUsed: ["Layout primitives across sites"],
    screenshots: ["Preview on catalogue card", "Live examples on /components/stack"],
    recentlyUpdated: null,
  },
  {
    id: "surface-panel",
    path: "/surface-panel",
    title: "Surface & Panel",
    summary: "Elevated surfaces and titled section containers.",
    category: "Layout",
    purpose: "Elevated surfaces and titled section containers for grouped content.",
    props: ["elevation", "title"],
    states: ["none", "xs", "sm", "md"],
    files: [
      "packages/ui/src/components/Surface.tsx",
      "packages/ui/src/components/Panel.tsx",
    ],
    whereUsed: ["Workspace panels", "Settings sections"],
    screenshots: ["Preview on catalogue card", "Live examples on /components/surface-panel"],
    recentlyUpdated: null,
  },
  {
    id: "form-controls",
    path: "/form-controls",
    title: "Form controls",
    summary: "Label, TextField, Select, and TextArea for data entry.",
    category: "Forms",
    purpose: "Accessible form inputs — Label, TextField, Select, and TextArea for data entry.",
    props: ["label", "value", "onChange", "required", "error"],
    states: ["default", "error", "disabled"],
    files: [
      "packages/ui/src/components/Label.tsx",
      "packages/ui/src/components/TextField.tsx",
      "packages/ui/src/components/Select.tsx",
      "packages/ui/src/components/TextArea.tsx",
    ],
    whereUsed: ["Settings forms", "Onboarding flows"],
    screenshots: ["Preview on catalogue card", "Live form demo on /components/form-controls"],
    recentlyUpdated: null,
  },
  {
    id: "parameter-panel",
    path: "/parameter-panel",
    title: "ParameterPanel",
    summary: "Declarative parameter forms from @platform/controls.",
    category: "Forms",
    purpose: "Declarative parameter forms driven by ParamDef schemas from @platform/controls.",
    props: ["params", "values", "onChange"],
    states: ["default"],
    files: ["packages/controls/src/ParameterPanel.tsx"],
    whereUsed: ["Component playgrounds", "Visualization parameter sidebars"],
    screenshots: ["Preview on catalogue card", "Live examples on /components/parameter-panel"],
    recentlyUpdated: null,
  },
  {
    id: "badge",
    path: "/badge",
    title: "Badge",
    summary: "Compact status and category labels.",
    category: "Feedback",
    purpose: "Compact status and category labels that supplement visible text.",
    props: ["variant"],
    states: ["default", "accent", "success", "warning", "error"],
    files: ["packages/ui/src/components/Badge.tsx"],
    whereUsed: ["Run status pills", "Notification categories"],
    screenshots: ["Preview on catalogue card", "Live examples on /components/badge"],
    recentlyUpdated: null,
  },
  {
    id: "empty-state",
    path: "/empty-state",
    title: "EmptyState",
    summary: "Placeholder content when there is nothing to show.",
    category: "Feedback",
    purpose: "Structured placeholder when lists or views have no content to display.",
    props: ["title", "description", "media", "action"],
    states: ["default"],
    files: ["packages/ui/src/components/EmptyState.tsx"],
    whereUsed: ["Empty lists", "Search with no results"],
    screenshots: ["Preview on catalogue card", "Live examples on /components/empty-state"],
    recentlyUpdated: null,
  },
  {
    id: "loading",
    path: "/loading",
    title: "Spinner & Skeleton",
    summary: "Loading indicators and content placeholders.",
    category: "Feedback",
    purpose: "Loading indicators and content placeholders for async views.",
    props: ["size", "label", "circle"],
    states: ["spinner", "skeleton"],
    files: [
      "packages/ui/src/components/Spinner.tsx",
      "packages/ui/src/components/Skeleton.tsx",
    ],
    whereUsed: ["Async data views", "Chart loading states"],
    screenshots: ["Preview on catalogue card", "Live examples on /components/loading"],
    recentlyUpdated: null,
  },
  {
    id: "kbd",
    path: "/kbd",
    title: "Kbd",
    summary: "Keyboard shortcut styling for inline documentation.",
    category: "Feedback",
    purpose: "Keyboard shortcut styling for inline help and documentation.",
    props: ["children"],
    states: ["default"],
    files: ["packages/ui/src/components/Kbd.tsx"],
    whereUsed: ["Help text", "Command palette hints"],
    screenshots: ["Preview on catalogue card", "Live examples on /components/kbd"],
    recentlyUpdated: null,
  },
  {
    id: "theme-toggle",
    path: "/theme-toggle",
    title: "ThemeToggle",
    summary: "Light, dark, and system theme preference control.",
    category: "Theme",
    purpose: "Light, dark, and system theme preference control for end users.",
    props: ["showLabels"],
    states: ["light", "dark", "system"],
    files: ["packages/ui/src/theme/ThemeToggle.tsx"],
    whereUsed: ["App shell top bar", "Components demos"],
    screenshots: ["Preview on catalogue card", "Live examples on /components/theme-toggle"],
    recentlyUpdated: null,
  },
];

const CATEGORIES: ComponentEntry["category"][] = [
  "Actions",
  "Layout",
  "Forms",
  "Feedback",
  "Theme",
];

export function getComponentsByCategory(): {
  category: ComponentEntry["category"];
  items: ComponentEntry[];
}[] {
  return CATEGORIES.map((category) => ({
    category,
    items: components.filter((entry) => entry.category === category),
  })).filter((group) => group.items.length > 0);
}

export function componentHref(path: string): string {
  return `${COMPONENTS_BASE_PATH}${path}`;
}
