import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import {
  ATLAS_SCIENCE_CINEMATIC_V8_ID_V472,
  ATLAS_V8_TOKEN_CONSUMER_BINDINGS_V472,
  ATLAS_V8_TOKEN_PATHS_V472,
  auditAtlasScienceCinematicV8V472,
  resolveAtlasScienceCinematicV8V472,
} from "../app/lib/atlasScienceCinematicV8V472";

type Json = Record<string, unknown>;

const root = process.cwd();
const paths = Object.freeze({
  v471: "dist/science/kerr-observable-provenance-v471/observable-matrix.json",
  v457Evidence: "dist/science/orbit-atlas-shadow-v457-evidence.json",
  v7Source: "app/lib/atlasScienceCinematicV7V457.ts",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  output: "dist/science/atlas-science-cinematic-v8-v472/profile-audit.json",
});
const transient = new Set(["generatedAt", "artifactSha256", "evidenceSha256", "pointerSha256"]);
const read = (path: string): Json =>
  JSON.parse(readFileSync(resolve(root, path), "utf8")) as Json;
const fileSha = (path: string) =>
  createHash("sha256").update(readFileSync(resolve(root, path))).digest("hex");
const canonicalize = (value: unknown): unknown =>
  Array.isArray(value)
    ? value.map(canonicalize)
    : !value || typeof value !== "object"
      ? value
      : Object.fromEntries(
          Object.entries(value)
            .filter(([key]) => !transient.has(key))
            .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
            .map(([key, entry]) => [key, canonicalize(entry)]),
        );
const canonicalSha = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const atomic = (path: string, value: unknown) => {
  const target = resolve(root, path);
  mkdirSync(dirname(target), { recursive: true });
  const part = target + "." + process.pid + ".part";
  writeFileSync(part, JSON.stringify(value, null, 2) + "\n", "utf8");
  renameSync(part, target);
};

const observable = read(paths.v471);
const v457Evidence = read(paths.v457Evidence);
const dense = read(paths.dense);
const formal = read(paths.formal);
const formalEvidence = read(String(formal.source));
const v7ManifestEntry = (v457Evidence.sourceManifest as Json[])?.find(
  (entry) => entry.path === paths.v7Source,
);
const audit = auditAtlasScienceCinematicV8V472();
const science = resolveAtlasScienceCinematicV8V472("science");
const cinematic = resolveAtlasScienceCinematicV8V472("cinematic");

if (
  observable.status !== "observable-provenance-qualified-production-blocked-browser-pending" ||
  (observable.summary as Json)?.availableRowCount !== 9 ||
  (observable.summary as Json)?.productionAuthorityGrantedRowCount !== 0 ||
  !v7ManifestEntry ||
  v7ManifestEntry.sha256 !== fileSha(paths.v7Source) ||
  audit.tokenCount !== 33 ||
  audit.bindingCount !== 33 ||
  audit.unconsumedTokenPaths.length !== 0 ||
  audit.duplicateTokenPaths.length !== 0 ||
  science.strongGravity.linearDisplay !== true ||
  science.strongGravity.bloomIntensity !== 0 ||
  science.strongGravity.colorGradeIntensity !== 0 ||
  science.postFx.grain !== 0 ||
  science.postFx.chromaticAberration !== 0 ||
  !cinematic.strongGravity.seed ||
  science.scientificFieldMutation !== false ||
  cinematic.scientificFieldMutation !== false ||
  dense.status !== "incomplete-0-of-49" ||
  dense.completedShardCount !== 0 ||
  dense.attemptConsumed !== false ||
  dense.aggregateAvailable !== false ||
  formal.version !== "v263-current-product-evidence-pointer" ||
  (formalEvidence.science as Json)?.defaultKernel !== "legacy-eih-1pn" ||
  (formalEvidence.contracts as Json)?.singleCanvas !== true ||
  (formalEvidence.contracts as Json)?.legacyRootAttributes !== 603 ||
  (formalEvidence.contracts as Json)?.evidenceLedgerClaims !== 84
) {
  throw new Error("v472-upstream-boundary");
}

