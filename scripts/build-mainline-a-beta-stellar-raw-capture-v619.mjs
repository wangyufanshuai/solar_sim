import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

export const PACK_SCHEMA = "mainline-a-beta-stellar-raw-capture-v619";
export const INPUT_PATH = "app/data/mainlineABetaStellarFreshCaptureV618.generated.json";
export const OUTPUT_PATH = "app/data/mainlineABetaStellarRawCaptureV619.generated.json";
export const SERVICE_ENDPOINT = "https://simbad.cds.unistra.fr/simbad/sim-tap/sync";
export const ALLOWLIST = Object.freeze(["acrux", "spica", "regulus", "polaris"]);
export const TRANSPORTS = Object.freeze(["https-html", "astroquery-sim-script", "fixture-replay"]);
export const PARSE_STATUSES = Object.freeze(["pending", "raw-only", "structured", "blocked"]);
const SHA256 = /^[a-f0-9]{64}$/i;
const ISO_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;

export function fail(message) { throw new Error(`stellar raw capture v619: ${message}`); }
export function assert(condition, message) { if (!condition) fail(message); }
export function sha256(value) { return crypto.createHash("sha256").update(value).digest("hex"); }
export function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
}
export function canonicalSha(value) { return sha256(JSON.stringify(canonicalize(value))); }

function readJson(root, relativePath) {
  const file = path.join(root, relativePath);
  assert(fs.existsSync(file), `missing ${relativePath}`);
  try { return JSON.parse(fs.readFileSync(file, "utf8")); }
  catch (error) { fail(`${relativePath} invalid JSON: ${error.message}`); }
}

function validPastUtc(value) {
  const parsed = Date.parse(value ?? "");
  return typeof value === "string" && ISO_UTC.test(value) && Number.isFinite(parsed) && new Date(parsed).toISOString() === value && parsed <= Date.now();
}

export function readFreshPack(root = process.cwd()) {
  const pack = readJson(root, INPUT_PATH);
  assert(pack.schema === "mainline-a-beta-stellar-fresh-capture-v618", "fresh capture schema changed");
  assert(pack.counts?.total === 4 && pack.records?.length === 4, "fresh capture count changed");
  assert(pack.counts.responseCaptured === 0 && pack.counts.runtimeAdmitted === 0 && pack.counts.measurementAdmitted === 0, "fresh capture admission opened");
  assert(pack.boundary?.freshCaptureOnly === true && pack.boundary.runtimeWrites === false && pack.boundary.measurementWrites === false && pack.boundary.scientificPayloadWriteback === false, "fresh capture boundary opened");
  assert(pack.records.every((record, index) => record.request.id === ALLOWLIST[index] && record.state === "required" && record.response === null && record.patch === null), "fresh capture request pack changed");
  return pack;
}

export function capturePlanId(request) { return `mainline-a-v619-${request.id}-${request.requestId.slice(-12)}`; }

export function buildCapturePlan(request) {
  assert(ALLOWLIST.includes(request.id), `capture id not allowlisted: ${request.id}`);
  assert(request.serviceEndpoint === SERVICE_ENDPOINT, `${request.id} endpoint changed`);
  assert(request.sourceUrl.startsWith("https://simbad.cds.unistra.fr/"), `${request.id} source URL not SIMBAD HTTPS`);
  return Object.freeze({
    planId: capturePlanId(request),
    requestId: request.requestId,
    id: request.id,
    queryIdentifier: request.queryIdentifier,
    sourceUrl: request.sourceUrl,
    requestUrl: request.sourceUrl,
    serviceEndpoint: request.serviceEndpoint,
    method: request.method,
    timeoutMs: 20000,
    maxAttempts: 2,
    retryBackoffMs: [500, 1500],
    allowedTransports: TRANSPORTS,
    rawResponseRequired: true,
    structuredEvidenceRequired: true,
    expectedSnapshotRecordDigest: request.expectedSnapshotRecordDigest,
    expectedProjectionRecordDigest: request.expectedProjectionRecordDigest,
    scientificPayloadWriteback: false,
  });
}

