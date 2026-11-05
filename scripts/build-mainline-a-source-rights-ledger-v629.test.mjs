import test from "node:test";
import assert from "node:assert/strict";
import {
  SCHEMA,
  canonicalize,
  digest,
  safeHttps,
  safeRelativePath,
  validDate,
  classifyAttempt,
  auditAttempts,
  auditStellarSourceRecord,
  auditNebulaSourceRecord,
  buildSourceRightsLedger,
  sourceRightsRowAction,
  summarizeSourceRightsLedger,
  validateSourceRightsReceipt,
  replaySourceRightsLedger,
  assertReceiptImmutableBaseline,
  inspectArtifactFile,
  classifyEvidenceClasses,
  makeHumanReviewQueue,
  receiptStatusLabel,
  formatLedgerReport,
  toCsv,
  isCandidateOnlyReceipt,
  pendingExternalSourceCount,
} from "./build-mainline-a-source-rights-ledger-v629.mjs";

const SHA = "a".repeat(64);
const SHA_B = "b".repeat(64);
const TIME_1 = "2026-09-22T00:00:00.000Z";
const TIME_2 = "2026-09-22T00:00:01.000Z";

function stellar(id = "acrux", override = {}) {
  return {
    id,
    schema: "mainline-a-beta-stellar-structured-candidate-v621",
    planId: "plan-v620",
    sourceArtifactPath: `docs/release/v607/raw-artifacts/${id}.html`,
    rawPageSha256: SHA,
    sourceLedger: {
      sourceUrl: `https://simbad.cds.unistra.fr/simbad/sim-basic?Ident=${id}`,
      capturedAt: TIME_2,
      rawPageSha256: SHA,
      citationStatus: "pending",
      rightsStatus: "odbl-attribution-required",
    },
    sourceRefs: [`https://simbad.cds.unistra.fr/simbad/sim-basic?Ident=${id}`, `docs/release/v607/raw-artifacts/${id}.html`],
    parseStatus: "parsed-candidate",
    queryTitle: id,
    objectType: "star",
    raDeg: 10,
    decDeg: 20,
    componentHints: [{ catalog: "WDS", identifier: "WDS 1234", sourceUrl: "https://vizier.cds.unistra.fr/viz-bin/VizieR-5?-source=WDS", evidence: "identifier-only" }],
    componentIdentityStatus: "unresolved",
    componentSourceReference: null,
    decision: "hold",
    runtimeAdmission: "candidate-only",
    measurementAdmission: "not-admitted",
    scientificPayloadWriteback: false,
    ...override,
  };
}

function attempt(override = {}) {
  return {
    attempt: 1,
    startedAt: TIME_1,
    endedAt: TIME_2,
    timeout: false,
    retryCount: 0,
    httpStatus: 200,
    contentType: "text/html; charset=utf-8",
    requestUrl: "https://simbad.cds.unistra.fr/simbad/sim-basic?Ident=acrux",
    finalUrl: "https://simbad.cds.unistra.fr/simbad/sim-basic?Ident=acrux",
    redirectChain: ["https://simbad.cds.unistra.fr/simbad/sim-basic?Ident=acrux"],
    errorClass: null,
    requestFingerprint: SHA,
    responseCaptured: 1,
    responseBytes: 100,
    rawArtifactPath: "docs/release/v607/raw-artifacts/acrux.html",
    rawArtifactSha256: SHA,
    ...override,
  };
}

