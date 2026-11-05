import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import {
  ANCHOR_TARGETS, CLOSED_BOUNDARY, EVIDENCE_DIRECTORY, SUPPLEMENT_PATH,
  buildSupplement, captureAttempt, classifyTransportError, coordinatesFromRow,
  decodeCatalogue, deriveParserCandidates, matchAnchor, parseBayerName,
  parseCatalogue, parseReadMe, readCaptureInputs, renderSupplementModule,
  requestFingerprint, safeOfficialUrl, sha256, validateCaptureBundle,
  validateDerivationReceipt, validateSupplement, verifyExisting,
} from "./collect-mainline-a-constellation-anchors-v638.mjs";

// All mutations below are in-memory fixture-only negative controls. Tests never call an external host,
// write scientific payloads, persist fixtures, or assert real-user/scientific/copyright acceptance.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const retained = readCaptureInputs(root);
const source = (id) => retained.capture.attempts.find((attempt) => attempt.artifactId === id && attempt.responseCaptured === 1);
const readMeBytes = retained.artifactBytes.get(source("readme").artifact.path);
const gzipBytes = retained.artifactBytes.get(source("catalog").artifact.path);
const schema = parseReadMe(readMeBytes);
const catalogueBytes = decodeCatalogue(gzipBytes);
const rows = parseCatalogue(catalogueBytes, schema);
const expected = buildSupplement(retained.capture, retained.ledgerBytes, retained.artifactBytes);
const epsilon = ANCHOR_TARGETS.find((target) => target.id === "epsilon1_lyr");
const clone = (value) => structuredClone(value);

function fixtureRecordWithField(row, label, text, activeSchema = schema) {
  const field = activeSchema.fields[label];
  assert.equal(text.length, field.end - field.start + 1, "fixture must preserve declared field width");
  const raw = row.raw.slice(0, field.start - 1) + text + row.raw.slice(field.end);
  return { ...row, raw,
    rawName: label === "Name" ? text : row.rawName,
    ads: label === "ADS" ? text.trim() : row.ads,
    adsComponent: label === "ADScomp" ? text.trim() : row.adsComponent,
  };
}

function fixtureCaptureWithChange(change) {
  const capture = clone(retained.capture);
  const artifacts = new Map(retained.artifactBytes);
  change(capture, artifacts);
  const ledgerBytes = Buffer.from(`${capture.attempts.map((attempt) => JSON.stringify(attempt)).join("\n")}\n`);
  capture.attemptLedger.bytes = ledgerBytes.length;
  capture.attemptLedger.sha256 = sha256(ledgerBytes);
  return { capture, artifacts, ledgerBytes };
}

function expectCaptureRejected(change, pattern) {
  const fixture = fixtureCaptureWithChange(change);
  assert.throws(() => validateCaptureBundle(fixture.capture, fixture.ledgerBytes, fixture.artifacts), pattern);
}

test("offline real-artifact replay reconstructs exactly 14 candidate-only anchors without a new network request", () => {
  const report = verifyExisting(root);
  assert.equal(report.status, "verified-candidate-only");
  assert.equal(report.records, 14);
  assert.equal(report.catalogueRecords, 9110);
  assert.equal(report.ambiguousNamesRetained, 1);
  assert.equal(report.scientificPayloadWriteback, false);
  assert.equal(report.independentNetworkAuthenticationClaimed, false);
  assert.equal(report.rawCatalogueSha256, "3dc44b1e90be8fbe5bcc7656032560f51275f985c7e3f783c9028e1838ec7bed");
  assert.deepEqual(expected.boundary, CLOSED_BOUNDARY);
});

test("retained official ReadMe supplies the actual J2000 columns, units, epoch, and 9110-record declaration", () => {
  assert.equal(schema.recordCount, 9110);
  assert.equal(schema.recordLength, 197);
  assert.deepEqual([schema.fields.RAh.start, schema.fields.RAh.end, schema.fields.RAh.units], [76, 77, "h"]);
  assert.deepEqual([schema.fields["DE-"].start, schema.fields.DEs.end], [84, 90]);
  assert.equal(schema.fields.Vmag.units, "mag");
  assert.equal(schema.fields.Name.start, 5);
  assert.match(schema.fields.RAh.explanation, /equinox J2000, epoch 2000.0/);
});

