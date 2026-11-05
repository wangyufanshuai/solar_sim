import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { safeWorkspacePathV662 } from
  "./build-mainline-a-r75-matrix-v662.mjs";
import { parseR77AuditOptionsV664,
  verifyR77CanonicalV664, verifyR77MatrixBrowserV664,
  verifyR77ScreenshotV664 } from
  "./audit-mainline-a-r77-evidence-v664.mjs";

const base = "docs/release/v607/";
async function receipt(name) {
  return JSON.parse(await readFile(safeWorkspacePathV662(
    base + name), "utf8"));
}
const [freeze, build, browser, desktop, mobile] = await Promise.all([
  receipt("mainline-a-r77-v664-freeze-20261013v664r77freeze01.json"),
  receipt("mainline-a-r77-build-20261013v664r77web01.json"),
  receipt("mainline-a-r77-v664-matrix-browser-20261013v664r77web01.json"),
  receipt("mainline-a-r77-web-canonical-scene-desktop-raw-20261013-v664scene01.json"),
  receipt("mainline-a-r77-web-canonical-scene-mobile-raw-20261013-v664scene02.json"),
]);

test("accepts the complete current-source desktop and mobile scene walks", () => {
  assert.equal(verifyR77CanonicalV664(desktop,
    freeze, build, "desktop").ok, true);
  assert.equal(verifyR77CanonicalV664(mobile,
    freeze, build, "mobile").ok, true);
});

test("rejects a missing scene even if the summary still says 36", () => {
  const bad = structuredClone(mobile);
  bad.items.pop();
  const result = verifyR77CanonicalV664(bad,
    freeze, build, "mobile");
  assert.equal(result.ok, false);
  assert.ok(result.issues.includes(
    "canonical-mobile-identity-or-coverage"));
});

test("rejects scene source, image, and rights promotion", () => {
  const bad = structuredClone(desktop);
  const nebula = bad.items.find((item) =>
    item.key === "nebula:m42");
  nebula.observed.nebula.sha256 = "0".repeat(64);
  nebula.observed.nebula.rights = "signed";
  const result = verifyR77CanonicalV664(bad,
    freeze, build, "desktop");
  assert.equal(result.ok, false);
  assert.ok(result.issues.includes("canonical-nebula:m42"));
});

test("rejects a forged build identity in the scene walk", () => {
  const bad = structuredClone(desktop);
  bad.build.sourceSha256 = "f".repeat(64);
  assert.ok(verifyR77CanonicalV664(bad,
    freeze, build, "desktop").issues.includes(
    "canonical-desktop-identity-or-coverage"));
});

test("accepts the complete 96 by 2 matrix and nine by two readiness walk", () => {
  const result = verifyR77MatrixBrowserV664(browser,
    freeze, build);
  assert.equal(result.ok, true, result.issues.join(","));
  assert.equal(result.matrixSelections, 192);
  assert.equal(result.readinessSelections, 18);
});

test("rejects a hidden matrix omission and synthetic rights promotion", () => {
  const bad = structuredClone(browser);
  bad.mobileViewport.matrixWalk.selections.pop();
  bad.desktop.matrixWalk.selections[0].rightsSigned = true;
  const issues = verifyR77MatrixBrowserV664(bad,
    freeze, build).issues;
  assert.ok(issues.includes("matrix-browser-desktop-coverage"));
  assert.ok(issues.includes("matrix-browser-mobileViewport-coverage"));
});

test("rejects overflow and missing browser frame samples", () => {
  const bad = structuredClone(browser);
  bad.mobileViewport.layout.documentWidth = 450;
  bad.desktop.performanceDiagnostic.count = 119;
  const issues = verifyR77MatrixBrowserV664(bad,
    freeze, build).issues;
  assert.ok(issues.includes("matrix-browser-desktop-coverage"));
  assert.ok(issues.includes("matrix-browser-mobileViewport-coverage"));
});

test("recomputes screenshot bytes and rejects tampered pixels", async () => {
  const meta = browser.mobileViewport.overview;
  const item = { device: "mobile", kind: "matrix-overview", meta };
  const bytes = await readFile(safeWorkspacePathV662(meta.path));
  assert.equal(verifyR77ScreenshotV664(item, bytes).ok, true);
  const changed = Buffer.from(bytes);
  changed[changed.length - 20] ^= 1;
  assert.equal(verifyR77ScreenshotV664(item, changed).ok, false);
  assert.equal(verifyR77ScreenshotV664({ ...item,
    device: "desktop" }, bytes).ok, false);
});

test("CLI requires distinct bounded scene runs", () => {
  const args = ["--build-run-id", "20261013v664r77web01",
    "--freeze-run-id", "20261013v664r77freeze01",
    "--browser-run-id", "20261013v664r77web01",
    "--desktop-scene-run", "20261013-v664scene01",
    "--mobile-scene-run", "20261013-v664scene02"];
  assert.equal(parseR77AuditOptionsV664(args).mobileSceneRun,
    "20261013-v664scene02");
  const same = [...args];
  same[9] = same[7];
  assert.throws(() => parseR77AuditOptionsV664(same));
  const traversal = [...args];
  traversal[9] = "../outside";
  assert.throws(() => parseR77AuditOptionsV664(traversal));
});
