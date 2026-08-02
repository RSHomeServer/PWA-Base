export type AnalysisKind = "ttest" | "pearson" | "regression";

export interface ResultRow {
  metric: string;
  value: string;
}

export interface AnalysisResult {
  rows: ResultRow[];
  significant: boolean | null;
  alpha: number;
  explanation: string;
  chart: ChartData;
}

export type ChartData =
  | {
      kind: "groups";
      groups: { label: string; mean: number; stdev: number; values: number[] }[];
    }
  | {
      kind: "scatter";
      points: { x: number; y: number }[];
      line?: { slope: number; intercept: number };
      xLabel: string;
      yLabel: string;
    };

export interface ParsedColumns {
  headers: string[];
  columns: number[][];
}
