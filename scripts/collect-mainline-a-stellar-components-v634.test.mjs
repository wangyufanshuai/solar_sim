import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  SOURCE_PACK_PATH, README_URL, buildComponentPlans, canonicalSha256,
  validateRequestUrl, executeComponentPlan, classifyCaptureError,
  replayStellarComponents, verifyCaptureLedger, collectStellarComponents, sha256,
} from "./collect-mainline-a-stellar-components-v634.mjs";

const pack = () => JSON.parse(fs.readFileSync(SOURCE_PACK_PATH, "utf8"));
const plans = () => buildComponentPlans(pack(), { maxAttempts: 1 });
const plan = () => plans().records[0].plan;
const response = (body = "test fixture only", type = "text/tab-separated-values", status = 200) => new Response(body, { status, headers: { "content-type": type } });

test("plans come only from the current exact four source records and WDS hints", () => {
  const result = plans();
  assert.deepEqual(result.records.map((row) => row.wdsSystemId), ["12266-6306", "13252-1110", "10084+1158", "02318+8916"]);
  assert.deepEqual(result.records[3].sourceHintIdentifiers, ["WDS J02318+8916A", "WDS J02318+8916Aa,Ab"]);
  assert.equal(result.readme.plan.requestUrl, README_URL);
  assert.ok(result.records[2].plan.requestUrl.includes("10084%2B1158"));
  assert.equal(new Set(result.records.map((row) => row.plan.requestFingerprint)).size, 4);
});

test("a name or unbound WDS hint cannot create a catalogue query", () => {
  const input = pack();
  input.records[0].componentHints[1].identifier = "WDS J00000+0000A";
  assert.throws(() => buildComponentPlans(input), /hint is not bound/);
  input.records[0].componentHints = [];
  assert.throws(() => buildComponentPlans(input), /no recorded WDS hints/);
});

test("conflicting WDS system keys in one source cannot be silently merged", () => {
  const input = pack();
  const record = input.records[0];
  record.identifiers.push("WDS J00000+0000A");
  record.componentHints.push({ catalog: "WDS", identifier: "WDS J00000+0000A", evidence: "identifier-only", sourceUrl: "https://vizier.cds.unistra.fr/viz-bin/VizieR-S?WDS%20J00000%2B0000A" });
  assert.throws(() => buildComponentPlans(input), /conflicting WDS system hints/);
});

test("source hint URLs are checked against the actual identifier", () => {
  const input = pack();
  input.records[0].componentHints[1].sourceUrl = "https://vizier.cds.unistra.fr/viz-bin/VizieR-S?WDS%20J11111-1111A";
  assert.throws(() => buildComponentPlans(input), /hint link does not match/);
});

test("roster duplication and opened science boundaries block planning", () => {
  const duplicate = pack();
  duplicate.records[1] = duplicate.records[0];
  assert.throws(() => buildComponentPlans(duplicate), /roster differs/);
  const promoted = pack();
  promoted.records[0].scientificPayloadWriteback = true;
  assert.throws(() => buildComponentPlans(promoted), /source admission is open/);
});

test("timeouts and retry counts are bounded", () => {
  for (const timeoutMs of [0, 999, 60001, NaN]) assert.throws(() => buildComponentPlans(pack(), { timeoutMs }), /timeout outside/);
  for (const maxAttempts of [0, 4, 1.5]) assert.throws(() => buildComponentPlans(pack(), { maxAttempts }), /attempt count outside/);
});

test("exact endpoint policy rejects credentials, cross-host paths and broader queries", () => {
  const input = plan();
  for (const url of [
    input.requestUrl.replace("https:", "http:"),
    input.requestUrl.replace("https://", "https://user@"),
    input.requestUrl.replace("asu-tsv", "VizieR"),
    input.requestUrl + "&WDS=11111-1111",
    input.requestUrl.replace("12266-6306", "12266*"),
    input.requestUrl + "#fragment",
  ]) assert.throws(() => validateRequestUrl(url, "wds", "12266-6306"));
  assert.throws(() => validateRequestUrl(README_URL + "?x=1", "readme"), /unexpected ReadMe/);
});

