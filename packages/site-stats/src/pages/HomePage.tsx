import { useMemo, useState, type ChangeEvent } from "react";
import type { ParamDef, ParamValues } from "@platform/controls";
import { ParameterPanel } from "@platform/controls";
import { downloadText } from "@platform/export";
import { Button, Label, Panel, Stack, TextArea } from "@platform/ui";
import "@platform/ui/tokens.css";
import { AnalysisChart } from "../components/AnalysisChart.js";
import { DataTable } from "../components/DataTable.js";
import { matrixToCsv, parseCsv, parseNumericColumns, resultsToCsv } from "../lib/csv.js";
import { runAnalysis } from "../lib/stats.js";
import type { AnalysisKind } from "../lib/types.js";
import styles from "./HomePage.module.css";

const DEFAULT_HEADERS = ["Group A", "Group B"];
const DEFAULT_ROWS = [
  ["12.1", "15.4"],
  ["13.0", "14.8"],
  ["11.8", "16.2"],
  ["12.5", "15.0"],
  ["13.2", "15.6"],
];

const CORRELATION_HEADERS = ["Variable X", "Variable Y"];
const CORRELATION_ROWS = [
  ["1.0", "2.1"],
  ["2.0", "3.9"],
  ["3.0", "6.2"],
  ["4.0", "7.8"],
  ["5.0", "10.1"],
  ["6.0", "12.3"],
  ["7.0", "14.0"],
  ["8.0", "16.2"],
];

const PRESETS = {
  "two-groups": {
    label: "Demo: two groups",
    headers: DEFAULT_HEADERS,
    rows: DEFAULT_ROWS,
    params: { test: "ttest", alpha: 0.05 },
  },
  correlation: {
    label: "Demo: correlation",
    headers: CORRELATION_HEADERS,
    rows: CORRELATION_ROWS,
    params: { test: "pearson", alpha: 0.05 },
  },
} as const;

type PresetId = keyof typeof PRESETS;

const PARAMS: ParamDef[] = [
  {
    id: "test",
    type: "select",
    label: "Analysis",
    description: "Choose the inferential procedure for the two numeric columns.",
    options: [
      { value: "ttest", label: "Two-sample t-test (Welch)" },
      { value: "pearson", label: "Pearson correlation" },
      { value: "regression", label: "Simple linear regression" },
    ],
  },
  {
    id: "alpha",
    type: "number",
    label: "Significance level (α)",
    min: 0.001,
    max: 0.2,
    step: 0.01,
    description: "Threshold for rejecting the null hypothesis (two-tailed).",
  },
];

const DEFAULT_PARAMS: ParamValues = {
  test: "ttest",
  alpha: 0.05,
};

function resultsKey(
  kind: AnalysisKind,
  alpha: number,
  headers: string[],
  rows: string[][],
): string {
  return `${kind}:${alpha}:${headers.join("|")}:${rows.map((row) => row.join(",")).join(";")}`;
}

