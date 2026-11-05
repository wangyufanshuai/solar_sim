import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { safeWorkspacePathV662 } from "./build-mainline-a-r75-matrix-v662.mjs";
import { expectedVisualCoverageV662, parseVisualOptionsV662 } from
  "./build-mainline-a-r75-visual-v662.mjs";

async function read(name) {
  return JSON.parse(await readFile(safeWorkspacePathV662(
    `docs/release/v607/${name}`), "utf8"));
}
async function records() {
  const [canonicalDesktop, canonicalMobile, sky, nebula, matrix] =
    await Promise.all([
      read("mainline-a-r75-web-canonical-scene-desktop-raw-20261013-v662scene01.json"),
      read("mainline-a-r75-web-canonical-scene-mobile-raw-20261013-v662scene02.json"),
      read("mainline-a-r75-v662-sky-browser-20261013v662r75web02.json"),
      read("mainline-a-r75-v662-nebula-browser-20261013v662r75web02.json"),
      read("mainline-a-r75-v662-matrix-browser-20261013v662r75web03.json"),
    ]);
  return { canonicalDesktop, canonicalMobile, sky, nebula, matrix };
}
test("full visual coverage uses 88 source-bound captures", async () => {
  const coverage = expectedVisualCoverageV662(await records());
  assert.equal(coverage.ok, true);
  assert.equal(coverage.screenshotCount, 88);
  assert.deepEqual([coverage.canonical, coverage.sky, coverage.nebula,
    coverage.matrix], [72, 6, 6, 4]);
});
test("missing canonical scene cannot be passed off as visual coverage", async () => {
  const changed = await records();
  changed.canonicalMobile.items.pop();
  const coverage = expectedVisualCoverageV662(changed);
  assert.equal(coverage.ok, false);
  assert.ok(coverage.issues.includes("canonical-screenshot-matrix-incomplete"));
  assert.ok(coverage.issues.includes("screenshot-count-not-88"));
});
test("matrix browser screenshots cannot replace star and nebula captures", async () => {
  const changed = await records();
  changed.sky.mobileViewport.screenshots.starDetail = null;
  changed.nebula.desktop.screenshots.heldDetail = null;
  const coverage = expectedVisualCoverageV662(changed);
  assert.equal(coverage.ok, false);
  assert.ok(coverage.issues.includes("screenshot-count-not-88"));
});
test("visual receipt options reject stale build identities", () => {
  assert.deepEqual(parseVisualOptionsV662(["--run-id",
    "20261013v662r75web02", "--matrix-browser-run-id",
    "20261013v662r75web03"]), {
    runId: "20261013v662r75web02",
    matrixBrowserRunId: "20261013v662r75web03",
  });
  assert.throws(() => parseVisualOptionsV662(["--run-id",
    "20261013v660r73web02", "--matrix-browser-run-id",
    "20261013v662r75web03"]));
});