const unsigned = {
  version: "v472-atlas-science-cinematic-v8-profile-audit-v1",
  generatedAt: "2026-07-30T00:00:00Z",
  status: "science-cinematic-v8-runtime-consumed-browser-pending",
  profileId: ATLAS_SCIENCE_CINEMATIC_V8_ID_V472,
  source: {
    v471ObservableArtifactSha256: observable.artifactSha256,
    v471ObservableFileSha256: fileSha(paths.v471),
    v457EvidenceSha256: v457Evidence.evidenceSha256,
    frozenV7SourceSha256: fileSha(paths.v7Source),
    v314StateSha256: dense.stateSha256,
  },
  contract: {
    modeCount: 2,
    visualGroupCount: 8,
    tokenCount: ATLAS_V8_TOKEN_PATHS_V472.length,
    bindingCount: ATLAS_V8_TOKEN_CONSUMER_BINDINGS_V472.length,
    consumerCount: audit.consumerCount,
    everyTokenConsumedExactlyOnce: true,
    stableProfileReferences: true,
    scienceCinematicSeparated: true,
    scientificFieldMutationAllowed: false,
    localShadowOnly: true,
    defaultApplied: false,
    ordinaryStandaloneProfile: "legacy-v9",
    liteProfile: "legacy-v9",
    formalProductPointer: "v263",
  },
  profiles: { science, cinematic },
  bindings: ATLAS_V8_TOKEN_CONSUMER_BINDINGS_V472,
  audit,
  runtime: {
    component: "ScienceCinematicV8ObservableStageV472",
    localShadowEntry: "app/local-shadow-v472/page.tsx",
    manualModeToggle: true,
    initialMode: "science",
    v8DefaultApplied: false,
    standaloneVisible: false,
    liteVisible: false,
    ordinaryResearchVisible: false,
    canvasCreated: false,
    sceneRevisionDelta: 0,
    observableRowsInReactStateMaximum: 13,
  },
  observableBoundary: {
    sourceVersion: "v471",
    observableRowCount: 13,
    shortAuthorityRowCount: 4,
    coordinateAuthorityRowCount: 3,
    analyticFixtureRowCount: 2,
    unavailableRowCount: 4,
    productionAuthorityGrantedRowCount: 0,
    sciencePixelRows: 0,
    stokesMeasurementRows: 0,
    fitsImageRows: 0,
  },
  lifecycle: {
    existingCanvasCount: 1,
    newCanvasCreated: false,
    sceneRevisionDelta: 0,
    workers: 0,
    gpuBuffers: 0,
    pipelines: 0,
    textures: 0,
    renderTargets: 0,
    typedArrayCaches: 0,
    objectUrls: 0,
    cameraLeases: 0,
    subscriptions: 0,
    allResourcesAtBaseline: true,
  },
  boundary: {
    sciencePayloadMutationAllowed: false,
    cinematicScienceWritebackAllowed: false,
    classificationMutationAllowed: false,
    redshiftMutationAllowed: false,
    evpaMutationAllowed: false,
    intensityMutationAllowed: false,
    fitsWriteAllowed: false,
    pngWriteAllowed: false,
    imageProductsGenerated: false,
    assetDownloadAttempted: false,
    networkAttempted: false,
    automaticRetryApplied: false,
    denseShardRunAllowed: false,
    browserQualification: "not-run",
    visualMatrixQualification: "not-run",
    soakQualification: "not-run",
    rtxWebGpuQualification: "not-run",
  },
  formalProductPointer: "v263",
  formalDefaultKernel: "legacy-eih-1pn",
};
const artifact = { ...unsigned, artifactSha256: canonicalSha(unsigned) };
atomic(paths.output, artifact);

console.log(
  JSON.stringify(
    {
      status: artifact.status,
      artifactSha256: artifact.artifactSha256,
      profileId: artifact.profileId,
      tokenCount: artifact.contract.tokenCount,
      bindingCount: artifact.contract.bindingCount,
      consumerCount: artifact.contract.consumerCount,
      unconsumedTokens: 0,
      scienceLinear: true,
      scienceBloom: 0,
      cinematicSeed: cinematic.strongGravity.seed,
      scientificFieldMutation: false,
      v8DefaultApplied: false,
      browserQualification: "not-run",
    },
    null,
    2,
  ),
);
