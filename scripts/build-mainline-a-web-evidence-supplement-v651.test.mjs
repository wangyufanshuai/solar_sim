import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  validateWebEvidenceSupplementInputsV651,
} from "./build-mainline-a-web-evidence-supplement-v651.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const load = async (relative) => JSON.parse(await readFile(path.join(root, relative), "utf8"));
const values = {
  build: await load("docs/release/v607/mainline-a-r66-build-20261011-v649web02.json"),
  http: await load("docs/release/v607/mainline-a-r66-http-20261011-v649web02.json"),
  pointer: await load("docs/release/v607/mainline-a-r66-web-pointer-verification-20261011-v649pointer02.json"),
  sourcePageLedger: await load("docs/release/v607/mainline-a-r66-nebula-source-page-ledger-20261011-v651page01.json"),
  sourcePageAudit: await load("docs/release/v607/mainline-a-r66-nebula-source-page-audit-20261011-v651page01.json"),
  imageLinkLedger: await load("docs/release/v607/mainline-a-r66-nebula-page-image-link-ledger-20261011-v652link01.json"),
  imageLinkAudit: await load("docs/release/v607/mainline-a-r66-nebula-page-image-link-audit-20261011-v652link01-fixed.json"),
  pixelLinkAudit: await load("docs/release/v607/mainline-a-r66-nebula-pixel-link-audit-20261011-v653pixel01.json"),
  priorRound: await load("docs/release/v607/mainline-a-r66-web-v649-technical-round-20261011.json"),
  priorCodeChange: await load("docs/release/v607/mainline-a-r66-web-v649-code-change-20261011.json"),
};
const currentSha = values.build.inputBefore.sha256;
values.longRunRaw = {
  schema: "mainline-a-r65-long-run-v643", status: "qualified",
  observations: [{}, {}], build: { buildId: values.build.runtimeBuildId },
  claims: { productionPerformance: false },
  boundary: { scientificPayloadWriteback: false },
};
values.longRunBinding = {
  schema: "mainline-a-web-r65-current-longrun-v648",
  status: "verified-current-source-local-longrun",
  sourceSha256: currentSha, buildId: values.build.buildId,
  currentSourceLongRuns: 2, issues: [],
  claims: { productionPerformance: false, physicalMobile: false },
};
const clone = structuredClone;
const validate = (input = values) =>
  validateWebEvidenceSupplementInputsV651(input, currentSha);

test("a held unit fixture binds all current web evidence classes", () => {
  const identity = validate();
  assert.equal(identity.sourceSha256, currentSha);
  assert.equal(identity.buildId, values.build.buildId);
  assert.equal(values.sourcePageAudit.counts.rightsSigned, 0);
  assert.equal(values.pixelLinkAudit.counts.decodedPixelIdentical, 6);
});

test("source changes cannot inherit a preserved production build", () => {
  assert.throws(() => validateWebEvidenceSupplementInputsV651(values,
    "a".repeat(64)), /build-source-invalid/);
});

test("an HTTP response detached from the build is rejected", () => {
  const forged = clone(values);
  forged.http.buildId = "different-build";
  assert.throws(() => validate(forged), /http-build-binding-invalid/);
});

test("a screenshot hash total cannot be padded or omitted", () => {
  const forged = clone(values);
  forged.pointer.counts.screenshotHashes = 71;
  assert.throws(() => validate(forged), /pointer-matrix-invalid/);
});

test("source pages do not grant copyright approval", () => {
  const forged = clone(values);
  forged.sourcePageAudit.claims.copyrightApproval = true;
  assert.throws(() => validate(forged), /source-page-audit-invalid/);
});

test("one fewer official JPEG cannot inherit six captured responses", () => {
  const forged = clone(values);
  forged.imageLinkLedger.counts.responseCaptured = 5;
  assert.throws(() => validate(forged), /image-link-ledger-invalid/);
});

test("forged exact byte identity fails the pinned image link", () => {
  const forged = clone(values);
  forged.imageLinkAudit.counts.byteIdentical = 6;
  assert.throws(() => validate(forged), /image-link-audit-invalid/);
});

test("decoded pixel identity does not grant image rights", () => {
  const forged = clone(values);
  forged.pixelLinkAudit.claims.copyrightApproval = true;
  assert.throws(() => validate(forged), /pixel-link-audit-invalid/);
});

test("a substituted or missing local long run fails the final binding", () => {
  const wrongBuild = clone(values);
  wrongBuild.longRunRaw.build.buildId = "historical-build";
  assert.throws(() => validate(wrongBuild), /longrun-raw-invalid/);
  const oneRun = clone(values);
  oneRun.longRunBinding.currentSourceLongRuns = 1;
  assert.throws(() => validate(oneRun), /longrun-binding-invalid/);
});

test("the candidate package cannot be asserted as a public release", () => {
  const forged = clone(values);
  forged.priorRound.status.publicWebRelease = "approved";
  assert.throws(() => validate(forged), /prior-round-invalid/);
});

test("a code-change receipt cannot claim scientific writeback", () => {
  const forged = clone(values);
  forged.priorCodeChange.boundary.scientificPayloadWriteback = true;
  assert.throws(() => validate(forged), /prior-code-change-invalid/);
});