test("injected HTTP transport cannot claim a real response capture", async () => {
  await assert.rejects(executeComponentPlan(plan(), { fetchImpl: async () => response() }), /requires testOnly/);
  const result = await executeComponentPlan(plan(), { testOnly: true, fetchImpl: async () => response() });
  assert.equal(result.evidenceClass, "fixture-replay");
  assert.equal(result.responseCaptured, 0);
  assert.equal(result.attempts[0].responseCaptured, 0);
  assert.equal(result.attempts[0].rawArtifact, null);
  assert.equal(result.raw.toString(), "test fixture only");
});

test("mock transport preserves exact bytes without decoding or text normalization", async () => {
  const bytes = Buffer.from([0xef, 0xbb, 0xbf, 65, 9, 66, 13, 10, 0xff]);
  const result = await executeComponentPlan(plan(), { testOnly: true, fetchImpl: async () => response(bytes) });
  assert.deepEqual(result.raw, bytes);
  assert.equal(result.attempts[0].responseBytes, bytes.length);
  assert.equal(result.responseCaptured, 0);
});

test("HTML success pages and empty bodies stay uncaptured", async () => {
  for (const [reply, category] of [[() => response("<html>Access denied</html>", "text/html"), "content-type"], [() => response(""), "invalid-response"]]) {
    const result = await executeComponentPlan(plan(), { testOnly: true, fetchImpl: async () => reply() });
    assert.equal(result.raw, null);
    assert.equal(result.attempts[0].errorCategory, category);
    assert.equal(result.attempts[0].responseBytes, null);
  }
});

test("HTTP errors preserve transport telemetry without raw artifacts", async () => {
  const result = await executeComponentPlan(plan(), { testOnly: true, fetchImpl: async () => response("failure", "text/plain", 503) });
  const entry = result.attempts[0];
  assert.equal(entry.httpStatus, 503);
  assert.equal(entry.contentType, "text/plain");
  assert.equal(entry.errorCategory, "http-status");
  assert.equal(entry.finalUrl, plan().requestUrl);
  assert.equal(entry.rawArtifact, null);
  assert.ok(Date.parse(entry.endedAt) >= Date.parse(entry.startedAt));
});

test("external redirects are recorded and stopped before the target is fetched", async () => {
  let requests = 0;
  const result = await executeComponentPlan(plan(), { testOnly: true, fetchImpl: async () => {
    requests += 1;
    return new Response(null, { status: 302, headers: { location: "https://example.invalid/fake.tsv" } });
  } });
  assert.equal(requests, 1);
  assert.equal(result.attempts[0].redirectChain[0].to, "https://example.invalid/fake.tsv");
  assert.equal(result.attempts[0].errorCategory, "redirect");
  assert.equal(result.raw, null);
});

test("redirects that keep the exact request identity retain their full chain", async () => {
  let requests = 0;
  const input = plan();
  const result = await executeComponentPlan(input, { testOnly: true, fetchImpl: async () => ++requests === 1
    ? new Response(null, { status: 302, headers: { location: input.requestUrl } }) : response() });
  assert.equal(result.attempts[0].redirectChain.length, 1);
  assert.equal(result.attempts[0].httpStatus, 200);
  assert.equal(result.responseCaptured, 0);
});

test("deadline covers a stalled request and records timeout without capture", async () => {
  const input = { ...plan(), timeoutMs: 10 };
  const result = await executeComponentPlan(input, { testOnly: true, fetchImpl: () => new Promise(() => {}) });
  assert.equal(result.attempts[0].timeout, true);
  assert.equal(result.attempts[0].errorCategory, "timeout");
  assert.equal(result.raw, null);
});

test("retry failures retain independent attempt timing and zero capture", async () => {
  const input = { ...plan(), maxAttempts: 2 };
  const result = await executeComponentPlan(input, { testOnly: true, fetchImpl: async () => { throw Object.assign(new Error("lookup failed"), { cause: { code: "ENOTFOUND" } }); } });
  assert.deepEqual(result.attempts.map((entry) => entry.retryCount), [0, 1]);
  assert.equal(result.attempts.every((entry) => entry.errorCategory === "dns" && entry.responseCaptured === 0), true);
  assert.equal(result.raw, null);
});

