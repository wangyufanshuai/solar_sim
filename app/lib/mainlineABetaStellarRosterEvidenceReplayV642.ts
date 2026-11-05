import {
  MAINLINE_A_BETA_STELLAR_EVIDENCE_CLASSES_V642,
  type MainlineABetaStellarEvidenceClassV642,
  type MainlineABetaStellarEvidencePackV642,
  type MainlineABetaStellarEvidenceRecordV642,
  type MainlineABetaStellarEvidenceStateV642,
  evidenceClassLabelV642,
  evidenceSummaryV642,
} from "./mainlineABetaStellarRosterEvidenceV642";

export type MainlineABetaStellarEvidenceGateV642 = Readonly<{
  evidenceClass: MainlineABetaStellarEvidenceClassV642;
  label: string;
  required: number;
  observed: number;
  blocked: number;
  notRun: number;
  status: "open" | "partial" | "closed" | "held";
  blockers: readonly string[];
}>;

export type MainlineABetaStellarEvidenceRowReplayV642 = Readonly<{
  id: string;
  evidenceClass: MainlineABetaStellarEvidenceClassV642;
  state: MainlineABetaStellarEvidenceStateV642;
  required: boolean;
  buildBound: boolean;
  observationBound: boolean;
  claimsClosed: boolean;
  safeToReport: boolean;
  reason: string;
}>;

export type MainlineABetaStellarEvidenceReplayV642 = Readonly<{
  schema: "mainline-a-beta-stellar-roster-evidence-replay-v642";
  total: number;
  required: number;
  observed: number;
  rows: readonly MainlineABetaStellarEvidenceRowReplayV642[];
  gates: readonly MainlineABetaStellarEvidenceGateV642[];
  openGateIds: readonly MainlineABetaStellarEvidenceClassV642[];
  buildBound: boolean;
  candidateBoundaryClosed: boolean;
  reportable: false;
}>;

const ALL_CLASSES_V642 = MAINLINE_A_BETA_STELLAR_EVIDENCE_CLASSES_V642;

function observationBoundV642(record: MainlineABetaStellarEvidenceRecordV642): boolean {
  return record.state === "observed" || record.state === "passed" || record.state === "blocked" || record.state === "not-run";
}

function buildBoundV642(pack: MainlineABetaStellarEvidencePackV642, record: MainlineABetaStellarEvidenceRecordV642): boolean {
  if (record.evidenceClass === "external-source") return true;
  return pack.build.buildId !== null && record.buildId === pack.build.buildId;
}

function claimsClosedV642(record: MainlineABetaStellarEvidenceRecordV642): boolean {
  return Object.values(record.claims).every((value) => value === false);
}

function rowReasonV642(
  pack: MainlineABetaStellarEvidencePackV642,
  record: MainlineABetaStellarEvidenceRecordV642,
): string {
  if (record.evidenceClass === "external-source") return "外部来源必须由真实来源与人工审查关闭";
  if (pack.build.buildId === null) return "尚未绑定新构建身份";
  if (record.buildId !== pack.build.buildId) return "记录与当前构建身份不一致";
  if (record.state === "planned") return "等待真实观测记录";
  if (record.state === "not-run") return "本环境未运行，不作通过解释";
  if (record.state === "blocked") return "观测已记录但门禁仍阻塞";
  if (record.state === "observed") return "已观测，尚未形成生产或人工验收结论";
  return "状态受 candidate-only 边界约束";
}

export function replayEvidenceRowV642(
  pack: MainlineABetaStellarEvidencePackV642,
  record: MainlineABetaStellarEvidenceRecordV642,
): MainlineABetaStellarEvidenceRowReplayV642 {
  const buildBound = buildBoundV642(pack, record);
  const observationBound = observationBoundV642(record);
  const claimsClosed = claimsClosedV642(record);
  const safeToReport = buildBound && observationBound && claimsClosed && record.state !== "planned";
  return {
    id: record.id,
    evidenceClass: record.evidenceClass,
    state: record.state,
    required: record.required,
    buildBound,
    observationBound,
    claimsClosed,
    safeToReport,
    reason: rowReasonV642(pack, record),
  };
}

function gateStatusV642(
  evidenceClass: MainlineABetaStellarEvidenceClassV642,
  required: number,
  observed: number,
  blocked: number,
  notRun: number,
): MainlineABetaStellarEvidenceGateV642["status"] {
  if (evidenceClass === "external-source") return "held";
  if (required === 0) return "closed";
  if (observed >= required && blocked === 0) return "closed";
  if (observed > 0 || blocked > 0 || notRun > 0) return "partial";
  return "open";
}

function gateBlockersV642(
  evidenceClass: MainlineABetaStellarEvidenceClassV642,
  records: readonly MainlineABetaStellarEvidenceRecordV642[],
): readonly string[] {
  const blockers: string[] = [];
  const required = records.filter((record) => record.required);
  if (evidenceClass === "external-source") blockers.push("external-source-review-required");
  if (required.some((record) => record.state === "planned")) blockers.push("planned-observation-present");
  if (required.some((record) => record.state === "blocked")) blockers.push("blocked-observation-present");
  if (required.some((record) => record.state === "not-run")) blockers.push("not-run-observation-present");
  if (required.some((record) => record.buildId === null && record.evidenceClass !== "external-source")) blockers.push("build-binding-missing");
  return [...new Set(blockers)];
}

