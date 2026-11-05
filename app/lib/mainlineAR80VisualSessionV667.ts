import type { VisualReviewIndexV666, VisualReviewPlanV666 } from
  "./mainlineAR79VisualReviewV666";

export interface VisualCycleV667 {
  key: string;
  route: string;
  sha256: string;
  bytes: number;
  width: number;
  height: number;
  acquiredAt: string;
  releasedAt: string;
}

export interface VisualSessionEntryV667 {
  key: string;
  kind: VisualReviewPlanV666["kind"];
  completedCycles: number;
  lastCycle: VisualCycleV667 | null;
}

export interface VisualSessionV667 {
  schema: "mainline-a-r80-local-visual-session-v667";
  status: "ready" | "held";
  planSignature: string;
  entries: Record<string, VisualSessionEntryV667>;
  eventCount: number;
  candidateOnly: true;
  hold: true;
  notAdmitted: true;
  scientificPayloadWriteback: false;
  humanVisualSignoff: false;
  copyrightApproval: false;
}

export interface VisualSessionProgressV667 {
  total: number;
  inspected: number;
  remaining: number;
  aImages: { total: number; inspected: number };
  betaDerived: { total: number; inspected: number };
  betaOfficialRaw: { total: number; inspected: number };
  sourceHolds: number;
  identityHolds: number;
  nextKey: string | null;
  complete: boolean;
  humanVisualSignoff: false;
  copyrightApproval: false;
}

export type VisualCycleDecisionV667 =
  | { accepted: true; state: VisualSessionV667 }
  | { accepted: false; state: VisualSessionV667; reason:
      "index-invalid" | "session-invalid" | "unknown-key"
      | "route-or-digest" | "bytes-or-dimensions"
      | "clock-order" | "catalog-drift" };

const SHA256 = /^[a-f0-9]{64}$/;
const MAX_CYCLES_PER_ITEM = 100;
const MAX_IMAGE_BYTES = 32 * 1024 * 1024;

function requestable(index: VisualReviewIndexV666):
  VisualReviewPlanV666[] {
  if (index.status !== "valid-candidate-hold"
    || index.issues.length > 0 || index.counts.aImages !== 12
    || index.counts.betaImages !== 19
    || index.counts.sourceHolds !== 5
    || index.counts.identityHolds !== 4
    || index.boundary.scientificPayloadWriteback !== false) return [];
  const plans = index.plans.filter((item) => item.requestAllowed);
  if (plans.length !== 31 || new Set(plans.map((item) => item.key)).size !== 31
    || plans.some((item) => !item.route
      || !SHA256.test(item.expectedSha256 ?? "")
      || item.rights !== "pending" || item.candidateOnly !== true
      || item.hold !== true || item.notAdmitted !== true
      || item.scientificPayloadWriteback !== false)) return [];
  return plans;
}

export function visualPlanSignatureV667(index: VisualReviewIndexV666): string {
  const plans = requestable(index);
  if (plans.length !== 31) return "held";
  return plans.map((item) => [item.key, item.kind,
    item.route, item.expectedSha256, item.expectedBytes,
    item.expectedWidth, item.expectedHeight].join("|")).join("\n");
}

export function createVisualSessionV667(
  index: VisualReviewIndexV666,
): VisualSessionV667 {
  const plans = requestable(index);
  const entries: Record<string, VisualSessionEntryV667> = {};
  for (const plan of plans) {
    entries[plan.key] = { key: plan.key, kind: plan.kind,
      completedCycles: 0, lastCycle: null };
  }
  return {
    schema: "mainline-a-r80-local-visual-session-v667",
    status: plans.length === 31 ? "ready" : "held",
    planSignature: visualPlanSignatureV667(index), entries,
    eventCount: 0, candidateOnly: true, hold: true,
    notAdmitted: true, scientificPayloadWriteback: false,
    humanVisualSignoff: false, copyrightApproval: false,
  };
}

function validTime(value: string): number | null {
  if (typeof value !== "string"
    || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) {
    return null;
  }
  const time = Date.parse(value);
  return Number.isFinite(time) && new Date(time).toISOString() === value
    ? time : null;
}

