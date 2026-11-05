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
  previousEvidence: "dist/science/orbit-atlas-shadow-v374-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v374.json",
  inspect: "dist/science/measured-expectation-v375/inspect.json",
  envelope: "dist/science/measured-expectation-v375/envelope.json",
  photon: "dist/science/kerr-science-photon-bands-v328/photon-radiance.json",
  detectorPointer: "dist/release/orbit-atlas-detector-calibration-authority-v367.json",
  geometryPointer: "dist/release/orbit-atlas-observation-geometry-authority-v373.json",
  runtimeGeometry: "dist/staging/detector-calibration-v369/observation-geometry.json",
  state: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v375-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v375.json",
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
const inspect = read(paths.inspect);
const photon = read(paths.photon);
const state = read(paths.state);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);

if (
  previousEvidence.status !==
    "observation-geometry-runtime-v374-publisher-implemented-inputs-unavailable-dense-incomplete-0-of-49" ||
  previousPointer.capabilities?.v374Publisher !==
    "implemented-nine-input-authority-revalidation" ||
  previousPointer.evidence?.fileSha256 !== fileSha(paths.previousEvidence) ||
  previousPointer.evidence?.canonicalSha256 !== previousEvidence.evidenceSha256 ||
  inspect.version !== "v375-dual-authority-measured-expectation-inspect-v1" ||
  inspect.status !== "blocked-dual-authority-inputs-unavailable" ||
  inspect.presentInputCount !== 1 ||
  inspect.missingInputs?.length !== 7 ||
  inspect.photonInputQualified !== true ||
  inspect.detectorAuthorityQualified !== false ||
  inspect.geometryAuthorityQualified !== false ||
  inspect.measuredExpectationAvailable !== false ||
  inspect.expectationRowCount !== 0 ||
  inspect.buildExecuted !== false ||
  inspect.attemptConsumed !== false ||
  inspect.networkAttempted !== false ||
  sha(inspect) !== inspect.artifactSha256 ||
  photon.version !== "v328-kerr-science-photon-bands-artifact-v1" ||
  photon.view?.counts?.applicableDiskRayCount !== 4 ||
  photon.view?.counts?.bandMeasurementCount !== 12 ||
  photon.view?.counts?.unavailableRayCount !== 12 ||
  sha(photon) !== photon.artifactSha256 ||
  existsSync(resolve(root, paths.envelope)) ||
  existsSync(resolve(root, paths.detectorPointer)) ||
  existsSync(resolve(root, paths.geometryPointer)) ||
  existsSync(resolve(root, paths.runtimeGeometry)) ||
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
  throw new Error("v375-boundary");
}

