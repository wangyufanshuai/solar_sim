export const KERR_CRITICAL_CURVE_GEOMETRY_EVIDENCE_SHA256_V300 = "76d2d4d3b803104ba477da627c428ed51d7b62b9691d2dc81e53f1e5bb8e81f7" as const;
export const KERR_CRITICAL_CURVE_GEOMETRY_FILE_SHA256_V300 = "29d17ba84b6017e6f5c5e50c131497abc306f4817689b366676eab7b6f8fbd69" as const;
export const KERR_CRITICAL_CURVE_BRACKET_COUNT_V300 = 40 as const;
export const KERR_CRITICAL_CURVE_PIXELS_PER_IMPACT_M_V300 = 10 as const;
export const KERR_CRITICAL_CURVE_MAX_WIDTH_PX_V300 = 0.5 as const;

export type KerrCriticalClassV300 = "capture" | "escape";

export type KerrCriticalBracketV300 = {
  readonly index: number;
  readonly spin: number;
  readonly leftImpactM: number;
  readonly rightImpactM: number;
  readonly leftClass: KerrCriticalClassV300;
  readonly rightClass: KerrCriticalClassV300;
  readonly bracketWidthPx: number;
};

export type KerrCriticalCurveViewV300 = {
  readonly version: "v300-kerr-critical-curve-view-v1";
  readonly status: "bounded-authority-view";
  readonly geometryEvidenceSha256: typeof KERR_CRITICAL_CURVE_GEOMETRY_EVIDENCE_SHA256_V300;
  readonly geometryFileSha256: typeof KERR_CRITICAL_CURVE_GEOMETRY_FILE_SHA256_V300;
  readonly bracketCount: typeof KERR_CRITICAL_CURVE_BRACKET_COUNT_V300;
  readonly pixelsPerImpactM: typeof KERR_CRITICAL_CURVE_PIXELS_PER_IMPACT_M_V300;
  readonly maxBracketWidthPx: number;
  readonly signedSpinCoverage: {
    readonly minimum: number;
    readonly maximum: number;
    readonly negativeCount: number;
    readonly positiveCount: number;
  };
  readonly brackets: readonly KerrCriticalBracketV300[];
};

type UnknownRecord = Record<string, unknown>;

function record(value: unknown, label: string): UnknownRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`critical-curve-${label}-invalid`);
  }
  return value as UnknownRecord;
}

function finite(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`critical-curve-${label}-non-finite`);
  }
  return value;
}

function criticalClass(value: unknown, label: string): KerrCriticalClassV300 {
  if (value !== "capture" && value !== "escape") {
    throw new Error(`critical-curve-${label}-invalid`);
  }
  return value;
}

function widthMatchesImpactInterval(widthPx: number, leftImpactM: number, rightImpactM: number): boolean {
  const expected = Math.abs(rightImpactM - leftImpactM) * KERR_CRITICAL_CURVE_PIXELS_PER_IMPACT_M_V300;
  const tolerance = Math.max(1e-15, Math.abs(expected) * 1e-12);
  return Math.abs(widthPx - expected) <= tolerance;
}

