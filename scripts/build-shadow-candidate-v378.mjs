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
  previousEvidence: "dist/science/orbit-atlas-shadow-v377-evidence.json",
  previousPointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v377.json",
  topology: "dist/science/measurement-authority-topology-v378/topology.json",
  envelope: "dist/science/measured-expectation-v375/envelope.json",
  imageJson: "dist/science/expected-electron-image-v376/image.json",
  imageCsv: "dist/science/expected-electron-image-v376/image.csv",
  state: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  evidence: "dist/science/orbit-atlas-shadow-v378-evidence.json",
  pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v378.json",
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
const topology = read(paths.topology);
const state = read(paths.state);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);
if (
  previousEvidence.status !==
    "visual-v11-measurement-lab-v377-implemented-science-image-unavailable-browser-pending-dense-incomplete-0-of-49" ||
  previousPointer.capabilities?.v377VisualProfile !==
    "science-cinematic-v11-measurement-lab" ||
  previousPointer.evidence?.fileSha256 !== fileSha(paths.previousEvidence) ||
  previousPointer.evidence?.canonicalSha256 !== previousEvidence.evidenceSha256 ||
  topology.version !== "v378-measurement-authority-topology-v1" ||
  topology.status !==
    "provenance-topology-qualified-inputs-partial-1-of-8-image-unavailable" ||
  sha(topology) !== topology.artifactSha256 ||
  topology.presentInputCount !== 1 ||
  topology.missingInputCount !== 7 ||
  topology.nodeCount !== 10 ||
  topology.edgeCount !== 9 ||
  topology.acyclic !== true ||
  topology.nodes?.filter((node) => node.status === "qualified").length !== 1 ||
  topology.nodes?.find((node) => node.status === "qualified")?.id !==
    "v328-photon-radiance" ||
  topology.nodes?.filter((node) => node.status === "missing").length !== 7 ||
  topology.nodes?.filter((node) => node.status === "withheld").length !== 2 ||
  topology.edges?.filter((edge) => edge.satisfied).length !== 1 ||
  topology.boundaries?.observedCountsNodeExists !== false ||
  topology.boundaries?.expectationCanBecomeObservedCounts !== false ||
  topology.boundaries?.syntheticFallbackAllowed !== false ||
  topology.boundaries?.zeroImageFallbackAllowed !== false ||
  topology.boundaries?.cinematicConsumerAllowed !== false ||
  topology.boundaries?.sciencePayloadMutationAllowed !== false ||
  topology.attemptConsumed !== false ||
  topology.networkAttempted !== false ||
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
  throw new Error("v378-boundary");
}

const sourcePaths = [
  "app/lib/measurementAuthorityTopologyV378.ts",
  "app/lib/measurementAuthorityTopologyV378.test.ts",
  "app/lib/measurementAuthorityTopologyServerV378.ts",
  "app/lib/measurementAuthorityTopologyServerV378.test.ts",
  "app/api/atlas/relativity-evidence/v378/measurement-authority-topology/route.ts",
  "app/api/atlas/relativity-evidence/v378/measurement-authority-topology/route.test.ts",
  "app/components/MeasurementAuthorityTopologySurfaceV378.tsx",
  "app/components/MeasurementAuthorityTopologySurfaceV378.test.tsx",
  "app/components/RelativityResearchWorkbenchV280.tsx",
  "app/lib/atlasShadowCapabilityPointerV378.ts",
  "app/lib/atlasShadowCapabilityPointerV378.test.ts",
  "scripts/build-measurement-authority-topology-v378.ts",
  "scripts/build-shadow-candidate-v378.mjs",
  "scripts/verify-shadow-v378-light.mjs",
  "scripts/atlas.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const evidenceUnsigned = {
  version: "orbit-atlas-shadow-v378-evidence-v1",
  generatedAt: new Date().toISOString(),
  status:
    "measurement-authority-topology-v378-qualified-inputs-partial-1-of-8-image-unavailable-browser-pending-dense-incomplete-0-of-49",
  dependency: {
    v377EvidenceSha256: previousEvidence.evidenceSha256,
    v377PointerSha256: previousPointer.pointerSha256,
    topologyArtifactSha256: topology.artifactSha256,
    topologyFileSha256: fileSha(paths.topology),
  },
  topology: {
    status: topology.status,
    nodeCount: topology.nodeCount,
    edgeCount: topology.edgeCount,
    acyclic: topology.acyclic,
    topologicalOrder: topology.topologicalOrder,
    expectedInputCount: topology.expectedInputCount,
    presentInputCount: topology.presentInputCount,
    missingInputCount: topology.missingInputCount,
    qualifiedNodeIds: topology.nodes
      .filter((node) => node.status === "qualified")
      .map((node) => node.id),
    missingNodeIds: topology.nodes
      .filter((node) => node.status === "missing")
      .map((node) => node.id),
    withheldNodeIds: topology.nodes
      .filter((node) => node.status === "withheld")
      .map((node) => node.id),
    satisfiedEdgeCount: topology.edges.filter((edge) => edge.satisfied).length,
    requiredEdgeCount: topology.edgeCount,
  },
  authorityBoundary: {
    detectorAndGeometryAuthorityRequired: true,
    syntheticFallbackAllowed: false,
    expectationCanBecomeObservedCounts: false,
    observedCountsNodeExists: false,
    scienceImageRequiresV375Envelope: true,
    zeroImageFallbackAllowed: false,
    cinematicConsumerAllowed: false,
    sciencePayloadMutationAllowed: false,
    expectationAvailable: false,
    scienceImageAvailable: false,
    imageArraysExist: false,
  },
  runtime: {
    profile: "science-cinematic-v11-v377",
    consumer: "MeasurementAuthorityTopologySurfaceV378",
    endpoint:
      "/api/atlas/relativity-evidence/v378/measurement-authority-topology",
    responseMaximumBytes: 64 * 1024,
    noStore: true,
    localShadowOnly: true,
    defaultApplied: false,
    legacyV9Default: true,
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
  attemptConsumed: false,
  networkAttempted: false,
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
    "qualified-provenance-dag-only-one-photon-input-seven-measured-inputs-missing-no-expectation-no-image-no-observed-counts",
};
const evidence = { ...evidenceUnsigned, evidenceSha256: sha(evidenceUnsigned) };
atomic(paths.evidence, evidence);
const pointerUnsigned = {
  version: "orbit-atlas-current-local-shadow-candidate-v378",
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
    v378AuthorityTopology: "qualified-acyclic-10-nodes-9-required-edges",
    v378AuthorityInput: "partial-1-of-8",
    v378ObservedCountsBoundary: "outside-graph-no-node-no-promotion",
    v378RuntimeConsumer: "v11-provenance-cryobus-wired",
    v378DefaultBoundary: "manual-local-shadow-only-default-legacy-v9",
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
      topology: pointer.capabilities.v378AuthorityTopology,
      input: pointer.capabilities.v378AuthorityInput,
      observedCounts: pointer.capabilities.v378ObservedCountsBoundary,
      dense: pointer.capabilities.v314CorrectedDense,
      browser: pointer.capabilities.browserQualification,
    },
    null,
    2,
  ),
);