function nebula(override = {}) {
  return {
    id: "orion-nebula",
    title: "orion-nebula",
    source: {
      url: "https://images-assets.nasa.gov/image/PIA00000/PIA00000~orig.jpg",
      sourcePageUrl: "https://www.nasa.gov/image/orion",
      credit: "NASA/JPL-Caltech",
      licenseUrl: "https://www.nasa.gov/nasa-brand-center/images-and-media/",
    },
    network: {
      responseCaptured: 1,
      attempts: [attempt({ contentType: "image/jpeg", rawArtifactPath: "docs/release/v607/nebula-image-artifacts/r68/orion.jpg", rawArtifactSha256: SHA_B, responseBytes: 120, requestUrl: "https://images-assets.nasa.gov/image/PIA00000/PIA00000~orig.jpg", finalUrl: "https://images-assets.nasa.gov/image/PIA00000/PIA00000~orig.jpg" })],
      artifact: { path: "docs/release/v607/nebula-image-artifacts/r68/orion.jpg", sha256: SHA_B, bytes: 120, width: 100, height: 80, format: "jpg", synthetic: false, fixture: false },
    },
    rights: { status: "pending", signoffStatus: "pending" },
    candidateOnly: true,
    runtimeAdmission: "candidate-only",
    measurementAdmission: "not-admitted",
    scientificPayloadWriteback: false,
    runtimeWrites: false,
    measurementWrites: false,
    ...override,
  };
}

test("canonicalize recursively sorts object keys", () => {
  assert.deepEqual(canonicalize({ z: 1, a: { y: 2, x: 1 } }), { a: { x: 1, y: 2 }, z: 1 });
  assert.equal(digest({ a: 1, b: 2 }), digest({ b: 2, a: 1 }));
});

test("URL and path guards reject insecure or traversal values", () => {
  assert.equal(safeHttps("https://www.nasa.gov/policy", new Set(["nasa.gov"])), true);
  assert.equal(safeHttps("http://www.nasa.gov/policy", new Set(["nasa.gov"])), false);
  assert.equal(safeHttps("https://nasa.gov/policy#fragment", new Set(["nasa.gov"])), false);
  assert.equal(safeRelativePath("docs/release/v607/raw/a.html"), true);
  assert.equal(safeRelativePath("docs/release/../secret"), false);
  assert.equal(validDate(TIME_1), true);
  assert.equal(validDate("2026-09-22"), false);
});

test("captured attempt validates complete telemetry", () => {
  const row = classifyAttempt(attempt(), "acrux");
  assert.equal(row.captured, true);
  assert.deepEqual(row.issues, []);
  const aggregate = auditAttempts({ id: "acrux", attemptLedger: [attempt()] });
  assert.equal(aggregate.captured, true);
  assert.equal(aggregate.attempts, 1);
});

test("failed attempt retains reason and no response artifact", () => {
  const row = classifyAttempt(attempt({ responseCaptured: 0, timeout: true, httpStatus: null, contentType: null, responseBytes: null, rawArtifactPath: null, rawArtifactSha256: null, errorClass: "timeout" }), "acrux");
  assert.equal(row.captured, false);
  assert.deepEqual(row.issues, []);
});

test("failed attempt carrying bytes is rejected", () => {
  const row = classifyAttempt(attempt({ responseCaptured: 0, timeout: true, httpStatus: null, contentType: null, errorClass: "timeout" }), "acrux");
  assert.ok(row.issues.includes("failed-attempt-artifact-present"));
});

test("stellar record preserves candidate-only and identifier-only hints", () => {
  const row = auditStellarSourceRecord(stellar(), { id: "acrux", attemptLedger: [attempt()] });
  assert.equal(row.kind, "stellar");
  assert.equal(row.boundary.scientificPayloadWriteback, false);
  assert.equal(row.componentHints, 1);
  assert.equal(row.citation, "pending");
  assert.ok(row.blockers.includes("citation-review-pending"));
});

test("stellar confirmation or source review is blocked", () => {
  const base = stellar();
  const row = auditStellarSourceRecord(stellar("acrux", { componentIdentityStatus: "confirmed", componentSourceReference: "https://vizier.cds.unistra.fr/x", sourceLedger: { ...base.sourceLedger, citationStatus: "reviewed" } }), { id: "acrux", attemptLedger: [attempt()] });
  assert.ok(row.blockers.includes("component-confirmation-opened"));
  assert.ok(row.blockers.includes("citation-status-opened"));
});