test("declared and streamed oversized data cannot become artifacts", async () => {
  const input = { ...plan(), maxResponseBytes: 8 };
  const declared = await executeComponentPlan(input, { testOnly: true, fetchImpl: async () => new Response("x", { headers: { "content-type": "text/tab-separated-values", "content-length": "9" } }) });
  const streamed = await executeComponentPlan(input, { testOnly: true, fetchImpl: async () => response("123456789") });
  assert.equal(declared.attempts[0].errorCategory, "invalid-response");
  assert.equal(streamed.attempts[0].errorCategory, "invalid-response");
  assert.equal(streamed.raw, null);
});

test("fingerprint tampering fails before networking and error classes are stable", async () => {
  await assert.rejects(executeComponentPlan({ ...plan(), requestFingerprint: "a".repeat(64) }, { testOnly: true, fetchImpl: async () => response() }), /fingerprint differs/);
  assert.equal(classifyCaptureError({ cause: { code: "CERT_HAS_EXPIRED" } }), "tls");
  assert.equal(classifyCaptureError({ cause: { code: "ECONNRESET" } }), "connection");
  assert.equal(canonicalSha256({ b: 2, a: 1 }), canonicalSha256({ a: 1, b: 2 }));
});

const capturedLedgerPath = "docs/release/v607/mainline-a-stellar-components-v634-20260927-056.json";
const capturedLedger = () => JSON.parse(fs.readFileSync(capturedLedgerPath, "utf8"));
function reseal(ledger) {
  const content = { ...ledger };
  delete content.ledgerDigest;
  ledger.ledgerDigest = canonicalSha256(content);
  return ledger;
}
const replay = (ledger, root = process.cwd()) => verifyCaptureLedger({ root, ledger, ledgerPath: capturedLedgerPath });

test("offline replay recomputes five real archived responses and keeps all gates closed", () => {
  const result = replayStellarComponents({ ledgerPath: capturedLedgerPath });
  assert.deepEqual(result.counts, { total: 4, responseCaptured: 4, failed: 0, readmeCaptured: 1 });
  assert.equal(result.records.every((record) => record.artifactVerified), true);
  assert.equal(result.boundary.scientificPayloadWriteback, false);
  assert.equal(result.boundary.componentConfirmed, false);
  assert.equal(result.semanticParsed, false);
  assert.equal(result.componentIdentityStatus, "unresolved");
});

test("fixture promotion is rejected even after a ledger digest is recomputed", () => {
  const fixture = capturedLedger();
  fixture.collector.fixture = true;
  assert.throws(() => replay(reseal(fixture)), /fixture collector rejected/);
  const fixtureRecord = capturedLedger();
  fixtureRecord.records[0].evidenceClass = "fixture-replay";
  assert.throws(() => replay(reseal(fixtureRecord)), /fixture evidence rejected/);
});

test("source candidate pack digest and exact query binding are both mandatory", () => {
  const changedPack = capturedLedger();
  changedPack.sourceCandidatePack.sha256 = "a".repeat(64);
  assert.throws(() => replay(reseal(changedPack)), /source pack digest differs/);
  const changedQuery = capturedLedger();
  changedQuery.records[0].plan.requestUrl = changedQuery.records[1].plan.requestUrl;
  assert.throws(() => replay(reseal(changedQuery)), /plan binding differs/);
});

test("source raw digest, source hint and star ordering cannot be changed", () => {
  for (const field of ["sourceRawPageSha256", "sourceQueryIdentifier", "sourceHintIdentifiers"]) {
    const ledger = capturedLedger();
    ledger.records[0][field] = field === "sourceHintIdentifiers" ? ["WDS J00000+0000A"] : "forged";
    assert.throws(() => replay(reseal(ledger)), /binding differs/);
  }
  const swapped = capturedLedger();
  [swapped.records[0], swapped.records[1]] = [swapped.records[1], swapped.records[0]];
  assert.throws(() => replay(reseal(swapped)), /binding differs/);
});

test("captured status requires a successful actual attempt, not just a top-level flag", () => {
  const ledger = capturedLedger();
  ledger.records[0].attempts = [];
  assert.throws(() => replay(reseal(ledger)), /attempt count invalid/);
  for (const patch of [{ httpStatus: 503 }, { errorCategory: "timeout", timeout: true }, { transport: "fixture-replay" }]) {
    const forged = capturedLedger();
    Object.assign(forged.records[0].attempts[0], patch);
    assert.throws(() => replay(reseal(forged)), /inconsistent|transport invalid/);
  }
});

