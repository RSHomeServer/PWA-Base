import { mean, stdevSample, sum, varianceSample } from "@platform/math";
import type { AnalysisKind, AnalysisResult, ParsedColumns } from "./types.js";

function formatNumber(value: number, digits = 4): string {
  if (Number.isNaN(value)) {
    return "—";
  }
  return value.toFixed(digits);
}

function logGamma(value: number): number {
  // Lanczos coefficients — disable precision lint; values are intentionally high-precision.
  /* eslint-disable no-loss-of-precision -- numerical recipe constants */
  const coefficients = [
    76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155,
    1.208650973866179e-3, -5.395239384953e-6,
  ];
  /* eslint-enable no-loss-of-precision */
  let y = value;
  let tmp = value + 5.5;
  tmp -= (value + 0.5) * Math.log(tmp);
  let ser = 1.000000000190015;
  for (let index = 0; index < coefficients.length; index += 1) {
    ser += coefficients[index]! / (y += 1);
  }
  return -tmp + Math.log((2.506628274631 * ser) / value);
}

function betaincContinuedFraction(a: number, b: number, x: number): number {
  const maxIterations = 200;
  const epsilon = 1e-10;
  const lnBeta = logGamma(a) + logGamma(b) - logGamma(a + b);
  const front = Math.exp(Math.log(x) * a + Math.log(1 - x) * b - lnBeta) / a;

  let fraction = 1;
  let coefficient = 1;
  for (let index = 0; index <= maxIterations; index += 1) {
    const m = Math.floor(index / 2);
    let numerator: number;
    if (index === 0) {
      numerator = 1;
    } else if (index % 2 === 0) {
      numerator = (m * (b - m) * x) / ((a + 2 * m - 1) * (a + 2 * m));
    } else {
      numerator = -((a + m) * (a + b + m) * x) / ((a + 2 * m) * (a + 2 * m + 1));
    }

    coefficient = 1 + numerator * coefficient;
    if (Math.abs(coefficient) < epsilon) {
      coefficient = epsilon;
    }
    coefficient = 1 / coefficient;
    fraction *= coefficient;
  }

  return front * fraction;
}

function regularizedIncompleteBeta(a: number, b: number, x: number): number {
  if (x <= 0) {
    return 0;
  }
  if (x >= 1) {
    return 1;
  }

  const beta =
    (Math.exp(logGamma(a + b) - logGamma(a) - logGamma(b)) * Math.pow(x, a) * Math.pow(1 - x, b)) /
    a;
  return beta * betaincContinuedFraction(a, b, x);
}

function tCdf(t: number, df: number): number {
  const x = df / (df + t * t);
  const ib = regularizedIncompleteBeta(df / 2, 0.5, x);
  return t >= 0 ? 1 - ib / 2 : ib / 2;
}

function twoTailedPFromT(t: number, df: number): number {
  if (df <= 0 || Number.isNaN(t)) {
    return NaN;
  }
  return 2 * (1 - tCdf(Math.abs(t), df));
}

function pearsonR(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 2) {
    return NaN;
  }

  const mx = mean(x.slice(0, n));
  const my = mean(y.slice(0, n));
  let numerator = 0;
  let denomX = 0;
  let denomY = 0;

  for (let index = 0; index < n; index += 1) {
    const dx = x[index]! - mx;
    const dy = y[index]! - my;
    numerator += dx * dy;
    denomX += dx * dx;
    denomY += dy * dy;
  }

  const denominator = Math.sqrt(denomX * denomY);
  return denominator === 0 ? NaN : numerator / denominator;
}

function welchTTest(groupA: number[], groupB: number[]) {
  const n1 = groupA.length;
  const n2 = groupB.length;
  const meanA = mean(groupA);
  const meanB = mean(groupB);
  const varA = varianceSample(groupA);
  const varB = varianceSample(groupB);
  const se = Math.sqrt(varA / n1 + varB / n2);
  const t = se === 0 ? NaN : (meanA - meanB) / se;
  const numerator = varA / n1 + varB / n2;
  const denominator = (varA / n1) ** 2 / (n1 - 1) + (varB / n2) ** 2 / (n2 - 1);
  const df = denominator === 0 ? NaN : numerator / denominator;
  const p = twoTailedPFromT(t, df);

  return {
    meanA,
    meanB,
    stdevA: stdevSample(groupA),
    stdevB: stdevSample(groupB),
    n1,
    n2,
    t,
    df,
    p,
  };
}

function linearRegression(x: number[], y: number[]) {
  const n = Math.min(x.length, y.length);
  const mx = mean(x.slice(0, n));
  const my = mean(y.slice(0, n));
  let sxy = 0;
  let sxx = 0;
  let syy = 0;

  for (let index = 0; index < n; index += 1) {
    const dx = x[index]! - mx;
    const dy = y[index]! - my;
    sxy += dx * dy;
    sxx += dx * dx;
    syy += dy * dy;
  }

  const slope = sxx === 0 ? NaN : sxy / sxx;
  const intercept = Number.isNaN(slope) ? NaN : my - slope * mx;
  const r = pearsonR(x, y);
  const t = Number.isNaN(r) ? NaN : r * Math.sqrt((n - 2) / (1 - r * r));
  const p = twoTailedPFromT(t, n - 2);
  const ssRes = sum(
    y.slice(0, n).map((value, index) => {
      const predicted = intercept + slope * x[index]!;
      const residual = value - predicted;
      return residual * residual;
    }),
  );
  const ssTot = syy;
  const rSquared = ssTot === 0 ? NaN : 1 - ssRes / ssTot;

  return { slope, intercept, r, rSquared, n, t, p };
}

