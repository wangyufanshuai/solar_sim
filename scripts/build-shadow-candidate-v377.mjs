import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = {
  previousEvidence: "dist/science/orbit-atlas-shadow-v376-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v376.json",
  visualAudit: "dist/science/atlas-visual-v11-v377/audit.json",
  expectationInspect: "dist/science/measured-expectation-v375/inspect.json",
  imageInspect: "dist/science/expected-electron-image-v376/inspect.json",
  envelope: "dist/science/measured-expectation-v375/envelope.json",
  imageJson: "dist/science/expected-electron-image-v376/image.json",
  imageCsv: "dist/science/expected-electron-image-v376/image.csv",
  state: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v377-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v377.json",
};
const bytes = (path) => readFileSync(resolve(root, path));
const read = (path) => JSON.parse(bytes(path));
const fileSha = (path) => createHash("sha256").update(bytes(path)).digest("hex");
const canonicalize = (value) =>
  Array.isArray(value)
    ? value.map(canonicalize)
    : !value || typeof value !== "object"
      ? value
      : Object.fromEntries(
          Object.entries(value)
            .filter(
              ([key]) =>
                ![
                  "generatedAt",
                  "artifactSha256",
                  "evidenceSha256",
                  "pointerSha256",
                ].includes(key),
            )
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([key, entry]) => [key, canonicalize(entry)]),
        );
