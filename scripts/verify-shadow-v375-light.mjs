import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const node = process.execPath;
const run = (label, command, args) => {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    shell: false,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${label} failed with ${result.status}`);
};

run("v375-inspect", node, [
  resolve(root, "node_modules/tsx/dist/cli.mjs"),
  "scripts/inspect-measured-expectation-v375.ts",
]);
run("v375-evidence", node, ["scripts/build-shadow-candidate-v375.mjs"]);
const firstEvidenceSha256 = JSON.parse(
  readFileSync(resolve(root, "dist/science/orbit-atlas-shadow-v375-evidence.json"), "utf8"),
).evidenceSha256;
run("v375-tests", node, [
  resolve(root, "node_modules/vitest/vitest.mjs"),
  "run",
  "app/lib/measuredExpectationAuthorityV375.test.ts",
  "app/lib/measuredExpectationAuthorityInspectV375.test.ts",
  "app/lib/measuredExpectationAuthorityInspectServerV375.test.ts",
  "app/api/atlas/relativity-evidence/v375/measured-expectation/route.test.ts",
  "app/components/MeasuredExpectationAuthoritySurfaceV375.test.tsx",
  "app/lib/atlasShadowCapabilityPointerV375.test.ts",
]);
run("v375-types", node, [
  resolve(root, "node_modules/typescript/bin/tsc"),
  "--noEmit",
]);
run("v375-evidence-determinism", node, ["scripts/build-shadow-candidate-v375.mjs"]);

const evidence = JSON.parse(
  readFileSync(resolve(root, "dist/science/orbit-atlas-shadow-v375-evidence.json"), "utf8"),
);
const pointer = JSON.parse(
  readFileSync(
    resolve(root, "dist/release/orbit-atlas-current-local-shadow-candidate-v375.json"),
    "utf8",
  ),
);
const state = JSON.parse(
  readFileSync(resolve(root, "dist/science/kerr-campaign-v314/campaign-state.json"), "utf8"),
);
const formal = JSON.parse(
  readFileSync(resolve(root, "dist/release/orbit-atlas-current-product-evidence-v263.json"), "utf8"),
);
const forbidden = [
  "dist/science/measured-expectation-v375/envelope.json",
  "dist/release/orbit-atlas-detector-calibration-authority-v367.json",
  "dist/release/orbit-atlas-observation-geometry-authority-v373.json",
  "dist/staging/detector-calibration-v369/observation-geometry.json",
];

if (
  evidence.evidenceSha256 !== firstEvidenceSha256 ||
  evidence.expectation?.presentInputCount !== 1 ||
  evidence.expectation?.photonInputQualified !== true ||
  evidence.expectation?.photonRayCount !== 4 ||
  evidence.expectation?.photonMeasurementCount !== 12 ||
  evidence.expectation?.detectorAuthorityQualified !== false ||
  evidence.expectation?.geometryAuthorityQualified !== false ||
  evidence.expectation?.measuredExpectationAvailable !== false ||
  evidence.expectation?.expectationRowCount !== 0 ||
  evidence.expectation?.attemptConsumed !== false ||
  evidence.expectation?.syntheticFallbackUsed !== false ||
  evidence.authorityBoundary?.expectationCanBecomeObservedCounts !== false ||
  evidence.authorityBoundary?.cinematicConsumerAllowed !== false ||
  evidence.visual?.defaultApplied !== false ||
  evidence.visual?.legacyV9Default !== true ||
  pointer.capabilities?.v328PhotonPayload !==
    "qualified-4-rays-12-band-measurements" ||
  pointer.capabilities?.v367DetectorAuthority !== "unavailable" ||
  pointer.capabilities?.v374GeometryAuthority !== "unavailable" ||
  pointer.capabilities?.v375Input !== "partial-1-of-8" ||
  pointer.capabilities?.v375Build !== "not-run-attempt-unconsumed" ||
  pointer.capabilities?.v375MeasuredExpectation !== "unavailable-0-of-12" ||
  pointer.capabilities?.v375ObservedCounts !==
    "unavailable-expectation-is-not-observation" ||
  pointer.localShadowDefaultApplied !== false ||
  forbidden.some((path) => existsSync(resolve(root, path))) ||
  state.status !== "incomplete-0-of-49" ||
  state.completedShardCount !== 0 ||
  state.attemptConsumed !== false ||
  state.aggregateAvailable !== false ||
  formal.version !== "v263-current-product-evidence-pointer"
) {
  throw new Error("v375 fail-closed validation failed");
}

console.log(
  JSON.stringify(
    {
      status: "passed-v375-low-memory",
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      photon: pointer.capabilities.v328PhotonPayload,
      input: pointer.capabilities.v375Input,
      detectorAuthority: pointer.capabilities.v367DetectorAuthority,
      geometryAuthority: pointer.capabilities.v374GeometryAuthority,
      expectation: pointer.capabilities.v375MeasuredExpectation,
      observedCounts: pointer.capabilities.v375ObservedCounts,
      dense: pointer.capabilities.v314CorrectedDense,
      browser: evidence.browserQualification,
    },
    null,
    2,
  ),
);