export function emptyRawRecord(plan) {
  return { plan, state: "pending", transport: null, parseStatus: "pending", capturedAt: null, httpStatus: null, contentType: null, responseBytes: null, finalUrl: null, rawPageSha256: null, rawResponse: null, attempts: 0, errors: [], retryAfter: null, reviewer: null, decision: "hold", runtimeAdmission: "candidate-only", measurementAdmission: "not-admitted", scientificPayloadWriteback: false };
}

export function parseRawCaptureDocument(input) {
  const document = typeof input === "string" ? JSON.parse(input) : input;
  assert(document && typeof document === "object", "raw capture is not an object");
  assert(document.schema === "mainline-a-stellar-raw-capture-response-v619", "raw capture schema changed");
  assert(ALLOWLIST.includes(document.id), "raw capture id not allowlisted");
  assert(typeof document.planId === "string" && document.planId.length > 0, "raw capture plan id missing");
  assert(typeof document.queryIdentifier === "string" && document.queryIdentifier.trim().length > 0, "raw capture query missing");
  assert(typeof document.sourceUrl === "string" && document.sourceUrl.startsWith("https://simbad.cds.unistra.fr/"), "raw capture source URL unsafe");
  assert(typeof document.requestUrl === "string" && document.requestUrl === document.sourceUrl, "raw capture request URL mismatch");
  assert(typeof document.serviceEndpoint === "string" && document.serviceEndpoint === SERVICE_ENDPOINT, "raw capture service endpoint mismatch");
  assert(TRANSPORTS.includes(document.transport), "raw capture transport invalid");
  assert(PARSE_STATUSES.filter((value) => value !== "pending").includes(document.parseStatus), "raw capture parse status invalid");
  assert(validPastUtc(document.capturedAt), "raw capture timestamp invalid or future");
  assert(document.httpStatus === 200, "raw capture HTTP status invalid");
  assert(typeof document.contentType === "string" && /^(text\/html|text\/plain|text\/tab-separated-values|application\/json)(?:;|$)/i.test(document.contentType), "raw capture content type not allowed");
  assert(Number.isInteger(document.responseBytes) && document.responseBytes >= 0, "raw capture byte count invalid");
  assert(typeof document.finalUrl === "string" && document.finalUrl.startsWith("https://simbad.cds.unistra.fr/"), "raw capture final URL unsafe");
  assert(typeof document.rawResponse === "string" && document.rawResponse.length > 0, "raw capture bytes missing");
  assert(document.responseBytes === Buffer.byteLength(document.rawResponse, "utf8"), "raw capture byte count mismatch");
  assert(typeof document.rawPageSha256 === "string" && SHA256.test(document.rawPageSha256), "raw capture hash invalid");
  assert(document.rawPageSha256 === sha256(document.rawResponse), "raw capture hash mismatch");
  assert(Array.isArray(document.errors), "raw capture errors missing");
  assert(document.reviewer === null || typeof document.reviewer === "string", "raw capture reviewer invalid");
  assert(["hold", "rejected"].includes(document.decision), "raw capture decision opened");
  assert(document.runtimeAdmission === "candidate-only" && document.measurementAdmission === "not-admitted" && document.scientificPayloadWriteback === false, "raw capture admission opened");
  return Object.freeze({ ...document });
}

export function validateRawCaptureAgainstPlan(plan, capture) {
  const errors = [];
  if (plan.planId !== capture.planId) errors.push("plan-id-mismatch");
  if (plan.id !== capture.id) errors.push("identity-mismatch");
  if (plan.sourceUrl !== capture.sourceUrl) errors.push("source-url-mismatch");
  if (plan.requestUrl !== capture.requestUrl) errors.push("request-url-mismatch");
  if (plan.serviceEndpoint !== capture.serviceEndpoint) errors.push("service-endpoint-mismatch");
  if (plan.queryIdentifier !== capture.queryIdentifier) errors.push("query-mismatch");
  if (capture.transport === "fixture-replay" && capture.parseStatus === "structured") errors.push("fixture-structured-requires-review");
  if (capture.finalUrl && !capture.finalUrl.startsWith("https://simbad.cds.unistra.fr/")) errors.push("final-url-unsafe");
  return Object.freeze(errors);
}

