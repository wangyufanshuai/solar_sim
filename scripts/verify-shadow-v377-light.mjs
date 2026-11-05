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
run("v377-visual-audit", node, [
  resolve(root, "node_modules/tsx/dist/cli.mjs"),
  "scripts/build-visual-runtime-v377.ts",
]);
run("v377-evidence", node, ["scripts/build-shadow-candidate-v377.mjs"]);
const firstEvidenceSha256 = JSON.parse(
  readFileSync(resolve(root, "dist/science/orbit-atlas-shadow-v377-evidence.json"), "utf8"),
).evidenceSha256;
run("v377-tests", node, [
  resolve(root, "node_modules/vitest/vitest.mjs"),
  "run",
  "app/lib/atlasVisualProfileV370.test.ts",
  "app/lib/atlasVisualProfileV377.test.ts",
  "app/components/MeasurementLabSurfaceV377.test.tsx",
  "app/lib/atlasShadowCapabilityPointerV377.test.ts",
]);
run("v377-types", node, [
  resolve(root, "node_modules/typescript/bin/tsc"),
  "--noEmit",
]);
run("v377-evidence-determinism", node, ["scripts/build-shadow-candidate-v377.mjs"]);

const evidence = JSON.parse(
  readFileSync(resolve(root, "dist/science/orbit-atlas-shadow-v377-evidence.json"), "utf8"),
);
const pointer = JSON.parse(
  readFileSync(
    resolve(root, "dist/release/orbit-atlas-current-local-shadow-candidate-v377.json"),
    "utf8",
  ),
);
const audit = JSON.parse(
  readFileSync(resolve(root, "dist/science/atlas-visual-v11-v377/audit.json"), "utf8"),
);
const state = JSON.parse(
  readFileSync(resolve(root, "dist/science/kerr-campaign-v314/campaign-state.json"), "utf8"),
);
const formal = JSON.parse(
  readFileSync(resolve(root, "dist/release/orbit-atlas-current-product-evidence-v263.json"), "utf8"),
);
const forbidden = [
  "dist/science/measured-expectation-v375/envelope.json",
  "dist/science/expected-electron-image-v376/image.json",
  "dist/science/expected-electron-image-v376/image.csv",
];
if (
  evidence.evidenceSha256 !== firstEvidenceSha256 ||
  evidence.measurementLab?.presentInputs !== 1 ||
  evidence.measurementLab?.scienceImageCells !== 0 ||
  evidence.measurementLab?.scienceImageAvailable !== false ||
  evidence.measurementLab?.imageArraysExist !== false ||
  evidence.measurementLab?.zeroImageFallbackUsed !== false ||
  evidence.measurementLab?.observedCountsAvailable !== false ||
  evidence.scienceBoundary?.exposure !== 1 ||
  evidence.scienceBoundary?.bloom !== 0 ||
  evidence.scienceBoundary?.noise !== 0 ||
  evidence.scienceBoundary?.sciencePayloadMutationAllowed !== false ||
  evidence.cinematicBoundary?.decorativeSignalsEncodeScience !== false ||
  evidence.visual?.defaultApplied !== false ||
  evidence.visual?.legacyV9Default !== true ||
  audit.ab?.localShadowManualOnly !== true ||
  audit.ab?.formalVisible !== false ||
  audit.ab?.standaloneVisible !== false ||
  audit.ab?.liteVisible !== false ||
  pointer.capabilities?.v375MeasuredExpectation !== "unavailable-0-of-12" ||
  pointer.capabilities?.v376ScienceImage !== "unavailable-no-pixel-arrays" ||
  pointer.capabilities?.v377RuntimeTokens !==
    "hud-and-strong-gravity-consumers-wired" ||
  pointer.capabilities?.v377DefaultBoundary !==
    "manual-local-shadow-only-default-legacy-v9" ||
  pointer.localShadowDefaultApplied !== false ||
  forbidden.some((path) => existsSync(resolve(root, path))) ||
  state.status !== "incomplete-0-of-49" ||
  state.completedShardCount !== 0 ||
  state.attemptConsumed !== false ||
  state.aggregateAvailable !== false ||
  formal.version !== "v263-current-product-evidence-pointer" ||
  evidence.browserQualification !== "not-run"
) {
  throw new Error("v377 fail-closed validation failed");
}
console.log(
  JSON.stringify(
    {
      status: "passed-v377-low-memory",
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      profile: pointer.capabilities.v377VisualProfile,
      input: `${evidence.measurementLab.presentInputs}/8`,
      imageCells: evidence.measurementLab.scienceImageCells,
      science: `${evidence.scienceBoundary.exposure}/${evidence.scienceBoundary.bloom}/${evidence.scienceBoundary.noise}`,
      dense: pointer.capabilities.v314CorrectedDense,
      browser: evidence.browserQualification,
    },
    null,
    2,
  ),
);
