import {
  Badge,
  Button,
  EmptyState,
  IconButton,
  Kbd,
  Panel,
  Skeleton,
  Spinner,
  Stack,
  Surface,
  TextField,
  ThemeToggle,
} from "@platform/ui";
import { ThemeDemoProvider } from "./ThemeDemoProvider.js";
import styles from "./ComponentPreview.module.css";

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export interface ComponentPreviewProps {
  componentId: string;
}

export function ComponentPreview({ componentId }: ComponentPreviewProps) {
  return (
    <div className={styles.preview} aria-hidden="true">
      {renderPreview(componentId)}
    </div>
  );
}

function renderPreview(componentId: string) {
  switch (componentId) {
    case "button":
      return (
        <Stack direction="row" gap="sm" align="center">
          <Button size="sm">Save</Button>
          <Button size="sm" variant="secondary">
            Cancel
          </Button>
        </Stack>
      );
    case "icon-button":
      return (
        <Stack direction="row" gap="sm" align="center">
          <IconButton label="Add" size="sm">
            <PlusIcon />
          </IconButton>
          <IconButton label="Add" size="sm" variant="outline">
            <PlusIcon />
          </IconButton>
        </Stack>
      );
    case "stack":
      return (
        <Stack gap="sm">
          <Badge>Row one</Badge>
          <Badge variant="accent">Row two</Badge>
        </Stack>
      );
    case "surface-panel":
      return (
        <Panel title="Preview">
          <Surface
            elevation="sm"
            style={{ padding: "var(--space-2)", fontSize: "var(--font-size-xs)" }}
          >
            Canvas
          </Surface>
        </Panel>
      );
    case "form-controls":
      return <TextField defaultValue="Songara Studio" aria-label="Preview field" />;
    case "parameter-panel":
      return (
        <Stack gap="sm" style={{ width: "100%" }}>
          <label style={{ fontSize: "var(--font-size-xs)", color: "var(--color-muted)" }}>
            Zoom
          </label>
          <input type="range" defaultValue="50" aria-hidden="true" tabIndex={-1} />
        </Stack>
      );
    case "badge":
      return (
        <Stack direction="row" gap="sm" align="center">
          <Badge variant="success">Active</Badge>
          <Badge variant="warning">Draft</Badge>
        </Stack>
      );
    case "empty-state":
      return (
        <EmptyState
          title="No items"
          description="Import data to begin."
          style={{ padding: "var(--space-3)", minHeight: "auto" }}
        />
      );
    case "loading":
      return (
        <Stack direction="row" gap="md" align="center">
          <Spinner size="sm" label="Loading preview" />
          <Skeleton style={{ height: "0.75rem", width: "4rem", flex: 1 }} />
        </Stack>
      );
    case "kbd":
      return (
        <span style={{ fontSize: "var(--font-size-sm)" }}>
          <Kbd>Ctrl</Kbd> + <Kbd>K</Kbd>
        </span>
      );
    case "theme-toggle":
      return (
        <ThemeDemoProvider>
          <ThemeToggle />
        </ThemeDemoProvider>
      );
    default:
      return null;
  }
}
