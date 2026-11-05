import type { CoverageKindV622 } from "./mainlineACanonicalCoverageV622";
import { evaluateMainlineAResourceObservationV633, type MainlineAResourceObservationV633 } from "./mainlineAResourceObservationV633";

export const CANONICAL_COVERAGE_SHA256_V635 = "1b710eda006fbdd1908b8c0cb070b546bdfd12d3fe96f9f315d3640f0a627377";
export type CanonicalRuntimeTargetV635 = {
  kind: CoverageKindV622; id: string; route: string; assetHash: string | null;
};
export type CanonicalRuntimeSelectionV635 = CanonicalRuntimeTargetV635 & {
  loading: "ready" | "loading" | "failed" | "unobserved";
  error: string | null;
};
export type CanonicalRuntimeSnapshotV635 = {
  selection: CanonicalRuntimeSelectionV635 | null;
  revision: number;
  publishedAt: string;
  cleanupErrors: string[];
};
export type CanonicalObjectCycleV635 = {
  mode: "canonical-object";
  target: CanonicalRuntimeTargetV635;
  manifestDigest: string;
};
type Row = Record<string, unknown>;
const SHA = /^[a-f0-9]{64}$/;
const KINDS: CoverageKindV622[] = ["star", "nebula", "constellation"];
const object = (value: unknown): value is Row => value !== null && typeof value === "object" && !Array.isArray(value);
const safeText = (value: unknown): value is string => typeof value === "string" && value.length > 0 && value.length <= 1024 && !/[\u0000-\u001f]/u.test(value);
const timestamp = (value: unknown): value is string => typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/u.test(value) && Number.isFinite(Date.parse(value));
const exact = (value: Row, fields: readonly string[]) => Object.keys(value).length === fields.length && fields.every((name) => Object.hasOwn(value, name));
const clone = <T>(value: T): T => structuredClone(value);

export function canonicalTargetKeyV635(target: Pick<CanonicalRuntimeTargetV635, "kind" | "id">): string {
  return `${target.kind}:${target.id}`;
}

export function validateCanonicalTargetV635(value: unknown): value is CanonicalRuntimeTargetV635 {
  return object(value) && KINDS.includes(value.kind as CoverageKindV622)
    && safeText(value.id) && /^[A-Za-z0-9][A-Za-z0-9-]*$/.test(value.id)
    && safeText(value.route) && !value.route.includes("..") && !value.route.includes("\\")
    && (value.assetHash === null || typeof value.assetHash === "string" && SHA.test(value.assetHash));
}

export function validateCanonicalSelectionV635(value: unknown): value is CanonicalRuntimeSelectionV635 {
  return object(value) && exact(value, ["kind", "id", "route", "assetHash", "loading", "error"])
    && typeof value.loading === "string" && ["ready", "loading", "failed", "unobserved"].includes(value.loading)
    && (value.error === null || safeText(value.error)) && validateCanonicalTargetV635(value);
}

export function canonicalSelectionReadyV635(value: CanonicalRuntimeSelectionV635 | null): boolean {
  return value !== null && validateCanonicalSelectionV635(value) && value.loading === "ready" && value.error === null;
}

export function sameCanonicalTargetV635(left: CanonicalRuntimeTargetV635 | null, right: CanonicalRuntimeTargetV635 | null): boolean {
  if (left === null || right === null) return left === right;
  return left.kind === right.kind && left.id === right.id && left.route === right.route && left.assetHash === right.assetHash;
}

