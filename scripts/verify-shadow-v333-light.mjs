import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const node = process.execPath;
function run(label, command, args) {
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit", shell: false });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${label} failed with ${result.status}`);
}

run("v333-vitest", node, [resolve(root, "node_modules/vitest/vitest.mjs"), "run",
  "app/components/KerrScienceObservatoryHeaderV333.test.ts",
  "app/components/KerrScienceBandHudV322.test.ts",
  "app/lib/atlasShadowCapabilityPointerV333.test.ts",
]);
run("v333-types", node, [resolve(root, "node_modules/typescript/bin/tsc"), "--noEmit"]);
run("v333-eslint", node, [resolve(root, "node_modules/eslint/bin/eslint.js"), "--max-warnings=0",
  "scripts/build-kerr-science-observatory-visual-audit-v333.mjs",
  "scripts/build-shadow-candidate-v333.mjs",
  "scripts/verify-shadow-v333-light.mjs",
  "scripts/atlas.mjs",
  "app/components/KerrScienceObservatoryHeaderV333.tsx",
  "app/components/KerrScienceObservatoryHeaderV333.test.ts",
  "app/components/KerrScienceBandHudV322.tsx",
  "app/components/KerrScienceBandHudV322.test.ts",
  "app/lib/atlasShadowCapabilityPointerV333.ts",
  "app/lib/atlasShadowCapabilityPointerV333.test.ts",
]);

const read = (relative) => JSON.parse(readFileSync(resolve(root, relative), "utf8"));
const evidence = read("dist/science/orbit-atlas-shadow-v333-evidence.json");
const pointer = read("dist/release/orbit-atlas-current-local-shadow-candidate-v333.json");
const audit = read("dist/science/kerr-science-observatory-v333/visual-audit.json");
const state = read("dist/science/kerr-campaign-v314/campaign-state.json");
const formal = read("dist/release/orbit-atlas-current-product-evidence-v263.json");
if (evidence.visual?.direction !== "deep-space-precision-instrument" || evidence.visual?.singleHeaderRuntimeConsumer !== true
  || evidence.visual?.spectralRail?.join(",") !== "visible,euv,soft-x-ray" || evidence.visual?.noMojibake !== true
  || evidence.runtime?.telemetryOnly !== true || evidence.runtime?.scienceDisplay !== "linear-no-grade" || evidence.runtime?.cinematicPresentationCopyDisjoint !== true
  || evidence.runtime?.noCanvas !== true || evidence.runtime?.noNetwork !== true || evidence.runtime?.noRandomness !== true || evidence.runtime?.noPhysicsMutationSurface !== true
  || audit.status !== "qualified-static-precision-console-browser-pending"
  || pointer.capabilities?.v333ScienceHud !== "single-runtime-header-three-band-rail-authority-boundaries"
  || pointer.capabilities?.v333Utf8Audit !== "semantic-codepoints-qualified-no-mojibake"
  || pointer.formalProductPointer !== "v263" || pointer.localShadowDefaultApplied !== false
  || formal.version !== "v263-current-product-evidence-pointer"
  || state.status !== "incomplete-0-of-49" || state.completedShardCount !== 0 || state.attemptConsumed !== false || state.aggregateAvailable !== false) throw new Error("v333 fail-closed validation failed");
console.log(JSON.stringify({ status: "passed-v333-low-memory", evidenceSha256: evidence.evidenceSha256, pointerSha256: pointer.pointerSha256, visualDirection: evidence.visual.direction, checks: Object.keys(audit.checks ?? {}).length, dense: pointer.capabilities.v314CorrectedDense }, null, 2));
