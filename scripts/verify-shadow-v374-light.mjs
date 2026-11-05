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

run("v374-inspect", node, [
  resolve(root, "node_modules/tsx/dist/cli.mjs"),
  "scripts/inspect-observation-geometry-v374.ts",
]);
run("v374-evidence", node, ["scripts/build-shadow-candidate-v374.mjs"]);
const firstEvidenceSha256 = JSON.parse(
  readFileSync(resolve(root, "dist/science/orbit-atlas-shadow-v374-evidence.json"), "utf8"),
).evidenceSha256;
run("v374-tests", node, [
  resolve(root, "node_modules/vitest/vitest.mjs"),
  "run",
  "app/lib/observationGeometryRuntimePublicationV374.test.ts",
  "app/lib/observationGeometryRuntimePublicationInspectV374.test.ts",
  "app/lib/observationGeometryRuntimePublicationInspectServerV374.test.ts",
  "app/api/atlas/relativity-evidence/v374/geometry-publication/route.test.ts",
  "app/components/ObservationGeometryRuntimePublicationSurfaceV374.test.tsx",
  "app/lib/atlasShadowCapabilityPointerV374.test.ts",
]);
run("v374-types", node, [
  resolve(root, "node_modules/typescript/bin/tsc"),
  "--noEmit",
]);
run("v374-evidence-determinism", node, ["scripts/build-shadow-candidate-v374.mjs"]);

const evidence = JSON.parse(
  readFileSync(resolve(root, "dist/science/orbit-atlas-shadow-v374-evidence.json"), "utf8"),
);
const pointer = JSON.parse(
  readFileSync(
    resolve(root, "dist/release/orbit-atlas-current-local-shadow-candidate-v374.json"),
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
  "dist/science/observation-geometry-v374/publication.json",
  "dist/release/orbit-atlas-observation-geometry-authority-v373.json",
  "dist/science/observation-geometry-v373/admission.json",
  "dist/science/observation-geometry-v372/validation.json",
  "dist/science/observation-geometry-v371/geometry.candidate.json",
  "dist/staging/detector-calibration-v369/observation-geometry.json",
];

if (
  evidence.evidenceSha256 !== firstEvidenceSha256 ||
  evidence.publication?.presentInputCount !== 0 ||
  evidence.publication?.publicationExecuted !== false ||
  evidence.publication?.runtimeGeometryPublished !== false ||
  evidence.publication?.measuredAuthorityAvailable !== false ||
  evidence.publication?.measuredExpectationAvailable !== false ||
  evidence.publication?.attemptConsumed !== false ||
  evidence.publication?.automaticPromotionAllowed !== false ||
  evidence.runtimeBoundary?.detectorAuthorityStillRequired !== true ||
  evidence.runtimeBoundary?.measuredExpectationAvailable !== false ||
  evidence.runtimeBoundary?.syntheticFallbackUsed !== false ||
  evidence.visual?.defaultApplied !== false ||
  evidence.visual?.legacyV9Default !== true ||
  pointer.capabilities?.v374Publisher !==
    "implemented-nine-input-authority-revalidation" ||
  pointer.capabilities?.v374Input !== "blocked-0-of-9" ||
  pointer.capabilities?.v374Publication !== "not-run-attempt-unconsumed" ||
  pointer.capabilities?.v374RuntimeGeometry !== "unavailable" ||
  pointer.capabilities?.v374MeasuredAuthority !==
    "unavailable-no-v373-authority-pointer" ||
  pointer.capabilities?.v374MeasuredExpectation !==
    "unavailable-detector-and-geometry-authority-required" ||
  pointer.localShadowDefaultApplied !== false ||
  forbidden.some((path) => existsSync(resolve(root, path))) ||
  state.status !== "incomplete-0-of-49" ||
  state.completedShardCount !== 0 ||
  state.attemptConsumed !== false ||
  state.aggregateAvailable !== false ||
  formal.version !== "v263-current-product-evidence-pointer"
) {
  throw new Error("v374 fail-closed validation failed");
}

console.log(
  JSON.stringify(
    {
      status: "passed-v374-low-memory",
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      publisher: pointer.capabilities.v374Publisher,
      input: pointer.capabilities.v374Input,
      publication: pointer.capabilities.v374Publication,
      runtimeGeometry: pointer.capabilities.v374RuntimeGeometry,
      authority: pointer.capabilities.v374MeasuredAuthority,
      expectation: pointer.capabilities.v374MeasuredExpectation,
      dense: pointer.capabilities.v314CorrectedDense,
      browser: evidence.browserQualification,
    },
    null,
    2,
  ),
);
