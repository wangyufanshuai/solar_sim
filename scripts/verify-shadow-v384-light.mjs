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
run("v384-python-oracle", python, [
  "scripts/run-measured-visible-photon-oracle-v384.py",
]);
run("v384-observable", node, [
  resolve(root, "node_modules/tsx/dist/cli.mjs"),
  "scripts/build-measured-visible-photon-observable-v384.ts",
]);
run("v384-evidence", node, ["scripts/build-shadow-candidate-v384.mjs"]);
const firstEvidenceSha256 = JSON.parse(
  readFileSync(
    resolve(root, "dist/science/orbit-atlas-shadow-v384-evidence.json"),
    "utf8",
  ),
).evidenceSha256;
run("v384-tests", node, [
  resolve(root, "node_modules/vitest/vitest.mjs"),
  "run",
  "app/lib/measuredVisiblePhotonObservableV384.test.ts",
  "app/lib/measuredVisiblePhotonObservableServerV384.test.ts",
  "app/api/atlas/relativity-evidence/v384/visible-photon-observable/route.test.ts",
  "app/components/MeasuredVisiblePhotonObservableSurfaceV384.test.tsx",
  "app/lib/atlasShadowCapabilityPointerV384.test.ts",
]);
run("v384-types", node, [
  resolve(root, "node_modules/typescript/bin/tsc"),
  "--noEmit",
]);
run("v384-evidence-determinism", node, [
  "scripts/build-shadow-candidate-v384.mjs",
]);

const observable = JSON.parse(
  readFileSync(
    resolve(
      root,
      "dist/science/measured-visible-photon-observable-v384/observable.json",
    ),
    "utf8",
  ),
);
const evidence = JSON.parse(
  readFileSync(
    resolve(root, "dist/science/orbit-atlas-shadow-v384-evidence.json"),
    "utf8",
  ),
);
const pointer = JSON.parse(
  readFileSync(
    resolve(
      root,
      "dist/release/orbit-atlas-current-local-shadow-candidate-v384.json",
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
  observable.rows?.length !== 4 ||
  observable.maxima?.unweightedReconstructionRelativeDifference >= 1e-7 ||
  observable.maxima?.pythonOracleRelativeDifference >= 1e-7 ||
  observable.algorithms?.integrationDomainIndependent !== true ||
  observable.authorityBoundary?.photonObservableQualified !== true ||
  observable.authorityBoundary?.detectorElectronExpectationAvailable !== false ||
  observable.authorityBoundary?.observedCountsAvailable !== false ||
  observable.authorityBoundary?.scienceImageAvailable !== false ||
  evidence.boundary?.sourceDossierAvailable !== false ||
  evidence.boundary?.runtimePackagingAllowed !== false ||
  pointer.capabilities?.v384PhotonObservable !==
    "qualified-four-authority-disk-rays" ||
  pointer.localShadowDefaultApplied !== false ||
  forbidden.some((path) => existsSync(resolve(root, path))) ||
  state.status !== "incomplete-0-of-49" ||
  state.completedShardCount !== 0 ||
  state.attemptConsumed !== false ||
  state.aggregateAvailable !== false ||
  formal.version !== "v263-current-product-evidence-pointer" ||
  evidence.browserQualification !== "not-run"
) {
  throw new Error("v384 fail-closed validation failed");
}
console.log(
  JSON.stringify(
    {
      status: "passed-v384-low-memory",
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      rows: observable.rows.length,
      effectiveThroughputRange: [
        Math.min(...observable.rows.map((row) => row.effectiveBandThroughput)),
        Math.max(...observable.rows.map((row) => row.effectiveBandThroughput)),
      ],
      maximumUnweightedReconstructionRelativeDifference:
        observable.maxima.unweightedReconstructionRelativeDifference,
      maximumPythonOracleRelativeDifference:
        observable.maxima.pythonOracleRelativeDifference,
      electronExpectationAvailable: false,
      observedCountsAvailable: false,
      dense: pointer.capabilities.v314CorrectedDense,
      browser: evidence.browserQualification,
    },
    null,
    2,
  ),
);
