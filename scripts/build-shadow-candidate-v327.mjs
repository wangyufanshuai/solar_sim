import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = {
  v326Evidence: "dist/science/orbit-atlas-shadow-v326-evidence.json",
  v326Pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v326.json",
  ab: "dist/science/kerr-science-cinematic-ab-v327/swatches.json",
  state: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v327-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v327.json",
};
const bytes = (relative) => readFileSync(resolve(root, relative));
const text = (relative) => bytes(relative).toString("utf8");
const read = (relative) => JSON.parse(text(relative));
const fileSha = (relative) => createHash("sha256").update(bytes(relative)).digest("hex");
const canonicalize = (value) => Array.isArray(value) ? value.map(canonicalize)
  : !value || typeof value !== "object" ? value
    : Object.fromEntries(Object.entries(value)
      .filter(([key]) => !["generatedAt", "artifactSha256", "pointerSha256", "pid", "host", "absolutePath", "peakRssGiB", "freeMemoryGiB", "freeDiskGiB", "elapsedSeconds"].includes(key))
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, canonicalize(entry)]));
const sha = (value) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const atomic = (relative, value) => {
  const target = resolve(root, relative);
  mkdirSync(dirname(target), { recursive: true });
  const temporary = `${target}.${process.pid}.part`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`);
  renameSync(temporary, target);
};

const v326Evidence = read(paths.v326Evidence);
const v326Pointer = read(paths.v326Pointer);
const artifact = read(paths.ab);
const view = artifact.view ?? {};
const state = read(paths.state);
const formal = read(paths.formal);
const hudSource = text("app/components/KerrScienceBandHudV322.tsx");
const componentSource = text("app/components/KerrScienceCinematicABV327.tsx");
const modelSource = text("app/lib/kerrScienceCinematicABV327.ts");
if (v326Evidence.status !== "uncertainty-provenance-wired-browser-pending-dense-incomplete-0-of-49"
  || v326Pointer.capabilities?.v326UncertaintyProvenance !== "json-csv-sanitized-twelve-derived-rows"
  || artifact.artifactSha256 !== "414bc7cff8bea20b05cfc2d26b9303d6dd30dd8346edd404fe9f29f7b8ab0592"
  || view.status !== "qualified-deterministic-science-cinematic-ab" || !Array.isArray(view.swatches) || view.swatches.length !== 4
  || view.scienceValuesUnchanged !== true || view.scienceBuffersDisjoint !== true || view.cinematicBuffersDisjoint !== true || view.profileOutputsDistinct !== true
  || view.presentationMapping !== "v305-production-cinematic-rgba-from-bounded-four-disk-ray-reference"
  || view.source?.denseAggregateSha256 !== null
  || state.status !== "incomplete-0-of-49" || state.completedShardCount !== 0 || state.attemptConsumed !== false || state.aggregateAvailable !== false
  || formal.version !== "v263-current-product-evidence-pointer" || formal.publicDeploymentBlocked !== true
  || !hudSource.includes("KerrScienceCinematicABV327")
  || !componentSource.includes("production v305 mapping") || componentSource.includes("<canvas") || componentSource.includes("Math.random")
  || !modelSource.includes("createKerrCinematicRgbaV305") || !modelSource.includes("resolveKerrStrongGravityVisualContractV305")) throw new Error("v327 dependency, A/B or runtime boundary mismatch");

const sourcePaths = [
  "scripts/build-kerr-science-cinematic-ab-v327.ts",
  "scripts/build-shadow-candidate-v327.mjs",
  "scripts/verify-shadow-v327-light.mjs",
  "scripts/atlas.mjs",
  "app/lib/kerrScienceCinematicABV327.ts",
  "app/lib/kerrScienceCinematicABV327.test.ts",
  "app/lib/kerrScienceCinematicABV327.generated.test.ts",
  "app/components/KerrScienceCinematicABV327.tsx",
  "app/components/KerrScienceCinematicABV327.test.ts",
  "app/components/KerrScienceBandHudV322.tsx",
  "app/components/KerrScienceBandHudV322.test.ts",
  "app/lib/atlasShadowCapabilityPointerV327.ts",
  "app/lib/atlasShadowCapabilityPointerV327.test.ts",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const evidenceUnsigned = {
  version: "orbit-atlas-shadow-v327-evidence-v1",
  generatedAt: new Date().toISOString(),
  status: "science-cinematic-ab-wired-browser-pending-dense-incomplete-0-of-49",
  dependency: {
    v326EvidenceSha256: v326Evidence.evidenceSha256,
    v326PointerSha256: v326Pointer.pointerSha256,
    abArtifactSha256: artifact.artifactSha256,
    fullShortAuthoritySha256: state.authority?.fullShortAuthoritySha256 ?? null,
  },
  visual: {
    swatchCount: view.swatches.length,
    profiles: view.profiles,
    tokens: view.tokens,
    presentationMapping: view.presentationMapping,
    profileOutputsDistinct: view.profileOutputsDistinct,
  },
  science: {
    valuesUnchanged: view.scienceValuesUnchanged,
    buffersDisjoint: view.scienceBuffersDisjoint,
    cinematicBuffersDisjoint: view.cinematicBuffersDisjoint,
    scienceBoundary: view.scienceBoundary,
    cinematicBoundary: view.cinematicBoundary,
    denseAggregateAccepted: false,
  },
  runtime: { hudWired: true, scienceIntentOnly: true, cinematicPanelHidden: true, extraCanvasCreated: false, browserQualification: "not-run" },
  correctedCampaign: { namespace: "v314", status: state.status, completedShardCount: state.completedShardCount, plannedShardCount: state.plannedShardCount, attemptConsumed: state.attemptConsumed, aggregateAvailable: state.aggregateAvailable, stateSha256: state.stateSha256 },
  sourceManifest,
  sourceSha256: sha(sourceManifest),
  release: { formalProductPointer: "v263", formalProductPointerSha256: fileSha(paths.formal), formalProductPointerAdvanced: false, localShadowDefaultApplied: false, publicDeploymentBlocked: true },
  boundary: "deterministic-science-cinematic-ab-runtime-wired-dense-incomplete-browser-and-heavy-gates-not-run",
};
const evidence = { ...evidenceUnsigned, evidenceSha256: sha(evidenceUnsigned) };
atomic(paths.evidence, evidence);
const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v327",
  generatedAt: new Date().toISOString(),
  status: "science-cinematic-ab-wired-browser-pending-dense-incomplete-0-of-49",
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v326UncertaintyProvenance: "json-csv-sanitized-twelve-derived-rows",
    v327ScienceCinematicAB: "four-ray-science-v5-v6-deterministic-swatches",
    v327ProductionMapping: "v305-cinematic-rgba-token-consumer",
    v327ScienceIsolation: "values-unchanged-buffers-disjoint",
    v327BrowserGate: "authored-not-run",
    cpuScienceAuthority: "v312-geometry+v313-polarization",
    v314CorrectedDense: "incomplete-0-of-49",
    denseAggregate: "unavailable",
    v5V6Profiles: "manual-local-shadow-only-not-default",
    browserQualification: "not-run",
  },
  evidence: { path: paths.evidence, fileSha256: fileSha(paths.evidence), canonicalSha256: evidence.evidenceSha256 },
};
const pointer = { ...pointerUnsigned, pointerSha256: sha(pointerUnsigned) };
atomic(paths.pointer, pointer);
console.log(JSON.stringify({ status: pointer.status, evidenceSha256: evidence.evidenceSha256, pointerSha256: pointer.pointerSha256, swatches: evidence.visual.swatchCount, profileOutputsDistinct: evidence.visual.profileOutputsDistinct, dense: pointer.capabilities.v314CorrectedDense }, null, 2));