export function createKerrCriticalCurveViewV300(source: unknown): KerrCriticalCurveViewV300 {
  const document = record(source, "document");
  if (document.version !== "v296-kerr-geometry-redshift-short-gate-v1"
    || document.status !== "geometry-redshift-qualified"
    || document.geometryRedshiftQualified !== true
    || document.evidenceSha256 !== KERR_CRITICAL_CURVE_GEOMETRY_EVIDENCE_SHA256_V300
    || document.criticalBracketCount !== KERR_CRITICAL_CURVE_BRACKET_COUNT_V300) {
    throw new Error("critical-curve-authority-lock-mismatch");
  }
  if (!Array.isArray(document.criticalBrackets)
    || document.criticalBrackets.length !== KERR_CRITICAL_CURVE_BRACKET_COUNT_V300) {
    throw new Error("critical-curve-bracket-count-mismatch");
  }

  let previousSpin = Number.NEGATIVE_INFINITY;
  let negativeCount = 0;
  let positiveCount = 0;
  let maxBracketWidthPx = 0;
  const brackets = document.criticalBrackets.map((entry, expectedIndex) => {
    const bracket = record(entry, `bracket-${expectedIndex}`);
    if (bracket.index !== expectedIndex || !Number.isSafeInteger(bracket.index)) {
      throw new Error("critical-curve-index-conservation-failed");
    }
    const spin = finite(bracket.spin, `spin-${expectedIndex}`);
    if (spin <= previousSpin) throw new Error("critical-curve-spin-order-failed");
    previousSpin = spin;
    if (spin < 0) negativeCount += 1;
    if (spin > 0) positiveCount += 1;

    const leftImpactM = finite(bracket.leftImpactM, `left-impact-${expectedIndex}`);
    const rightImpactM = finite(bracket.rightImpactM, `right-impact-${expectedIndex}`);
    const leftClass = criticalClass(bracket.leftClass, `left-class-${expectedIndex}`);
    const rightClass = criticalClass(bracket.rightClass, `right-class-${expectedIndex}`);
    const bracketWidthPx = finite(bracket.bracketWidthPx, `width-${expectedIndex}`);
    if (bracket.valid !== true || leftClass === rightClass) {
      throw new Error("critical-curve-endpoint-classification-failed");
    }
    if (leftImpactM === rightImpactM || bracketWidthPx <= 0) {
      throw new Error("critical-curve-zero-width-failed");
    }
    if (!widthMatchesImpactInterval(bracketWidthPx, leftImpactM, rightImpactM)) {
      throw new Error("critical-curve-width-conservation-failed");
    }
    if (bracketWidthPx >= KERR_CRITICAL_CURVE_MAX_WIDTH_PX_V300) {
      throw new Error("critical-curve-width-threshold-failed");
    }
    maxBracketWidthPx = Math.max(maxBracketWidthPx, bracketWidthPx);
    return Object.freeze({
      index: expectedIndex,
      spin,
      leftImpactM,
      rightImpactM,
      leftClass,
      rightClass,
      bracketWidthPx,
    });
  });

  if (negativeCount === 0 || positiveCount === 0 || brackets[0].spin >= 0 || brackets.at(-1)!.spin <= 0) {
    throw new Error("critical-curve-signed-spin-coverage-failed");
  }

  return Object.freeze({
    version: "v300-kerr-critical-curve-view-v1",
    status: "bounded-authority-view",
    geometryEvidenceSha256: KERR_CRITICAL_CURVE_GEOMETRY_EVIDENCE_SHA256_V300,
    geometryFileSha256: KERR_CRITICAL_CURVE_GEOMETRY_FILE_SHA256_V300,
    bracketCount: KERR_CRITICAL_CURVE_BRACKET_COUNT_V300,
    pixelsPerImpactM: KERR_CRITICAL_CURVE_PIXELS_PER_IMPACT_M_V300,
    maxBracketWidthPx,
    signedSpinCoverage: Object.freeze({
      minimum: brackets[0].spin,
      maximum: brackets.at(-1)!.spin,
      negativeCount,
      positiveCount,
    }),
    brackets: Object.freeze(brackets),
  });
}

export function parseKerrCriticalCurveViewV300(source: unknown): KerrCriticalCurveViewV300 {
  const candidate = record(source, "view");
  if (candidate.version !== "v300-kerr-critical-curve-view-v1"
    || candidate.status !== "bounded-authority-view"
    || candidate.geometryEvidenceSha256 !== KERR_CRITICAL_CURVE_GEOMETRY_EVIDENCE_SHA256_V300
    || candidate.geometryFileSha256 !== KERR_CRITICAL_CURVE_GEOMETRY_FILE_SHA256_V300
    || candidate.bracketCount !== KERR_CRITICAL_CURVE_BRACKET_COUNT_V300
    || candidate.pixelsPerImpactM !== KERR_CRITICAL_CURVE_PIXELS_PER_IMPACT_M_V300
    || !Array.isArray(candidate.brackets)) {
    throw new Error("critical-curve-view-authority-lock-mismatch");
  }
  const rebuilt = createKerrCriticalCurveViewV300({
    version: "v296-kerr-geometry-redshift-short-gate-v1",
    status: "geometry-redshift-qualified",
    geometryRedshiftQualified: true,
    evidenceSha256: candidate.geometryEvidenceSha256,
    criticalBracketCount: candidate.bracketCount,
    criticalBrackets: candidate.brackets.map((bracket) => ({ ...record(bracket, "view-bracket"), valid: true })),
  });
  const coverage = record(candidate.signedSpinCoverage, "view-spin-coverage");
  if (candidate.maxBracketWidthPx !== rebuilt.maxBracketWidthPx
    || coverage.minimum !== rebuilt.signedSpinCoverage.minimum
    || coverage.maximum !== rebuilt.signedSpinCoverage.maximum
    || coverage.negativeCount !== rebuilt.signedSpinCoverage.negativeCount
    || coverage.positiveCount !== rebuilt.signedSpinCoverage.positiveCount) {
    throw new Error("critical-curve-view-summary-conservation-failed");
  }
  return rebuilt;
}