test("fixture-only altered ReadMe is rejected for missing columns, duplicated columns, wrong units, or B1900 masquerading as J2000", () => {
  const text = readMeBytes.toString("ascii");
  const variants = [
    text.replace(/^.*\bRAh\s+.*\n/m, ""),
    text.replace(/^(.*\bRAh\s+.*)$/m, "$1\n$1"),
    text.replace(/(\bRAh\s+\?Hours RA, equinox )J2000/, "$1B1900"),
    text.replace(/(I2\s+)h(\s+RAh\s+)/, "$1deg$2"),
  ];
  for (const variant of variants) assert.throws(() => parseReadMe(Buffer.from(variant)), /readme:/);
});

test("fixture-only swapped coordinate columns are read from the ReadMe definition rather than guessed positions", () => {
  const text = readMeBytes.toString("ascii")
    .replace(/76- 77(\s+I2\s+h\s+RAh)/, "78- 79$1")
    .replace(/78- 79(\s+I2\s+min\s+RAm)/, "76- 77$1");
  const shifted = parseReadMe(Buffer.from(text));
  assert.equal(shifted.fields.RAh.start, 78);
  const original = rows.find((row) => row.hr === 7528);
  let fixture = fixtureRecordWithField(original, "RAh", "19", shifted);
  fixture = fixtureRecordWithField(fixture, "RAm", "44", shifted);
  assert.deepEqual(coordinatesFromRow(fixture, shifted), coordinatesFromRow(original, schema));
});

test("fixture-only HTML and fake gzip payloads cannot masquerade as a structured catalogue", () => {
  assert.throws(() => parseReadMe(Buffer.from("<html>V/50 Bright Star Catalogue</html>")), /readme:/);
  assert.throws(() => decodeCatalogue(Buffer.from("<html>200 OK</html>")), /gzip-signature/);
  const marker = gzipSync(Buffer.from("fixture-only synthetic data; not an official catalogue\n"));
  assert.throws(() => deriveParserCandidates(readMeBytes, marker), /catalog:/);
});

test("retained catalogue line offsets address uncompressed bytes, including short records with omitted trailing blanks", () => {
  assert.equal(rows.length, 9110);
  assert.ok(rows.some((row) => row.raw.length < 197));
  for (const hr of [1346, 4656, 7051, 7052, 7236, 7949]) {
    const row = rows.find((item) => item.hr === hr);
    const bytes = catalogueBytes.subarray(row.byteStart, row.byteEndExclusive);
    assert.equal(bytes.toString("ascii"), row.raw);
    assert.equal(sha256(bytes), row.rawLineSha256);
    assert.equal(row.lineNumber, hr);
  }
});

test("fixture-only missing rows, overlong rows, duplicate HR values, and non-ASCII bytes are rejected", () => {
  const rawLines = catalogueBytes.toString("ascii").trimEnd().split("\n");
  assert.throws(() => parseCatalogue(Buffer.from(`${rawLines.slice(1).join("\n")}\n`), schema), /record-count/);
  const duplicate = [...rawLines]; duplicate[1] = duplicate[0];
  assert.throws(() => parseCatalogue(Buffer.from(`${duplicate.join("\n")}\n`), schema), /duplicate-or-invalid-hr/);
  const long = [...rawLines]; long[0] = `${long[0]}${" ".repeat(198)}`;
  assert.throws(() => parseCatalogue(Buffer.from(`${long.join("\n")}\n`), schema), /record-length/);
  const nonAscii = Buffer.from(catalogueBytes); nonAscii[10] = 0xff;
  assert.throws(() => parseCatalogue(nonAscii, schema), /non-ascii/);
});

test("Bayer parsing preserves superscript and constellation instead of accepting nearest-sky or loose-name matches", () => {
  assert.deepEqual(parseBayerName("  4Eps1Lyr"), { flamsteed: 4, bayer: "Eps", suffix: "1", constellationCode: "Lyr" });
  assert.deepEqual(parseBayerName("   Del Cru"), { flamsteed: null, bayer: "Del", suffix: "", constellationCode: "Cru" });
  assert.equal(parseBayerName("Fawaris"), null);
  assert.equal(parseBayerName("4Eps1Lyr extra"), null);
  const target = ANCHOR_TARGETS[0];
  const row = rows.find((item) => item.hr === 7528);
  assert.throws(() => matchAnchor([{ ...row, rawName: "18Del Aql" }], target), /identity:missing/);
  assert.throws(() => matchAnchor([{ ...row, rawName: "18Del1Cyg" }], target), /identity:missing/);
});

