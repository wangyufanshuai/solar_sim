import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

export const SCHEMA = "mainline-a-beta-stellar-roster-v641";
export const RECEIPT_SCHEMA = "mainline-a-b3-stellar-roster-audit-v641";
export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const PACK_PATH = "app/data/mainlineABetaStellarRosterV641.generated.json";
export const RECEIPT_PATH = "docs/release/v607/mainline-a-b3-stellar-roster-audit-v641.json";
export const SNAPSHOT_SHA256 = "be5e2956350d7d81f19e29d6f98529702b4cf018cd1c3b6d47b392be82db5061";
export const ALL_IDS = Object.freeze([
  "sirius-a", "canopus", "alpha-centauri-a", "alpha-centauri-b", "arcturus", "vega",
  "capella-a", "rigel", "procyon-a", "betelgeuse", "aldebaran", "antares", "achernar",
  "hadar", "altair", "acrux", "spica", "pollux", "fomalhaut", "deneb", "regulus", "polaris",
  "bellatrix", "alnilam",
]);
export const PENDING_IDS = Object.freeze(["acrux", "spica", "regulus", "polaris"]);
const SHA = /^[a-f0-9]{64}$/;
const REQUIRED_FIELDS = Object.freeze(["coordinates", "properMotion", "spectralType", "parallax", "distance", "component"]);

export function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  return value;
}

export function digest(value) {
  return crypto.createHash("sha256").update(JSON.stringify(canonical(value))).digest("hex");
}

export function bytesDigest(relativePath) {
  const absolute = path.resolve(ROOT, relativePath);
  if (!fs.existsSync(absolute)) return { exists: false, bytes: null, sha256: null };
  const bytes = fs.readFileSync(absolute);
  return { exists: true, bytes: bytes.byteLength, sha256: crypto.createHash("sha256").update(bytes).digest("hex") };
}

