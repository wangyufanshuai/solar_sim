import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

import {
  V596_ALL_RESERVED_SOURCE_PATHS,
  V596_BASE_SOURCE_MANIFEST_PATH,
  V596_CLOSURE_SOURCE_PATHS,
  V596_DELTA_SOURCE_PATHS,
  V596_PARENT_ARTIFACT_PATHS,
  V596_PARENT_RETIRED_SOURCE_DISPOSITIONS,
  V596_PARENT_RETIRED_SOURCE_PATHS,
  V596_PARENT_VERSION,
  V596_SOURCE_PATHS,
} from "./v596-source-paths.mjs";

test("v596 source contract is an explicit delta over immutable v595", () => {
  assert.equal(V596_PARENT_VERSION, "v595");
  assert.equal(V596_BASE_SOURCE_MANIFEST_PATH, V596_PARENT_ARTIFACT_PATHS.sourceManifest);
  assert.equal(V596_PARENT_ARTIFACT_PATHS.candidateManifest,
    "public/data/stellar-relativity-v595/manifest.json");
  assert.equal(new Set(V596_DELTA_SOURCE_PATHS).size, V596_DELTA_SOURCE_PATHS.length);
  assert.deepEqual(V596_SOURCE_PATHS, V596_DELTA_SOURCE_PATHS);
  assert.equal(V596_CLOSURE_SOURCE_PATHS.length, 8);
  assert.equal(new Set(V596_ALL_RESERVED_SOURCE_PATHS).size,
    V596_ALL_RESERVED_SOURCE_PATHS.length);
});

test("declared v596 source files exist while parent artifacts are never delta", () => {
  for (const path of V596_DELTA_SOURCE_PATHS) assert.equal(existsSync(path), true, path);
  for (const path of Object.values(V596_PARENT_ARTIFACT_PATHS)) {
    assert.equal(V596_ALL_RESERVED_SOURCE_PATHS.includes(path), false, path);
  }
});

test("v595 tmp removals are exact, explicit, and replacement-bound", () => {
  const parent = JSON.parse(readFileSync(V596_BASE_SOURCE_MANIFEST_PATH, "utf8"));
  const parentRows = new Map(
    [...parent.files, ...parent.closureSourcePaths].map((row) => [row.path, row]),
  );
  assert.equal(V596_PARENT_RETIRED_SOURCE_PATHS.length, 14);
  for (const path of V596_PARENT_RETIRED_SOURCE_PATHS) {
    assert.equal(parentRows.has(path), true, path);
    assert.equal(existsSync(path), false, path);
    const disposition = V596_PARENT_RETIRED_SOURCE_DISPOSITIONS[path];
    assert.match(disposition.state, /^retired-parent-/);
    for (const replacement of disposition.replacements) {
      assert.equal(V596_ALL_RESERVED_SOURCE_PATHS.includes(replacement), true, replacement);
    }
  }
});

test("known byte-identical v595 sources are not mislabeled as v596 delta", () => {
  for (const path of [
    "package.json",
    "app/components/AtlasAppShell.tsx",
    "app/components/AtlasSceneCameraBridges.tsx",
    "app/components/AtlasSceneFocusCameraBridge.tsx",
  ]) assert.equal(V596_DELTA_SOURCE_PATHS.includes(path), false, path);
});

test("v596 owns the visible-leap renderer, integration, and final evidence surfaces", () => {
  for (const path of [
    "scripts/build-atlas-profile.mjs",
    "app/components/StellarPortraitMaterialV596.tsx",
    "app/effects/ThreeJsPostPipeline.tsx",
    "app/lib/stellarPortraitRenderContractV596.ts",
    "app/lib/v596FormalEvidenceContract.ts",
    "app/components/V596FormalEvidenceDomSurface.tsx",
    "app/components/V594CdpSoakSurface.tsx",
    "app/lib/v594CdpSoakSurface.test.ts",
    "tmp/v596-browser-evidence-collector.mjs",
    "tmp/v596-24x2-stellar-browser-matrix.mjs",
    "tmp/v596-cdp-renderer-soak-runner.mjs",
  ]) assert.equal(V596_DELTA_SOURCE_PATHS.includes(path), true, path);
});
