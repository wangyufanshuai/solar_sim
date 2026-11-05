import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import {
  ARTIFACT_ROOT,
  BATCH_ID,
  INPUT,
  OUTPUT,
  ROOT,
  sha256,
  validateBatch,
} from "./collect-mainline-a-nebula-batch-v628.mjs";

const require = createRequire(import.meta.url);
const sharp = require("sharp");
export const AUDIT_OUTPUT = "docs/release/v607/mainline-a-r66-nebula-batch-v628-audit-20260922.json";
const SHA = /^[a-f0-9]{64}$/i;

function inside(base, candidate) {
  const resolvedBase = path.resolve(base);
  const resolvedCandidate = path.resolve(candidate);
  return resolvedCandidate.startsWith(`${resolvedBase}${path.sep}`);
}

function issue(code, id = null, detail = null) {
  return Object.freeze({ code, candidateId: id, detail });
}

export function readBatch(root = ROOT, relative = OUTPUT) {
  return JSON.parse(fs.readFileSync(path.resolve(root, relative), "utf8"));
}

export function auditIdentity(batch, root = ROOT) {
  const findings = [];
  if (batch?.schema !== "mainline-a-nebula-batch-v628") findings.push(issue("schema-invalid"));
  if (batch?.batchId !== BATCH_ID) findings.push(issue("batch-id-invalid"));
  if (batch?.sourceIdentity?.inputs?.[0]?.path !== INPUT) findings.push(issue("input-path-invalid"));
  const inputAbsolute = path.resolve(root, INPUT);
  if (!fs.existsSync(inputAbsolute)) findings.push(issue("input-missing"));
  else if (batch?.sourceIdentity?.inputs?.[0]?.sha256 !== sha256(fs.readFileSync(inputAbsolute))) findings.push(issue("input-sha-mismatch"));
  return findings;
}

export async function auditArtifact(row, root = ROOT) {
  const findings = [];
  if (row.network.responseCaptured !== 1) {
    if (row.network.artifact !== null) findings.push(issue("artifact-without-response", row.id));
    return findings;
  }
  const artifact = row.network.artifact;
  const successful = row.network.attempts.find((attempt) => attempt.responseCaptured === 1 && attempt.rawArtifactPath === artifact?.path && attempt.rawPageSha256 === artifact?.sha256);
  if (!artifact || !successful) {
    findings.push(issue("capture-not-linked-to-attempt", row.id));
    return findings;
  }
  if (!SHA.test(String(artifact.sha256 ?? ""))) {
    findings.push(issue("artifact-sha-invalid", row.id));
    return findings;
  }
  const absolute = path.resolve(root, artifact.path ?? "");
  const base = path.resolve(root, ARTIFACT_ROOT);
  if (!inside(base, absolute)) {
    findings.push(issue("artifact-path-outside-root", row.id));
    return findings;
  }
  if (!fs.existsSync(absolute)) {
    findings.push(issue("artifact-file-missing", row.id));
    return findings;
  }
  const bytes = await fsp.readFile(absolute);
  const digest = createHash("sha256").update(bytes).digest("hex");
  if (digest !== artifact.sha256) findings.push(issue("artifact-sha-mismatch", row.id, `${digest} != ${artifact.sha256}`));
  if (artifact.bytes !== bytes.byteLength) findings.push(issue("artifact-byte-count-mismatch", row.id));
  try {
    const metadata = await sharp(bytes, { failOn: "error" }).metadata();
    if (metadata.width !== artifact.width || metadata.height !== artifact.height) findings.push(issue("artifact-dimensions-mismatch", row.id));
  } catch (error) {
    findings.push(issue("artifact-image-invalid", row.id, String(error?.message ?? error)));
  }
  return findings;
}

export function auditAttempts(row) {
  const findings = [];
  const attempts = row.network?.attempts ?? [];
  if (!attempts.length) findings.push(issue("attempt-ledger-missing", row.id));
  attempts.forEach((attempt, index) => {
    if (attempt.attempt !== index + 1) findings.push(issue("attempt-sequence-invalid", row.id));
    const start = Date.parse(attempt.startedAt);
    const end = Date.parse(attempt.endedAt);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) findings.push(issue("attempt-time-invalid", row.id));
    if (!SHA.test(String(attempt.requestFingerprint ?? ""))) findings.push(issue("request-fingerprint-invalid", row.id));
    if (attempt.responseCaptured === 0 && !attempt.errorClass && !attempt.timeout) findings.push(issue("failed-attempt-unclassified", row.id));
    if (attempt.responseCaptured === 1 && (attempt.httpStatus !== 200 || !attempt.contentType || !attempt.finalUrl || !attempt.rawPageSha256)) findings.push(issue("captured-attempt-telemetry-incomplete", row.id));
    if (attempt.responseCaptured === 0 && attempt.rawArtifactPath !== null) findings.push(issue("failed-attempt-artifact-link", row.id));
  });
  return findings;
}

