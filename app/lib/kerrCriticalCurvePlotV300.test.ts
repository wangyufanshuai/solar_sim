import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { createKerrCriticalCurveViewV300 } from "./kerrCriticalCurveV300";
import { createKerrCriticalCurvePlotV300, nearestKerrCriticalBracketV300 } from "./kerrCriticalCurvePlotV300";

const geometry = JSON.parse(readFileSync(resolve(process.cwd(), "dist/science/kerr-reference-v296/geometry-redshift-short-gate.json"), "utf8"));

describe("v300 critical-curve scientific plot", () => {
  it("keeps both signed-impact branches and all 40 authority brackets", () => {
    const view = createKerrCriticalCurveViewV300(geometry);
    const plot = createKerrCriticalCurvePlotV300(view);
    expect(plot.points).toHaveLength(40);
    expect(plot.points.filter((point) => point.impactM > 0)).toHaveLength(20);
    expect(plot.points.filter((point) => point.impactM < 0)).toHaveLength(20);
    expect(plot.positivePath).toMatch(/^M/);
    expect(plot.negativePath).toMatch(/^M/);
    expect(plot.points.every((point) => point.widthPx > 0 && point.endpointClasses[0] !== point.endpointClasses[1])).toBe(true);
  });

  it("selects the nearest measured spin without interpolating authority", () => {
    const view = createKerrCriticalCurveViewV300(geometry);
    expect(nearestKerrCriticalBracketV300(view, -0.94).index).toBe(0);
    expect(nearestKerrCriticalBracketV300(view, 0.94).index).toBe(39);
    expect(() => nearestKerrCriticalBracketV300(view, Number.NaN)).toThrow("critical-curve-selected-spin-non-finite");
  });

  it("keeps the bounded artifact request behind the Kerr workbench tab", () => {
    const workbench = readFileSync(resolve(process.cwd(), "app/components/RelativityResearchWorkbenchV280.tsx"), "utf8");
    const curve = readFileSync(resolve(process.cwd(), "app/components/KerrCriticalCurveWorkbenchV300.tsx"), "utf8");
    expect(workbench).toContain('tab === "kerr-geodesics"');
    expect(workbench).toContain("<KerrCriticalCurveWorkbenchV300");
    expect(curve).toContain("/api/atlas/relativity-evidence/artifacts/v296-critical-brackets");
    expect(curve).toContain("MAX_RESPONSE_BYTES = 32 * 1024");
    expect(curve).not.toContain("executions");
  });
});
