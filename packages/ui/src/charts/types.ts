export type GaugeTone = "success" | "warning" | "error" | "neutral";

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