export function createCanonicalRuntimeRegistryV635(clock: () => string = () => new Date().toISOString()) {
  let current: CanonicalRuntimeSnapshotV635 = { selection: null, revision: 0, publishedAt: new Date(0).toISOString(), cleanupErrors: [] };
  const subscribers = new Set<(snapshot: CanonicalRuntimeSnapshotV635) => void>();
  const read = (): CanonicalRuntimeSnapshotV635 => clone(current);
  const notify = (): void => {
    for (const listener of [...subscribers]) {
      try { listener(read()); }
      catch { /* An observer cannot prevent other observers from seeing runtime state. */ }
    }
  };
  const update = (selection: CanonicalRuntimeSelectionV635 | null, cleanupErrors: string[]): CanonicalRuntimeSnapshotV635 => {
    const at = clock();
    if (!timestamp(at)) throw new Error("canonical-publication-time-invalid");
    current = { selection: clone(selection), revision: current.revision + 1, publishedAt: at, cleanupErrors: [...cleanupErrors] };
    notify();
    return read();
  };
  return {
    read,
    publish(selection: CanonicalRuntimeSelectionV635 | null): CanonicalRuntimeSnapshotV635 {
      if (selection !== null && !validateCanonicalSelectionV635(selection)) throw new Error("canonical-selection-invalid");
      return update(selection, current.cleanupErrors);
    },
    reportCleanupFailure(message: string): void {
      if (!safeText(message)) throw new Error("canonical-cleanup-error-invalid");
      const errors = current.cleanupErrors.includes(message) ? current.cleanupErrors : [...current.cleanupErrors, message].slice(-128);
      update(current.selection, errors);
    },
    subscribe(listener: (snapshot: CanonicalRuntimeSnapshotV635) => void): () => void {
      subscribers.add(listener);
      return () => { subscribers.delete(listener); };
    },
  };
}

const registry = createCanonicalRuntimeRegistryV635();
export const publishCanonicalRuntimeSelectionV635 = registry.publish;
export const readCanonicalRuntimeSelectionV635 = registry.read;
export const reportCanonicalRuntimeCleanupFailureV635 = registry.reportCleanupFailure;
export const subscribeCanonicalRuntimeV635 = registry.subscribe;

export function validateCanonicalSnapshotV635(value: unknown, capturedAt?: unknown): string[] {
  if (!object(value) || !exact(value, ["selection", "revision", "publishedAt", "cleanupErrors"])) return ["canonical:snapshot-shape"];
  const issues: string[] = [];
  if (typeof value.revision !== "number" || !Number.isSafeInteger(value.revision) || value.revision <= 0) issues.push("canonical:runtime-unobserved");
  if (!timestamp(value.publishedAt) || capturedAt !== undefined && (!timestamp(capturedAt) || Date.parse(value.publishedAt) > Date.parse(capturedAt))) issues.push("canonical:publication-time-invalid");
  if (!Array.isArray(value.cleanupErrors) || value.cleanupErrors.some((entry) => !safeText(entry))) issues.push("canonical:cleanup-shape");
  else if (value.cleanupErrors.length > 0) issues.push("canonical:cleanup-failed");
  if (value.selection !== null) {
    if (!validateCanonicalSelectionV635(value.selection)) issues.push("canonical:selection-shape");
    else if (!canonicalSelectionReadyV635(value.selection)) issues.push("canonical:selection-not-ready");
  }
  return issues;
}