export function recordVisualCycleV667(
  state: VisualSessionV667,
  index: VisualReviewIndexV666,
  cycle: VisualCycleV667,
): VisualCycleDecisionV667 {
  const plans = requestable(index);
  if (plans.length !== 31) {
    return { accepted: false, state, reason: "index-invalid" };
  }
  if (state.schema !== "mainline-a-r80-local-visual-session-v667"
    || state.status !== "ready"
    || state.candidateOnly !== true || state.hold !== true
    || state.notAdmitted !== true
    || state.scientificPayloadWriteback !== false
    || state.humanVisualSignoff !== false
    || state.copyrightApproval !== false
    || !Number.isSafeInteger(state.eventCount)
    || state.eventCount < 0) {
    return { accepted: false, state, reason: "session-invalid" };
  }
  if (state.planSignature !== visualPlanSignatureV667(index)) {
    return { accepted: false, state, reason: "catalog-drift" };
  }
  const plan = plans.find((item) => item.key === cycle.key);
  const prior = state.entries[cycle.key];
  if (!plan || !prior || prior.kind !== plan.kind
    || !Number.isSafeInteger(prior.completedCycles)
    || prior.completedCycles >= MAX_CYCLES_PER_ITEM) {
    return { accepted: false, state, reason: "unknown-key" };
  }
  if (cycle.route !== plan.route || cycle.sha256 !== plan.expectedSha256
    || !SHA256.test(cycle.sha256)) {
    return { accepted: false, state, reason: "route-or-digest" };
  }
  if (!Number.isSafeInteger(cycle.bytes) || cycle.bytes <= 0
    || cycle.bytes > MAX_IMAGE_BYTES
    || !Number.isSafeInteger(cycle.width) || cycle.width <= 0
    || cycle.width > 32768
    || !Number.isSafeInteger(cycle.height) || cycle.height <= 0
    || cycle.height > 32768
    || (plan.expectedBytes !== null && cycle.bytes !== plan.expectedBytes)
    || (plan.expectedWidth !== null && cycle.width !== plan.expectedWidth)
    || (plan.expectedHeight !== null
      && cycle.height !== plan.expectedHeight)) {
    return { accepted: false, state, reason: "bytes-or-dimensions" };
  }
  const acquired = validTime(cycle.acquiredAt);
  const released = validTime(cycle.releasedAt);
  if (acquired === null || released === null
    || released < acquired || released - acquired > 60 * 60 * 1000) {
    return { accepted: false, state, reason: "clock-order" };
  }
  const nextEntry = { ...prior,
    completedCycles: prior.completedCycles + 1,
    lastCycle: { ...cycle } };
  return { accepted: true, state: { ...state,
    entries: { ...state.entries, [cycle.key]: nextEntry },
    eventCount: state.eventCount + 1 } };
}

export function visualSessionProgressV667(
  state: VisualSessionV667,
  index: VisualReviewIndexV666,
): VisualSessionProgressV667 {
  const plans = requestable(index);
  const valid = state.status === "ready"
    && state.planSignature === visualPlanSignatureV667(index)
    && state.candidateOnly === true && state.hold === true
    && state.notAdmitted === true
    && state.scientificPayloadWriteback === false
    && state.humanVisualSignoff === false
    && state.copyrightApproval === false;
  const safe = valid ? plans : [];
  const inspected = safe.filter((plan) =>
    state.entries[plan.key]?.completedCycles > 0);
  const segment = (kind: VisualReviewPlanV666["kind"]) => ({
    total: safe.filter((plan) => plan.kind === kind).length,
    inspected: inspected.filter((plan) => plan.kind === kind).length,
  });
  const next = safe.find((plan) =>
    !(state.entries[plan.key]?.completedCycles > 0)) ?? null;
  return { total: safe.length, inspected: inspected.length,
    remaining: safe.length - inspected.length,
    aImages: segment("a-local-image"),
    betaDerived: segment("beta-derived-preview"),
    betaOfficialRaw: segment("beta-official-raw"),
    sourceHolds: index.counts.sourceHolds,
    identityHolds: index.counts.identityHolds,
    nextKey: next?.key ?? null,
    complete: safe.length === 31 && inspected.length === 31,
    humanVisualSignoff: false, copyrightApproval: false };
}
