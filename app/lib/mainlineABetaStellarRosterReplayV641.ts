import {
  MAINLINE_A_BETA_STELLAR_PENDING_IDS_V641,
  rosterFieldV641,
  type MainlineABetaStellarFieldLedgerV641,
  type MainlineABetaStellarFieldV641,
  type MainlineABetaStellarRosterPackV641,
  type MainlineABetaStellarRosterRowV641,
} from "./mainlineABetaStellarRosterV641";

export type MainlineABetaStellarReviewGateV641 = Readonly<{
  id: "roster" | "fields" | "component" | "rights" | "runtime" | "writeback";
  status: "observed" | "pending" | "closed";
  required: number;
  observed: number;
  blockers: readonly string[];
}>;

export type MainlineABetaStellarRowReplayV641 = Readonly<{
  id: string;
  phase: MainlineABetaStellarRosterRowV641["phase"];
  fieldStates: Readonly<Record<MainlineABetaStellarFieldV641, MainlineABetaStellarFieldLedgerV641["state"]>>;
  missingFields: readonly MainlineABetaStellarFieldV641[];
  candidateFields: readonly MainlineABetaStellarFieldV641[];
  sourceCount: number;
  hashedSourceCount: number;
  componentPending: boolean;
  admissionClosed: boolean;
  fingerprintPresent: boolean;
}>;

export type MainlineABetaStellarReplayV641 = Readonly<{
  schema: "mainline-a-beta-stellar-roster-replay-v641";
  total: number;
  rows: readonly MainlineABetaStellarRowReplayV641[];
  gates: readonly MainlineABetaStellarReviewGateV641[];
  runtimeReady: readonly string[];
  reviewQueue: readonly string[];
  writeback: false;
}>;

const FIELDS_V641: readonly MainlineABetaStellarFieldV641[] = [
  "coordinates",
  "properMotion",
  "spectralType",
  "parallax",
  "distance",
  "component",
];

function fieldStateMap(row: MainlineABetaStellarRosterRowV641): Readonly<Record<MainlineABetaStellarFieldV641, MainlineABetaStellarFieldLedgerV641["state"]>> {
  return Object.fromEntries(FIELDS_V641.map((field) => [field, rosterFieldV641(row, field)?.state ?? "missing"])) as Readonly<Record<MainlineABetaStellarFieldV641, MainlineABetaStellarFieldLedgerV641["state"]>>;
}

export function normalizeRosterFieldValueV641(entry: MainlineABetaStellarFieldLedgerV641 | null): string {
  if (!entry || entry.value === null || entry.value === "") return "∅";
  if (typeof entry.value === "number") return `${entry.value}:${entry.unit ?? ""}`;
  return entry.value.trim().replace(/\s+/g, " ");
}

export function compareRosterFieldsV641(left: MainlineABetaStellarFieldLedgerV641 | null, right: MainlineABetaStellarFieldLedgerV641 | null): "equal" | "different" | "unavailable" {
  if (!left || !right || left.value === null || right.value === null) return "unavailable";
  return normalizeRosterFieldValueV641(left) === normalizeRosterFieldValueV641(right) ? "equal" : "different";
}

export function rowReplayV641(row: MainlineABetaStellarRosterRowV641): MainlineABetaStellarRowReplayV641 {
  const fieldStates = fieldStateMap(row);
  const missingFields = FIELDS_V641.filter((field) => fieldStates[field] === "missing");
  const candidateFields = FIELDS_V641.filter((field) => fieldStates[field] === "candidate");
  const sourceCount = row.sourceRefs.length;
  const hashedSourceCount = row.sourceRefs.filter((source) => source.sha256 !== null).length;
  return {
    id: row.id,
    phase: row.phase,
    fieldStates,
    missingFields,
    candidateFields,
    sourceCount,
    hashedSourceCount,
    componentPending: row.componentReview.status === "unresolved" || row.componentReview.status === "not-reviewed",
    admissionClosed: row.runtimeAdmission === "candidate-only" && row.measurementAdmission === "not-admitted" && row.scientificPayloadWriteback === false,
    fingerprintPresent: /^[a-f0-9]{64}$/.test(row.fingerprint),
  };
}

function gate(
  id: MainlineABetaStellarReviewGateV641["id"],
  status: MainlineABetaStellarReviewGateV641["status"],
  required: number,
  observed: number,
  blockers: readonly string[],
): MainlineABetaStellarReviewGateV641 {
  return { id, status, required, observed, blockers: [...blockers] };
}