export function evaluateCanonicalObjectCycleV635(value: unknown, checkpoints: unknown): string[] {
  const issues: string[] = [];
  if (!object(value) || !exact(value, ["mode", "target", "manifestDigest"]) || value.mode !== "canonical-object"
    || !validateCanonicalTargetV635(value.target) || !exact(value.target, ["kind", "id", "route", "assetHash"])
    || typeof value.manifestDigest !== "string" || !SHA.test(value.manifestDigest)) return ["canonical:cycle-binding-invalid"];
  if (!Array.isArray(checkpoints) || checkpoints.length !== 3) return ["canonical:three-checkpoints-required"];
  const snapshots: CanonicalRuntimeSnapshotV635[] = [];
  for (const [index, checkpoint] of checkpoints.entries()) {
    if (!object(checkpoint)) { issues.push(`canonical:${index}:checkpoint-shape`); continue; }
    if (!timestamp(checkpoint.capturedAt)) issues.push(`canonical:checkpoint-time-invalid:${index}`);
    issues.push(...validateCanonicalSnapshotV635(checkpoint.canonical, checkpoint.capturedAt).map((issue) => `${issue}:${index}`));
    if (object(checkpoint.canonical)) snapshots.push(checkpoint.canonical as CanonicalRuntimeSnapshotV635);
  }
  if (issues.length || snapshots.length !== 3) return issues;
  const [baseline, active, returned] = snapshots;
  if (!sameCanonicalTargetV635(active.selection, value.target)) issues.push("canonical:active-target-mismatch");
  if (sameCanonicalTargetV635(baseline.selection, active.selection)) issues.push("canonical:object-transition-missing");
  if (!sameCanonicalTargetV635(baseline.selection, returned.selection)) issues.push("canonical:baseline-object-not-restored");
  if (active.revision <= baseline.revision || returned.revision <= active.revision) issues.push("canonical:publication-revisions-not-advanced");
  if (Date.parse(active.publishedAt) < Date.parse(baseline.publishedAt) || Date.parse(returned.publishedAt) < Date.parse(active.publishedAt)) issues.push("canonical:publication-order-invalid");
  if (Date.parse(active.publishedAt) <= Date.parse(checkpoints[0].capturedAt)
    || Date.parse(returned.publishedAt) < Date.parse(checkpoints[1].capturedAt)) issues.push("canonical:publication-not-fresh");
  return issues;
}

export type CanonicalReplayedObservationV635 = {
  rawSha256: string;
  observation: MainlineAResourceObservationV633;
  evidenceClass: "browser-export" | "fixture";
};
export type CanonicalCoverageEvaluationV635 = {
  status: "blocked" | "measured-local";
  issues: string[];
  counts: { expected: 36; observed: number; verified: number; stars: number; nebulae: number; constellations: number };
  rows: { key: string; runId: string; rawSha256: string; status: "blocked" | "measured-local"; issues: string[] }[];
  missing: string[];
  duplicates: string[];
  scientificPayloadWriteback: false;
  rightsApproval: false;
};

