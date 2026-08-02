import type { ChartData } from "../lib/types.js";
import styles from "./AnalysisChart.module.css";

const WIDTH = 480;
const HEIGHT = 280;
const PADDING = 48;

function scaleLinear(domain: [number, number], range: [number, number]) {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  return (value: number) => r0 + ((value - d0) / (d1 - d0)) * (r1 - r0);
}

function niceExtent(values: number[], padRatio = 0.1): [number, number] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) {
    return [min - 1, max + 1];
  }
  const pad = (max - min) * padRatio;
  return [min - pad, max + pad];
}

function GroupChart({ data }: { data: Extract<ChartData, { kind: "groups" }> }) {
  const means = data.groups.map((group) => group.mean);
  const [yMin, yMax] = niceExtent([
    ...means,
    ...data.groups.flatMap((group) => [group.mean - group.stdev, group.mean + group.stdev]),
  ]);
  const yScale = scaleLinear([yMin, yMax], [HEIGHT - PADDING, PADDING]);
  const barWidth = 72;
  const gap = 48;
  const startX = (WIDTH - (data.groups.length * barWidth + (data.groups.length - 1) * gap)) / 2;

  return (
    <svg
      className={styles.chart}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label="Group means with sample standard deviation whiskers"
    >
      <line
        x1={PADDING}
        y1={HEIGHT - PADDING}
        x2={WIDTH - PADDING}
        y2={HEIGHT - PADDING}
        className={styles.axis}
      />
      {data.groups.map((group, index) => {
        const x = startX + index * (barWidth + gap);
        const meanY = yScale(group.mean);
        const topY = yScale(group.mean + group.stdev);
        const bottomY = yScale(group.mean - group.stdev);

        return (
          <g key={group.label}>
            <rect
              x={x}
              y={meanY}
              width={barWidth}
              height={HEIGHT - PADDING - meanY}
              className={styles.bar}
            />
            <line
              x1={x + barWidth / 2}
              y1={topY}
              x2={x + barWidth / 2}
              y2={bottomY}
              className={styles.whisker}
            />
            <line
              x1={x + barWidth / 2 - 10}
              y1={topY}
              x2={x + barWidth / 2 + 10}
              y2={topY}
              className={styles.whisker}
            />
            <line
              x1={x + barWidth / 2 - 10}
              y1={bottomY}
              x2={x + barWidth / 2 + 10}
              y2={bottomY}
              className={styles.whisker}
            />
            <text
              x={x + barWidth / 2}
              y={HEIGHT - PADDING + 20}
              textAnchor="middle"
              className={styles.label}
            >
              {group.label}
            </text>
            <text
              x={x + barWidth / 2}
              y={meanY - 8}
              textAnchor="middle"
              className={styles.valueLabel}
            >
              {group.mean.toFixed(2)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function ScatterChart({ data }: { data: Extract<ChartData, { kind: "scatter" }> }) {
  const xs = data.points.map((point) => point.x);
  const ys = data.points.map((point) => point.y);
  const [xMin, xMax] = niceExtent(xs);
  const [yMin, yMax] = niceExtent(ys);
  const xScale = scaleLinear([xMin, xMax], [PADDING, WIDTH - PADDING]);
  const yScale = scaleLinear([yMin, yMax], [HEIGHT - PADDING, PADDING]);

  const linePoints =
    data.line && !Number.isNaN(data.line.slope) && !Number.isNaN(data.line.intercept)
      ? [
          { x: xMin, y: data.line.intercept + data.line.slope * xMin },
          { x: xMax, y: data.line.intercept + data.line.slope * xMax },
        ]
      : null;

  return (
    <svg
      className={styles.chart}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label={`Scatter plot of ${data.yLabel} versus ${data.xLabel}`}
    >
      <line
        x1={PADDING}
        y1={HEIGHT - PADDING}
        x2={WIDTH - PADDING}
        y2={HEIGHT - PADDING}
        className={styles.axis}
      />
      <line x1={PADDING} y1={PADDING} x2={PADDING} y2={HEIGHT - PADDING} className={styles.axis} />
      {linePoints ? (
        <line
          x1={xScale(linePoints[0]!.x)}
          y1={yScale(linePoints[0]!.y)}
          x2={xScale(linePoints[1]!.x)}
          y2={yScale(linePoints[1]!.y)}
          className={styles.regressionLine}
        />
      ) : null}
      {data.points.map((point, index) => (
        <circle
          key={index}
          cx={xScale(point.x)}
          cy={yScale(point.y)}
          r={4}
          className={styles.point}
        />
      ))}
      <text x={WIDTH / 2} y={HEIGHT - 8} textAnchor="middle" className={styles.label}>
        {data.xLabel}
      </text>
      <text
        x={16}
        y={HEIGHT / 2}
        textAnchor="middle"
        transform={`rotate(-90 16 ${HEIGHT / 2})`}
        className={styles.label}
      >
        {data.yLabel}
      </text>
    </svg>
  );
}

export function AnalysisChart({ data }: { data: ChartData }) {
  return (
    <div className={styles.wrapper}>
      {data.kind === "groups" ? <GroupChart data={data} /> : <ScatterChart data={data} />}
    </div>
  );
}