test("nebula pending rights can be captured without admission", () => {
  const row = auditNebulaSourceRecord(nebula());
  assert.equal(row.kind, "nebula");
  assert.equal(row.captured, true);
  assert.equal(row.rightsStatus, "pending");
  assert.equal(row.boundary.candidateOnly, true);
  assert.equal(row.boundary.scientificPayloadWriteback, false);
  assert.equal(row.blockers.includes("rights-status-invalid"), false);
});

test("nebula failed network keeps artifact absent", () => {
  const row = auditNebulaSourceRecord(nebula({ network: { responseCaptured: 0, attempts: [attempt({ responseCaptured: 0, timeout: true, httpStatus: null, contentType: null, responseBytes: null, rawArtifactPath: null, rawArtifactSha256: null, errorClass: "timeout" })], artifact: null } }));
  assert.equal(row.captured, false);
  assert.equal(row.blockers.some((blocker) => blocker.includes("source") || blocker.includes("attempt") || blocker.includes("artifact")), false);
});

test("rights signed without evidence remains blocked", () => {
  const row = auditNebulaSourceRecord(nebula({ rights: { status: "verified", signoffStatus: "signed", creditConfirmed: false } }));
  assert.ok(row.blockers.includes("rights-evidence-missing"));
  assert.ok(row.blockers.includes("rights-credit-unconfirmed"));
});

test("batch ledger has deterministic ordering and closed boundary", () => {
  const receipt = buildSourceRightsLedger({ stellarPack: { records: [stellar()] }, stellarAttempts: { records: [{ id: "acrux", attemptLedger: [attempt()] }] }, nebulaBatch: { records: [nebula()] }, generatedAt: TIME_2 });
  assert.equal(receipt.schema, SCHEMA);
  assert.equal(receipt.rows.length, 2);
  assert.equal(receipt.boundary.scientificPayloadWriteback, false);
  assert.equal(receipt.boundary.runtimeWrites, false);
  assert.equal(receipt.status, "blocked");
  assert.equal(receipt.closureDigest.length, 64);
  assert.equal(receipt.rows[0].kind, "nebula");
});

test("receipt validation and replay detect tampering", () => {
  const receipt = buildSourceRightsLedger({ stellarPack: { records: [stellar()] }, stellarAttempts: { records: [{ id: "acrux", attemptLedger: [attempt()] }] }, nebulaBatch: { records: [nebula()] }, generatedAt: TIME_2 });
  assert.equal(validateSourceRightsReceipt(receipt).valid, true);
  const replay = replaySourceRightsLedger(receipt);
  assert.equal(replay.valid, true);
  const tampered = { ...receipt, rows: [{ ...receipt.rows[0], blockers: ["forged"] }] };
  assert.equal(replaySourceRightsLedger(tampered).valid, false);
});

test("immutable baseline and human review queue remain explicit", () => {
  const receipt = buildSourceRightsLedger({ stellarPack: { records: [stellar()] }, stellarAttempts: { records: [{ id: "acrux", attemptLedger: [attempt()] }] }, nebulaBatch: { records: [nebula()] }, generatedAt: TIME_2 });
  assert.equal(assertReceiptImmutableBaseline(receipt, receipt.closureDigest).valid, true);
  assert.equal(assertReceiptImmutableBaseline(receipt, SHA_B).valid, false);
  assert.ok(makeHumanReviewQueue(receipt).length > 0);
  assert.equal(isCandidateOnlyReceipt(receipt), true);
  assert.ok(pendingExternalSourceCount(receipt) >= 1);
});

test("report adapters keep evidence classes separate", () => {
  const receipt = buildSourceRightsLedger({ stellarPack: { records: [stellar()] }, stellarAttempts: { records: [{ id: "acrux", attemptLedger: [attempt()] }] }, nebulaBatch: { records: [nebula()] }, generatedAt: TIME_2 });
  const summary = summarizeSourceRightsLedger(receipt);
  assert.equal(summary.allBoundaryClosed, true);
  assert.equal(receiptStatusLabel(receipt), "blocked · source or rights evidence incomplete");
  assert.match(formatLedgerReport(receipt), /scientificPayloadWriteback=false/);
  assert.match(toCsv(receipt), /kind/);
  const classes = classifyEvidenceClasses(receipt);
  assert.equal(classes.visual.present, false);
  assert.equal(classes.performance.present, false);
});