export function sealRawCapture(plan, input) {
  const capture = parseRawCaptureDocument(input);
  const errors = validateRawCaptureAgainstPlan(plan, capture);
  assert(errors.length === 0, `raw capture rejected: ${errors.join(",")}`);
  return Object.freeze({ ...capture, planId: plan.planId, expectedSnapshotRecordDigest: plan.expectedSnapshotRecordDigest, expectedProjectionRecordDigest: plan.expectedProjectionRecordDigest });
}

export function buildPack(root = process.cwd()) {
  const freshPack = readFreshPack(root);
  const records = freshPack.records.map((record) => emptyRawRecord(buildCapturePlan(record.request)));
  return {
    schema: PACK_SCHEMA,
    generatedAt: freshPack.generatedAt,
    input: { path: INPUT_PATH, sourceSchema: freshPack.schema, sourceSnapshotSha256: freshPack.input.sourceSnapshotSha256 },
    service: { endpoint: SERVICE_ENDPOINT, transports: TRANSPORTS, rawOnlyAllowed: true, structuredReviewRequired: true },
    counts: { total: records.length, pending: records.length, captured: 0, rawOnly: 0, structured: 0, blocked: 0, runtimeAdmitted: 0, measurementAdmitted: 0 },
    boundary: { rawCaptureOnly: true, fixtureReplayAllowed: true, structuredAutoAdmission: false, runtimeWrites: false, measurementWrites: false, scientificPayloadWriteback: false, legalDecision: "not-granted" },
    records,
  };
}

export function validatePack(pack) {
  assert(pack.schema === PACK_SCHEMA, "raw capture pack schema changed");
  assert(pack.counts.total === 4 && pack.records.length === 4, "raw capture pack count changed");
  assert(pack.counts.pending === 4 && pack.counts.captured === 0 && pack.counts.rawOnly === 0 && pack.counts.structured === 0 && pack.counts.blocked === 0, "raw capture output is not pending-only");
  assert(pack.boundary.rawCaptureOnly && pack.boundary.fixtureReplayAllowed && pack.boundary.structuredAutoAdmission === false && pack.boundary.runtimeWrites === false && pack.boundary.measurementWrites === false && pack.boundary.scientificPayloadWriteback === false, "raw capture boundary changed");
  pack.records.forEach((record, index) => {
    assert(record.plan.id === ALLOWLIST[index], `raw capture order changed at ${index}`);
    assert(record.state === "pending" && record.transport === null && record.rawResponse === null && record.rawPageSha256 === null, `${record.plan.id} fake raw response appeared`);
    assert(record.runtimeAdmission === "candidate-only" && record.measurementAdmission === "not-admitted", `${record.plan.id} admission opened`);
  });
  return pack;
}

export function verifyPack(actual, expected) {
  assert(JSON.stringify(actual) === JSON.stringify(expected), "raw capture pack differs from sealed V618 intake");
  validatePack(actual);
  return { status: "verified", total: actual.counts.total, pending: actual.counts.pending, output: OUTPUT_PATH };
}

export function run({ root = process.cwd(), check = false } = {}) {
  const pack = buildPack(root);
  if (check) return verifyPack(readJson(root, OUTPUT_PATH), pack);
  fs.writeFileSync(path.join(root, OUTPUT_PATH), `${JSON.stringify(pack, null, 2)}\n`, "utf8");
  return { status: "generated", total: pack.counts.total, pending: pack.counts.pending, output: OUTPUT_PATH };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { console.log(JSON.stringify(run({ check: process.argv.includes("--check") }), null, 2)); }
  catch (error) { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; }
}
