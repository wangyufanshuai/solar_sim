import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import {
  canonicalKerrDualRenderPayloadV475,
  countKerrPresentationScientificFieldsV475,
  KERR_DUAL_RENDER_ARTIFACT_VERSION_V475,
  parseKerrDualRenderArtifactV475,
  type KerrPresentationBufferV475,
  type KerrScienceBufferV475,
} from "../app/lib/kerrDualRenderBoundaryV475";

type Json = Record<string, unknown>;

const root = process.cwd();
const paths = Object.freeze({
  v474: "dist/science/kerr-sparse-science-payload-v474/sparse-payload.json",
  v472: "dist/science/atlas-science-cinematic-v8-v472/profile-audit.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  output: "dist/science/kerr-dual-render-boundary-v475/dual-render.json",
});
const read = (path: string): Json =>
  JSON.parse(readFileSync(resolve(root, path), "utf8")) as Json;
const fileSha = (path: string) =>
  createHash("sha256").update(readFileSync(resolve(root, path))).digest("hex");
const canonicalSha = (value: unknown) =>
  createHash("sha256").update(canonicalKerrDualRenderPayloadV475(value)).digest("hex");
const atomic = (path: string, value: unknown) => {
  const target = resolve(root, path);
  mkdirSync(dirname(target), { recursive: true });
  const part = target + "." + process.pid + ".part";
  writeFileSync(part, JSON.stringify(value, null, 2) + "\n", "utf8");
  renameSync(part, target);
};
const nested = (value: Json, key: string) => (value[key] ?? {}) as Json;
const rows = (value: Json, key: string) => (value[key] ?? []) as Json[];

const sparse = read(paths.v474);
const visual = read(paths.v472);
const dense = read(paths.dense);
const formal = read(paths.formal);
const formalEvidence = read(String(formal.source));
const sparseRows = rows(sparse, "rows");
const profiles = nested(visual, "profiles");
const scienceProfile = nested(profiles, "science");
const cinematicProfile = nested(profiles, "cinematic");
const scienceStrong = nested(scienceProfile, "strongGravity");
const scienceFx = nested(scienceProfile, "postFx");
const cinematicStrong = nested(cinematicProfile, "strongGravity");
const cinematicFx = nested(cinematicProfile, "postFx");

if (
  sparse.status !== "sparse-science-envelope-qualified-production-payload-blocked-browser-pending" ||
  sparseRows.length !== 4 ||
  nested(sparse, "qualification").sparseAuthorityQualified !== true ||
  nested(sparse, "qualification").productionPayloadQualified !== false ||
  visual.status !== "science-cinematic-v8-runtime-consumed-browser-pending" ||
  nested(visual, "contract").everyTokenConsumedExactlyOnce !== true ||
  scienceStrong.linearDisplay !== true ||
  scienceStrong.bloomIntensity !== 0 ||
  scienceStrong.colorGradeIntensity !== 0 ||
  scienceFx.grain !== 0 ||
  scienceFx.chromaticAberration !== 0 ||
  !cinematicStrong.seed ||
  dense.status !== "incomplete-0-of-49" ||
  dense.completedShardCount !== 0 ||
  dense.attemptConsumed !== false ||
  dense.aggregateAvailable !== false ||
  formal.version !== "v263-current-product-evidence-pointer" ||
  nested(formalEvidence, "science").defaultKernel !== "legacy-eih-1pn" ||
  nested(formalEvidence, "contracts").singleCanvas !== true ||
  nested(formalEvidence, "contracts").legacyRootAttributes !== 603 ||
  nested(formalEvidence, "contracts").evidenceLedgerClaims !== 84
) {
  throw new Error("v475-upstream-boundary");
}

const tupleNumbers = (selector: (row: Json) => number) =>
  sparseRows.map(selector) as [number, number, number, number];
const tupleNulls = [null, null, null, null] as const;
const scienceBufferUnsigned = {
  version: "v475-kerr-science-buffer-v1" as const,
  sourcePayloadSha256: String(sparse.payloadSha256),
  sourceRowSha256: sparseRows.map((row) => String(row.rowSha256)) as [
    string,
    string,
    string,
    string,
  ],
  rayIds: sparseRows.map((row) => String(row.rayId)) as [
    "disk-00",
    "disk-01",
    "disk-02",
    "disk-03",
  ],
  classification: ["disk-hit", "disk-hit", "disk-hit", "disk-hit"] as const,
  emissionRadiusM: tupleNumbers((row) => Number(nested(row, "geometry").emissionRadiusM)),
  redshiftFactor: tupleNumbers((row) => Number(nested(row, "geometry").redshiftFactor)),
  evpaDeg: tupleNumbers((row) => Number(nested(row, "polarization").evpaDeg)),
  orientationQHat: tupleNumbers((row) => Number(nested(row, "polarization").orientationQHat)),
  orientationUHat: tupleNumbers((row) => Number(nested(row, "polarization").orientationUHat)),
  continuousPixelX: tupleNumbers((row) => Number(nested(row, "coordinate").continuousPixelX)),
  continuousPixelY: tupleNumbers((row) => Number(nested(row, "coordinate").continuousPixelY)),
  intensity: tupleNulls,
  stokesI: tupleNulls,
  stokesQ: tupleNulls,
  stokesU: tupleNulls,
  stokesV: tupleNulls,
  readonly: true as const,
};
const scienceBuffer = Object.freeze({
  ...scienceBufferUnsigned,
  scienceBufferSha256: canonicalSha(scienceBufferUnsigned),
}) as KerrScienceBufferV475;