test("duplicate ids and opened writes fail closed", () => {
  const receipt = buildSourceRightsLedger({ stellarPack: { records: [stellar(), stellar("acrux", { id: "acrux" })] }, stellarAttempts: { records: [{ id: "acrux", attemptLedger: [attempt()] }] }, nebulaBatch: { records: [nebula({ scientificPayloadWriteback: true })] }, generatedAt: TIME_2 });
  assert.ok(receipt.errors.includes("acrux:duplicate-id"));
  assert.ok(receipt.errors.includes("orion-nebula:scientific-writeback-opened"));
  assert.equal(receipt.status, "blocked");
});

test("source row actions explain blocked external evidence", () => {
  assert.match(sourceRightsRowAction({ kind: "stellar", blockers: ["attempt-record-missing"], citation: "pending" }), /raw attempt ledger/);
  assert.match(sourceRightsRowAction({ kind: "nebula", captured: false, blockers: ["network-payload-pending"], rightsStatus: "pending" }), /失败 attempt ledger/);
});

test("artifact verifier fails closed when local artifact is absent", () => {
  const row = inspectArtifactFile(process.cwd(), { id: "x" }, "docs/release/v607/nebula-image-artifacts/r68/missing.jpg", SHA, 4);
  assert.equal(row.present, false);
  assert.ok(row.issues.includes("artifact-file-missing"));
});

function timeoutAttempt(override = {}) {
  return attempt({ responseCaptured: 0, timeout: true, httpStatus: null, contentType: null, responseBytes: null, rawArtifactPath: null, rawArtifactSha256: null, errorClass: "timeout", ...override });
}

function collectionHistory() {
  return [
    timeoutAttempt({ attempt: 1, retryCount: 0, runAttempt: 1, retryScope: "per-collection", collectionId: "first-collection" }),
    timeoutAttempt({ attempt: 2, retryCount: 1, runAttempt: 2, retryScope: "per-collection", collectionId: "first-collection" }),
    attempt({ attempt: 3, retryCount: 0, runAttempt: 1, retryScope: "per-collection", collectionId: "second-collection" }),
  ];
}

test("a fresh collection can capture after historical timeouts without a false retry error", () => {
  const attempts = collectionHistory();
  const before = JSON.stringify(attempts);
  assert.deepEqual(classifyAttempt(attempts[2]).issues, []);
  const result = auditAttempts({ responseCaptured: 1, attempts }, "jellyfish");
  assert.deepEqual(result.issues, []);
  assert.equal(result.captured, true);
  assert.equal(result.captures, 1);
  assert.equal(result.attempts, 3);
  assert.equal(result.timeouts, 2);
  assert.equal(result.retries, 1);
  assert.equal(JSON.stringify(attempts), before);
  assert.deepEqual(attempts.map((entry) => entry.responseCaptured), [0, 0, 1]);
});

test("per-collection retries require a valid local attempt and collection identity", () => {
  const valid = collectionHistory()[2];
  for (const runAttempt of [undefined, null, 0, -1, 1.5, "1", 4, Number.MAX_SAFE_INTEGER + 1]) {
    assert.ok(classifyAttempt({ ...valid, runAttempt }).issues.includes("run-attempt-number-invalid"), String(runAttempt));
  }
  for (const collectionId of [undefined, null, "", " ", 42, " padded ", "bad\nidentity"]) {
    assert.ok(classifyAttempt({ ...valid, collectionId }).issues.includes("collection-id-invalid"), String(collectionId));
  }
});

test("global numbering cannot be used to forge a local retry count", () => {
  const valid = collectionHistory()[2];
  for (const retryCount of [-1, 1, 2, 0.5, "0", undefined]) {
    assert.ok(classifyAttempt({ ...valid, retryCount }).issues.includes("retry-count-invalid"), String(retryCount));
  }
});