test("fixture-only duplicated exact target name is rejected even when one row has nearer or brighter coordinates", () => {
  const row = rows.find((item) => item.hr === 7528);
  const brighter = fixtureRecordWithField({ ...row, hr: 8000 }, "Vmag", "-1.00");
  assert.throws(() => matchAnchor([row, brighter], ANCHOR_TARGETS[0]), /ambiguous-name/);
});

test("epsilon1 defaults to ambiguous; the explicit HR7051 Name ADS11635 A rule is uniquely selected and B is retained", () => {
  const unqualified = { ...epsilon }; delete unqualified.componentSelector;
  assert.throws(() => matchAnchor(rows, unqualified), /ambiguous-name/);
  const match = matchAnchor(rows, epsilon);
  assert.equal(match.row.hr, 7051);
  assert.equal(match.row.ads, "11635");
  assert.equal(match.row.adsComponent, "A");
  assert.deepEqual(match.matches.map((row) => row.hr), [7051, 7052]);
  assert.deepEqual(expected.ambiguity[0].candidates.map((row) => row.adsComponent), ["A", "B"]);
  const record = expected.records.find((item) => item.id === "epsilon1_lyr");
  assert.match(record.name, /HR7051.*component A/);
  assert.match(record.nameCn, /HR7051.*目录组件A/);
  assert.equal(record.systemCentreClaimed, false);
  assert.equal(record.scientificIdentityConfirmed, false);
});

test("fixture-only epsilon component B, missing ADS component, fake HR, and fake raw Name cannot satisfy the A selector", () => {
  const original = rows.find((row) => row.hr === 7051);
  const mutations = [
    { ...original, adsComponent: "B" }, { ...original, adsComponent: "" },
    { ...original, hr: 7052 }, { ...original, ads: "11636" }, { ...original, rawName: "5Eps1Lyr" },
  ];
  for (const mutation of mutations) assert.throws(() => matchAnchor([mutation], epsilon), /component-selector-mismatch/);
  const ruleB = { ...epsilon, componentSelector: { ...epsilon.componentSelector, hr: 7052, adsComponent: "B" } };
  assert.throws(() => matchAnchor(rows, ruleB), /selector-not-authorized/);
});

test("sexagesimal J2000 conversion uses the signed declination and retained visual magnitude", () => {
  const delta = expected.records.find((record) => record.id === "delta_cyg");
  assert.equal(delta.raDeg, 296.24375);
  assert.equal(delta.decDeg, 45.130833333333);
  const theta = expected.records.find((record) => record.id === "theta_aql");
  assert.equal(theta.raDeg, 302.82625);
  assert.equal(theta.decDeg, -0.821388888889);
  assert.equal(theta.magV, 3.23);
  assert.equal(expected.records.find((record) => record.id === "epsilon1_lyr").raDeg, 281.085);
});

test("fixture-only invalid sexagesimal numbers, unsigned declination, and out-of-range poles are rejected", () => {
  const row = rows.find((item) => item.hr === 7528);
  const cases = [["RAh", "24"], ["RAm", "60"], ["RAs", "60.0"], ["RAh", "xx"], ["DE-", " "], ["DEd", "91"], ["DEm", "60"], ["DEs", "60"]];
  for (const [label, value] of cases) assert.throws(() => coordinatesFromRow(fixtureRecordWithField(row, label, value), schema), /coordinate:/);
  assert.throws(() => coordinatesFromRow(fixtureRecordWithField(row, "DEd", "90"), schema), /invalid-pole/);
});

test("fixture-only blank magnitude remains null without inventing photometry", () => {
  const row = rows.find((item) => item.hr === 7528);
  assert.equal(coordinatesFromRow(fixtureRecordWithField(row, "Vmag", "     "), schema).magV, null);
  assert.throws(() => coordinatesFromRow(fixtureRecordWithField(row, "Vmag", " NaN "), schema), /invalid-number/);
});

