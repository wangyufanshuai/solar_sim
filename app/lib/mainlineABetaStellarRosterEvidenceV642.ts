export const MAINLINE_A_BETA_STELLAR_ROSTER_EVIDENCE_SCHEMA_V642 = "mainline-a-beta-stellar-roster-evidence-v642" as const;

export const MAINLINE_A_BETA_STELLAR_EVIDENCE_CLASSES_V642 = Object.freeze([
  "static",
  "http",
  "visual",
  "browser",
  "performance",
  "external-source",
] as const);

export type MainlineABetaStellarEvidenceClassV642 =
  (typeof MAINLINE_A_BETA_STELLAR_EVIDENCE_CLASSES_V642)[number];

export type MainlineABetaStellarEvidenceStateV642 =
  | "planned"
  | "observed"
  | "passed"
  | "blocked"
  | "not-run";

export type MainlineABetaStellarEvidenceRecordV642 = Readonly<{
  id: string;
  evidenceClass: MainlineABetaStellarEvidenceClassV642;
  title: string;
  required: boolean;
  state: MainlineABetaStellarEvidenceStateV642;
  buildId: string | null;
  startedAt: string | null;
  endedAt: string | null;
  source: string | null;
  httpStatus: number | null;
  contentType: string | null;
  finalUrl: string | null;
  redirectChain: readonly string[];
  bytes: number | null;
  sha256: string | null;
  observationFingerprint: string | null;
  details: readonly string[];
  claims: Readonly<{
    browserDrawObserved: boolean;
    visualAcceptance: boolean;
    productionPerformance: boolean;
    scientificValidity: boolean;
    rightsApproved: boolean;
  }>;
}>;

export type MainlineABetaStellarEvidenceBuildV642 = Readonly<{
  buildId: string | null;
  branch: string;
  head: string;
  distDir: string | null;
  sourceStableAtBuild: boolean;
}>;

export type MainlineABetaStellarEvidencePackV642 = Readonly<{
  schema: typeof MAINLINE_A_BETA_STELLAR_ROSTER_EVIDENCE_SCHEMA_V642;
  generatedAt: string;
  roster: Readonly<{
    path: string;
    sha256: string;
    total: number;
    runtimeExisting: number;
    candidateHold: number;
    componentConfirmed: number;
  }>;
  build: MainlineABetaStellarEvidenceBuildV642;
  records: readonly MainlineABetaStellarEvidenceRecordV642[];
  boundary: Readonly<{
    candidateOnly: true;
    hold: true;
    notAdmitted: true;
    runtimeWrites: false;
    measurementWrites: false;
    scientificPayloadWriteback: false;
    snapshotMutation: false;
  }>;
  claims: Readonly<{
    browserAcceptance: false;
    visualAcceptance: false;
    rendererDrawObserved: false;
    productionPerformance: false;
    scientificValidity: false;
    copyrightApproval: false;
    realUserValidation: false;
  }>;
  fingerprint: string;
}>;

export const MAINLINE_A_BETA_STELLAR_EVIDENCE_BOUNDARY_V642 = Object.freeze({
  candidateOnly: true,
  hold: true,
  notAdmitted: true,
  runtimeWrites: false,
  measurementWrites: false,
  scientificPayloadWriteback: false,
  snapshotMutation: false,
} as const);

export const MAINLINE_A_BETA_STELLAR_EVIDENCE_CLAIMS_V642 = Object.freeze({
  browserAcceptance: false,
  visualAcceptance: false,
  rendererDrawObserved: false,
  productionPerformance: false,
  scientificValidity: false,
  copyrightApproval: false,
  realUserValidation: false,
} as const);

export const MAINLINE_A_BETA_STELLAR_EVIDENCE_PLAN_V642 = Object.freeze([
  {
    id: "static-v641-roster",
    evidenceClass: "static",
    title: "V641 24-row roster and immutable fingerprint",
    required: true,
  },
  {
    id: "static-v641-negative",
    evidenceClass: "static",
    title: "V641 promotion, synthetic-source and tamper negatives",
    required: true,
  },
  {
    id: "http-home",
    evidenceClass: "http",
    title: "new build home response and runtime identity",
    required: true,
  },
  {
    id: "http-health",
    evidenceClass: "http",
    title: "new build health response and kernel boundary",
    required: true,
  },
  {
    id: "http-roster-panel",
    evidenceClass: "http",
    title: "V641 roster DOM marker delivered by the new build",
    required: true,
  },
  {
    id: "visual-desktop",
    evidenceClass: "visual",
    title: "desktop screenshot of the V641 evidence panel",
    required: true,
  },
  {
    id: "browser-desktop",
    evidenceClass: "browser",
    title: "desktop interaction and readable accessibility state",
    required: true,
  },
  {
    id: "browser-mobile",
    evidenceClass: "browser",
    title: "available mobile viewport interaction",
    required: false,
  },
  {
    id: "performance-long-run",
    evidenceClass: "performance",
    title: "long-run frame, memory and resource lifecycle observation",
    required: true,
  },
  {
    id: "external-stellar-identity",
    evidenceClass: "external-source",
    title: "four candidate component identities and source review",
    required: true,
  },
  {
    id: "external-nebula-rights",
    evidenceClass: "external-source",
    title: "nebula source and rights signatures",
    required: true,
  },
] as const);

