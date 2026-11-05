import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { safeWorkspacePathV662 } from "./build-mainline-a-r75-matrix-v662.mjs";
import { parseEvidenceOptionsV662, verifyCanonicalBrowserV662,
  verifySkyBrowserV662, verifyNebulaBrowserV662,
  verifyMatrixBrowserV662, verifyLongRunAuditV662 } from
  "./audit-mainline-a-r75-evidence-v662.mjs";

async function saved(name) {
  return JSON.parse(await readFile(safeWorkspacePathV662(
    `docs/release/v607/${name}`), "utf8"));
}
const clone = (value) => structuredClone(value);
let records;
async function baseline() {
  records ??= await Promise.all([
    saved("mainline-a-r75-build-20261013v662r75web02.json"),
    saved("mainline-a-r75-v662-matrix-20261013v662r75web02.json"),
    saved("mainline-a-r75-web-canonical-scene-desktop-raw-20261013-v662scene01.json"),
    saved("mainline-a-r75-web-canonical-scene-mobile-raw-20261013-v662scene02.json"),
    saved("mainline-a-r75-v662-sky-browser-20261013v662r75web02.json"),
    saved("mainline-a-r75-v662-nebula-browser-20261013v662r75web02.json"),
    saved("mainline-a-r75-v662-matrix-browser-20261013v662r75web03.json"),
  ]);
  return records;
}

test("saved current-source browser classes cover the intended entries", async () => {
  const [build, matrix, desktop, mobile, sky, nebula, acceptance] =
    await baseline();
  assert.deepEqual(verifyCanonicalBrowserV662(desktop, matrix, build,
    "desktop").issues, []);
  assert.deepEqual(verifyCanonicalBrowserV662(mobile, matrix, build,
    "mobile").issues, []);
  assert.deepEqual(verifySkyBrowserV662(sky, matrix, build).issues, []);
  assert.deepEqual(verifyNebulaBrowserV662(nebula, matrix, build).issues, []);
  assert.deepEqual(verifyMatrixBrowserV662(acceptance, matrix, build).issues,
    []);
});

test("canonical matrix rejects one missing scene and mismatched image rights", async () => {
  const [build, matrix, raw] = await baseline();
  const changed = clone(raw);
  changed.items.pop();
  assert.equal(verifyCanonicalBrowserV662(changed, matrix, build,
    "desktop").ok, false);
  const rights = clone(raw);
  const nebula = rights.items.find((row) => row.key.startsWith("nebula:"));
  nebula.observed.nebula.rights = "approved";
  assert.ok(verifyCanonicalBrowserV662(rights, matrix, build,
    "desktop").issues.some((item) => item.includes("canonical-nebula")));
});

test("sky matrix rejects a promoted held star", async () => {
  const [build, matrix, , , raw] = await baseline();
  const changed = clone(raw);
  changed.mobileViewport.starSelections.find((row) =>
    row.id === "acrux").focusEnabled = true;
  assert.ok(verifySkyBrowserV662(changed, matrix, build)
    .issues.includes("sky-browser:mobileViewport"));
});

test("nebula matrix rejects missing object URL cleanup", async () => {
  const [build, matrix, , , , raw] = await baseline();
  const changed = clone(raw);
  changed.desktop.objectUrlsAfterClose = 1;
  assert.ok(verifyNebulaBrowserV662(changed, matrix, build)
    .issues.includes("nebula-browser:desktop"));
});

test("new matrix rejects an omitted entry and external image request", async () => {
  const [build, matrix, , , , , raw] = await baseline();
  const changed = clone(raw);
  changed.desktop.selections.pop();
  changed.desktop.externalImageRequests.push("https://example.invalid/fake.jpg");
  assert.ok(verifyMatrixBrowserV662(changed, matrix, build)
    .issues.includes("matrix-browser:desktop"));
});

test("longrun verifier cannot qualify synthetic or truncated observations", async () => {
  const [build] = await baseline();
  const fake = { schema: "mainline-a-r75-longrun-audit-v662",
    status: "verified-two-independent-current-source-local-browser-runs",
    sourceSha256: build.inputAfterSha256, buildId: build.buildId,
    physicalMobile: "not-run",
    claims: { productionPerformance: false, copyrightApproval: false },
    qualification: { ok: true } };
  const check = verifyLongRunAuditV662(fake,
    { observations: [] }, { observations: [] }, build);
  assert.equal(check.ok, false);
  assert.ok(check.issues.includes("longrun-identity-independence-or-boundary"));
  assert.ok(check.issues.includes("longrun-qualification-not-reproducible"));
});

test("audit identifiers require pinned build, matrix browser and longrun", () => {
  assert.deepEqual(parseEvidenceOptionsV662(["--run-id",
    "20261013v662r75web02", "--matrix-browser-run-id",
    "20261013v662r75web03", "--long-id",
    "20261013v662r75long01"]),
  { runId: "20261013v662r75web02",
    matrixBrowserRunId: "20261013v662r75web03",
    longId: "20261013v662r75long01" });
  assert.throws(() => parseEvidenceOptionsV662(["--run-id",
    "20261013v662r75web02", "--matrix-browser-run-id",
    "20261013v662r75web03", "--long-id",
    "20261013v660r73long01"]));
});
