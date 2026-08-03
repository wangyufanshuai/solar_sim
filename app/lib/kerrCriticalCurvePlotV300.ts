import type { KerrCriticalBracketV300, KerrCriticalCurveViewV300 } from "./kerrCriticalCurveV300";

const WIDTH = 640;
const HEIGHT = 240;
const PADDING_X = 34;
const PADDING_Y = 22;
const SPIN_MIN = -1;
const SPIN_MAX = 1;
const IMPACT_MIN = -8;
const IMPACT_MAX = 8;

export type KerrCriticalCurvePlotPointV300 = {
  readonly index: number;
  readonly spin: number;
  readonly impactM: number;
  readonly x: number;
  readonly y: number;
  readonly widthPx: number;
  readonly endpointClasses: readonly ["capture" | "escape", "capture" | "escape"];
};

export type KerrCriticalCurvePlotV300 = {
  readonly viewBox: `0 0 ${number} ${number}`;
  readonly positivePath: string;
  readonly negativePath: string;
  readonly points: readonly KerrCriticalCurvePlotPointV300[];
  readonly xAxisY: number;
  readonly yAxisX: number;
};

const xForSpin = (spin: number) => PADDING_X + ((spin - SPIN_MIN) / (SPIN_MAX - SPIN_MIN)) * (WIDTH - 2 * PADDING_X);
const yForImpact = (impactM: number) => HEIGHT - PADDING_Y - ((impactM - IMPACT_MIN) / (IMPACT_MAX - IMPACT_MIN)) * (HEIGHT - 2 * PADDING_Y);
const midpoint = (bracket: KerrCriticalBracketV300) => (bracket.leftImpactM + bracket.rightImpactM) / 2;

function path(points: readonly KerrCriticalCurvePlotPointV300[]): string {
  return points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(3)},${point.y.toFixed(3)}`).join(" ");
}

export function createKerrCriticalCurvePlotV300(view: KerrCriticalCurveViewV300): KerrCriticalCurvePlotV300 {
  const points = view.brackets.map((bracket) => Object.freeze({
    index: bracket.index,
    spin: bracket.spin,
    impactM: midpoint(bracket),
    x: xForSpin(bracket.spin),
    y: yForImpact(midpoint(bracket)),
    widthPx: bracket.bracketWidthPx,
    endpointClasses: Object.freeze([bracket.leftClass, bracket.rightClass] as const),
  }));
  const positive = points.filter((point) => point.impactM > 0);
  const negative = points.filter((point) => point.impactM < 0);
  if (points.length !== 40 || positive.length !== 20 || negative.length !== 20) {
    throw new Error("critical-curve-plot-branch-conservation-failed");
  }
  return Object.freeze({
    viewBox: `0 0 ${WIDTH} ${HEIGHT}`,
    positivePath: path(positive),
    negativePath: path(negative),
    points: Object.freeze(points),
    xAxisY: yForImpact(0),
    yAxisX: xForSpin(0),
  });
}

export function nearestKerrCriticalBracketV300(
  view: KerrCriticalCurveViewV300,
  spin: number,
): KerrCriticalBracketV300 {
  if (!Number.isFinite(spin)) throw new Error("critical-curve-selected-spin-non-finite");
  return view.brackets.reduce((nearest, bracket) => Math.abs(bracket.spin - spin) < Math.abs(nearest.spin - spin) ? bracket : nearest);
}
