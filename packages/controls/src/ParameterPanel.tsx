import { Label, Select, Stack, TextField } from "@platform/ui";
import type { ParamDef, ParamValue, ParamValues } from "./types.js";
import styles from "./ParameterPanel.module.css";

export interface ParameterPanelProps {
  params: ParamDef[];
  values: ParamValues;
  onChange: (id: string, value: ParamValue) => void;
}

function ParamField({
  param,
  value,
  onChange,
}: {
  param: ParamDef;
  value: ParamValue | undefined;
  onChange: (value: ParamValue) => void;
}) {
  const fieldId = `param-${param.id}`;

  switch (param.type) {
    case "number":
      return (
        <div className={styles.field}>
          <Label htmlFor={fieldId}>{param.label}</Label>
          {param.description ? <p className={styles.description}>{param.description}</p> : null}
          <TextField
            id={fieldId}
            type="number"
            value={typeof value === "number" ? value : ""}
            min={param.min}
            max={param.max}
            step={param.step}
            onChange={(event) => onChange(Number(event.target.value))}
          />
        </div>
      );

    case "boolean":
      return (
        <div className={styles.field}>
          <div className={styles.checkboxRow}>
            <input
              id={fieldId}
              className={styles.checkbox}
              type="checkbox"
              checked={Boolean(value)}
              onChange={(event) => onChange(event.target.checked)}
            />
            <Label htmlFor={fieldId}>{param.label}</Label>
          </div>
          {param.description ? <p className={styles.description}>{param.description}</p> : null}
        </div>
      );

    case "select":
      return (
        <div className={styles.field}>
          <Label htmlFor={fieldId}>{param.label}</Label>
          {param.description ? <p className={styles.description}>{param.description}</p> : null}
          <Select
            id={fieldId}
            value={typeof value === "string" ? value : ""}
            onChange={(event) => onChange(event.target.value)}
          >
            {param.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
      );

    case "text":
      return (
        <div className={styles.field}>
          <Label htmlFor={fieldId}>{param.label}</Label>
          {param.description ? <p className={styles.description}>{param.description}</p> : null}
          <TextField
            id={fieldId}
            type="text"
            value={typeof value === "string" ? value : ""}
            onChange={(event) => onChange(event.target.value)}
          />
        </div>
      );
  }
}

export function ParameterPanel({ params, values, onChange }: ParameterPanelProps) {
  return (
    <Stack gap="md" aria-label="Parameters">
      {params.map((param) => (
        <ParamField
          key={param.id}
          param={param}
          value={values[param.id]}
          onChange={(value) => onChange(param.id, value)}
        />
      ))}
    </Stack>
  );
}
