import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

export const PACK_SCHEMA = "mainline-a-beta-stellar-fresh-capture-v618";
export const INPUT_PATH = "app/data/mainlineABetaStellarSourceClosureV616.generated.json";
export const OUTPUT_PATH = "app/data/mainlineABetaStellarFreshCaptureV618.generated.json";
export const SERVICE_ENDPOINT = "https://simbad.cds.unistra.fr/simbad/sim-tap/sync";
export const SERVICE_LICENSE = "ODbL-1.0";
export const SERVICE_CITATION = "Wenger et al. 2000, A&AS, 143, 9";
export const CAPTURE_IDS = Object.freeze(["acrux", "spica", "regulus", "polaris"]);
export const CAPTURE_RESPONSE_SCHEMA = "mainline-a-stellar-capture-response-v618";
const SHA256_PATTERN = /^[a-f0-9]{64}$/i;
const ISO_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;

export function fail(message) { throw new Error(`stellar fresh capture v618: ${message}`); }
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

function stableJson(value) { return JSON.stringify(value); }

export function readClosurePack(root = process.cwd()) {
  const pack = readJson(root, INPUT_PATH);
  assert(pack.schema === "mainline-a-beta-stellar-source-closure-v616", "closure schema changed");
  assert(pack.counts?.total === 4 && pack.records?.length === 4, "closure count changed");
  assert(pack.boundary?.legalDecision === "not-granted" && pack.boundary.runtimeWrites === false && pack.boundary.measurementWrites === false && pack.boundary.scientificPayloadWriteback === false, "closure boundary opened");
  assert(pack.records.every((record) => CAPTURE_IDS.includes(record.id) && record.runtimeAdmission === "candidate-only" && record.measurementAdmission === "not-admitted"), "closure admission changed");
  return pack;
}

export function captureRequestId(record) {
  return `mainline-a-v618-${record.id}-${record.snapshotRecordDigest.slice(0, 12)}`;
}

export function buildRequest(record) {
  assert(CAPTURE_IDS.includes(record.id), `capture id not allowlisted: ${record.id}`);
  assert(record.sourcePageUrl.startsWith("https://"), `${record.id} source URL not HTTPS`);
  return Object.freeze({
    requestId: captureRequestId(record),
    id: record.id,
    queryIdentifier: record.queryIdentifier,
    sourceUrl: record.sourcePageUrl,
    serviceEndpoint: SERVICE_ENDPOINT,
    method: "GET",
    requestedAt: null,
    expectedSnapshotRecordDigest: record.snapshotRecordDigest,
    expectedProjectionRecordDigest: record.projectionRecordDigest,
    expectedResolutionClass: record.resolutionClass,
    responseRequired: true,
    scientificPayloadWriteback: false,
  });
}

