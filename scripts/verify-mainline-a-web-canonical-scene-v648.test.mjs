import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  auditWebCanonicalSceneV648,
  inspectWebCanonicalSceneV648,
  replayWebCanonicalSceneV648,
} from "./verify-mainline-a-web-canonical-scene-v648.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const RUN = "20261007-v648scene05";
const BUILD = "docs/release/v607/mainline-a-r66-build-20261007-v648web01.json";
const MANIFEST = "app/data/mainlineACanonicalCoverageV622.generated.json";
const read = (relative) => readFile(path.join(ROOT, relative));

let fixturePromise;
function fixture() {
  fixturePromise ??= (async () => {
    const [desktopBytes, mobileBytes, buildBytes, manifestBytes] = await Promise.all([
      read(`docs/release/v607/mainline-a-r66-web-canonical-scene-desktop-raw-${RUN}.json`),
      read(`docs/release/v607/mainline-a-r66-web-canonical-scene-mobile-raw-${RUN}.json`),
      read(BUILD), read(MANIFEST),
    ]);
    const raws = { desktop: JSON.parse(desktopBytes.toString("utf8")),
      mobile: JSON.parse(mobileBytes.toString("utf8")) };
    const screenshotPaths = Object.values(raws).flatMap((raw) => raw.items
      .map((item) => item.screenshot.path));
    const screenshots = Object.fromEntries(await Promise.all(screenshotPaths
      .map(async (relative) => [relative, await read(relative)])));
    const build = JSON.parse(buildBytes.toString("utf8"));
    return { raws, build, manifest: JSON.parse(manifestBytes.toString("utf8")),
      manifestBytes, sourceSha256: build.inputBefore.sha256, runId: RUN, screenshots };
  })();
  return fixturePromise;
}

function altered(input, change) {
  const copy = { ...input, raws: structuredClone(input.raws),
    manifest: structuredClone(input.manifest), screenshots: { ...input.screenshots } };
  change(copy);
  return inspectWebCanonicalSceneV648(copy);
}

test("current V648 build selects all 36 real scene targets in both local viewports", async () => {
  const result = inspectWebCanonicalSceneV648(await fixture());
  assert.equal(result.status, "verified-local-browser-scenes-candidate");
  assert.deepEqual(result.issues, []);
  assert.deepEqual(result.counts, { desktopSelectedReady: 36,
    mobileViewportSelectedReady: 36, screenshotsHashed: 72, humanRightsSigned: 0 });
  assert.equal(result.physicalMobile, "not-run");
  assert.equal(result.publicWebRelease, "blocked");
});

test("one omitted star cannot be hidden by retaining the 36-count header", async () => {
  const result = altered(await fixture(), ({ raws }) => {
    raws.mobile.items.splice(1, 1);
  });
  assert.equal(result.status, "failed");
  assert.ok(result.issues.includes("mobile:coverage-or-order-invalid"));
});

test("a stale resource readout cannot be reported as ready", async () => {
  const result = altered(await fixture(), ({ raws }) => {
    raws.desktop.items[3].runtime = "运行时对象：star:sirius-a · loading";
  });
  assert.equal(result.status, "failed");
  assert.ok(result.issues.includes("desktop:star:sirius-a:runtime-not-ready"));
});

test("a forged selection or passport fails even with the right screenshot", async () => {
  const result = altered(await fixture(), ({ raws }) => {
    raws.mobile.items[12].observed.selectedCatalogId = "constellation:Tau";
  });
  assert.equal(result.status, "failed");
  assert.ok(result.issues.includes("mobile:constellation:Ori:selection-or-passport-invalid"));
});

test("nebula copyright promotion is rejected before human signoff", async () => {
  const result = altered(await fixture(), ({ raws }) => {
    raws.desktop.items[24].observed.nebula.rights = "signed";
  });
  assert.equal(result.status, "failed");
  assert.ok(result.issues.includes("desktop:nebula:m42:scene-image-or-rights-invalid"));
});

test("a source-build substitution fails independent of image hashes", async () => {
  const result = altered(await fixture(), ({ raws }) => {
    raws.mobile.build.sourceSha256 = "f".repeat(64);
  });
  assert.equal(result.status, "failed");
  assert.ok(result.issues.includes("mobile:build-drift"));
});

test("one altered screenshot fails its recomputed SHA-256", async () => {
  const result = altered(await fixture(), (copy) => {
    const relative = copy.raws.mobile.items[25].screenshot.path;
    copy.screenshots[relative] = Buffer.from(copy.screenshots[relative]);
    copy.screenshots[relative][40] ^= 1;
  });
  assert.equal(result.status, "failed");
  assert.ok(result.issues.includes("mobile:nebula:m1:screenshot-digest-invalid"));
});

test("manifest scientific admission is not inferred from a ready browser scene", async () => {
  const result = altered(await fixture(), ({ manifest }) => {
    manifest.records[0].measurementAdmission = "admitted";
  });
  assert.equal(result.status, "failed");
  assert.ok(result.issues.includes("star:alpha-centauri-a:manifest-promoted"));
});

test("a mobile viewport cannot be relabeled as a physical device", async () => {
  const result = altered(await fixture(), ({ raws }) => {
    raws.mobile.physicalDevice = true;
  });
  assert.equal(result.status, "failed");
  assert.ok(result.issues.includes("mobile:raw-identity-invalid"));
});

test("offline replay rejects a forged public release claim", async () => {
  const fresh = await auditWebCanonicalSceneV648(RUN);
  assert.equal(fresh.status, "verified-local-browser-scenes-candidate");
  const saved = structuredClone(fresh);
  saved.claims.publicWebReleaseApproved = true;
  assert.throws(() => replayWebCanonicalSceneV648(saved, fresh),
    /saved-replay-mismatch/);
});