const sha = (value) =>
  createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const atomic = (path, value) => {
  const target = resolve(root, path);
  mkdirSync(dirname(target), { recursive: true });
  const temporary = `${target}.${process.pid}.part`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`);
  renameSync(temporary, target);
};

const previousEvidence = read(paths.previousEvidence);
const previousPointer = read(paths.previousPointer);
const visualAudit = read(paths.visualAudit);
const expectationInspect = read(paths.expectationInspect);
const imageInspect = read(paths.imageInspect);
const state = read(paths.state);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);
if (
  previousEvidence.status !==
    "expected-electron-image-v376-compiler-implemented-envelope-unavailable-dense-incomplete-0-of-49" ||
  previousPointer.capabilities?.v376ScienceImage !==
    "unavailable-no-pixel-arrays" ||
  previousPointer.evidence?.fileSha256 !== fileSha(paths.previousEvidence) ||
  previousPointer.evidence?.canonicalSha256 !== previousEvidence.evidenceSha256 ||
  visualAudit.version !==
    "v377-atlas-visual-v11-measurement-lab-runtime-audit-v1" ||
  visualAudit.status !==
    "implemented-v11-measurement-lab-science-image-unavailable-browser-pending" ||
  sha(visualAudit) !== visualAudit.artifactSha256 ||
  visualAudit.measurementState?.presentInputs !== 1 ||
  visualAudit.measurementState?.photonInputQualified !== true ||
  visualAudit.measurementState?.detectorAuthorityQualified !== false ||
  visualAudit.measurementState?.geometryAuthorityQualified !== false ||
  visualAudit.measurementState?.expectationRows !== 0 ||
  visualAudit.measurementState?.scienceImageCells !== 0 ||
  visualAudit.measurementState?.scienceImageAvailable !== false ||
  visualAudit.measurementState?.imageArraysExist !== false ||
  visualAudit.scienceBoundary?.exposure !== 1 ||
  visualAudit.scienceBoundary?.bloom !== 0 ||
  visualAudit.scienceBoundary?.noise !== 0 ||
  visualAudit.scienceBoundary?.sciencePayloadMutationAllowed !== false ||
  visualAudit.cinematicBoundary?.electronColumnsEncodeScience !== false ||
  visualAudit.cinematicBoundary?.uncertaintyHaloEncodesScience !== false ||
  visualAudit.ab?.localShadowManualOnly !== true ||
  visualAudit.ab?.defaultApplied !== false ||
  visualAudit.browserQualification !== "not-run" ||
  expectationInspect.presentInputCount !== 1 ||
  expectationInspect.measuredExpectationAvailable !== false ||
  imageInspect.imageAvailable !== false ||
  imageInspect.zeroImageFallbackUsed !== false ||
  existsSync(resolve(root, paths.envelope)) ||
  existsSync(resolve(root, paths.imageJson)) ||
  existsSync(resolve(root, paths.imageCsv)) ||
  state.status !== "incomplete-0-of-49" ||
  state.completedShardCount !== 0 ||
  state.attemptConsumed !== false ||
  state.aggregateAvailable !== false ||
  formal.version !== "v263-current-product-evidence-pointer" ||
  formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" ||
  formalEvidence.contracts?.workerPhysicsMutation !== "not-applied" ||
  formalEvidence.contracts?.eihOnePnMutation !== "not-applied" ||
  formalEvidence.contracts?.singleCanvas !== true ||
  formalEvidence.contracts?.legacyRootAttributes !== 603 ||
  formalEvidence.contracts?.evidenceLedgerClaims !== 84
) {
  throw new Error("v377-boundary");
}

const sourcePaths = [
  "app/lib/atlasVisualProfileV299.ts",
  "app/lib/atlasVisualProfileV370.test.ts",
  "app/lib/atlasVisualProfileV377.test.ts",
  "app/components/AtlasVisualABControlV261.tsx",
  "app/components/MeasurementLabSurfaceV377.tsx",
  "app/components/MeasurementLabSurfaceV377.test.tsx",
  "app/components/RelativityResearchWorkbenchV280.tsx",
  "app/lib/atlasShadowCapabilityPointerV377.ts",
  "app/lib/atlasShadowCapabilityPointerV377.test.ts",
  "scripts/build-visual-runtime-v377.ts",
  "scripts/build-shadow-candidate-v377.mjs",
  "scripts/verify-shadow-v377-light.mjs",
  "scripts/atlas.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const evidenceUnsigned = {
  version: "orbit-atlas-shadow-v377-evidence-v1",
  generatedAt: new Date().toISOString(),
  status:
    "visual-v11-measurement-lab-v377-implemented-science-image-unavailable-browser-pending-dense-incomplete-0-of-49",
  dependency: {
    v376EvidenceSha256: previousEvidence.evidenceSha256,
    v376PointerSha256: previousPointer.pointerSha256,
    visualAuditArtifactSha256: visualAudit.artifactSha256,
    visualAuditFileSha256: fileSha(paths.visualAudit),
    expectationInspectArtifactSha256: expectationInspect.artifactSha256,
    imageInspectArtifactSha256: imageInspect.artifactSha256,
  },
  measurementLab: {
    visualDirection: visualAudit.visualDirection,
    expectedInputs: visualAudit.measurementState.expectedInputs,
    presentInputs: visualAudit.measurementState.presentInputs,
    photonInputQualified: visualAudit.measurementState.photonInputQualified,
    detectorAuthorityQualified:
      visualAudit.measurementState.detectorAuthorityQualified,
    geometryAuthorityQualified:
      visualAudit.measurementState.geometryAuthorityQualified,
    expectedElectronRows: visualAudit.measurementState.expectationRows,
    scienceImageCells: visualAudit.measurementState.scienceImageCells,
    scienceImageAvailable: visualAudit.measurementState.scienceImageAvailable,
    imageArraysExist: visualAudit.measurementState.imageArraysExist,
    zeroImageFallbackUsed: false,
    observedCountsAvailable: false,
  },
  visual: {
    profile: "science-cinematic-v11-v377",
    runtimeConsumer: "MeasurementLabSurfaceV377",
    runtimeTokenGroups: visualAudit.runtimeConsumer.groups,
    runtimeTokensConsumed: visualAudit.runtimeConsumer.tokenGroups,
    v10ProfileDigestSha256: visualAudit.profileDigests.v10ProfileDigestSha256,
    v11ProfileDigestSha256: visualAudit.profileDigests.v11ProfileDigestSha256,
    localShadowManualOnly: true,
    defaultApplied: false,
    legacyV9Default: true,
  },
  scienceBoundary: {
    transform: visualAudit.scienceBoundary.displayTransform,
    exposure: visualAudit.scienceBoundary.exposure,
    bloom: visualAudit.scienceBoundary.bloom,
    noise: visualAudit.scienceBoundary.noise,
    immutableScienceSourceSha256:
      visualAudit.scienceBoundary.immutableScienceSourceSha256,
    sciencePayloadMutationAllowed: false,
    zeroImageFallbackAllowed: false,
    cinematicCopyAllowed: false,
  },
  cinematicBoundary: {
    seededDetail: true,
    detailSeed: visualAudit.cinematicBoundary.detailSeed,
    decorativeSignalsEncodeScience: false,
    classificationMutationAllowed: false,
    redshiftMutationAllowed: false,
    evpaMutationAllowed: false,
    intensityMutationAllowed: false,
  },
  correctedCampaign: {
    namespace: "v314",
    status: state.status,
    completedShardCount: state.completedShardCount,
    plannedShardCount: state.plannedShardCount,
    attemptConsumed: state.attemptConsumed,
    aggregateAvailable: state.aggregateAvailable,
    stateSha256: state.stateSha256,
  },
  browserQualification: "not-run",
  sourceManifest,
  sourceSha256: sha(sourceManifest),
  release: {
    formalProductPointer: "v263",
    formalProductPointerSha256: fileSha(paths.formal),
    formalProductPointerAdvanced: false,
    localShadowDefaultApplied: false,
    publicDeploymentBlocked: true,
  },
  boundary:
    "v11-measurement-lab-implemented-no-authority-envelope-no-science-image-no-zero-fallback-manual-local-shadow-only",
};
const evidence = { ...evidenceUnsigned, evidenceSha256: sha(evidenceUnsigned) };
atomic(paths.evidence, evidence);
const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v377",
  generatedAt: new Date().toISOString(),
  status: evidence.status,
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v375MeasuredExpectation: "unavailable-0-of-12",
    v376ScienceImage: "unavailable-no-pixel-arrays",
    v377VisualProfile: "science-cinematic-v11-measurement-lab",
    v377RuntimeTokens: "hud-and-strong-gravity-consumers-wired",
    v377ScienceBoundary: "identity-linear-float64-1-0-0-immutable",
    v377CinematicBoundary: "seeded-decoration-no-science-encoding",
    v377DefaultBoundary: "manual-local-shadow-only-default-legacy-v9",
    v314CorrectedDense: "incomplete-0-of-49",
    denseAggregate: "unavailable",
    browserQualification: "not-run",
  },
  evidence: {
    path: paths.evidence,
    fileSha256: fileSha(paths.evidence),
    canonicalSha256: evidence.evidenceSha256,
  },
};
const pointer = { ...pointerUnsigned, pointerSha256: sha(pointerUnsigned) };
atomic(paths.pointer, pointer);
console.log(
  JSON.stringify(
    {
      status: pointer.status,
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      profile: pointer.capabilities.v377VisualProfile,
      expectation: pointer.capabilities.v375MeasuredExpectation,
      image: pointer.capabilities.v376ScienceImage,
      dense: pointer.capabilities.v314CorrectedDense,
      browser: pointer.capabilities.browserQualification,
    },
    null,
    2,
  ),
);
