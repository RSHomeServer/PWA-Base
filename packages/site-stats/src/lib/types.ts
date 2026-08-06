import type { ChartData } from "@platform/ui";

export type { ChartData };

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

export interface ParsedColumns {
  headers: string[];
  columns: number[][];
}