test("request URL allowlist rejects insecure transport, credentials, lookalike hosts, query parameters, and other catalogues", () => {
  assert.equal(safeOfficialUrl("https://cdsarc.cds.unistra.fr/ftp/V/50/ReadMe"), true);
  assert.equal(safeOfficialUrl("https://cdsarc.u-strasbg.fr/ftp/V/50/catalog.gz"), true);
  const invalid = ["http://cdsarc.cds.unistra.fr/ftp/V/50/ReadMe", "https://user:pass@cdsarc.cds.unistra.fr/ftp/V/50/ReadMe",
    "https://cdsarc.cds.unistra.fr.example.test/ftp/V/50/ReadMe", "https://cdsarc.cds.unistra.fr/ftp/V/51/ReadMe",
    "https://cdsarc.cds.unistra.fr/ftp/V/50/catalog.gz?fixture=1", "https://cdsarc.cds.unistra.fr:444/ftp/V/50/ReadMe"];
  for (const value of invalid) assert.equal(safeOfficialUrl(value), false);
  assert.notEqual(requestFingerprint(source("readme").requestUrl), requestFingerprint(source("catalog").requestUrl));
});

test("fixture-only unsafe request is rejected before any network request or artifact creation", async () => {
  const attempt = await captureAttempt({ url: "https://example.invalid/fixture-only", timeoutMs: 100, maxBytes: 10,
    attempt: 1, artifactId: "readme", root, outputDirectory: EVIDENCE_DIRECTORY });
  assert.equal(attempt.responseCaptured, 0);
  assert.equal(attempt.artifact, null);
  assert.equal(attempt.errorClass, "redirect");
  assert.equal(attempt.hops.length, 0);
});

test("transport error classes retain timeout, DNS, TLS, connection, byte limit, and redirect distinctions", () => {
  const cases = { CAPTURE_TIMEOUT: "timeout", EAI_AGAIN: "dns", CERT_HAS_EXPIRED: "tls", ECONNRESET: "connection", CAPTURE_SIZE: "size-limit", CAPTURE_REDIRECT: "redirect", ENOSPC: "artifact-io", OTHER: "network" };
  for (const [code, expectedClass] of Object.entries(cases)) assert.equal(classifyTransportError({ code }), expectedClass);
});

test("fixture-only altered raw artifact fails even when the retained ledger still declares its original SHA", () => {
  expectCaptureRejected((_capture, artifacts) => {
    const filename = source("catalog").artifact.path;
    const bytes = Buffer.from(artifacts.get(filename)); bytes[50] ^= 1; artifacts.set(filename, bytes);
  }, /raw-sha256/);
});

test("fixture-only altered ledger bytes fail their digest and altered embedded attempts fail the ledger linkage", () => {
  assert.throws(() => validateCaptureBundle(retained.capture, Buffer.concat([retained.ledgerBytes, Buffer.from(" ")]), retained.artifactBytes), /attempt-ledger-sha256/);
  const changed = clone(retained.capture); changed.attempts[0].httpStatus = 404;
  assert.throws(() => validateCaptureBundle(changed, retained.ledgerBytes, retained.artifactBytes), /attempt-ledger-content/);
});

test("fixture-only provenance flags, fake transport, and opened science boundary cannot be promoted", () => {
  expectCaptureRejected((capture) => { capture.fixture = true; }, /fixture-or-synthetic/);
  expectCaptureRejected((capture) => { capture.synthetic = true; }, /fixture-or-synthetic/);
  expectCaptureRejected((capture) => { capture.evidenceOrigin = "fixture-only"; }, /fixture-or-synthetic/);
  expectCaptureRejected((capture) => { capture.attempts[0].fixture = true; }, /fixture-transport/);
  expectCaptureRejected((capture) => { capture.attempts[0].transport = "injected-test-response"; }, /fixture-transport/);
  expectCaptureRejected((capture) => { capture.boundary.scientificPayloadWriteback = true; }, /boundary-scientificPayloadWriteback/);
});