test("response byte/hash links must match the record and original artifact", () => {
  const metadata = capturedLedger();
  metadata.records[0].attempts[0].responseBytes += 1;
  assert.throws(() => replay(reseal(metadata)), /artifact response metadata differs/);
  const linked = capturedLedger();
  linked.records[0].attempts[0].rawArtifact.sha256 = "a".repeat(64);
  assert.throws(() => replay(reseal(linked)), /artifact link differs/);
});

test("recomputed ledger digest cannot conceal an invalid body path or source type", () => {
  const escaped = capturedLedger();
  escaped.records[0].artifact.path = "../outside.tsv";
  escaped.records[0].attempts[0].rawArtifact.path = "../outside.tsv";
  assert.throws(() => replay(reseal(escaped)), /artifact path escapes run/);
  const html = capturedLedger();
  html.records[0].attempts[0].contentType = "text/html";
  assert.throws(() => replay(reseal(html)), /successful content type invalid/);
});

test("failed attempts cannot carry the original successful body", () => {
  const ledger = capturedLedger();
  Object.assign(ledger.records[0].attempts[0], { responseCaptured: 0, errorCategory: "timeout", timeout: true });
  assert.throws(() => replay(reseal(ledger)), /failed attempt claims bytes or artifact/);
});

test("timestamps, retry counts and redirect continuity remain checkable offline", () => {
  const retry = capturedLedger();
  retry.records[0].attempts[0].retryCount = 7;
  assert.throws(() => replay(reseal(retry)), /attempt sequence invalid/);
  const timing = capturedLedger();
  timing.records[0].attempts[0].endedAt = "2000-01-01T00:00:00.000Z";
  assert.throws(() => replay(reseal(timing)), /attempt timestamps invalid/);
  const redirect = capturedLedger();
  redirect.records[0].attempts[0].redirectChain.push({ from: "https://example.invalid/", to: redirect.records[0].plan.requestUrl, status: 302 });
  assert.throws(() => replay(reseal(redirect)), /redirect chain discontinuity/);
});

test("replay refuses counterfeit success counts, rights approval and component promotion", () => {
  const counts = capturedLedger();
  counts.counts.responseCaptured = 5;
  assert.throws(() => replay(reseal(counts)), /summary counts differ/);
  const promoted = capturedLedger();
  promoted.componentIdentityStatus = "confirmed";
  assert.throws(() => replay(reseal(promoted)), /semantic promotion rejected/);
  const boundary = capturedLedger();
  boundary.boundary.rightsApproved = true;
  assert.throws(() => replay(reseal(boundary)), /admission boundary changed/);
});

test("raw bytes are rehashed rather than accepted from a resealed ledger", () => {
  const ledger = capturedLedger();
  const root = fs.mkdtempSync(path.join(process.cwd(), "tmp", "v634-negative-raw-"));
  fs.writeFileSync(path.join(root, "TEST-ONLY.txt"), "Controlled negative replay; never production source evidence. Retained for audit.\n");
  const sourcePath = path.join(root, SOURCE_PACK_PATH);
  fs.mkdirSync(path.dirname(sourcePath), { recursive: true });
  fs.copyFileSync(SOURCE_PACK_PATH, sourcePath);
  for (const row of [ledger.readme, ...ledger.records]) {
    const target = path.join(root, row.artifact.path);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    const raw = fs.readFileSync(row.artifact.path);
    if (row.id === "acrux") raw[raw.length - 1] ^= 1;
    fs.writeFileSync(target, raw, { flag: "wx" });
  }
  assert.throws(() => replay(ledger, root), /artifact SHA-256 differs/);
});

test("existing run output cannot be replaced by another collection", async () => {
  const before = sha256(fs.readFileSync(capturedLedgerPath));
  await assert.rejects(collectStellarComponents({ runId: "20260927-056" }), /run ledger already exists/);
  assert.equal(sha256(fs.readFileSync(capturedLedgerPath)), before);
  await assert.rejects(collectStellarComponents({ runId: "../outside" }), /run-id must be/);
});
