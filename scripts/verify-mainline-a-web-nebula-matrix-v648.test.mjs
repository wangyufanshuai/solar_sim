import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  auditWebNebulaMatrixV648,
  inspectWebNebulaMatrixV648,
  replayWebNebulaMatrixV648,
} from "./verify-mainline-a-web-nebula-matrix-v648.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const RUN = "20261007-v648matrix02";
const RAW = `docs/release/v607/mainline-a-r66-web-nebula-matrix-raw-${RUN}.json`;
const BUILD = "docs/release/v607/mainline-a-r66-build-20261007-v648web01.json";
const MANIFEST = "app/data/mainlineACanonicalCoverageV622.generated.json";
const read = (relative) => readFile(path.join(ROOT, relative));

let bundlePromise;
function bundle() {
  bundlePromise ??= (async () => {
    const [rawBytes, buildBytes, manifestBytes] = await Promise.all([
      read(RAW), read(BUILD), read(MANIFEST),
    ]);
    const raw = JSON.parse(rawBytes.toString("utf8"));
    const build = JSON.parse(buildBytes.toString("utf8"));
    const manifest = JSON.parse(manifestBytes.toString("utf8"));
    const rows = manifest.records.filter((row) => row.kind === "nebula");
    const assetBytes = Object.fromEntries(await Promise.all(rows.map(async (row) =>
      [row.route.assetPath, await read(row.route.assetPath)])));
    const items = [...raw.desktop.items, ...raw.mobile.items];
    const screenshotBytes = Object.fromEntries(await Promise.all(items.map(async (item) =>
      [item.screenshot.path, await read(item.screenshot.path)])));
    return { raw, build, manifest, manifestBytes,
      sourceSha256: build.inputBefore.sha256, runId: RUN,
      assetBytes, screenshotBytes };
  })();
  return bundlePromise;
}
function mutated(input, update) {
  const changed = { ...input, raw: structuredClone(input.raw),
    screenshotBytes: { ...input.screenshotBytes }, assetBytes: { ...input.assetBytes } };
  update(changed);
  return inspectWebNebulaMatrixV648(changed);
}

test("all 12 A-line previews remain painted in two local viewports and rights-pending", async () => {
  const inspected = inspectWebNebulaMatrixV648(await bundle());
  assert.equal(inspected.status, "verified-local-browser-matrix-candidate");
  assert.deepEqual(inspected.issues, []);
  assert.equal(inspected.counts.desktopPainted, 12);
  assert.equal(inspected.counts.mobilePainted, 12);
  assert.equal(inspected.publicWebRelease, "blocked");
});

test("a forged copyright signoff fails without changing the screenshot", async () => {
  const inspected = mutated(await bundle(), ({ raw }) => {
    raw.mobile.items[0].observed.rights.humanReview = "signed";
  });
  assert.equal(inspected.status, "failed");
  assert.ok(inspected.issues.includes("mobile-m42-rights-or-source-promoted"));
});

test("an image captured before opacity settles fails visual admission", async () => {
  const inspected = mutated(await bundle(), ({ raw }) => {
    raw.desktop.items[1].observed.preview.opacity = 0.7;
  });
  assert.equal(inspected.status, "failed");
  assert.ok(inspected.issues.includes("desktop-m1-preview-not-painted"));
});

test("a modified PNG fails its screenshot digest", async () => {
  const inspected = mutated(await bundle(), (input) => {
    const name = input.raw.mobile.items[2].screenshot.path;
    input.screenshotBytes[name] = Buffer.from(input.screenshotBytes[name]);
    input.screenshotBytes[name][30] ^= 1;
  });
  assert.equal(inspected.status, "failed");
  assert.ok(inspected.issues.includes("mobile-m8-screenshot-digest-drift"));
});

test("source substitution fails against the canonical manifest", async () => {
  const inspected = mutated(await bundle(), ({ raw }) => {
    raw.desktop.items[3].observed.rights.sourceHref = "https://example.com/fake";
  });
  assert.equal(inspected.status, "failed");
  assert.ok(inspected.issues.includes("desktop-m16-rights-or-source-promoted"));
});

test("fault injection cannot be presented as a real source failure", async () => {
  const inspected = mutated(await bundle(), ({ raw }) => {
    raw.failureRecovery.realExternalSourceFailure = true;
  });
  assert.equal(inspected.status, "failed");
  assert.ok(inspected.issues.includes("fault-injection-recovery-invalid"));
});

test("saved receipt replay rejects a promoted release claim", async () => {
  const fresh = await auditWebNebulaMatrixV648(RAW);
  assert.equal(fresh.status, "verified-local-browser-matrix-candidate");
  const saved = structuredClone(fresh);
  saved.claims.publicWebReleaseApproved = true;
  assert.throws(() => replayWebNebulaMatrixV648(saved, fresh),
    /saved-replay-mismatch/);
});
