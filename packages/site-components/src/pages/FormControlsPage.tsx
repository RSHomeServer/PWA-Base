import { useCallback, useMemo, useState } from "react";
import type { ParamDef, ParamValue, ParamValues } from "@platform/controls";
import { ParameterPanel } from "@platform/controls";
import { Badge, Button, Label, Panel, Select, Stack, TextArea, TextField } from "@platform/ui";
import { AccessibilitySection } from "../components/AccessibilitySection.js";
import { ExampleBlock } from "../components/ExampleBlock.js";
import { ShowcaseSection } from "../components/ShowcaseSection.js";
import { ShowcaseShell } from "../components/ShowcaseShell.js";
import { UsageNote } from "../components/UsageNote.js";

const FORM_PARAMS: ParamDef[] = [
  {
    id: "showError",
    type: "boolean",
    label: "Show error",
    description: "Demonstrates invalid field styling.",
  },
  {
    id: "required",
    type: "boolean",
    label: "Required fields",
    description: "Adds required attribute and asterisk labels.",
  },
  {
    id: "layout",
    type: "select",
    label: "Layout",
    options: [
      { value: "stacked", label: "Stacked" },
      { value: "inline", label: "Inline actions" },
    ],
  },
];

export function FormControlsPage() {
  const [name, setName] = useState("Songara Studio");
  const [role, setRole] = useState("designer");
  const [notes, setNotes] = useState("Describe your use case…");
  const [formConfig, setFormConfig] = useState<ParamValues>({
    showError: false,
    required: true,
    layout: "stacked",
  });

  const handleConfigChange = useCallback((id: string, value: ParamValue) => {
    setFormConfig((current) => ({ ...current, [id]: value }));
  }, []);

  const showError = Boolean(formConfig.showError);
  const required = Boolean(formConfig.required);
  const inlineActions = formConfig.layout === "inline";

  const nameError = showError && name.trim().length === 0;

  const snippet = useMemo(
    () =>
      `<Label htmlFor="project"${required ? " required" : ""}>Project name</Label>
<TextField id="project" value={name} onChange={...}${required ? " required" : ""}${nameError ? " aria-invalid" : ""} />`,
    [nameError, required],
  );

  return (
    <ShowcaseShell
      title="Form controls"
      summary="Styled native inputs for accessible data entry. Pair every control with a Label using matching htmlFor and id."
    >
      <ShowcaseSection
        title="Playground"
        description="Toggle validation and layout options to see how form controls compose in real views."
      >
        <ExampleBlock title="Form playground" column stretch muted usageNote={snippet}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) min(14rem, 100%)",
              gap: "var(--space-4)",
              alignItems: "start",
            }}
          >
            <Panel title="Invite teammate">
              <Stack gap="md">
                <Stack gap="sm">
                  <Label htmlFor="playground-name">Project name{required ? " *" : ""}</Label>
                  <TextField
                    id="playground-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Enter a name"
                    required={required}
                    aria-invalid={nameError || undefined}
                    aria-describedby={nameError ? "playground-name-error" : undefined}
                  />
                  {nameError ? (
                    <span
                      id="playground-name-error"
                      role="alert"
                      style={{ color: "var(--color-error)", fontSize: "var(--font-size-sm)" }}
                    >
                      Project name is required.
                    </span>
                  ) : null}
                </Stack>

                <Stack gap="sm">
                  <Label htmlFor="playground-role">Role{required ? " *" : ""}</Label>
                  <Select
                    id="playground-role"
                    value={role}
                    onChange={(event) => setRole(event.target.value)}
                    required={required}
                  >
                    <option value="designer">Designer</option>
                    <option value="developer">Developer</option>
                    <option value="researcher">Researcher</option>
                  </Select>
                </Stack>

                <Stack gap="sm">
                  <Label htmlFor="playground-notes">Notes</Label>
                  <TextArea
                    id="playground-notes"
                    rows={3}
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                  />
                </Stack>

                {inlineActions ? (
                  <Stack direction="row" gap="sm" justify="end">
                    <Button variant="secondary" size="sm" type="button">
                      Cancel
                    </Button>
                    <Button size="sm" type="button">
                      Send invite
                    </Button>
                  </Stack>
                ) : (
                  <Button size="sm" type="button">
                    Send invite
                  </Button>
                )}
              </Stack>
            </Panel>

            <ParameterPanel
              params={FORM_PARAMS}
              values={formConfig}
              onChange={handleConfigChange}
            />
          </div>
        </ExampleBlock>
      </ShowcaseSection>

      <ShowcaseSection
        title="Text field"
        description="Single-line text input. Supports all standard input attributes."
      >
        <ExampleBlock title="TextField example" column stretch>
          <Stack gap="sm">
            <Label htmlFor="demo-name">Project name</Label>
            <TextField
              id="demo-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Enter a name"
            />
          </Stack>
        </ExampleBlock>
      </ShowcaseSection>

      <ShowcaseSection title="Select" description="Dropdown for choosing one option from a list.">
        <ExampleBlock title="Select example" column stretch>
          <Stack gap="sm">
            <Label htmlFor="demo-role">Role</Label>
            <Select id="demo-role" value={role} onChange={(event) => setRole(event.target.value)}>
              <option value="designer">Designer</option>
              <option value="developer">Developer</option>
              <option value="researcher">Researcher</option>
            </Select>
          </Stack>
        </ExampleBlock>
      </ShowcaseSection>

      <ShowcaseSection
        title="Text area"
        description="Multi-line input for longer content such as CSV paste or notes."
      >
        <ExampleBlock title="TextArea example" column stretch>
          <Stack gap="sm">
            <Label htmlFor="demo-notes">Notes</Label>
            <TextArea
              id="demo-notes"
              rows={4}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </Stack>
        </ExampleBlock>
      </ShowcaseSection>

      <ShowcaseSection
        title="Composition"
        description="Form controls inside Panel with Badge status and paired action buttons."
      >
        <ExampleBlock title="Form composition" column stretch muted>
          <Panel title="Workspace settings">
            <Stack gap="md">
              <Stack direction="row" gap="sm" align="center">
                <Badge variant="warning">Unsaved changes</Badge>
              </Stack>
              <Stack gap="sm">
                <Label htmlFor="compose-name">Display name</Label>
                <TextField id="compose-name" defaultValue="Songara Studio" />
              </Stack>
              <Stack direction="row" gap="sm" justify="end">
                <Button variant="secondary" size="sm">
                  Discard
                </Button>
                <Button size="sm">Save</Button>
              </Stack>
            </Stack>
          </Panel>
        </ExampleBlock>
      </ShowcaseSection>

      <ShowcaseSection title="Intended usage">
        <UsageNote>{`import { Label, TextField, Select, TextArea } from "@platform/ui";

<Label htmlFor="email">Email</Label>
<TextField id="email" type="email" value={email} onChange={...} />

<Label htmlFor="plan">Plan</Label>
<Select id="plan" value={plan} onChange={...}>
  <option value="free">Free</option>
</Select>`}</UsageNote>
      </ShowcaseSection>

      <AccessibilitySection>
        <ul>
          <li>
            Every input needs a visible <code>Label</code> with matching <code>htmlFor</code> and{" "}
            <code>id</code>.
          </li>
          <li>
            Surface validation with <code>aria-invalid</code> and an <code>aria-describedby</code>{" "}
            link to error text announced via <code>role="alert"</code>.
          </li>
          <li>
            Group related fields in semantic containers; associate required fields visually and
            programmatically.
          </li>
          <li>Place primary submit actions after fields in DOM order for logical tab sequence.</li>
        </ul>
      </AccessibilitySection>
    </ShowcaseShell>
  );
}