const SHA256_V642 = /^[a-f0-9]{64}$/;
const GIT_HEAD_V642 = /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/;
const ISO_V642 = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;
const URL_V642 = /^(?:https:\/\/|http:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?\/)/;
const BRANCH_V642 = /^codex\/[a-z0-9][a-z0-9-]*$/;

type AnyRecordV642 = Record<string, unknown>;

function isRecordV642(value: unknown): value is AnyRecordV642 {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonEmptyV642(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function finiteOrNullV642(value: unknown): boolean {
  return value === null || (typeof value === "number" && Number.isFinite(value));
}

function immutableClaimSetV642(value: unknown): boolean {
  if (!isRecordV642(value)) return false;
  return Object.entries(MAINLINE_A_BETA_STELLAR_EVIDENCE_CLAIMS_V642).every(
    ([key, expected]) => value[key] === expected,
  );
}

function classIsV642(value: unknown): value is MainlineABetaStellarEvidenceClassV642 {
  return (MAINLINE_A_BETA_STELLAR_EVIDENCE_CLASSES_V642 as readonly unknown[]).includes(value);
}

function stateIsV642(value: unknown): value is MainlineABetaStellarEvidenceStateV642 {
  return ["planned", "observed", "passed", "blocked", "not-run"].includes(String(value));
}

export function canonicalEvidenceValueV642(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalEvidenceValueV642);
  if (!isRecordV642(value)) return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, canonicalEvidenceValueV642(value[key])]),
  );
}

export function evidenceFingerprintInputV642(pack: MainlineABetaStellarEvidencePackV642): unknown {
  const unsigned = Object.fromEntries(Object.entries(pack).filter(([key]) => key !== "fingerprint"));
  return canonicalEvidenceValueV642(unsigned);
}

export function evidenceRecordFingerprintInputV642(record: MainlineABetaStellarEvidenceRecordV642): unknown {
  return canonicalEvidenceValueV642(Object.fromEntries(Object.entries(record).filter(([key]) => key !== "observationFingerprint")));
}

function recordBoundaryV642(record: MainlineABetaStellarEvidenceRecordV642): string[] {
  const errors: string[] = [];
  if (record.claims.browserDrawObserved || record.claims.visualAcceptance || record.claims.productionPerformance) {
    errors.push(`${record.id}:unverified-claim`);
  }
  if (record.claims.scientificValidity || record.claims.rightsApproved) {
    errors.push(`${record.id}:external-claim`);
  }
  if (record.evidenceClass === "external-source" && record.state === "passed") {
    errors.push(`${record.id}:external-pass-forbidden`);
  }
  return errors;
}