export function deriveEvidenceGatesV642(
  pack: MainlineABetaStellarEvidencePackV642,
): readonly MainlineABetaStellarEvidenceGateV642[] {
  return ALL_CLASSES_V642.map((evidenceClass) => {
    const records = pack.records.filter((record) => record.evidenceClass === evidenceClass);
    const requiredRecords = records.filter((record) => record.required);
    const observed = requiredRecords.filter((record) => record.state === "observed" || record.state === "passed").length;
    const blocked = requiredRecords.filter((record) => record.state === "blocked").length;
    const notRun = requiredRecords.filter((record) => record.state === "not-run").length;
    return {
      evidenceClass,
      label: evidenceClassLabelV642(evidenceClass),
      required: requiredRecords.length,
      observed,
      blocked,
      notRun,
      status: gateStatusV642(evidenceClass, requiredRecords.length, observed, blocked, notRun),
      blockers: gateBlockersV642(evidenceClass, records),
    };
  });
}

export function replayMainlineABetaStellarRosterEvidenceV642(
  pack: MainlineABetaStellarEvidencePackV642,
): MainlineABetaStellarEvidenceReplayV642 {
  const rows = pack.records.map((record) => replayEvidenceRowV642(pack, record));
  const gates = deriveEvidenceGatesV642(pack);
  const openGateIds = gates.filter((gate) => gate.status !== "closed").map((gate) => gate.evidenceClass);
  const summary = evidenceSummaryV642(pack);
  return {
    schema: "mainline-a-beta-stellar-roster-evidence-replay-v642",
    total: summary.total,
    required: summary.required,
    observed: summary.observed,
    rows,
    gates,
    openGateIds,
    buildBound: summary.buildBound,
    candidateBoundaryClosed: pack.boundary.candidateOnly
      && pack.boundary.hold
      && pack.boundary.notAdmitted
      && !pack.boundary.runtimeWrites
      && !pack.boundary.measurementWrites
      && !pack.boundary.scientificPayloadWriteback,
    reportable: false,
  };
}

export function evidenceReplaySummaryV642(pack: MainlineABetaStellarEvidencePackV642) {
  const replay = replayMainlineABetaStellarRosterEvidenceV642(pack);
  const summary = evidenceSummaryV642(pack);
  return {
    total: replay.total,
    required: replay.required,
    observed: replay.observed,
    blocked: summary.blocked,
    pending: summary.pending,
    notRun: summary.notRun,
    buildBound: replay.buildBound,
    candidateBoundaryClosed: replay.candidateBoundaryClosed,
    openGateIds: replay.openGateIds,
    gateStates: replay.gates.map((gate) => `${gate.evidenceClass}:${gate.status}:${gate.observed}/${gate.required}`),
    reportable: replay.reportable,
  } as const;
}

export function evidenceClassRecordsV642(
  pack: MainlineABetaStellarEvidencePackV642,
  evidenceClass: MainlineABetaStellarEvidenceClassV642,
): readonly MainlineABetaStellarEvidenceRecordV642[] {
  return pack.records.filter((record) => record.evidenceClass === evidenceClass);
}

export function requiredRecordsV642(
  pack: MainlineABetaStellarEvidencePackV642,
): readonly MainlineABetaStellarEvidenceRecordV642[] {
  return pack.records.filter((record) => record.required);
}

export function pendingEvidenceRecordsV642(
  pack: MainlineABetaStellarEvidencePackV642,
): readonly MainlineABetaStellarEvidenceRecordV642[] {
  return pack.records.filter((record) => record.state === "planned" || record.state === "blocked" || record.state === "not-run");
}

export function canBindObservationV642(
  pack: MainlineABetaStellarEvidencePackV642,
  record: MainlineABetaStellarEvidenceRecordV642,
): boolean {
  if (record.evidenceClass === "external-source") return true;
  return pack.build.buildId !== null && record.buildId === pack.build.buildId && pack.build.sourceStableAtBuild;
}

export function reportBoundaryV642(pack: MainlineABetaStellarEvidencePackV642): readonly string[] {
  const replay = replayMainlineABetaStellarRosterEvidenceV642(pack);
  const reasons: string[] = [
    "candidate-only",
    "hold",
    "not-admitted",
    "scientificPayloadWriteback=false",
  ];
  if (!replay.buildBound) reasons.push("new-build-binding-pending");
  if (replay.openGateIds.length > 0) reasons.push(`open-evidence-gates:${replay.openGateIds.join(",")}`);
  reasons.push("evidence-does-not-prove-scientific-validity-or-copyright");
  return reasons;
}

export function classProgressV642(
  pack: MainlineABetaStellarEvidencePackV642,
  evidenceClass: MainlineABetaStellarEvidenceClassV642,
) {
  const gate = deriveEvidenceGatesV642(pack).find((entry) => entry.evidenceClass === evidenceClass);
  if (!gate) return { evidenceClass, label: evidenceClassLabelV642(evidenceClass), observed: 0, required: 0, status: "open" as const };
  return {
    evidenceClass,
    label: gate.label,
    observed: gate.observed,
    required: gate.required,
    status: gate.status,
    blockers: gate.blockers,
  } as const;
}

export function allRequiredObservedV642(pack: MainlineABetaStellarEvidencePackV642): boolean {
  return requiredRecordsV642(pack).every((record) => record.state === "observed" || record.state === "passed");
}

export function hasUnsafeClaimV642(pack: MainlineABetaStellarEvidencePackV642): boolean {
  return pack.records.some((record) => Object.values(record.claims).some(Boolean)) || Object.values(pack.claims).some(Boolean);
}

export function evidenceClassOrderV642(): readonly MainlineABetaStellarEvidenceClassV642[] {
  return ALL_CLASSES_V642;
}