function isObject(value) { return Boolean(value) && typeof value === "object" && !Array.isArray(value); }
function nonEmpty(value) { return typeof value === "string" && value.trim().length > 0; }
function isHttps(value) { return typeof value === "string" && /^https:\/\//i.test(value); }
function unique(values) { return new Set(values).size === values.length; }
function exact(values, expected) { return values.length === expected.length && expected.every((value) => values.includes(value)); }
function issue(list, code, detail = null) { list.push(detail ? { code, detail } : { code }); }

export function validateRosterPack(pack) {
  const issues = [];
  if (!isObject(pack)) return [{ code: "pack-not-object" }];
  if (pack.schema !== SCHEMA) issue(issues, "schema-invalid");
  if (!nonEmpty(pack.generatedAt) || Number.isNaN(Date.parse(pack.generatedAt))) issue(issues, "generatedAt-invalid");
  const boundary = pack.boundary;
  const expectedBoundary = { candidateOnly: true, hold: true, notAdmitted: true, runtimeWrites: false, measurementWrites: false, scientificPayloadWriteback: false, snapshotMutation: false };
  for (const [key, value] of Object.entries(expectedBoundary)) if (!isObject(boundary) || boundary[key] !== value) issue(issues, `boundary:${key}`);
  if (!isObject(pack.source) || pack.source.snapshotSha256 !== SNAPSHOT_SHA256) issue(issues, "snapshot-binding-invalid");
  const records = Array.isArray(pack.records) ? pack.records : [];
  if (records.length !== 24) issue(issues, "record-count", String(records.length));
  const ids = records.map((row) => String(row?.id ?? ""));
  if (!unique(ids)) issue(issues, "duplicate-id");
  if (!exact(ids, ALL_IDS)) issue(issues, "roster-id-mismatch");
  const pending = records.filter((row) => row?.phase === "candidate-hold").map((row) => row.id);
  const runtime = records.filter((row) => row?.phase === "runtime-existing").map((row) => row.id);
  if (!exact(pending, PENDING_IDS)) issue(issues, "pending-id-mismatch");
  if (runtime.length !== 20) issue(issues, "runtime-count", String(runtime.length));
  if (pack.counts?.total !== records.length) issue(issues, "counts-total");
  if (pack.counts?.runtimeExisting !== runtime.length) issue(issues, "counts-runtime");
  if (pack.counts?.candidateHold !== pending.length) issue(issues, "counts-pending");
  for (const row of records) {
    validateRow(row, issues);
  }
  return issues;
}

function validateRow(row, issues) {
  const id = String(row?.id ?? "missing");
  const pending = PENDING_IDS.includes(id);
  if (!nonEmpty(row?.displayName)) issue(issues, "display-name", id);
  if (row?.phase !== (pending ? "candidate-hold" : "runtime-existing")) issue(issues, "phase", id);
  if (row?.sourceClass !== (pending ? "raw-structured-candidate" : "sealed-local-projection")) issue(issues, "source-class", id);
  if (row?.runtimeRoute !== (pending ? "candidate-review-only" : "existing-mainline-a-runtime")) issue(issues, "runtime-route", id);
  if (row?.decision !== (pending ? "hold" : "existing-reference")) issue(issues, "decision", id);
  if (row?.runtimeAdmission !== "candidate-only" || row?.measurementAdmission !== "not-admitted" || row?.scientificPayloadWriteback !== false) issue(issues, "admission-opened", id);
  if (row?.sourceSnapshotSha256 !== SNAPSHOT_SHA256 || !SHA.test(String(row?.fingerprint ?? ""))) issue(issues, "digest-binding", id);
  const unsigned = Object.fromEntries(Object.entries(row ?? {}).filter(([key]) => key !== "fingerprint"));
  if (digest(unsigned) !== row?.fingerprint) issue(issues, "fingerprint-mismatch", id);
  const refs = Array.isArray(row?.sourceRefs) ? row.sourceRefs : [];
  if (!refs.length || !unique(refs.map((ref) => ref?.id))) issue(issues, "source-refs", id);
  for (const ref of refs) {
    if (!nonEmpty(ref?.id) || !isHttps(ref?.url) || !["object-page", "catalogue", "raw-artifact", "render-anchor", "literature"].includes(ref?.role)) issue(issues, "source-ref-invalid", id);
    if (ref?.sha256 !== null && !SHA.test(String(ref?.sha256 ?? ""))) issue(issues, "source-ref-sha", id);
    if (ref?.role === "raw-artifact") {
      if (!nonEmpty(ref?.path)) issue(issues, "raw-path-missing", id);
      else {
        const actual = bytesDigest(ref.path);
        if (!actual.exists || actual.sha256 !== ref.sha256) issue(issues, "raw-sha-mismatch", `${id}:${ref.path}`);
      }
    }
    if (/synthetic|fixture|example\.com/i.test(`${ref?.url ?? ""} ${ref?.path ?? ""}`)) issue(issues, "synthetic-source", id);
  }
  const fields = Array.isArray(row?.fieldLedger) ? row.fieldLedger : [];
  const names = fields.map((entry) => entry?.field);
  if (!exact(names, REQUIRED_FIELDS) || !unique(names)) issue(issues, "field-ledger", id);
  const refIds = new Set(refs.map((ref) => ref?.id));
  for (const entry of fields) {
    if (!REQUIRED_FIELDS.includes(entry?.field)) issue(issues, "field-name", id);
    if (!Array.isArray(entry?.sourceRefIds) || entry.sourceRefIds.some((refId) => !refIds.has(refId))) issue(issues, "field-source-binding", `${id}:${entry?.field}`);
    if (entry?.state === "missing" && entry.value !== null) issue(issues, "missing-field-value", `${id}:${entry?.field}`);
    if (entry?.state === "observed" && entry?.confidence !== "explicit") issue(issues, "observed-confidence", `${id}:${entry?.field}`);
  }
  const component = row?.componentReview;
  if (!component || !["not-reviewed", "unresolved"].includes(component.status)) issue(issues, "component-state", id);
  if (pending && (component?.status !== "unresolved" || !Array.isArray(component.hints) || component.hints.length === 0)) issue(issues, "component-pending-boundary", id);
  if (!pending && component?.status === "unresolved") issue(issues, "runtime-component-unresolved", id);
  if (!pending && refs.some((ref) => ref?.role === "raw-artifact")) issue(issues, "runtime-raw-artifact", id);
  if (pending && !refs.some((ref) => ref?.role === "raw-artifact" && SHA.test(String(ref?.sha256 ?? "")))) issue(issues, "candidate-raw-artifact", id);
}

export function runNegativeProbes(pack) {
  const results = [];
  const cases = [
    ["duplicate-id", (copy) => { copy.records[1].id = copy.records[0].id; }],
    ["admission", (copy) => { const row = copy.records.find((entry) => entry.id === "polaris"); row.decision = "existing-reference"; row.runtimeRoute = "existing-mainline-a-runtime"; }],
    ["synthetic-source", (copy) => { const row = copy.records.find((entry) => entry.id === "polaris"); row.sourceRefs[0].url = "https://example.com/fixture.html"; }],
    ["fingerprint", (copy) => { copy.records.at(-1).fingerprint = "0".repeat(64); }],
    ["component-promotion", (copy) => { const row = copy.records.find((entry) => entry.id === "polaris"); row.componentReview.status = "not-reviewed"; }],
  ];
  for (const [name, mutate] of cases) {
    const copy = structuredClone(pack);
    mutate(copy);
    const issues = validateRosterPack(copy);
    results.push({ name, rejected: issues.length > 0, issueCount: issues.length, firstIssue: issues[0]?.code ?? null });
  }
  return results;
}

export function auditRosterPack(pack) {
  const issues = validateRosterPack(pack);
  const negative = runNegativeProbes(pack);
  const negativePassed = negative.filter((entry) => entry.rejected).length;
  const artifactRows = pack.records.flatMap((row) => row.sourceRefs.filter((ref) => ref.role === "raw-artifact").map((ref) => ({ id: row.id, path: ref.path, declaredSha256: ref.sha256, ...bytesDigest(ref.path) })));
  return {
    schema: RECEIPT_SCHEMA,
    generatedAt: new Date().toISOString(),
    input: { path: PACK_PATH, sha256: digest(pack) },
    status: issues.length === 0 && negativePassed === negative.length ? "verified-candidate-only" : "blocked",
    counts: {
      roster: Array.isArray(pack.records) ? pack.records.length : 0,
      runtimeExisting: pack.counts?.runtimeExisting ?? null,
      candidateHold: pack.counts?.candidateHold ?? null,
      sourceArtifactBacked: artifactRows.length,
      artifactRecomputed: artifactRows.filter((row) => row.exists && row.sha256 === row.declaredSha256).length,
      componentConfirmed: 0,
    },
    validation: { issueCount: issues.length, issues, negativeCases: negative, negativePassed },
    artifacts: artifactRows,
    gates: {
      betaRoster24: issues.some((entry) => ["record-count", "roster-id-mismatch"].includes(entry.code)) ? "blocked" : "verified",
      componentIdentity: "pending",
      rights: "pending",
      runtimeAdmission: "closed",
      scientificPayloadWriteback: "closed",
    },
    boundary: pack.boundary,
    claims: { scientificValidity: false, copyrightApproval: false, productionPerformance: false, realUserValidation: false },
  };
}

export function run({ check = false, write = true } = {}) {
  const pack = JSON.parse(fs.readFileSync(path.resolve(ROOT, PACK_PATH), "utf8"));
  const receipt = auditRosterPack(pack);
  if (write && !check) fs.writeFileSync(path.resolve(ROOT, RECEIPT_PATH), `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
  if (check && receipt.status !== "verified-candidate-only") throw new Error(`V641 audit blocked: ${receipt.validation.issues.map((entry) => entry.code).join(", ")}`);
  return receipt;
}

const self = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === self) {
  try {
    const receipt = run({ check: process.argv.includes("--check"), write: !process.argv.includes("--no-write") });
    console.log(JSON.stringify({ status: receipt.status, counts: receipt.counts, issueCount: receipt.validation.issueCount, negativePassed: receipt.validation.negativePassed }, null, 2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
