import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const node = process.execPath;
const python = process.platform === "win32" ? "python" : "python3";
const run = (label, command, args) => {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    shell: false,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${label} failed with ${result.status}`);
};
run("v383-python-oracle", python, [
  "scripts/run-measured-visible-throughput-oracle-v383.py",
]);
run("v383-normalization", node, [
  resolve(root, "node_modules/tsx/dist/cli.mjs"),
  "scripts/build-measured-visible-throughput-v383.ts",
]);
run("v383-evidence", node, ["scripts/build-shadow-candidate-v383.mjs"]);
const firstEvidenceSha256 = JSON.parse(
  readFileSync(
    resolve(root, "dist/science/orbit-atlas-shadow-v383-evidence.json"),
    "utf8",
  ),
).evidenceSha256;
run("v383-tests", node, [
  resolve(root, "node_modules/vitest/vitest.mjs"),
  "run",
  "app/lib/measuredVisibleThroughputV383.test.ts",
  "app/lib/measuredVisibleThroughputServerV383.test.ts",
  "app/api/atlas/relativity-evidence/v383/visible-throughput/route.test.ts",
  "app/components/MeasuredVisibleThroughputSurfaceV383.test.tsx",
  "app/lib/atlasShadowCapabilityPointerV383.test.ts",
]);
run("v383-types", node, [
  resolve(root, "node_modules/typescript/bin/tsc"),
  "--noEmit",
]);
run("v383-evidence-determinism", node, [
  "scripts/build-shadow-candidate-v383.mjs",
]);

const manifest = JSON.parse(
  readFileSync(
    resolve(root, "dist/science/measured-visible-throughput-v383/manifest.json"),
    "utf8",
  ),
);
const evidence = JSON.parse(
  readFileSync(
    resolve(root, "dist/science/orbit-atlas-shadow-v383-evidence.json"),
    "utf8",
  ),
);
const pointer = JSON.parse(
  readFileSync(
    resolve(
      root,
      "dist/release/orbit-atlas-current-local-shadow-candidate-v383.json",
    ),
    "utf8",
  ),
);
const state = JSON.parse(
  readFileSync(
    resolve(root, "dist/science/kerr-campaign-v314/campaign-state.json"),
    "utf8",
  ),
);
const formal = JSON.parse(
  readFileSync(
    resolve(root, "dist/release/orbit-atlas-current-product-evidence-v263.json"),
    "utf8",
  ),
);
const forbidden = [
  "dist/staging/measured-authority-v382-visible/manifest.json",
  "dist/science/measured-expectation-v375/envelope.json",
  "dist/science/expected-electron-image-v376/image.json",
  "dist/science/expected-electron-image-v376/image.csv",
];
if (
  evidence.evidenceSha256 !== firstEvidenceSha256 ||
  manifest.normalizedProfile?.metrics?.rowCount !== 3301 ||
  manifest.normalizedProfile?.metrics?.interpolationApplied !== false ||
  manifest.dualImplementation?.sourceRowCanonicalShaMatched !== true ||
  manifest.dualImplementation?.maximumMetricRelativeDifference >= 1e-12 ||
  manifest.authorityBoundary?.visibleMeasuredAuthorityGranted !== false ||
  manifest.authorityBoundary?.observedCountsAvailable !== false ||
  evidence.boundary?.sourceDossierAvailable !== false ||
  evidence.boundary?.detectorNoiseAuthorityAvailable !== false ||
  evidence.boundary?.observationGeometryAuthorityAvailable !== false ||
  evidence.boundary?.runtimePackagingAllowed !== false ||
  pointer.capabilities?.v383DualImplementation !==
    "qualified-typescript-float64-vs-python-decimal50" ||
  pointer.localShadowDefaultApplied !== false ||
  forbidden.some((path) => existsSync(resolve(root, path))) ||
  state.status !== "incomplete-0-of-49" ||
  state.completedShardCount !== 0 ||
  state.attemptConsumed !== false ||
  state.aggregateAvailable !== false ||
  formal.version !== "v263-current-product-evidence-pointer" ||
  evidence.browserQualification !== "not-run"
) {
  throw new Error("v383 fail-closed validation failed");
}
console.log(
  JSON.stringify(
    {
      status: "passed-v383-low-memory",
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      rows: manifest.normalizedProfile.metrics.rowCount,
      equivalentWidthAngstrom:
        manifest.normalizedProfile.metrics.equivalentWidthAngstrom,
      pivotWavelengthAngstrom:
        manifest.normalizedProfile.metrics.pivotWavelengthAngstrom,
      maximumMetricRelativeDifference:
        manifest.dualImplementation.maximumMetricRelativeDifference,
      measuredAuthority: false,
      dense: pointer.capabilities.v314CorrectedDense,
      browser: evidence.browserQualification,
    },
    null,
    2,
  ),
);
