import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  auditWebPointerMatrixV649,
  inspectWebPointerMatrixV649,
  replayWebPointerMatrixV649,
} from "./verify-mainline-a-web-pointer-matrix-v649.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const RUN = "20261011-v649pointer02";
const BUILD = "docs/release/v607/mainline-a-r66-build-20261011-v649web02.json";
const MANIFEST = "app/data/mainlineACanonicalCoverageV622.generated.json";
const read = (relative) => readFile(path.join(ROOT, relative));

let bundlePromise;
function bundle() {
  bundlePromise ??= (async () => {
    const [desktopBytes, mobileBytes, buildBytes, manifestBytes] = await Promise.all([
      read(`docs/release/v607/mainline-a-r66-web-pointer-desktop-raw-${RUN}.json`),
      read(`docs/release/v607/mainline-a-r66-web-pointer-mobile-raw-${RUN}.json`),
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
  return bundlePromise;
}

function altered(input, change) {
  const copy = { ...input, raws: structuredClone(input.raws),
    manifest: structuredClone(input.manifest), screenshots: { ...input.screenshots } };
  change(copy);
  return inspectWebPointerMatrixV649(copy);
}

test("all 36 canonical targets admit real pointer routes in both local viewports", async () => {
  const result = inspectWebPointerMatrixV649(await bundle());
  assert.equal(result.status, "verified-local-pointer-matrix-candidate");
  assert.deepEqual(result.issues, []);
  assert.deepEqual(result.counts, { desktopPointerReady: 36,
    mobilePointerReady: 36, screenshotHashes: 72,
    keyboardActivations: 0, humanRightsSigned: 0 });
  assert.equal(result.publicWebRelease, "blocked");
  assert.equal(result.physicalMobile, "not-run");
});

test("mobile keyboard fallback cannot masquerade as a pointer-only route", async () => {
  const result = altered(await bundle(), ({ raws }) => {
    raws.mobile.counts.keyboardActivations = 1;
  });
  assert.equal(result.status, "failed");
  assert.ok(result.issues.includes("mobile:counts-or-browser-errors-invalid"));
});

test("an intercepted M42 section button invalidates mobile pointer evidence", async () => {
  const result = altered(await bundle(), ({ raws }) => {
    const pointer = raws.mobile.items[24].selection.pointer;
    pointer.find((item) => item.label === "expand-deep-sky-over-passport-trigger").targetOwnsHit = false;
  });
  assert.equal(result.status, "failed");
  assert.ok(result.issues.includes(
    "mobile:nebula:m42:pointer-hit-invalid:expand-deep-sky-over-passport-trigger"));
});

test("the formerly obstructed close control must itself be exercised", async () => {
  const result = altered(await bundle(), ({ raws }) => {
    raws.mobile.items[24].selection.pointer = raws.mobile.items[24].selection.pointer
      .filter((item) => item.label !== "close-object-browser-over-passport-trigger");
  });
  assert.equal(result.status, "failed");
  assert.ok(result.issues.includes(
    "mobile:nebula:m42:previously-occluded-controls-not-tested"));
});

test("mobile nebula selection cannot leave the browser over the scene", async () => {
  const result = altered(await bundle(), ({ raws }) => {
    raws.mobile.items[25].selection.browserAutoClosed = false;
  });
  assert.equal(result.status, "failed");
  assert.ok(result.issues.includes("mobile:nebula:m1:browser-not-auto-closed"));
});

test("a missing canonical star fails exact 36-object coverage", async () => {
  const result = altered(await bundle(), ({ raws }) => {
    raws.desktop.items.splice(0, 1);
  });
  assert.equal(result.status, "failed");
  assert.ok(result.issues.includes("desktop:coverage-or-order-invalid"));
});

test("modified screenshots fail their SHA-256 even with unchanged DOM state", async () => {
  const result = altered(await bundle(), (copy) => {
    const relative = copy.raws.mobile.items[24].screenshot.path;
    copy.screenshots[relative] = Buffer.from(copy.screenshots[relative]);
    copy.screenshots[relative][40] ^= 1;
  });
  assert.equal(result.status, "failed");
  assert.ok(result.issues.includes("mobile:nebula:m42:screenshot-digest-invalid"));
});

test("rights promotion is not inferred from a painted M42 scene", async () => {
  const result = altered(await bundle(), ({ raws }) => {
    raws.desktop.items[24].observed.nebula.rights = "signed";
  });
  assert.equal(result.status, "failed");
  assert.ok(result.issues.includes("desktop:nebula:m42:scene-image-or-rights-invalid"));
});

test("build substitution fails regardless of pointer and screenshot results", async () => {
  const result = altered(await bundle(), ({ raws }) => {
    raws.mobile.build.sourceSha256 = "a".repeat(64);
  });
  assert.equal(result.status, "failed");
  assert.ok(result.issues.includes("mobile:build-drift"));
});

test("a manifest admission edit cannot promote scientific payloads", async () => {
  const result = altered(await bundle(), ({ manifest }) => {
    manifest.records[0].scientificPayloadWriteback = true;
  });
  assert.equal(result.status, "failed");
  assert.ok(result.issues.includes("star:alpha-centauri-a:manifest-promoted"));
});

test("saved replay rejects a forged public release claim", async () => {
  const fresh = await auditWebPointerMatrixV649(RUN);
  assert.equal(fresh.status, "verified-local-pointer-matrix-candidate");
  const saved = structuredClone(fresh);
  saved.claims.publicWebReleaseApproved = true;
  assert.throws(() => replayWebPointerMatrixV649(saved, fresh),
    /saved-replay-mismatch/);
});