test("legacy records retain global retry semantics even with a misleading local counter", () => {
  for (const retryScope of [undefined, "legacy-unclassified"]) {
    const attempts = [
      timeoutAttempt({ attempt: 1, retryCount: 0, retryScope }),
      timeoutAttempt({ attempt: 2, retryCount: 1, retryScope }),
      attempt({ attempt: 3, retryCount: 2, retryScope, runAttempt: 1 }),
    ];
    assert.deepEqual(auditAttempts({ attempts }).issues, []);
    assert.ok(classifyAttempt({ ...attempts[2], retryCount: 0 }).issues.includes("retry-count-invalid"));
  }
  assert.ok(classifyAttempt(attempt({ retryScope: "unknown-mode" })).issues.includes("retry-scope-invalid"));
});

test("global attempt ordering rejects missing, duplicated and reordered entries", () => {
  const history = collectionHistory();
  const malformed = [
    history.slice(1),
    [history[0], { ...history[1], attempt: 1 }, history[2]],
    [history[1], history[0], history[2]],
    [history[0], { ...history[1], attempt: 4 }, history[2]],
  ];
  for (const attempts of malformed) {
    assert.ok(auditAttempts({ attempts }, "nebula").issues.includes("nebula:attempt-sequence-invalid"));
  }
});

test("each collection must begin at one and advance without skipped or reused local attempts", () => {
  for (const runAttempt of [1, 3]) {
    const attempts = collectionHistory();
    attempts[1] = { ...attempts[1], runAttempt, retryCount: runAttempt - 1 };
    assert.ok(auditAttempts({ attempts }, "nebula").issues.includes("nebula:collection-attempt-sequence-invalid"));
  }
  const startsLate = collectionHistory();
  startsLate[2] = { ...startsLate[2], runAttempt: 2, retryCount: 1 };
  assert.ok(auditAttempts({ attempts: startsLate }, "nebula").issues.includes("nebula:collection-attempt-sequence-invalid"));
  const reusedId = collectionHistory();
  reusedId[2] = { ...reusedId[2], collectionId: "first-collection" };
  assert.ok(auditAttempts({ attempts: reusedId }, "nebula").issues.includes("nebula:collection-attempt-sequence-invalid"));
});

test("new per-collection attempts can follow an unclassified legacy ledger", () => {
  const attempts = collectionHistory();
  attempts[0] = timeoutAttempt({ attempt: 1, retryCount: 0 });
  attempts[1] = timeoutAttempt({ attempt: 2, retryCount: 1, retryScope: "legacy-unclassified" });
  assert.deepEqual(auditAttempts({ attempts }).issues, []);
});

test("nebula source status blocks invalid transport counters while keeping rights pending", () => {
  const base = nebula();
  const bad = auditNebulaSourceRecord({ ...base, network: { ...base.network, attempts: [{ ...base.network.attempts[0], retryCount: 9 }] } });
  assert.equal(bad.status, "blocked");
  assert.equal(bad.captured, true);
  assert.ok(bad.blockers.includes("retry-count-invalid"));
  assert.ok(bad.blockers.includes("rights-review-pending"));
  assert.equal(bad.boundary.scientificPayloadWriteback, false);
});

test("valid collection retry transport stays pending rights without admission", () => {
  const base = nebula();
  const attempts = collectionHistory();
  attempts[2] = { ...base.network.attempts[0], attempt: 3, retryCount: 0, runAttempt: 1, retryScope: "per-collection", collectionId: "second-collection" };
  const row = auditNebulaSourceRecord({ ...base, network: { ...base.network, attempts } });
  assert.equal(row.status, "pending-rights");
  assert.equal(row.captured, true);
  assert.equal(row.rightsStatus, "pending");
  assert.equal(row.signoff, "pending");
  assert.deepEqual(row.blockers, ["rights-review-pending"]);
  assert.deepEqual(row.boundary, { candidateOnly: true, hold: true, notAdmitted: true, scientificPayloadWriteback: false });
});
