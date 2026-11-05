import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";

import {
  V595_ALL_RESERVED_SOURCE_PATHS,
  V595_BASE_SOURCE_MANIFEST_PATH,
  V595_CLOSURE_SOURCE_PATHS,
  V595_DELTA_SOURCE_PATHS,
  V595_PARENT_ARTIFACT_PATHS,
  V595_PARENT_VERSION,
  V595_SOURCE_PATHS,
} from "./v595-source-paths.mjs";

test("v595 source contract is an explicit delta over v594", () => {
  assert.equal(V595_PARENT_VERSION, "v594");
  assert.equal(V595_BASE_SOURCE_MANIFEST_PATH, V595_PARENT_ARTIFACT_PATHS.sourceManifest);
  assert.equal(new Set(V595_DELTA_SOURCE_PATHS).size, V595_DELTA_SOURCE_PATHS.length);
  assert.deepEqual(V595_SOURCE_PATHS, V595_DELTA_SOURCE_PATHS);
  assert.equal(V595_CLOSURE_SOURCE_PATHS.length, 8);
  assert.equal(new Set(V595_ALL_RESERVED_SOURCE_PATHS).size, V595_ALL_RESERVED_SOURCE_PATHS.length);
});

test("every declared v595 delta file exists while closure paths may remain reserved", () => {
  for (const path of V595_DELTA_SOURCE_PATHS) assert.equal(existsSync(path), true, path);
  for (const path of Object.values(V595_PARENT_ARTIFACT_PATHS)) {
    assert.equal(V595_ALL_RESERVED_SOURCE_PATHS.includes(path), false, path);
  }
});

test("v595 explicitly owns the optional texture fallback and owner-identity revision", () => {
  assert.equal(V595_DELTA_SOURCE_PATHS.includes("app/lib/useOptionalTexture.ts"), true);
  assert.equal(V595_DELTA_SOURCE_PATHS.includes("app/lib/useOptionalTexture.test.ts"), true);
  assert.equal(V595_DELTA_SOURCE_PATHS.includes("app/components/BodyDetailSidebar.tsx"), true);
  assert.equal(V595_DELTA_SOURCE_PATHS.includes("app/components/AtlasSceneCameraBridges.tsx"), true);
  assert.equal(V595_DELTA_SOURCE_PATHS.includes("app/components/AtlasSceneFocusCameraBridge.tsx"), true);
  assert.equal(V595_DELTA_SOURCE_PATHS.includes("app/components/SpacecraftModel.tsx"), true);
  assert.equal(V595_DELTA_SOURCE_PATHS.includes("app/components/SolarSystemBodies.tsx"), true);
  assert.equal(V595_DELTA_SOURCE_PATHS.includes("public/data/catalog-lite-v7/astrophysical-parameters.json.gz"), true);
});
