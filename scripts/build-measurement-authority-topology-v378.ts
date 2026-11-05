import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import {
  MEASUREMENT_AUTHORITY_INPUT_IDS_V378,
  parseMeasurementAuthorityTopologyV378,
  type MeasurementAuthorityEdgeV378,
  type MeasurementAuthorityLaneV378,
  type MeasurementAuthorityNodeV378,
} from "../app/lib/measurementAuthorityTopologyV378";

const root = process.cwd();
const output = "dist/science/measurement-authority-topology-v378/topology.json";
const inputDefinitions = [
  { id: "v367-detector-admission", label: "Detector admission", lane: "detector", role: "authority-admission", path: "dist/science/detector-calibration-v367/admission.json" },
  { id: "v367-detector-authority-pointer", label: "Detector authority", lane: "detector", role: "authority-pointer", path: "dist/release/orbit-atlas-detector-calibration-authority-v367.json" },
  { id: "v361-detector-manifest", label: "Detector manifest", lane: "detector", role: "measured-input", path: "dist/staging/detector-calibration-v361/manifest.json" },
  { id: "v373-geometry-admission", label: "Geometry admission", lane: "geometry", role: "authority-admission", path: "dist/science/observation-geometry-v373/admission.json" },
  { id: "v373-geometry-authority-pointer", label: "Geometry authority", lane: "geometry", role: "authority-pointer", path: "dist/release/orbit-atlas-observation-geometry-authority-v373.json" },
  { id: "v374-geometry-publication-receipt", label: "Geometry publication", lane: "geometry", role: "publication-receipt", path: "dist/science/observation-geometry-v374/publication.json" },
  { id: "v369-runtime-observation-geometry", label: "Runtime observation geometry", lane: "geometry", role: "runtime-geometry", path: "dist/staging/detector-calibration-v369/observation-geometry.json" },
  { id: "v328-photon-radiance", label: "Photon radiance", lane: "photon", role: "science-input", path: "dist/science/kerr-science-photon-bands-v328/photon-radiance.json" },
] as const;
const bytes = (path: string) => readFileSync(resolve(root, path));
const read = (path: string) => JSON.parse(bytes(path).toString("utf8"));
const fileSha = (path: string) =>
  createHash("sha256").update(bytes(path)).digest("hex");
const canonicalize = (value: unknown): unknown =>
  Array.isArray(value)
    ? value.map(canonicalize)
    : !value || typeof value !== "object"
      ? value
      : Object.fromEntries(
          Object.entries(value as Record<string, unknown>)
            .filter(
              ([key]) =>
                !["generatedAt", "artifactSha256", "pointerSha256"].includes(key),
            )
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([key, entry]) => [key, canonicalize(entry)]),
        );
const sha = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");

const inspect = read("dist/science/measured-expectation-v375/inspect.json");
const imageInspect = read("dist/science/expected-electron-image-v376/inspect.json");
const dense = read("dist/science/kerr-campaign-v314/campaign-state.json");
const formal = read("dist/release/orbit-atlas-current-product-evidence-v263.json");
const formalEvidence = read(formal.source);
if (
  JSON.stringify(inspect.expectedInputs) !==
    JSON.stringify(MEASUREMENT_AUTHORITY_INPUT_IDS_V378) ||
  inspect.status !== "blocked-dual-authority-inputs-unavailable" ||
  inspect.presentInputCount !== 1 ||
  inspect.missingInputs?.length !== 7 ||
  inspect.photonInputQualified !== true ||
  inspect.detectorAuthorityQualified !== false ||
  inspect.geometryAuthorityQualified !== false ||
  inspect.measuredExpectationAvailable !== false ||
  inspect.expectationRowCount !== 0 ||
  imageInspect.status !== "blocked-envelope-unavailable" ||
  imageInspect.imageAvailable !== false ||
  imageInspect.zeroImageFallbackUsed !== false ||
  dense.status !== "incomplete-0-of-49" ||
  dense.completedShardCount !== 0 ||
  dense.attemptConsumed !== false ||
  dense.aggregateAvailable !== false ||
  formal.version !== "v263-current-product-evidence-pointer" ||
  formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" ||
  formalEvidence.contracts?.workerPhysicsMutation !== "not-applied" ||
  formalEvidence.contracts?.singleCanvas !== true
) {
  throw new Error("v378-topology-source-boundary");
}