export function evaluateCanonicalRuntimeCoverageV635(args: unknown): CanonicalCoverageEvaluationV635 {
  const result: CanonicalCoverageEvaluationV635 = {
    status: "blocked", issues: [], counts: { expected: 36, observed: 0, verified: 0, stars: 0, nebulae: 0, constellations: 0 },
    rows: [], missing: [], duplicates: [], scientificPayloadWriteback: false, rightsApproval: false,
  };
  if (!object(args)) { result.issues.push("coverage:input-shape"); return result; }
  if (args.expectedManifestDigest !== CANONICAL_COVERAGE_SHA256_V635) result.issues.push("coverage:manifest-digest-unbound");
  const coverage = object(args.coverage) ? args.coverage : {};
  const records: unknown[] = Array.isArray(coverage.records) ? coverage.records : [];
  const observations: unknown[] = Array.isArray(args.observations) ? args.observations : [];
  const expectedBuild = object(args.expectedBuild) ? args.expectedBuild : {};
  if (!Array.isArray(args.observations)) result.issues.push("coverage:observations-shape");
  if (coverage.schema !== "mainline-a-canonical-coverage-v622" || records.length !== 36) result.issues.push("coverage:canonical-roster-required");
  if (!object(coverage.counts) || coverage.counts.total !== 36 || coverage.counts.stars !== 12 || coverage.counts.nebulae !== 12 || coverage.counts.constellations !== 12) result.issues.push("coverage:manifest-counts-invalid");
  if (!safeText(expectedBuild.buildId) || /^unknown/i.test(expectedBuild.buildId) || !safeText(expectedBuild.branch) || typeof expectedBuild.head !== "string" || !/^[a-f0-9]{40}$/.test(expectedBuild.head)) result.issues.push("coverage:expected-build-invalid");
  const expected = new Map<string, CanonicalRuntimeTargetV635>();
  for (const row of records) {
    const target = object(row) && object(row.route) ? { kind: row.kind, id: row.id, route: row.route.route, assetHash: row.route.assetHash } : null;
    if (!validateCanonicalTargetV635(target)) { result.issues.push("coverage:invalid-manifest-target"); continue; }
    const key = canonicalTargetKeyV635(target);
    if (expected.has(key)) result.issues.push(`coverage:duplicate-manifest:${key}`);
    expected.set(key, target);
    if (!object(row) || row.scientificPayloadWriteback !== false || row.runtimeAdmission !== "candidate-only" || row.measurementAdmission !== "not-admitted") result.issues.push(`coverage:manifest-boundary:${key}`);
  }
  for (const kind of KINDS) if (records.filter((row) => object(row) && row.kind === kind).length !== 12) result.issues.push(`coverage:expected-twelve:${kind}`);
  const seenTargets = new Set<string>();
  const seenRaw = new Set<string>();
  const seenRun = new Set<string>();
  for (const rawEntry of observations) {
    const entry = object(rawEntry) ? rawEntry : {};
    const observation = object(entry.observation) ? entry.observation : {};
    const cycle = object(observation.objectCycle) ? observation.objectCycle : null;
    const cycleTarget = cycle && validateCanonicalTargetV635(cycle.target) ? cycle.target : null;
    const key = cycleTarget ? canonicalTargetKeyV635(cycleTarget) : "unbound";
    const rawSha256 = typeof entry.rawSha256 === "string" ? entry.rawSha256 : "";
    const runId = typeof observation.runId === "string" ? observation.runId : "";
    const issues = [...evaluateMainlineAResourceObservationV633(observation).issues];
    if (!cycle || cycle.mode !== "canonical-object") issues.push("coverage:object-cycle-required");
    if (!SHA.test(rawSha256)) issues.push("coverage:raw-digest-invalid");
    if (entry.evidenceClass !== "browser-export") issues.push("coverage:fixture-not-runtime-evidence");
    if (seenRaw.has(rawSha256)) issues.push("coverage:duplicate-raw-artifact");
    if (seenRun.has(runId)) issues.push("coverage:duplicate-run-id");
    if (seenTargets.has(key)) { issues.push("coverage:duplicate-object-observation"); result.duplicates.push(key); }
    seenRaw.add(rawSha256);
    seenRun.add(runId);
    seenTargets.add(key);
    const target = expected.get(key);
    if (!target || !cycle || !cycleTarget) issues.push("coverage:unknown-object");
    else if (!sameCanonicalTargetV635(cycleTarget, target)) issues.push("coverage:target-route-or-hash-mismatch");
    if (cycle?.manifestDigest !== args.expectedManifestDigest) issues.push("coverage:observation-manifest-mismatch");
    if (!object(observation.build) || observation.build.buildId !== expectedBuild.buildId || observation.build.branch !== expectedBuild.branch || observation.build.head !== expectedBuild.head) issues.push("coverage:observation-build-mismatch");
    const uniqueIssues = [...new Set(issues)];
    const status = uniqueIssues.length === 0 ? "measured-local" : "blocked";
    result.rows.push({ key, runId, rawSha256, status, issues: uniqueIssues });
    if (status === "measured-local" && target) {
      result.counts.verified += 1;
      if (target.kind === "star") result.counts.stars += 1;
      else if (target.kind === "nebula") result.counts.nebulae += 1;
      else result.counts.constellations += 1;
    }
  }
  result.counts.observed = observations.length;
  result.missing = [...expected.keys()].filter((key) => !seenTargets.has(key));
  if (result.missing.length) result.issues.push("coverage:objects-not-observed");
  if (result.duplicates.length) result.issues.push("coverage:duplicate-observations");
  if (observations.length !== 36 || result.counts.verified !== 36) result.issues.push("coverage:thirty-six-verified-roundtrips-required");
  if (result.rows.some((row) => row.status === "blocked")) result.issues.push("coverage:blocked-roundtrips");
  if (result.issues.length === 0) result.status = "measured-local";
  return result;
}