export function validateMainlineABetaStellarRosterEvidenceV642(value: unknown): readonly string[] {
  const errors: string[] = [];
  if (!isRecordV642(value)) return ["pack-not-object"];
  if (value.schema !== MAINLINE_A_BETA_STELLAR_ROSTER_EVIDENCE_SCHEMA_V642) errors.push("schema-invalid");
  if (!nonEmptyV642(value.generatedAt) || !ISO_V642.test(String(value.generatedAt))) errors.push("generatedAt-invalid");
  if (!isRecordV642(value.roster)) errors.push("roster-missing");
  else {
    if (value.roster.path !== "app/data/mainlineABetaStellarRosterV641.generated.json") errors.push("roster:path");
    if (!SHA256_V642.test(String(value.roster.sha256 ?? ""))) errors.push("roster:sha256");
    for (const key of ["total", "runtimeExisting", "candidateHold", "componentConfirmed"]) {
      if (typeof value.roster[key] !== "number" || !Number.isInteger(value.roster[key])) errors.push(`roster:${key}`);
    }
    if (value.roster.total !== 24) errors.push("roster:total");
    if (value.roster.runtimeExisting !== 20) errors.push("roster:runtimeExisting");
    if (value.roster.candidateHold !== 4) errors.push("roster:candidateHold");
    if (value.roster.componentConfirmed !== 0) errors.push("roster:componentConfirmed");
  }
  if (!isRecordV642(value.build)) errors.push("build-missing");
  else {
    if (value.build.buildId !== null && !nonEmptyV642(value.build.buildId)) errors.push("build:buildId");
    if (!BRANCH_V642.test(String(value.build.branch ?? ""))) errors.push("build:branch");
    if (!GIT_HEAD_V642.test(String(value.build.head ?? ""))) errors.push("build:head");
    if (value.build.distDir !== null && !nonEmptyV642(value.build.distDir)) errors.push("build:distDir");
    if (value.build.sourceStableAtBuild !== true) errors.push("build:source-not-stable");
  }
  if (!isRecordV642(value.boundary)) errors.push("boundary-missing");
  else {
    for (const [key, expected] of Object.entries(MAINLINE_A_BETA_STELLAR_EVIDENCE_BOUNDARY_V642)) {
      if (value.boundary[key] !== expected) errors.push(`boundary:${key}`);
    }
  }
  if (!immutableClaimSetV642(value.claims)) errors.push("claims-not-closed");
  if (!SHA256_V642.test(String(value.fingerprint ?? ""))) errors.push("fingerprint-invalid");
  const records = Array.isArray(value.records) ? value.records : [];
  const expectedIds = MAINLINE_A_BETA_STELLAR_EVIDENCE_PLAN_V642.map((entry) => entry.id);
  if (records.length !== expectedIds.length) errors.push("record-count-invalid");
  const ids = records.map((record) => (isRecordV642(record) ? String(record.id) : ""));
  if (new Set(ids).size !== ids.length) errors.push("record-ids-duplicate");
  if (ids.some((id) => !expectedIds.includes(id as (typeof expectedIds)[number]))) errors.push("record-id-unknown");
  if (expectedIds.some((id) => !ids.includes(id))) errors.push("record-id-missing");
  for (const raw of records) {
    if (!isRecordV642(raw)) {
      errors.push("record-not-object");
      continue;
    }
    const id = String(raw.id);
    const plan = MAINLINE_A_BETA_STELLAR_EVIDENCE_PLAN_V642.find((entry) => entry.id === id);
    if (!plan) continue;
    if (!classIsV642(raw.evidenceClass) || raw.evidenceClass !== plan.evidenceClass) errors.push(`${id}:class`);
    if (raw.title !== plan.title) errors.push(`${id}:title`);
    if (raw.required !== plan.required) errors.push(`${id}:required`);
    if (!stateIsV642(raw.state)) errors.push(`${id}:state`);
    if (raw.buildId !== null && !nonEmptyV642(raw.buildId)) errors.push(`${id}:buildId`);
    if (raw.evidenceClass !== "external-source" && isRecordV642(value.build)) {
      if (value.build.buildId === null && raw.buildId !== null) errors.push(`${id}:buildId`);
      if (value.build.buildId !== null && raw.buildId !== value.build.buildId) errors.push(`${id}:buildId-mismatch`);
    }
    if (raw.startedAt !== null && !ISO_V642.test(String(raw.startedAt))) errors.push(`${id}:startedAt`);
    if (raw.endedAt !== null && !ISO_V642.test(String(raw.endedAt))) errors.push(`${id}:endedAt`);
    if (raw.startedAt !== null && raw.endedAt !== null && String(raw.endedAt) < String(raw.startedAt)) errors.push(`${id}:time-order`);
    if (raw.source !== null && (!nonEmptyV642(raw.source) || (raw.evidenceClass === "external-source" && !/^https:\/\//.test(raw.source)))) errors.push(`${id}:source`);
    if (!finiteOrNullV642(raw.httpStatus) || (typeof raw.httpStatus === "number" && (!Number.isInteger(raw.httpStatus) || raw.httpStatus < 100 || raw.httpStatus > 599))) errors.push(`${id}:httpStatus`);
    if (raw.contentType !== null && !nonEmptyV642(raw.contentType)) errors.push(`${id}:contentType`);
    if (raw.finalUrl !== null && (!nonEmptyV642(raw.finalUrl) || !URL_V642.test(raw.finalUrl))) errors.push(`${id}:finalUrl`);
    if (!Array.isArray(raw.redirectChain) || raw.redirectChain.some((url) => typeof url !== "string" || !URL_V642.test(url))) errors.push(`${id}:redirectChain`);
    if (!finiteOrNullV642(raw.bytes) || (typeof raw.bytes === "number" && (!Number.isInteger(raw.bytes) || raw.bytes < 0))) errors.push(`${id}:bytes`);
    if (raw.sha256 !== null && !SHA256_V642.test(String(raw.sha256))) errors.push(`${id}:sha256`);
    if (raw.observationFingerprint !== null && !SHA256_V642.test(String(raw.observationFingerprint))) errors.push(`${id}:observationFingerprint`);
    if (!Array.isArray(raw.details) || raw.details.some((detail) => typeof detail !== "string" || detail.trim().length === 0)) errors.push(`${id}:details`);
    if (!immutableClaimSetV642(raw.claims) && !isRecordV642(raw.claims)) errors.push(`${id}:claims`);
    if (isRecordV642(raw.claims)) {
      for (const key of ["browserDrawObserved", "visualAcceptance", "productionPerformance", "scientificValidity", "rightsApproved"]) {
        if (typeof raw.claims[key] !== "boolean") errors.push(`${id}:claims:${key}`);
      }
    }
    errors.push(...recordBoundaryV642(raw as MainlineABetaStellarEvidenceRecordV642));
  }
  return [...new Set(errors)];
}

export function assertMainlineABetaStellarRosterEvidenceV642(value: unknown): asserts value is MainlineABetaStellarEvidencePackV642 {
  const errors = validateMainlineABetaStellarRosterEvidenceV642(value);
  if (errors.length > 0) throw new Error(`Mainline A Beta stellar evidence V642 invalid: ${errors.join(", ")}`);
}

function emptyClaimsV642(): MainlineABetaStellarEvidenceRecordV642["claims"] {
  return {
    browserDrawObserved: false,
    visualAcceptance: false,
    productionPerformance: false,
    scientificValidity: false,
    rightsApproved: false,
  };
}

function plannedRecordV642(
  plan: (typeof MAINLINE_A_BETA_STELLAR_EVIDENCE_PLAN_V642)[number],
): MainlineABetaStellarEvidenceRecordV642 {
  return {
    id: plan.id,
    evidenceClass: plan.evidenceClass,
    title: plan.title,
    required: plan.required,
    state: plan.evidenceClass === "external-source" ? "blocked" : "planned",
    buildId: null,
    startedAt: null,
    endedAt: null,
    source: null,
    httpStatus: null,
    contentType: null,
    finalUrl: null,
    redirectChain: [],
    bytes: null,
    sha256: null,
    observationFingerprint: null,
    details: plan.evidenceClass === "external-source"
      ? ["external review is required; local evidence cannot promote this gate"]
      : ["observation not yet bound to a new V641 build"],
    claims: emptyClaimsV642(),
  };
}

export function createMainlineABetaStellarEvidencePlanV642(args: Readonly<{
  generatedAt: string;
  rosterSha256: string;
  build: MainlineABetaStellarEvidenceBuildV642;
}>): MainlineABetaStellarEvidencePackV642 {
  const records = MAINLINE_A_BETA_STELLAR_EVIDENCE_PLAN_V642.map(plannedRecordV642);
  const packWithoutFingerprint = {
    schema: MAINLINE_A_BETA_STELLAR_ROSTER_EVIDENCE_SCHEMA_V642,
    generatedAt: args.generatedAt,
    roster: {
      path: "app/data/mainlineABetaStellarRosterV641.generated.json",
      sha256: args.rosterSha256,
      total: 24,
      runtimeExisting: 20,
      candidateHold: 4,
      componentConfirmed: 0,
    },
    build: args.build,
    records,
    boundary: MAINLINE_A_BETA_STELLAR_EVIDENCE_BOUNDARY_V642,
    claims: MAINLINE_A_BETA_STELLAR_EVIDENCE_CLAIMS_V642,
  } as Omit<MainlineABetaStellarEvidencePackV642, "fingerprint">;
  return {
    ...packWithoutFingerprint,
    fingerprint: "pending-fingerprint-v642",
  } as MainlineABetaStellarEvidencePackV642;
}

export function withEvidenceFingerprintV642(
  pack: MainlineABetaStellarEvidencePackV642,
  fingerprint: string,
): MainlineABetaStellarEvidencePackV642 {
  if (!SHA256_V642.test(fingerprint)) throw new Error("V642 evidence fingerprint must be SHA-256");
  return { ...pack, fingerprint };
}

export function mergeEvidenceObservationV642(
  pack: MainlineABetaStellarEvidencePackV642,
  observation: MainlineABetaStellarEvidenceRecordV642,
): MainlineABetaStellarEvidencePackV642 {
  const existing = pack.records.find((record) => record.id === observation.id);
  if (!existing) throw new Error(`V642 evidence record is unknown: ${observation.id}`);
  if (observation.evidenceClass !== existing.evidenceClass) throw new Error(`${observation.id}: evidence class changed`);
  if (observation.evidenceClass !== "external-source" && pack.build.buildId !== null && observation.buildId !== pack.build.buildId) {
    throw new Error(`${observation.id}: build identity mismatch`);
  }
  if (observation.state === "passed" && observation.observationFingerprint === null) {
    throw new Error(`${observation.id}: passed observation requires a fingerprint`);
  }
  const records = pack.records.map((record) => record.id === observation.id ? observation : record);
  return { ...pack, records, fingerprint: "pending-fingerprint-v642" };
}

export function bindBuildToEvidencePlanV642(
  pack: MainlineABetaStellarEvidencePackV642,
  build: MainlineABetaStellarEvidenceBuildV642,
): MainlineABetaStellarEvidencePackV642 {
  if (!build.buildId || !build.distDir) throw new Error("V642 build binding requires buildId and distDir");
  if (!build.sourceStableAtBuild) throw new Error("V642 build binding requires stable source");
  return {
    ...pack,
    build,
    records: pack.records.map((record) => record.buildId === null && record.evidenceClass !== "external-source"
      ? { ...record, buildId: build.buildId, details: ["bound to new build; observation still pending", ...record.details] }
      : record),
    fingerprint: "pending-fingerprint-v642",
  };
}

export function evidenceClassLabelV642(evidenceClass: MainlineABetaStellarEvidenceClassV642): string {
  return {
    static: "静态",
    http: "HTTP",
    visual: "视觉",
    browser: "浏览器",
    performance: "性能",
    "external-source": "外部来源",
  }[evidenceClass];
}

export function evidenceStateLabelV642(state: MainlineABetaStellarEvidenceStateV642): string {
  return {
    planned: "待观测",
    observed: "已观测",
    passed: "通过",
    blocked: "阻塞",
    "not-run": "未运行",
  }[state];
}

export function evidenceStateToneV642(state: MainlineABetaStellarEvidenceStateV642): string {
  return {
    planned: "text-slate-400",
    observed: "text-cyan-200",
    passed: "text-emerald-200",
    blocked: "text-amber-100",
    "not-run": "text-slate-500",
  }[state];
}

export function evidenceSummaryV642(pack: MainlineABetaStellarEvidencePackV642) {
  const byClass = Object.fromEntries(
    MAINLINE_A_BETA_STELLAR_EVIDENCE_CLASSES_V642.map((evidenceClass) => {
      const records = pack.records.filter((record) => record.evidenceClass === evidenceClass);
      return [evidenceClass, {
        total: records.length,
        observed: records.filter((record) => record.state === "observed" || record.state === "passed").length,
        blocked: records.filter((record) => record.state === "blocked").length,
        notRun: records.filter((record) => record.state === "not-run").length,
        required: records.filter((record) => record.required).length,
      }];
    }),
  ) as Record<MainlineABetaStellarEvidenceClassV642, { total: number; observed: number; blocked: number; notRun: number; required: number }>;
  return {
    total: pack.records.length,
    required: pack.records.filter((record) => record.required).length,
    observed: pack.records.filter((record) => record.state === "observed" || record.state === "passed").length,
    pending: pack.records.filter((record) => record.state === "planned").length,
    blocked: pack.records.filter((record) => record.state === "blocked").length,
    notRun: pack.records.filter((record) => record.state === "not-run").length,
    buildBound: pack.build.buildId !== null,
    byClass,
    boundary: pack.boundary,
  } as const;
}

export function evidenceNegativeMutationV642(
  pack: MainlineABetaStellarEvidencePackV642,
  mutation: "wrong-build" | "visual-claim" | "external-pass" | "missing-record",
): unknown {
  if (mutation === "missing-record") return { ...pack, records: pack.records.slice(0, -1) };
  if (mutation === "wrong-build") {
    const first = pack.records[0];
    return { ...pack, records: [{ ...first, buildId: "wrong-build-id", state: "observed" }, ...pack.records.slice(1)] };
  }
  if (mutation === "visual-claim") {
    const first = pack.records.find((record) => record.evidenceClass === "visual") ?? pack.records[0];
    return { ...pack, records: pack.records.map((record) => record.id === first.id ? { ...record, claims: { ...record.claims, visualAcceptance: true } } : record) };
  }
  const external = pack.records.find((record) => record.evidenceClass === "external-source") ?? pack.records[0];
  return { ...pack, records: pack.records.map((record) => record.id === external.id ? { ...record, state: "passed" } : record) };
}