export function auditPendingGates(batch) {
  const rows = batch.rows ?? [];
  const sourceVerified = rows.filter((row) => row.source?.sourcePageStatus === "verified").length;
  const rightsCleared = rows.filter((row) => row.rights?.status === "cleared" && row.rights?.signoffStatus === "cleared").length;
  const captured = rows.filter((row) => row.network?.responseCaptured === 1).length;
  return Object.freeze({
    sourcePage: { observed: sourceVerified, required: rows.length, status: sourceVerified === rows.length ? "pass" : "pending" },
    rawArtifact: { observed: captured, required: rows.length, status: captured === rows.length ? "pass" : "pending" },
    rightsSignoff: { observed: rightsCleared, required: rows.length, status: rightsCleared === rows.length ? "pass" : "pending" },
    candidateBoundary: { observed: batch.boundary?.candidateOnly && batch.boundary?.hold && batch.boundary?.notAdmitted ? 1 : 0, required: 1, status: batch.boundary?.candidateOnly && batch.boundary?.hold && batch.boundary?.notAdmitted ? "pass" : "blocked" },
  });
}

export async function auditBatch(batch, root = ROOT) {
  const findings = [...auditIdentity(batch, root), ...validateBatch(batch) .map((code) => issue(`validator:${code}`))];
  for (const row of batch.rows ?? []) {
    findings.push(...auditAttempts(row));
    findings.push(...await auditArtifact(row, root));
    if (row.runtimeAdmission !== "candidate-only" || row.measurementAdmission !== "not-admitted" || row.scientificPayloadWriteback !== false) findings.push(issue("candidate-boundary-open", row.id));
    if (row.source?.sourcePageStatus !== "pending") findings.push(issue("source-page-promoted", row.id));
    if (row.rights?.status !== "pending" || row.rights?.signoffStatus !== "pending") findings.push(issue("rights-promoted", row.id));
  }
  const gates = auditPendingGates(batch);
  const hardFindings = findings.filter((finding) => !["source-page-promoted", "rights-promoted"].includes(finding.code));
  return Object.freeze({
    schema: "mainline-a-nebula-batch-audit-v628",
    batchId: batch.batchId,
    status: hardFindings.length ? "blocked" : Object.values(gates).some((gate) => gate.status === "pending") ? "pending-gates" : "passed",
    source: { path: INPUT, sha256: batch.sourceIdentity?.inputs?.[0]?.sha256 ?? null },
    counts: { rows: batch.rows?.length ?? 0, captured: batch.rows?.filter((row) => row.network.responseCaptured === 1).length ?? 0, attempts: batch.rows?.reduce((sum, row) => sum + row.network.attempts.length, 0) ?? 0, findings: findings.length, hardFindings: hardFindings.length },
    gates,
    findings,
    boundary: { candidateOnly: batch.boundary?.candidateOnly === true, hold: batch.boundary?.hold === true, notAdmitted: batch.boundary?.notAdmitted === true, scientificPayloadWriteback: batch.boundary?.scientificPayloadWriteback ?? null },
    evidenceClass: "collector-ledger-and-artifact-integrity-audit-not-rights-approval",
  });
}

export async function run({ root = ROOT, input = OUTPUT, output = AUDIT_OUTPUT, check = false } = {}) {
  const batch = readBatch(root, input);
  const report = await auditBatch(batch, root);
  if (!check) {
    await fsp.mkdir(path.dirname(path.resolve(root, output)), { recursive: true });
    await fsp.writeFile(path.resolve(root, output), `${JSON.stringify({ ...report, generatedAt: new Date().toISOString(), batchSha256: sha256(fs.readFileSync(path.resolve(root, input))) }, null, 2)}\n`, "utf8");
  }
  return { ...report, output };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run({ check: process.argv.includes("--check") }).then((report) => { console.log(JSON.stringify(report, null, 2)); if (report.status === "blocked") process.exitCode = 1; }).catch((error) => { console.error(error.stack ?? error.message); process.exitCode = 1; });
}