export function runAnalysis(
  kind: AnalysisKind,
  data: ParsedColumns,
  alpha: number,
): AnalysisResult | { error: string } {
  const [colA, colB] = data.columns;
  const [headerA, headerB] = data.headers;

  if (!colA || !colB || !headerA || !headerB) {
    return { error: "Two numeric columns are required." };
  }

  if (kind === "ttest") {
    if (colA.length < 2 || colB.length < 2) {
      return { error: "Each group needs at least two observations for a t-test." };
    }

    const result = welchTTest(colA, colB);
    const significant = !Number.isNaN(result.p) ? result.p < alpha : null;

    return {
      rows: [
        { metric: "Group A mean", value: formatNumber(result.meanA) },
        { metric: "Group B mean", value: formatNumber(result.meanB) },
        { metric: "Group A SD (sample)", value: formatNumber(result.stdevA) },
        { metric: "Group B SD (sample)", value: formatNumber(result.stdevB) },
        { metric: "n (A)", value: String(result.n1) },
        { metric: "n (B)", value: String(result.n2) },
        { metric: "t statistic", value: formatNumber(result.t) },
        { metric: "df (Welch)", value: formatNumber(result.df, 2) },
        { metric: "p-value (two-tailed)", value: formatNumber(result.p) },
        { metric: "α", value: formatNumber(alpha) },
        {
          metric: "Decision",
          value: significant ? "Reject H₀" : significant === false ? "Fail to reject H₀" : "—",
        },
      ],
      significant,
      alpha,
      explanation:
        "Welch's two-sample t-test compares independent group means without assuming equal variances. " +
        "H₀: the population means are equal.",
      chart: {
        kind: "groups",
        groups: [
          {
            label: headerA,
            mean: result.meanA,
            stdev: result.stdevA,
            values: colA,
          },
          {
            label: headerB,
            mean: result.meanB,
            stdev: result.stdevB,
            values: colB,
          },
        ],
      },
    };
  }

  if (colA.length !== colB.length || colA.length < 2) {
    return { error: "Paired numeric columns with at least two rows are required." };
  }

  const points = colA.map((x, index) => ({ x, y: colB[index]! }));

  if (kind === "pearson") {
    const r = pearsonR(colA, colB);
    const n = colA.length;
    const t = Number.isNaN(r) ? NaN : r * Math.sqrt((n - 2) / (1 - r * r));
    const p = twoTailedPFromT(t, n - 2);
    const significant = !Number.isNaN(p) ? p < alpha : null;

    return {
      rows: [
        { metric: "Pearson r", value: formatNumber(r) },
        { metric: "n", value: String(n) },
        { metric: "t statistic", value: formatNumber(t) },
        { metric: "df", value: String(n - 2) },
        { metric: "p-value (two-tailed)", value: formatNumber(p) },
        { metric: "α", value: formatNumber(alpha) },
        {
          metric: "Decision",
          value: significant ? "Reject H₀" : significant === false ? "Fail to reject H₀" : "—",
        },
      ],
      significant,
      alpha,
      explanation:
        "Pearson's r measures linear association between two continuous variables. " +
        "H₀: the population correlation is zero.",
      chart: {
        kind: "scatter",
        points,
        xLabel: headerA,
        yLabel: headerB,
      },
    };
  }

  const regression = linearRegression(colA, colB);
  const significant = !Number.isNaN(regression.p) ? regression.p < alpha : null;

  return {
    rows: [
      { metric: "Slope (b)", value: formatNumber(regression.slope) },
      { metric: "Intercept (a)", value: formatNumber(regression.intercept) },
      { metric: "Pearson r", value: formatNumber(regression.r) },
      { metric: "R²", value: formatNumber(regression.rSquared) },
      { metric: "n", value: String(regression.n) },
      { metric: "t statistic (slope)", value: formatNumber(regression.t) },
      { metric: "df", value: String(regression.n - 2) },
      { metric: "p-value (two-tailed)", value: formatNumber(regression.p) },
      { metric: "α", value: formatNumber(alpha) },
      {
        metric: "Decision",
        value: significant ? "Reject H₀" : significant === false ? "Fail to reject H₀" : "—",
      },
      {
        metric: "Model",
        value: `y = ${formatNumber(regression.intercept)} + ${formatNumber(regression.slope)}·x`,
      },
    ],
    significant,
    alpha,
    explanation:
      "Simple linear regression estimates the best-fit line y = a + b·x by ordinary least squares. " +
      "H₀: the slope is zero (no linear relationship).",
    chart: {
      kind: "scatter",
      points,
      line: { slope: regression.slope, intercept: regression.intercept },
      xLabel: headerA,
      yLabel: headerB,
    },
  };
}