export function parseCaptureDocument(input) {
  const document = typeof input === "string" ? JSON.parse(input) : input;
  assert(document && typeof document === "object", "capture response is not an object");
  assert(document.schema === CAPTURE_RESPONSE_SCHEMA, "capture response schema changed");
  assert(typeof document.id === "string" && CAPTURE_IDS.includes(document.id), "capture response id is not allowlisted");
  assert(typeof document.queryIdentifier === "string" && document.queryIdentifier.trim().length > 0, "capture query identifier missing");
  assert(/^https:\/\//i.test(document.sourceUrl ?? ""), "capture source URL not HTTPS");
  assert(typeof document.capturedAt === "string" && ISO_PATTERN.test(document.capturedAt), "capture timestamp invalid");
  const capturedTime = Date.parse(document.capturedAt);
  assert(Number.isFinite(capturedTime) && new Date(capturedTime).toISOString() === document.capturedAt, "capture timestamp invalid");
  assert(capturedTime <= Date.now(), "capture timestamp is in the future");
  assert(typeof document.responseSha256 === "string" && SHA256_PATTERN.test(document.responseSha256), "capture response digest invalid");
  assert(typeof document.recordDigest === "string" && SHA256_PATTERN.test(document.recordDigest), "capture record digest invalid");
  assert(typeof document.snapshotRecordDigest === "string" && SHA256_PATTERN.test(document.snapshotRecordDigest), "snapshot record digest invalid");
  assert(typeof document.projectionRecordDigest === "string" && SHA256_PATTERN.test(document.projectionRecordDigest), "projection record digest invalid");
  assert(typeof document.serviceLicense === "string" && document.serviceLicense === SERVICE_LICENSE, "capture service license missing");
  assert(typeof document.citation === "string" && document.citation.includes("Wenger"), "capture citation missing");
  assert(["confirmed", "ambiguous", "rejected"].includes(document.componentIdentityDecision), "component decision invalid");
  assert(document.parallaxMas === null || (Number.isFinite(document.parallaxMas) && document.parallaxMas > 0), "capture parallax invalid");
  assert(document.errorMas === null || (Number.isFinite(document.errorMas) && document.errorMas >= 0), "capture parallax error invalid");
  assert(document.bibcode === null || typeof document.bibcode === "string", "capture bibcode invalid");
  assert(document.componentSourceReference === null || (typeof document.componentSourceReference === "string" && document.componentSourceReference.startsWith("https://")), "component source reference invalid");
  return Object.freeze({ ...document });
}

export function validateCaptureAgainstRequest(request, capture) {
  const errors = [];
  if (request.id !== capture.id) errors.push("identity-mismatch");
  if (request.queryIdentifier !== capture.queryIdentifier) errors.push("query-mismatch");
  if (request.sourceUrl !== capture.sourceUrl) errors.push("source-url-mismatch");
  if (request.expectedResolutionClass !== capture.resolutionClass) errors.push("resolution-class-mismatch");
  if (request.expectedSnapshotRecordDigest !== capture.snapshotRecordDigest) errors.push("snapshot-record-digest-mismatch");
  if (request.expectedProjectionRecordDigest !== capture.projectionRecordDigest) errors.push("projection-record-digest-mismatch");
  if (capture.recordDigest !== canonicalSha({ id: capture.id, queryIdentifier: capture.queryIdentifier, resolutionClass: capture.resolutionClass, parallaxMas: capture.parallaxMas, errorMas: capture.errorMas, bibcode: capture.bibcode, componentIdentityDecision: capture.componentIdentityDecision })) errors.push("record-digest-mismatch");
  if (capture.responseSha256 !== sha256(capture.rawResponse ?? "")) errors.push("response-digest-mismatch");
  return Object.freeze(errors);
}

export function buildFreshCapturePatch(request, input) {
  const capture = parseCaptureDocument(input);
  const errors = validateCaptureAgainstRequest(request, capture);
  assert(errors.length === 0, `capture rejected: ${errors.join(",")}`);
  return Object.freeze({
    id: capture.id,
    requestId: request.requestId,
    sourcePageUrl: capture.sourceUrl,
    capturedAt: capture.capturedAt,
    captureSha256: capture.responseSha256,
    reviewer: null,
    decision: "hold",
    resolutionClass: capture.resolutionClass,
    sourceRecordDigest: capture.recordDigest,
    parallaxMas: capture.parallaxMas,
    errorMas: capture.errorMas,
    bibcode: capture.bibcode,
    componentIdentityDecision: capture.componentIdentityDecision,
    componentSourceReference: capture.componentSourceReference,
    expectedSnapshotRecordDigest: request.expectedSnapshotRecordDigest,
    expectedProjectionRecordDigest: request.expectedProjectionRecordDigest,
    serviceLicense: capture.serviceLicense,
    citation: capture.citation,
    runtimeAdmission: "candidate-only",
    measurementAdmission: "not-admitted",
    scientificPayloadWriteback: false,
  });
}

function emptyCapture(request) {
  return { request, state: "required", response: null, patch: null, reviewDecision: "hold", runtimeAdmission: "candidate-only", measurementAdmission: "not-admitted", scientificPayloadWriteback: false };
}

export function buildPack(root = process.cwd()) {
  const closure = readClosurePack(root);
  const records = closure.records.map((record) => emptyCapture(buildRequest(record)));
  return {
    schema: PACK_SCHEMA,
    generatedAt: closure.generatedAt,
    input: { path: INPUT_PATH, sourceSchema: closure.schema, sourceSnapshotSha256: closure.source.snapshotSha256 },
    service: { endpoint: SERVICE_ENDPOINT, license: SERVICE_LICENSE, citation: SERVICE_CITATION, responseSchema: CAPTURE_RESPONSE_SCHEMA },
    counts: { total: records.length, requestRequired: records.length, responseCaptured: 0, reviewPending: 0, cleared: 0, runtimeAdmitted: 0, measurementAdmitted: 0 },
    boundary: { freshCaptureOnly: true, runtimeWrites: false, measurementWrites: false, scientificPayloadWriteback: false, legalDecision: "not-granted" },
    records,
  };
}

export function validatePack(pack) {
  assert(pack.schema === PACK_SCHEMA, "capture pack schema changed");
  assert(pack.counts.total === CAPTURE_IDS.length && pack.records.length === CAPTURE_IDS.length, "capture pack count changed");
  assert(pack.counts.responseCaptured === 0 && pack.counts.cleared === 0 && pack.counts.runtimeAdmitted === 0 && pack.counts.measurementAdmitted === 0, "capture admission opened");
  assert(pack.boundary.freshCaptureOnly && pack.boundary.runtimeWrites === false && pack.boundary.measurementWrites === false && pack.boundary.scientificPayloadWriteback === false, "capture boundary changed");
  pack.records.forEach((record, index) => {
    assert(record.request.id === CAPTURE_IDS[index], `capture order changed at ${index}`);
    assert(record.state === "required" && record.response === null && record.patch === null, `${record.request.id} fake response appeared`);
    assert(record.request.serviceEndpoint.startsWith("https://"), `${record.request.id} endpoint not HTTPS`);
  });
  return pack;
}

export function verifyPack(actual, expected) {
  assert(stableJson(actual) === stableJson(expected), "fresh capture pack differs from sealed closure input");
  validatePack(actual);
  return { status: "verified", total: actual.counts.total, responseCaptured: actual.counts.responseCaptured, output: OUTPUT_PATH };
}

export function run({ root = process.cwd(), check = false } = {}) {
  const pack = buildPack(root);
  if (check) return verifyPack(readJson(root, OUTPUT_PATH), pack);
  fs.writeFileSync(path.join(root, OUTPUT_PATH), `${JSON.stringify(pack, null, 2)}\n`, "utf8");
  return { status: "generated", total: pack.counts.total, responseCaptured: pack.counts.responseCaptured, output: OUTPUT_PATH };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { console.log(JSON.stringify(run({ check: process.argv.includes("--check") }), null, 2)); }
  catch (error) { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; }
}