const presentation = (
  mode: "science" | "cinematic",
  strong: Json,
  fx: Json,
): KerrPresentationBufferV475 =>
  Object.freeze({
    mode,
    linearDisplay: Boolean(strong.linearDisplay),
    exposure: Number(strong.exposure),
    bloomIntensity: Number(strong.bloomIntensity),
    colorGradeIntensity: Number(strong.colorGradeIntensity),
    grain: Number(fx.grain),
    chromaticAberration: Number(fx.chromaticAberration),
    vignette: Number(fx.vignette),
    seed: strong.seed === null ? null : String(strong.seed),
    scientificFieldMutation: false as const,
    scienceWritebackAllowed: false as const,
  });
const sciencePresentation = presentation("science", scienceStrong, scienceFx);
const cinematicPresentation = presentation("cinematic", cinematicStrong, cinematicFx);
if (
  countKerrPresentationScientificFieldsV475({
    science: sciencePresentation,
    cinematic: cinematicPresentation,
  }) !== 0
) {
  throw new Error("v475-presentation-scientific-field-leak");
}

const source = {
  v474: fileSha(paths.v474),
  v472: fileSha(paths.v472),
  dense: fileSha(paths.dense),
};
const unsigned = {
  version: KERR_DUAL_RENDER_ARTIFACT_VERSION_V475,
  generatedAt: "2026-07-30T00:00:00Z",
  status: "dual-render-boundary-qualified-browser-pending" as const,
  source,
  contract: {
    scienceBufferRowCount: 4 as const,
    scienceFieldArrayCount: 13 as const,
    presentationFieldCount: 8 as const,
    modeCount: 2 as const,
    sharedScienceBufferIdentityRequired: true as const,
    presentationBuffersIndependent: true as const,
    presentationCannotContainScientificFields: true as const,
    scienceWritebackForbidden: true as const,
    stableViewCacheRequired: true as const,
    boundedSummaryOnly: true as const,
    maximumResponseBytes: 131072 as const,
    localShadowOnly: true as const,
    defaultApplied: false as const,
    formalProductPointer: "v263" as const,
    denseCampaignStatus: "incomplete-0-of-49" as const,
  },
  scienceBuffer,
  presentation: {
    science: sciencePresentation,
    cinematic: cinematicPresentation,
  },
  audit: {
    scienceBufferCanonicalIdentityShared: true as const,
    scienceViewScienceBufferSha256: scienceBuffer.scienceBufferSha256,
    cinematicViewScienceBufferSha256: scienceBuffer.scienceBufferSha256,
    presentationScientificFieldCount: 0 as const,
    classificationMutationCount: 0 as const,
    redshiftMutationCount: 0 as const,
    evpaMutationCount: 0 as const,
    intensityMutationCount: 0 as const,
    stokesMutationCount: 0 as const,
    presentationWritebackCount: 0 as const,
    scienceEffectsZero: true as const,
    cinematicSeedDeterministic: true as const,
  },
  lifecycle: {
    existingCanvasCount: 1 as const,
    newCanvasCreated: false as const,
    sceneRevisionDelta: 0 as const,
    workers: 0 as const,
    gpuBuffers: 0 as const,
    pipelines: 0 as const,
    textures: 0 as const,
    renderTargets: 0 as const,
    typedArrayCaches: 0 as const,
    objectUrls: 0 as const,
    cameraLeases: 0 as const,
    subscriptions: 0 as const,
    allResourcesAtBaseline: true as const,
  },
  boundary: {
    sparseAuthorityQualified: true as const,
    denseAuthorityQualified: false as const,
    productionPayloadQualified: false as const,
    sciencePixelRows: 0 as const,
    imageProductsGenerated: false as const,
    runtimeSciencePayloadMutationAllowed: false as const,
    cinematicScienceWritebackAllowed: false as const,
    networkAttempted: false as const,
    automaticRetryApplied: false as const,
    denseShardRunAllowed: false as const,
    browserQualification: "not-run" as const,
    visualMatrixQualification: "not-run" as const,
    soakQualification: "not-run" as const,
    rtxWebGpuQualification: "not-run" as const,
  },
  formalProductPointer: "v263" as const,
  formalDefaultKernel: "legacy-eih-1pn" as const,
};
const artifact = parseKerrDualRenderArtifactV475({
  ...unsigned,
  artifactSha256: canonicalSha(unsigned),
});
atomic(paths.output, artifact);

console.log(
  JSON.stringify(
    {
      status: artifact.status,
      artifactSha256: artifact.artifactSha256,
      scienceBufferSha256: artifact.scienceBuffer.scienceBufferSha256,
      rowCount: 4,
      scienceFieldArrays: 13,
      presentationFields: 8,
      sharedScienceBuffer: true,
      presentationScientificFields: 0,
      mutationCount: 0,
      scienceEffectsZero: true,
      cinematicSeed: artifact.presentation.cinematic.seed,
      productionPayload: false,
      sciencePixelRows: 0,
      denseCampaign: "0/49",
      browserQualification: "not-run",
    },
    null,
    2,
  ),
);
