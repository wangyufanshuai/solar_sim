import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  KERR_CRITICAL_CURVE_GEOMETRY_EVIDENCE_SHA256_V300,
  createKerrCriticalCurveViewV300,
  parseKerrCriticalCurveViewV300,
} from "./kerrCriticalCurveV300";

function authority(): Record<string, unknown> {
  return JSON.parse(readFileSync(resolve(process.cwd(), "dist/science/kerr-reference-v296/geometry-redshift-short-gate.json"), "utf8"));
}

function mutateBracket(index: number, patch: Record<string, unknown>): Record<string, unknown> {
  const document = structuredClone(authority());
  const brackets = document.criticalBrackets as Record<string, unknown>[];
  brackets[index] = { ...brackets[index], ...patch };
  return document;
}

describe("v300 bounded critical-curve authority view", () => {
  it("derives exactly 40 ordered, signed-spin, non-zero authority brackets", () => {
    const view = createKerrCriticalCurveViewV300(authority());
    expect(view).toMatchObject({
      version: "v300-kerr-critical-curve-view-v1",
      status: "bounded-authority-view",
      geometryEvidenceSha256: KERR_CRITICAL_CURVE_GEOMETRY_EVIDENCE_SHA256_V300,
      bracketCount: 40,
      pixelsPerImpactM: 10,
      signedSpinCoverage: { negativeCount: 20, positiveCount: 20 },
    });
    expect(view.brackets.every((bracket, index) => bracket.index === index
      && bracket.leftClass !== bracket.rightClass
      && bracket.bracketWidthPx > 0
      && bracket.bracketWidthPx < 0.5)).toBe(true);
    expect(view.maxBracketWidthPx).toBeLessThan(0.5);
    expect(Object.isFrozen(view)).toBe(true);
    expect(Object.isFrozen(view.brackets)).toBe(true);
  });

  it("fails closed on zero width and same-class endpoints", () => {
    expect(() => createKerrCriticalCurveViewV300(mutateBracket(0, {
      rightImpactM: (authority().criticalBrackets as Record<string, number>[])[0].leftImpactM,
      bracketWidthPx: 0,
    }))).toThrow("critical-curve-zero-width-failed");
    expect(() => createKerrCriticalCurveViewV300(mutateBracket(0, { rightClass: "capture" })))
      .toThrow("critical-curve-endpoint-classification-failed");
  });

  it("fails closed on index, spin, width and authority drift", () => {
    expect(() => createKerrCriticalCurveViewV300(mutateBracket(1, { index: 0 })))
      .toThrow("critical-curve-index-conservation-failed");
    const firstSpin = (authority().criticalBrackets as Record<string, number>[])[0].spin;
    expect(() => createKerrCriticalCurveViewV300(mutateBracket(1, { spin: firstSpin })))
      .toThrow("critical-curve-spin-order-failed");
    expect(() => createKerrCriticalCurveViewV300(mutateBracket(0, { bracketWidthPx: 0.1 })))
      .toThrow("critical-curve-width-conservation-failed");
    expect(() => createKerrCriticalCurveViewV300({ ...authority(), evidenceSha256: "0".repeat(64) }))
      .toThrow("critical-curve-authority-lock-mismatch");
  });

  it("revalidates the bounded browser payload and rejects summary drift", () => {
    const view = createKerrCriticalCurveViewV300(authority());
    expect(parseKerrCriticalCurveViewV300(JSON.parse(JSON.stringify(view)))).toEqual(view);
    expect(() => parseKerrCriticalCurveViewV300({ ...view, maxBracketWidthPx: 0 }))
      .toThrow("critical-curve-view-summary-conservation-failed");
    expect(() => parseKerrCriticalCurveViewV300({ ...view, geometryFileSha256: "f".repeat(64) }))
      .toThrow("critical-curve-view-authority-lock-mismatch");
  });
});
