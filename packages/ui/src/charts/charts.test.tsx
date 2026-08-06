import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AnalysisChart } from "./AnalysisChart.js";
import { Gauge } from "./Gauge.js";
import { Sparkline } from "./Sparkline.js";
import { clamp, niceExtent, scaleLinear } from "./scale.js";

describe("scale helpers", () => {
  it("scaleLinear maps domain to range", () => {
    const scale = scaleLinear([0, 10], [0, 100]);
    expect(scale(0)).toBe(0);
    expect(scale(10)).toBe(100);
    expect(scale(5)).toBe(50);
  });

  it("niceExtent pads equal values", () => {
    expect(niceExtent([3, 3])).toEqual([2, 4]);
  });

  it("clamp bounds values", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(12, 0, 10)).toBe(10);
  });
});

describe("Sparkline", () => {
  it("renders an svg for sample data", () => {
    const html = renderToStaticMarkup(
      createElement(Sparkline, { data: [1, 2, 3, 2, 4], label: "Trend" }),
    );
    expect(html).toContain("<svg");
    expect(html).toContain('aria-label="Trend"');
  });

  it("renders empty state without polyline", () => {
    const html = renderToStaticMarkup(createElement(Sparkline, { data: [] }));
    expect(html).toContain("<svg");
    expect(html).not.toContain("<polyline");
  });
});

describe("Gauge", () => {
  it("renders readout and label", () => {
    const html = renderToStaticMarkup(
      createElement(Gauge, {
        value: 42,
        max: 100,
        label: "Score",
        displayValue: "42",
        tone: "success",
      }),
    );
    expect(html).toContain("Score");
    expect(html).toContain("42");
    expect(html).toContain("<svg");
  });
});

describe("AnalysisChart", () => {
  it("renders group chart", () => {
    const html = renderToStaticMarkup(
      createElement(AnalysisChart, {
        data: {
          kind: "groups",
          groups: [
            { label: "A", mean: 10, stdev: 1, values: [9, 10, 11] },
            { label: "B", mean: 12, stdev: 2, values: [10, 12, 14] },
          ],
        },
      }),
    );
    expect(html).toContain("A");
    expect(html).toContain("B");
    expect(html).toContain("<rect");
  });

  it("renders scatter chart", () => {
    const html = renderToStaticMarkup(
      createElement(AnalysisChart, {
        data: {
          kind: "scatter",
          points: [
            { x: 1, y: 2 },
            { x: 2, y: 3 },
          ],
          xLabel: "X",
          yLabel: "Y",
          line: { slope: 1, intercept: 1 },
        },
      }),
    );
    expect(html).toContain("X");
    expect(html).toContain("Y");
    expect(html).toContain("<circle");
  });
});