const sourcePaths = [
  "app/lib/measuredExpectationAuthorityV375.ts",
  "app/lib/measuredExpectationAuthorityV375.test.ts",
  "app/lib/measuredExpectationAuthorityInspectV375.ts",
  "app/lib/measuredExpectationAuthorityInspectV375.test.ts",
  "app/lib/measuredExpectationAuthorityInspectServerV375.ts",
  "app/lib/measuredExpectationAuthorityInspectServerV375.test.ts",
  "app/api/atlas/relativity-evidence/v375/measured-expectation/route.ts",
  "app/api/atlas/relativity-evidence/v375/measured-expectation/route.test.ts",
  "app/components/MeasuredExpectationAuthoritySurfaceV375.tsx",
  "app/components/MeasuredExpectationAuthoritySurfaceV375.test.tsx",
  "app/components/RelativityResearchWorkbenchV280.tsx",
  "app/lib/atlasShadowCapabilityPointerV375.ts",
  "app/lib/atlasShadowCapabilityPointerV375.test.ts",
  "scripts/inspect-measured-expectation-v375.ts",
  "scripts/build-measured-expectation-v375.ts",
  "scripts/build-shadow-candidate-v375.mjs",
  "scripts/verify-shadow-v375-light.mjs",
  "scripts/atlas.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));

const evidenceUnsigned = {
  version: "orbit-atlas-shadow-v375-evidence-v1",
  generatedAt: new Date().toISOString(),
  status:
    "measured-expectation-v375-dual-authority-builder-implemented-inputs-partial-1-of-8-dense-incomplete-0-of-49",
  dependency: {
    v374EvidenceSha256: previousEvidence.evidenceSha256,
    v374PointerSha256: previousPointer.pointerSha256,
    inspectArtifactSha256: inspect.artifactSha256,
    photonArtifactSha256: photon.artifactSha256,
    photonFileSha256: fileSha(paths.photon),
  },
  expectation: {
    status: inspect.status,
    expectedInputs: inspect.expectedInputs,
    presentInputCount: inspect.presentInputCount,
    missingInputs: inspect.missingInputs,
    builderImplemented: inspect.envelopeBuilderImplemented,
    buildCommand: inspect.buildCommand,
    buildExecuted: inspect.buildExecuted,
    photonInputQualified: inspect.photonInputQualified,
    photonRayCount: photon.view.counts.applicableDiskRayCount,
    photonMeasurementCount: photon.view.counts.bandMeasurementCount,
    detectorAuthorityQualified: inspect.detectorAuthorityQualified,
    geometryAuthorityQualified: inspect.geometryAuthorityQualified,
    measuredExpectationAvailable: inspect.measuredExpectationAvailable,
    expectationRowCount: inspect.expectationRowCount,
    attemptConsumed: inspect.attemptConsumed,
    networkAttempted: inspect.networkAttempted,
    dualAuthorityRequired: true,
    syntheticFallbackUsed: false,
    observedCounts: "unavailable-expectation-is-not-observation",
  },
  authorityBoundary: {
    detectorAuthorityPointerExists: false,
    geometryAuthorityPointerExists: false,
    runtimeGeometryExists: false,
    envelopeExists: false,
    detectorAndGeometryInstrumentIdentityMustMatch: true,
    expectationProvenanceMustLockBothAuthorities: true,
    expectationCanBecomeObservedCounts: false,
    cinematicConsumerAllowed: false,
  },
  visual: {
    profile: "science-cinematic-v10-observatory",
    runtimeConsumer: "MeasuredExpectationAuthoritySurfaceV375",
    localShadowManualOnly: true,
    defaultApplied: false,
    legacyV9Default: true,
    scienceBufferMutationAllowed: false,
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
    "photon-input-qualified-dual-authority-missing-zero-expectation-zero-observed-counts-v10-manual-shadow-only",
};
const evidence = { ...evidenceUnsigned, evidenceSha256: sha(evidenceUnsigned) };
atomic(paths.evidence, evidence);

const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v375",
  generatedAt: new Date().toISOString(),
  status: evidence.status,
  formalProductPointer: "v263",
  formalProductPointerAdvanced: false,
  localShadowDefaultApplied: false,
  publicDeploymentBlocked: true,
  capabilities: {
    v328PhotonPayload: "qualified-4-rays-12-band-measurements",
    v367DetectorAuthority: "unavailable",
    v374GeometryAuthority: "unavailable",
    v375EnvelopeBuilder: "implemented-dual-authority-no-synthetic-fallback",
    v375Input: "partial-1-of-8",
    v375Build: "not-run-attempt-unconsumed",
    v375MeasuredExpectation: "unavailable-0-of-12",
    v375ObservedCounts: "unavailable-expectation-is-not-observation",
    v370VisualProfile: "science-cinematic-v10-observatory",
    v370DefaultBoundary: "manual-local-shadow-only-default-legacy-v9",
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
      photon: pointer.capabilities.v328PhotonPayload,
      input: pointer.capabilities.v375Input,
      detectorAuthority: pointer.capabilities.v367DetectorAuthority,
      geometryAuthority: pointer.capabilities.v374GeometryAuthority,
      expectation: pointer.capabilities.v375MeasuredExpectation,
      observedCounts: pointer.capabilities.v375ObservedCounts,
      dense: pointer.capabilities.v314CorrectedDense,
    },
    null,
    2,
  ),
);
