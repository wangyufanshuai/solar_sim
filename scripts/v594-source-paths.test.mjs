import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import test from "node:test";

import {
  buildV594SourceBoundaryRecords,
  canonicalShaV594,
} from "./build-v594-stellar-relativity-candidate.mjs";
import {
  V594_ALL_RESERVED_SOURCE_PATHS,
  V594_CLOSURE_SOURCE_PATHS,
  V594_SOURCE_PATHS,
} from "./v594-source-paths.mjs";

const representatives = Object.freeze([
    "app/components/StellarPortraitMaterial.tsx",
    "app/components/PostV593StellarRosterPanel.test.tsx",
    "app/data/stellarProvenanceCandidate.generated.ts",
    "app/lib/stellarPhenomenologyV1.ts",
    "app/lib/stellarPhenomenologyV1.test.ts",
  "tmp/v594-browser-evidence-collector.mjs",
  "scripts/verify-v594-stellar-relativity-candidate.mjs",
]);

test("v594 source identity changes for every representative boundary class", async () => {
  const root = await mkdtemp(resolve(tmpdir(), "v594-source-boundary-"));
  try {
    for (const [index, path] of representatives.entries()) {
      const absolute = resolve(root, path);
      await mkdir(dirname(absolute), { recursive: true });
      await writeFile(absolute, `stable-${index}\n`, "utf8");
    }
    const baseline = canonicalShaV594(buildV594SourceBoundaryRecords(root, representatives));
    for (const [index, path] of representatives.entries()) {
      const absolute = resolve(root, path);
      await writeFile(absolute, `changed-${index}\n`, "utf8");
      const changed = canonicalShaV594(buildV594SourceBoundaryRecords(root, representatives));
      assert.notEqual(changed, baseline, path);
      await writeFile(absolute, `stable-${index}\n`, "utf8");
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("v594 reserved source boundary covers every current lifecycle, soak, texture, and closure artifact", () => {
  const required = [
    "app/components/UniverseCanvas.tsx",
    "app/components/UniverseCanvas.lifecycle-retention.test.tsx",
    "app/components/SolarSystemBodies.tsx",
    "app/data/planetTextureManifest.test.ts",
    "app/lib/postV594SameRealmLifecycle.ts",
    "app/lib/postV594SameRealmLifecycle.test.ts",
    "app/lib/celestialTextures.ts",
    "app/lib/useOptionalTexture.ts",
    "app/lib/useOptionalTexture.test.ts",
    "app/lib/useSolarSystem.ts",
    "tmp/v594-browser-evidence-contract.mjs",
    "tmp/v594-same-realm-lifecycle-runner.mjs",
    "tmp/audit-v594-same-realm-lifecycle.mjs",
    "tmp/audit-v594-same-realm-lifecycle.test.mjs",
    "tmp/v594-cdp-renderer-soak-runner.mjs",
    "tmp/audit-v594-cdp-renderer-soak.mjs",
    "tmp/audit-v594-cdp-renderer-soak.test.mjs",
    "tmp/diagnose-v594-released-baseline-heap-diff.mjs",
    "tmp/v594-heap-snapshot-semantics.mjs",
    "tmp/v594-heap-snapshot-semantics.test.mjs",
    "tmp/v594-released-heap-semantic-contract.mjs",
    "tmp/v594-released-heap-semantic-contract.test.mjs",
    "tmp/v594-24-hero-browser-matrix.mjs",
    "tmp/v594-24-hero-browser-matrix.test.mjs",
    "app/lib/v594ReleasedHeapSemanticProbe.ts",
    "app/lib/v594ReleasedHeapSemanticProbe.test.ts",
    "scripts/build-v594-current-source-lifecycle.mjs",
    "scripts/build-v594-current-source-soak.mjs",
    "scripts/seal-v594-stellar-relativity-candidate.mjs",
    "scripts/verify-v594-stellar-relativity-candidate.mjs",
  ];
  assert.equal(new Set(V594_SOURCE_PATHS).size, V594_SOURCE_PATHS.length);
  assert.equal(new Set(V594_CLOSURE_SOURCE_PATHS).size, V594_CLOSURE_SOURCE_PATHS.length);
  assert.equal(new Set(V594_ALL_RESERVED_SOURCE_PATHS).size, V594_ALL_RESERVED_SOURCE_PATHS.length);
  for (const path of required) assert.ok(V594_ALL_RESERVED_SOURCE_PATHS.includes(path), path);
  for (const path of V594_ALL_RESERVED_SOURCE_PATHS) assert.equal(existsSync(path), true, path);
});