const nodes: MeasurementAuthorityNodeV378[] = inputDefinitions.map((entry) => {
  const available = existsSync(resolve(root, entry.path));
  const artifact = available ? read(entry.path) : null;
  const qualified = entry.id === "v328-photon-radiance" && available;
  if (available !== !inspect.missingInputs.includes(entry.id) || qualified !== available) {
    throw new Error(`v378-topology-input-mismatch:${entry.id}`);
  }
  if (
    qualified &&
    (artifact?.version !== "v328-kerr-science-photon-bands-artifact-v1" ||
      sha(artifact) !== artifact.artifactSha256)
  ) {
    throw new Error("v378-photon-authority");
  }
  return Object.freeze({
    id: entry.id,
    label: entry.label,
    lane: entry.lane as MeasurementAuthorityLaneV378,
    role: entry.role,
    status: qualified ? "qualified" : "missing",
    available,
    authoritative: qualified,
    sourcePath: entry.path,
    sourceFileSha256: qualified ? fileSha(entry.path) : null,
    canonicalSha256: qualified ? artifact.artifactSha256 : null,
    reason: qualified
      ? "qualified-sparse-photon-authority"
      : "measured-authority-input-unavailable",
  });
});
nodes.push(
  Object.freeze({
    id: "v375-dual-authority-envelope",
    label: "Dual-authority expectation",
    lane: "fusion",
    role: "derived-envelope",
    status: "withheld",
    available: false,
    authoritative: false,
    sourcePath: null,
    sourceFileSha256: null,
    canonicalSha256: null,
    reason: "requires-all-eight-authority-inputs",
  }),
  Object.freeze({
    id: "v376-expected-electron-image",
    label: "Expected-electron science image",
    lane: "image",
    role: "derived-image",
    status: "withheld",
    available: false,
    authoritative: false,
    sourcePath: null,
    sourceFileSha256: null,
    canonicalSha256: null,
    reason: "requires-v375-dual-authority-envelope",
  }),
);
const edges: MeasurementAuthorityEdgeV378[] = [
  ...MEASUREMENT_AUTHORITY_INPUT_IDS_V378.map((id) =>
    Object.freeze({
      from: id,
      to: "v375-dual-authority-envelope" as const,
      requirement: "required-no-fallback" as const,
      satisfied: id === "v328-photon-radiance",
    }),
  ),
  Object.freeze({
    from: "v375-dual-authority-envelope" as const,
    to: "v376-expected-electron-image" as const,
    requirement: "required-no-fallback" as const,
    satisfied: false,
  }),
];
const unsigned = {
  version: "v378-measurement-authority-topology-v1" as const,
  generatedAt: new Date().toISOString(),
  status: "provenance-topology-qualified-inputs-partial-1-of-8-image-unavailable" as const,
  expectedInputCount: 8 as const,
  presentInputCount: 1 as const,
  missingInputCount: 7 as const,
  nodeCount: 10 as const,
  edgeCount: 9 as const,
  acyclic: true as const,
  topologicalOrder: [
    ...MEASUREMENT_AUTHORITY_INPUT_IDS_V378,
    "v375-dual-authority-envelope" as const,
    "v376-expected-electron-image" as const,
  ],
  nodes,
  edges,
  boundaries: {
    detectorAndGeometryAuthorityRequired: true as const,
    syntheticFallbackAllowed: false as const,
    expectationCanBecomeObservedCounts: false as const,
    observedCountsNodeExists: false as const,
    scienceImageRequiresV375Envelope: true as const,
    zeroImageFallbackAllowed: false as const,
    cinematicConsumerAllowed: false as const,
    sciencePayloadMutationAllowed: false as const,
  },
  attemptConsumed: false as const,
  networkAttempted: false as const,
  formalProductPointer: "v263" as const,
  denseCampaignStatus: "incomplete-0-of-49" as const,
  browserQualification: "not-run" as const,
};
const artifact = parseMeasurementAuthorityTopologyV378({
  ...unsigned,
  artifactSha256: sha(unsigned),
});
const target = resolve(root, output);
mkdirSync(dirname(target), { recursive: true });
const temporary = `${target}.${process.pid}.part`;
writeFileSync(temporary, `${JSON.stringify(artifact, null, 2)}\n`);
renameSync(temporary, target);
console.log(
  JSON.stringify(
    {
      status: artifact.status,
      artifactSha256: artifact.artifactSha256,
      nodes: artifact.nodeCount,
      edges: artifact.edgeCount,
      inputs: `${artifact.presentInputCount}/${artifact.expectedInputCount}`,
      image: "unavailable-no-arrays",
      observedCountsNode: artifact.boundaries.observedCountsNodeExists,
      dense: artifact.denseCampaignStatus,
    },
    null,
    2,
  ),
);