export function HomePage() {
  const [headers, setHeaders] = useState(DEFAULT_HEADERS);
  const [rows, setRows] = useState(DEFAULT_ROWS);
  const [csvDraft, setCsvDraft] = useState("");
  const [paramValues, setParamValues] = useState<ParamValues>(DEFAULT_PARAMS);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [activePreset, setActivePreset] = useState<PresetId>("two-groups");

  const analysisKind = (paramValues.test as AnalysisKind) ?? "ttest";
  const alpha = typeof paramValues.alpha === "number" ? paramValues.alpha : 0.05;

  const parsed = useMemo(() => parseNumericColumns(headers, rows, 2), [headers, rows]);

  const analysis = useMemo(() => {
    if (parsed.errors.length > 0) {
      return { error: parsed.errors[0]! };
    }
    return runAnalysis(analysisKind, { headers: parsed.headers, columns: parsed.columns }, alpha);
  }, [analysisKind, alpha, parsed]);

  const resultAnimationKey = useMemo(
    () => resultsKey(analysisKind, alpha, headers, rows),
    [analysisKind, alpha, headers, rows],
  );

  const handleParamChange = (id: string, value: string | number | boolean) => {
    setParamValues((current) => ({ ...current, [id]: value }));
  };

  const handlePresetChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const presetId = event.target.value as PresetId;
    const preset = PRESETS[presetId];
    if (!preset) {
      return;
    }
    setActivePreset(presetId);
    setHeaders([...preset.headers]);
    setRows(preset.rows.map((row) => [...row]));
    setParamValues({ ...preset.params });
    setImportMessage(null);
  };

  const handleCsvImport = () => {
    const { headers: nextHeaders, rows: nextRows } = parseCsv(csvDraft);
    setHeaders(nextHeaders.slice(0, 2).length === 2 ? nextHeaders.slice(0, 2) : DEFAULT_HEADERS);
    setRows(nextRows.length > 0 ? nextRows.map((row) => row.slice(0, 2)) : DEFAULT_ROWS);
    setActivePreset("two-groups");
    setImportMessage(`Imported ${nextRows.length} row(s).`);
  };

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const text = await file.text();
    setCsvDraft(text);
    const { headers: nextHeaders, rows: nextRows } = parseCsv(text);
    setHeaders(nextHeaders.slice(0, 2).length === 2 ? nextHeaders.slice(0, 2) : DEFAULT_HEADERS);
    setRows(nextRows.length > 0 ? nextRows.map((row) => row.slice(0, 2)) : DEFAULT_ROWS);
    setActivePreset("two-groups");
    setImportMessage(`Loaded ${file.name} (${nextRows.length} row(s)).`);
    event.target.value = "";
  };

  const exportResults = () => {
    if ("error" in analysis) {
      return;
    }
    downloadText("stats-results.csv", resultsToCsv(analysis.rows), "text/csv;charset=utf-8");
  };

  const exportData = () => {
    downloadText("stats-data.csv", matrixToCsv(headers, rows), "text/csv;charset=utf-8");
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1>Statistical Analysis</h1>
        <p className={styles.lead}>
          Enter numeric data in two columns, choose an analysis, and review inferential statistics
          with an accompanying visualization. Sample standard deviations and Welch&apos;s t-test are
          used where appropriate for small-sample inference.
        </p>
      </header>

      <div className={styles.workspace}>
        <div className={styles.column}>
          <Panel title="Data" className={styles.panel}>
            <Stack gap="md">
              <div className={styles.presetRow}>
                <label htmlFor="dataset-preset" className={styles.presetLabel}>
                  Sample dataset
                </label>
                <select
                  id="dataset-preset"
                  className={styles.presetSelect}
                  value={activePreset}
                  onChange={handlePresetChange}
                >
                  {(Object.entries(PRESETS) as [PresetId, (typeof PRESETS)[PresetId]][]).map(
                    ([id, preset]) => (
                      <option key={id} value={id}>
                        {preset.label}
                      </option>
                    ),
                  )}
                </select>
              </div>

              <DataTable
                headers={headers}
                rows={rows}
                onHeadersChange={setHeaders}
                onRowsChange={setRows}
              />

              <div className={styles.importBlock}>
                <label htmlFor="csv-upload" className={styles.uploadLabel}>
                  Import CSV file
                </label>
                <input
                  id="csv-upload"
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileUpload}
                />
                <div>
                  <Label htmlFor="csv-paste">Or paste CSV</Label>
                  <TextArea
                    id="csv-paste"
                    rows={4}
                    value={csvDraft}
                    placeholder="Group A,Group B&#10;12.1,15.4&#10;13.0,14.8"
                    onChange={(event) => setCsvDraft(event.target.value)}
                  />
                </div>
                <div className={styles.importActions}>
                  <Button type="button" variant="secondary" size="sm" onClick={handleCsvImport}>
                    Apply pasted CSV
                  </Button>
                  <Button type="button" variant="secondary" size="sm" onClick={exportData}>
                    Export data CSV
                  </Button>
                </div>
                {importMessage ? <p className={styles.message}>{importMessage}</p> : null}
              </div>
            </Stack>
          </Panel>

          <Panel title="Analysis options" className={styles.panel}>
            <ParameterPanel params={PARAMS} values={paramValues} onChange={handleParamChange} />
          </Panel>
        </div>

        <div className={styles.column}>
          <Panel title="Results" className={styles.panel}>
            {"error" in analysis ? (
              <p className={styles.error} role="alert">
                {analysis.error}
              </p>
            ) : (
              <Stack gap="md" key={resultAnimationKey} className={styles.resultsBody}>
                {analysis.significant !== null ? (
                  <p
                    className={`${styles.verdict} ${
                      analysis.significant
                        ? styles.verdictSignificant
                        : styles.verdictNotSignificant
                    }`}
                    role="status"
                  >
                    {analysis.significant
                      ? `Statistically significant at α = ${alpha}`
                      : `Not statistically significant at α = ${alpha}`}
                  </p>
                ) : null}

                <p className={styles.explanation}>{analysis.explanation}</p>

                <div className={styles.tableWrap}>
                  <table className={styles.resultsTable}>
                    <thead>
                      <tr>
                        <th scope="col">Metric</th>
                        <th scope="col">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analysis.rows.map((row) => (
                        <tr key={row.metric}>
                          <th scope="row">{row.metric}</th>
                          <td>{row.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className={styles.chartPanel}>
                  <AnalysisChart data={analysis.chart} />
                </div>

                <div>
                  <Button type="button" size="sm" onClick={exportResults}>
                    Export results CSV
                  </Button>
                </div>
              </Stack>
            )}
          </Panel>
        </div>
      </div>
    </main>
  );
}