export function deriveRosterGatesV641(pack: MainlineABetaStellarRosterPackV641, rows: readonly MainlineABetaStellarRowReplayV641[] = pack.records.map(rowReplayV641)): readonly MainlineABetaStellarReviewGateV641[] {
  const pending = rows.filter((row) => row.phase === "candidate-hold");
  const missing = rows.filter((row) => row.missingFields.length > 0);
  const componentPending = rows.filter((row) => row.componentPending);
  const admissionClosed = rows.filter((row) => row.admissionClosed);
  return [
    gate("roster", pack.records.length === 24 ? "observed" : "pending", 24, pack.records.length, pack.records.length === 24 ? [] : ["beta-roster-not-24"]),
    gate("fields", missing.length === 0 ? "observed" : "pending", pack.records.length, pack.records.length - missing.length, missing.length === 0 ? [] : ["missing-field-values"]),
    gate("component", componentPending.length === 0 ? "observed" : "pending", pack.records.length, pack.records.length - componentPending.length, componentPending.length === 0 ? [] : ["component-identity-review-required"]),
    gate("rights", "pending", pack.records.length, 0, ["terms-or-rights-review-required"]),
    gate("runtime", pending.length === 0 ? "observed" : "pending", 0, pack.records.length - pending.length, pending.length === 0 ? [] : ["candidate-hold-present"]),
    gate("writeback", admissionClosed.length === pack.records.length ? "closed" : "pending", pack.records.length, admissionClosed.length, admissionClosed.length === pack.records.length ? [] : ["admission-boundary-invalid"]),
  ];
}

export function replayMainlineABetaStellarRosterV641(pack: MainlineABetaStellarRosterPackV641): MainlineABetaStellarReplayV641 {
  const rows = pack.records.map(rowReplayV641);
  const gates = deriveRosterGatesV641(pack, rows);
  const runtimeReady = rows.filter((row) => row.phase === "runtime-existing" && row.admissionClosed && row.fingerprintPresent).map((row) => row.id);
  const reviewQueue = rows.filter((row) => row.phase === "candidate-hold" || row.componentPending || row.missingFields.length > 0).map((row) => row.id);
  return {
    schema: "mainline-a-beta-stellar-roster-replay-v641",
    total: rows.length,
    rows,
    gates,
    runtimeReady,
    reviewQueue: [...new Set(reviewQueue)],
    writeback: false,
  };
}

export function rosterReplaySummaryV641(pack: MainlineABetaStellarRosterPackV641) {
  const replay = replayMainlineABetaStellarRosterV641(pack);
  return {
    total: replay.total,
    runtimeReady: replay.runtimeReady.length,
    reviewQueue: replay.reviewQueue.length,
    pendingIds: replay.reviewQueue.filter((id) => (MAINLINE_A_BETA_STELLAR_PENDING_IDS_V641 as readonly string[]).includes(id)),
    gates: replay.gates.map((gateEntry) => `${gateEntry.id}:${gateEntry.status}:${gateEntry.observed}/${gateEntry.required}`),
    scientificPayloadWriteback: replay.writeback,
  } as const;
}

export function replayFieldMatrixV641(pack: MainlineABetaStellarRosterPackV641) {
  return pack.records.map((row) => {
    const replay = rowReplayV641(row);
    return {
      id: row.id,
      phase: row.phase,
      fields: FIELDS_V641.map((field) => ({ field, state: replay.fieldStates[field], value: normalizeRosterFieldValueV641(rosterFieldV641(row, field)) })),
      sourceCoverage: `${replay.hashedSourceCount}/${replay.sourceCount}`,
      componentStatus: row.componentReview.status,
      admission: replay.admissionClosed ? "closed" : "open",
    };
  });
}

export function isRosterRowPromotionSafeV641(row: MainlineABetaStellarRosterRowV641): boolean {
  return row.phase === "runtime-existing"
    && row.decision === "existing-reference"
    && row.componentReview.status === "not-reviewed"
    && row.runtimeAdmission === "candidate-only"
    && row.measurementAdmission === "not-admitted"
    && row.scientificPayloadWriteback === false;
}

export function explainRosterRowV641(row: MainlineABetaStellarRosterRowV641): readonly string[] {
  const replay = rowReplayV641(row);
  const reasons: string[] = [];
  if (row.phase === "candidate-hold") reasons.push("候选行仍处于 hold");
  if (replay.missingFields.length) reasons.push(`缺少字段：${replay.missingFields.join("、")}`);
  if (replay.candidateFields.length) reasons.push(`候选字段：${replay.candidateFields.join("、")}`);
  if (row.componentReview.status !== "not-reviewed") reasons.push("组件身份未解决");
  else reasons.push("组件身份未在本批确认");
  if (row.rightsStatus !== "catalogue-terms-review") reasons.push("来源条款仍需复核");
  reasons.push("scientificPayloadWriteback=false");
  return reasons;
}
