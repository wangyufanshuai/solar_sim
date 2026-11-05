import test from "node:test";
import assert from "node:assert/strict";
import {
  ALLOWLIST,
  buildLedger,
  classifyError,
  collectPlan,
  createAttempt,
  requestFingerprint,
  readResponseBodyWithTimeout,
  validateAttempt,
  validateLedger,
} from "./collect-mainline-a-stellar-raw-v620.mjs";

const plan = { planId: "mainline-a-v619-acrux-test", id: "acrux", requestId: "r", queryIdentifier: "* alf01 Cru", sourceUrl: "https://simbad.cds.unistra.fr/simbad/sim-id?Ident=x", requestUrl: "https://simbad.cds.unistra.fr/simbad/sim-id?Ident=x", serviceEndpoint: "https://simbad.cds.unistra.fr/simbad/sim-tap/sync", method: "GET", timeoutMs: 1000, maxAttempts: 2, retryBackoffMs: [0, 0], allowedTransports: ["https-html"], rawResponseRequired: true, structuredEvidenceRequired: true, expectedSnapshotRecordDigest: "a", expectedProjectionRecordDigest: "b", scientificPayloadWriteback: false };
const clock = class extends Date { static now() { return 0; } constructor() { super("2026-09-14T00:00:00.000Z"); } };

test("request fingerprint is deterministic and content bound", () => {
  assert.equal(requestFingerprint(plan), requestFingerprint({ ...plan }));
  assert.notEqual(requestFingerprint(plan), requestFingerprint({ ...plan, queryIdentifier: "* alf Vir" }));
});

test("failed HTTPS retries retain a closed artifact boundary", async () => {
  let calls = 0;
  const result = await collectPlan(plan, { clock, sleep: async () => {}, fetchImpl: async () => { calls += 1; throw Object.assign(new Error("offline"), { code: "ENOTFOUND" }); } });
  assert.equal(calls, 2);
  assert.equal(result.responseCaptured, 0);
  assert.equal(result.attempts.length, 2);
  assert.equal(result.attempts[1].retryCount, 1);
  assert.equal(result.attempts[0].errorCategory, "dns");
  assert.deepEqual(validateAttempt(result.attempts[0]), []);
});

test("successful HTTPS capture records status, content type, redirects and hash", async () => {
  const headers = new Headers({ "content-type": "text/html; charset=utf-8" });
  const result = await collectPlan(plan, { clock, sleep: async () => {}, fetchImpl: async () => ({ status: 200, headers, text: async () => "<html>simbad</html>" }) });
  assert.equal(result.responseCaptured, 1);
  assert.equal(result.attempts[0].httpStatus, 200);
  assert.equal(result.attempts[0].responseCaptured, 1);
  assert.equal(result.capture.body, "<html>simbad</html>");
  assert.match(result.capture.hash, /^[a-f0-9]{64}$/);
});

test("HTTP and content-type errors are classified and retried", async () => {
  let calls = 0;
  const result = await collectPlan(plan, { clock, sleep: async () => {}, fetchImpl: async () => { calls += 1; return { status: 503, headers: new Headers({ "content-type": "text/plain" }), text: async () => "busy" }; } });
  assert.equal(calls, 2);
  assert.equal(result.responseCaptured, 0);
  assert.equal(result.attempts.every((attempt) => attempt.errorCategory === "http-5xx"), true);
  assert.equal(classifyError(new Error("x"), { status: 503 }), "http-5xx");
});

test("ledger validation keeps all four stars candidate-only by shape", () => {
  const rows = ALLOWLIST.map((id) => ({ planId: `mainline-a-v619-${id}`, id, requestFingerprint: "a".repeat(64), responseCaptured: 0, attempts: [] }));
  const ledger = buildLedger(rows, "2026-09-14T00:00:00.000Z");
  assert.equal(validateLedger(ledger), true);
  assert.equal(ledger.counts.responseCaptured, 0);
  assert.equal(ledger.boundary.scientificPayloadWriteback, false);
});

test("attempt constructor sets retry and capture fields to safe defaults", () => {
  const attempt = createAttempt(plan, 2, "2026-09-14T00:00:00.000Z");
  assert.equal(attempt.retryCount, 1);
  assert.equal(attempt.responseCaptured, 0);
  assert.equal(attempt.rawArtifactPath, null);
  assert.equal(attempt.rawArtifactSha256, null);
});

test("rejects credentialed, non-HTTPS, and ported SIMBAD URLs", async () => {
  for (const requestUrl of ["http://simbad.cds.unistra.fr/x", "https://user:pass@simbad.cds.unistra.fr/x", "https://simbad.cds.unistra.fr:8443/x"]) {
    const result = await collectPlan({ ...plan, requestUrl }, { clock, sleep: async () => {}, fetchImpl: async () => ({ status: 200, headers: new Headers({ "content-type": "text/html" }), text: async () => "x" }) });
    assert.equal(result.responseCaptured, 0);
    assert.equal(result.attempts[0].errorCategory, "redirect");
  }
});

test("body timeout and response size limit fail closed", async () => {
  const hanging = { status: 200, headers: new Headers({ "content-type": "text/html" }), text: () => new Promise(() => {}) };
  const timed = await collectPlan({ ...plan, timeoutMs: 10 }, { clock, maxAttempts: 1, sleep: async () => {}, fetchImpl: async () => hanging });
  assert.equal(timed.responseCaptured, 0);
  assert.equal(timed.attempts[0].errorCategory, "timeout");
  const oversized = await collectPlan(plan, { clock, maxAttempts: 1, maxResponseBytes: 3, sleep: async () => {}, fetchImpl: async () => ({ status: 200, headers: new Headers({ "content-type": "text/plain" }), text: async () => "1234" }) });
  assert.equal(oversized.attempts[0].errorCategory, "invalid-response");
  await assert.rejects(() => readResponseBodyWithTimeout(hanging, 5, 100), /timeout/);
});

test("unsafe redirect preserves observed status and chain", async () => {
  const result = await collectPlan(plan, { clock, maxAttempts: 1, sleep: async () => {}, fetchImpl: async () => ({ status: 302, headers: new Headers({ location: "https://example.com/escape" }), text: async () => "" }) });
  assert.equal(result.responseCaptured, 0);
  assert.equal(result.attempts[0].errorCategory, "redirect");
  assert.equal(result.attempts[0].httpStatus, 302);
  assert.equal(result.attempts[0].redirectChain.length, 1);
});
