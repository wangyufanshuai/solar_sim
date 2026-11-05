import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  auditMainlineAWebDeliveryV647,
  classifyWebEvidenceV647,
  safeWebAuditPath,
  verifyCanonicalDigestsV647,
  verifyWebPreviewAssetsV647,
} from "./audit-mainline-a-web-delivery-v647.mjs";
import rightsExports from "../app/lib/mainlineAWebRightsTruthV647.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = "93b297e97cc3a2cee8d72e8c91a43ff64b55d3c75b975b6476e027dfa6844f98";
async function json(relative) { return JSON.parse(await readFile(path.join(ROOT, relative), "utf8")); }

test("the web audit rehashes all twelve real local preview images", async () => {
  const rows = await verifyWebPreviewAssetsV647(rightsExports.MAINLINE_A_WEB_NEBULA_RIGHTS_V647);
  assert.equal(rows.length, 12);
  assert.equal(new Set(rows.map((row) => row.sha256)).size, 12);
  assert.ok(rows.every((row) => row.humanRightsSignoff === "pending" && row.releaseAdmission === "candidate-only"));
});

test("the web-only audit never promotes local static checks to public release", async () => {
  const report = await auditMainlineAWebDeliveryV647();
  assert.equal(report.status, "candidate-only-web-review-release-blocked");
  assert.equal(report.rightsCounts.total, 12);
  assert.equal(report.rightsCounts.rightsApproved, 0);
  assert.equal(report.decision.deliveryTarget, "next-web-only");
  assert.equal(report.decision.localTechnicalReview, "pending");
  assert.equal(report.decision.publicWebRelease, "blocked");
  assert.equal(report.claims.realUserValidation, false);
});

test("path traversal, parent access and fixture references are rejected", () => {
  for (const relative of ["../web/package.json", "C:/Windows/notepad.exe", "\\\\server\\share\\receipt.json",
    "docs/release/fixture-browser.json", "docs/release/../private.json", "/absolute/file.json"]) {
    assert.throws(() => safeWebAuditPath(relative), /web-v647:path-invalid/);
  }
  assert.equal(safeWebAuditPath("docs/release/v607/current.json"), path.join(ROOT, "docs/release/v607/current.json"));
});

test("the preserved V645 browser lacks the V647 rights observation and remains historical", async () => {
  const build = await json("docs/release/v607/mainline-a-r65-build-20261007-v645r65a.json");
  const browser = await json("docs/release/v607/mainline-a-r66-browser-20261007-v645.json");
  const http = await json("docs/release/v607/mainline-a-r66-http-20261007-v645.json");
  assert.equal(classifyWebEvidenceV647("build", build, SOURCE), "verified-current");
  assert.equal(classifyWebEvidenceV647("browser", browser, SOURCE), "historical");
  assert.equal(classifyWebEvidenceV647("http", http, SOURCE), "verified-current");
  const changed = "f".repeat(64);
  assert.equal(classifyWebEvidenceV647("build", build, changed), "historical");
  assert.equal(classifyWebEvidenceV647("browser", browser, changed), "historical");
  assert.equal(classifyWebEvidenceV647("http", http, changed), "historical");
});

test("forged rights, fake browser markers and unstable builds fail classification", async () => {
  const browser = await json("docs/release/v607/mainline-a-r66-browser-20261007-v645.json");
  const build = await json("docs/release/v607/mainline-a-r65-build-20261007-v645r65a.json");
  assert.throws(() => classifyWebEvidenceV647("browser", { ...browser, claims: { legalClearance: true } }, SOURCE), /claim-promotion/);
  assert.throws(() => classifyWebEvidenceV647("browser", { ...browser, mobileViewport: { status: "not-run" } }, SOURCE), /browser-not-passed/);
  assert.throws(() => classifyWebEvidenceV647("build", { ...build, inputAfterSha256: "f".repeat(64) }, SOURCE), /build-not-stable/);
});

test("a pinned historical source index stays historical for changed web code", async () => {
  const index = await json("docs/release/v607/mainline-a-r66-v646-evidence-supplement-20261007.json");
  assert.equal(classifyWebEvidenceV647("externalSource", index, SOURCE), "verified-current");
  assert.equal(classifyWebEvidenceV647("externalSource", index, "f".repeat(64)), "historical");
  assert.throws(() => classifyWebEvidenceV647("externalSource", {
    ...index, gates: { ...index.gates, nebulaRightsSignoff: "approved-12-of-12" },
  }, SOURCE), /external-source-boundary-invalid/);
});

test("canonical row and manifest digest tampering is rejected before web review", async () => {
  const source = await json("app/data/mainlineACanonicalCoverageV622.generated.json");
  assert.equal(verifyCanonicalDigestsV647(source), source.manifestDigest);
  const tamperedRow = structuredClone(source);
  tamperedRow.records.find((row) => row.kind === "nebula").source.license = "CC BY 4.0 approved fixture";
  assert.throws(() => verifyCanonicalDigestsV647(tamperedRow), /canonical-row-digest-mismatch/);
  const tamperedManifest = structuredClone(source);
  tamperedManifest.manifestDigest = "f".repeat(64);
  assert.throws(() => verifyCanonicalDigestsV647(tamperedManifest), /canonical-manifest-digest-mismatch/);
});

test("the saved web-only receipt replays against current pinned evidence", () => {
  const result = execFileSync(process.execPath, ["--import", "tsx",
    "scripts/audit-mainline-a-web-delivery-v647.mjs",
    "--evidence", "docs/release/v607/mainline-a-r66-web-evidence-input-20261007-v647web02.json",
    "--check", "docs/release/v607/mainline-a-r66-web-delivery-audit-20261007-v647web02.json"],
  { cwd: ROOT, encoding: "utf8", timeout: 30_000 });
  assert.match(result, /Web V647: verified; release blocked/);
});