test("fixture-only status, content type, TLS, final URL, fingerprint, and retry sequence tampering are rejected", () => {
  expectCaptureRejected((capture) => { capture.attempts[0].httpStatus = 404; }, /success-state/);
  expectCaptureRejected((capture) => { capture.attempts[0].contentType = "text/html"; capture.attempts[0].hops[0].contentType = "text/html"; }, /content-type/);
  expectCaptureRejected((capture) => { capture.attempts[0].hops[0].tlsAuthorized = false; }, /official-tls-hop/);
  expectCaptureRejected((capture) => { capture.attempts[0].finalUrl = "https://example.invalid/fixture"; }, /final-response-binding/);
  expectCaptureRejected((capture) => { capture.attempts[0].requestFingerprint = "0".repeat(64); }, /request-fingerprint/);
  expectCaptureRejected((capture) => { capture.attempts[0].retryCount = 8; }, /attempt-sequence/);
});

test("fixture-only redirect ledger cannot invent an unrecorded final hop", () => {
  expectCaptureRejected((capture) => { capture.attempts[0].redirectChain.push({ from: capture.attempts[0].requestUrl,
    to: "https://cdsarc.u-strasbg.fr/ftp/V/50/ReadMe", httpStatus: 302 }); }, /redirect-chain-length/);
});

test("fixture-only missing anchors, duplicate ids, wrong constellations, invalid coordinates and modified values fail recomputation", () => {
  const fewer = clone(expected); fewer.records.pop();
  assert.throws(() => validateSupplement(fewer, expected), /missing-or-extra/);
  const duplicate = clone(expected); duplicate.records[1] = clone(duplicate.records[0]);
  assert.throws(() => validateSupplement(duplicate, expected), /duplicate-id/);
  const wrong = clone(expected); wrong.records[0].constellationCode = "Aql";
  assert.throws(() => validateSupplement(wrong, expected), /wrong-constellation/);
  for (const field of ["raDeg", "decDeg"]) {
    const invalid = clone(expected); invalid.records[0][field] = NaN;
    assert.throws(() => validateSupplement(invalid, expected), /invalid-coordinate/);
  }
  const altered = clone(expected); altered.records[0].raDeg += 0.001;
  assert.throws(() => validateSupplement(altered, expected), /recomputed-content/);
});

test("fixture-only supplement promotion and replacing the explicit epsilon component label are rejected", () => {
  const fixture = clone(expected); fixture.fixture = true;
  assert.throws(() => validateSupplement(fixture, expected), /fixture-promotion/);
  const identity = clone(expected); identity.records[0].scientificIdentityConfirmed = true;
  assert.throws(() => validateSupplement(identity, expected), /boundary-scientificIdentityConfirmed/);
  const label = clone(expected); label.records.find((record) => record.id === "epsilon1_lyr").nameCn = "整个ε¹系统中心";
  assert.throws(() => validateSupplement(label, expected), /recomputed-content/);
});

test("the client supplement contains only retained candidate data and reproduces its exact module bytes", () => {
  assert.equal(readFileSync(path.join(root, SUPPLEMENT_PATH), "utf8"), renderSupplementModule(expected));
  assert.equal(expected.records.every((record) => record.artifactSha256 === expected.compressedCatalogue.sha256), true);
  assert.equal(expected.records.every((record) => record.scientificPayloadWriteback === false && record.admission === "not-admitted"), true);
  const parsed = deriveParserCandidates(readMeBytes, gzipBytes);
  assert.equal(parsed.evidenceClass, "parser-output-only");
  assert.equal(parsed.records.length, 14);
});

test("fixture-only false derivation counts, scientific confirmation, capture binding, and output hashes are rejected", () => {
  const derivation = JSON.parse(readFileSync(path.join(root, EVIDENCE_DIRECTORY, "derivation.json"), "utf8"));
  const captureBytes = readFileSync(path.join(root, EVIDENCE_DIRECTORY, "capture.json"));
  const outputs = new Map(derivation.outputs.map((item) => [item.path, readFileSync(path.join(root, item.path))]));
  assert.equal(validateDerivationReceipt(derivation, captureBytes, outputs), true);
  for (const change of [
    (item) => { item.records = 999; }, (item) => { item.scientificIdentityConfirmed = true; },
    (item) => { item.schema = "fixture-only"; }, (item) => { item.createdAt = "not-a-time"; },
    (item) => { item.inputCapture.path = "../outside.json"; },
    (item) => { item.outputs[0].sha256 = "0".repeat(64); },
  ]) {
    const fixture = clone(derivation); change(fixture);
    assert.throws(() => validateDerivationReceipt(fixture, captureBytes, outputs), /verify:/);
  }
});
