import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = Object.freeze({
  v479: "dist/science/kerr-frequency-provenance-viewer-v479/provenance-viewer.json",
  v480: "dist/science/kerr-photon-evidence-workbench-v480/workbench.json",
  v481: "dist/science/kerr-spectral-landmark-transport-v481/landmarks.json",
  v482: "dist/science/kerr-spectral-landmark-covariance-v482/covariance.json",
  v483: "dist/science/kerr-spectral-sensitivity-modes-v483/sensitivity-modes.json",
  v484: "dist/science/kerr-spectral-identifiability-v484/identifiability.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  artifact: "dist/science/kerr-dimensionless-photon-atlas-v487/atlas.json",
  svg: "dist/science/kerr-dimensionless-photon-atlas-v487/atlas.svg",
});
const transient = new Set([
  "generatedAt",
  "artifactSha256",
  "payloadSha256",
  "stageChainSha256",
  "evidenceSha256",
  "pointerSha256",
]);
const bytes = (path) => readFileSync(resolve(root, path));
const read = (path) => JSON.parse(bytes(path).toString("utf8"));
const fileSha = (path) => createHash("sha256").update(bytes(path)).digest("hex");
const digest = (value) => createHash("sha256").update(value).digest("hex");
const canonicalizeWith = (value, omitted) =>
  Array.isArray(value)
    ? value.map((entry) => canonicalizeWith(entry, omitted))
    : !value || typeof value !== "object"
      ? value
      : Object.fromEntries(
          Object.entries(value)
            .filter(([key]) => !omitted.has(key))
            .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
            .map(([key, entry]) => [key, canonicalizeWith(entry, omitted)]),
        );
const canonicalize = (value) => canonicalizeWith(value, transient);
const canonicalSha = (value) => digest(JSON.stringify(canonicalize(value)));
const sourceTransient = Object.freeze({
  v479: new Set([...transient, "provenanceSha256", "frequencyBufferSha256", "rowSha256"]),
  v480: new Set(["generatedAt", "artifactSha256", "evidenceSha256", "pointerSha256"]),
  v481: new Set([...transient, "rowSha256"]),
  v482: new Set([...transient, "rowSha256"]),
  v483: new Set([...transient, "rowSha256"]),
  v484: new Set([...transient, "rowSha256"]),
});
const sourceCanonicalSha = (id, value) =>
  digest(JSON.stringify(canonicalizeWith(value, sourceTransient[id])));
const atomicText = (path, value) => {
  const target = resolve(root, path);
  mkdirSync(dirname(target), { recursive: true });
  const part = `${target}.${process.pid}.part`;
  writeFileSync(part, value, "utf8");
  renameSync(part, target);
};
const atomicJson = (path, value) => atomicText(path, `${JSON.stringify(value, null, 2)}\n`);
const finite = (value, label) => {
  if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`v487-finite:${label}`);
  return value;
};
const asMap = (rows, label) => {
  const map = new Map(rows.map((row) => [row.rayId, row]));
  if (map.size !== rows.length) throw new Error(`v487-duplicate:${label}`);
  return map;
};

const sources = Object.fromEntries(
  ["v479", "v480", "v481", "v482", "v483", "v484"].map((id) => [id, read(paths[id])]),
);
const dense = read(paths.dense);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);
for (const [id, artifact] of Object.entries(sources)) {
  if (sourceCanonicalSha(id, artifact) !== artifact.artifactSha256) throw new Error(`v487-source-sha:${id}`);
}
if (
  sources.v479.contract.frequencyBufferSampleCount !== 20 ||
  sources.v481.contract.landmarkCount !== 20 ||
  sources.v482.contract.covarianceMatrixCount !== 4 ||
  sources.v482.contract.rankUpperBound !== 1 ||
  sources.v483.contract.commonScaleModeCount !== 1 ||
  sources.v483.contract.nullspaceModeCount !== 4 ||
  sources.v484.contract.identifiableDimensionPerRay !== 1 ||
  sources.v484.contract.unidentifiableDimensionPerRay !== 4 ||
  dense.status !== "incomplete-0-of-49" ||
  dense.completedShardCount !== 0 ||
  dense.attemptConsumed !== false ||
  formal.version !== "v263-current-product-evidence-pointer" ||
  formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" ||
  formalEvidence.contracts?.singleCanvas !== true ||
  formalEvidence.contracts?.legacyRootAttributes !== 603 ||
  formalEvidence.contracts?.evidenceLedgerClaims !== 84
) {
  throw new Error("v487-upstream-boundary");
}

const sourceMaps = {
  v479: asMap(sources.v479.frequencyBuffer, "v479"),
  v482: asMap(sources.v482.rows, "v482"),
  v483: asMap(sources.v483.rows, "v483"),
  v484: asMap(sources.v484.rows, "v484"),
};
let maximumTransportResidual = 0;
const rays = sources.v481.rows.map((landmarkRow) => {
  const frequencyRow = sourceMaps.v479.get(landmarkRow.rayId);
  const covarianceRow = sourceMaps.v482.get(landmarkRow.rayId);
  const sensitivityRow = sourceMaps.v483.get(landmarkRow.rayId);
  const identifiabilityRow = sourceMaps.v484.get(landmarkRow.rayId);
  if (!frequencyRow || !covarianceRow || !sensitivityRow || !identifiabilityRow) {
    throw new Error(`v487-ray-join:${landmarkRow.rayId}`);
  }
  if (
    frequencyRow.samples.length !== 5 ||
    landmarkRow.features.length !== 5 ||
    sensitivityRow.projections.length !== 5 ||
    identifiabilityRow.identifiableDimension !== 1 ||
    identifiabilityRow.unidentifiableDimension !== 4
  ) {
    throw new Error(`v487-ray-shape:${landmarkRow.rayId}`);
  }
  const landmarks = landmarkRow.features.map((feature, index) => {
    const sample = frequencyRow.samples[index];
    const emitter = finite(feature.emitterCoordinate, `${landmarkRow.rayId}:emitter:${index}`);
    const observer = finite(feature.observerCoordinate, `${landmarkRow.rayId}:observer:${index}`);
    const transported = finite(landmarkRow.redshiftFactor, `${landmarkRow.rayId}:g`) * emitter;
    const residual = Math.abs(observer - transported) / Math.max(Math.abs(observer), 1);
    maximumTransportResidual = Math.max(maximumTransportResidual, residual);
    if (
      feature.anchorIndex !== index ||
      sample.anchorIndex !== index ||
      feature.observerCoordinate !== sample.observerFrequencyOverReference ||
      feature.emitterCoordinate !== sample.emitterFrequencyOverReference
    ) {
      throw new Error(`v487-landmark-identity:${landmarkRow.rayId}:${index}`);
    }
    return Object.freeze({
      id: feature.id,
      anchorIndex: index,
      emitterCoordinate: emitter,
      observerCoordinate: observer,
      observerCoordinateUncertaintyUpperBound: finite(
        feature.observerCoordinateUncertaintyUpperBound,
        `${landmarkRow.rayId}:u:${index}`,
      ),
      relativeCoordinateUncertaintyUpperBound: finite(
        feature.relativeCoordinateUncertaintyUpperBound,
        `${landmarkRow.rayId}:ur:${index}`,
      ),
      applicability: "dimensionless-feature-position-only",
    });
  });
  if (!landmarks.every((entry, index) => index === 0 || entry.observerCoordinate > landmarks[index - 1].observerCoordinate)) {
    throw new Error(`v487-monotonic:${landmarkRow.rayId}`);
  }
  const commonScale = sensitivityRow.projections.find((entry) => entry.modeId === "common-scale");
  if (!commonScale) throw new Error(`v487-common-scale:${landmarkRow.rayId}`);
  return Object.freeze({
    rayId: landmarkRow.rayId,
    redshiftFactor: finite(landmarkRow.redshiftFactor, `${landmarkRow.rayId}:g`),
    shiftClass: landmarkRow.shiftClass,
    coordinateSystem: "dimensionless-frequency-over-unspecified-reference",
    landmarks,
    commonScaleMode: Object.freeze({
      projectedCoordinate: finite(commonScale.projectedCoordinate, `${landmarkRow.rayId}:projection`),
      varianceUpperBound: finite(commonScale.varianceUpperBoundDirect, `${landmarkRow.rayId}:variance`),
      standardDeviationUpperBoundDisplayOnly: finite(
        commonScale.standardDeviationUpperBoundDisplayOnly,
        `${landmarkRow.rayId}:sd`,
      ),
      interpretation: "deterministic-upper-bound-not-1sigma",
    }),
    identifiability: Object.freeze({
      identifiableDimension: 1,
      unidentifiableDimension: 4,
      fullConditionNumber: "infinite-singular",
      fisherInformationAuthorityGranted: false,
      likelihoodAuthorityGranted: false,
    }),
    sourceIdentity: Object.freeze({
      frequencyRowSha256: frequencyRow.rowSha256,
      landmarkRowSha256: landmarkRow.rowSha256,
      covarianceRowSha256: covarianceRow.rowSha256,
      sensitivityRowSha256: sensitivityRow.rowSha256,
      identifiabilityRowSha256: identifiabilityRow.rowSha256,
    }),
  });
});
if (rays.length !== 4 || rays.flatMap((ray) => ray.landmarks).length !== 20) {
  throw new Error("v487-counts");
}

const payloadSha256 = canonicalSha(rays);
const escapeXml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");
const width = 1440;
const height = 900;
const left = 290;
const right = 1320;
const xMin = 0.35;
const xMax = 2.2;
const x = (value) => left + ((value - xMin) / (xMax - xMin)) * (right - left);
const anchorValues = [0.5, 0.75, 1, 1.5, 2];
const colors = { blueshift: "#68e8ff", redshift: "#ff9270" };
const grid = anchorValues.map((value) => `
    <line x1="${x(value).toFixed(2)}" y1="118" x2="${x(value).toFixed(2)}" y2="706" stroke="#9cc8cf" stroke-opacity="0.11" />
    <text x="${x(value).toFixed(2)}" y="92" text-anchor="middle" fill="#b8dbe0" fill-opacity="0.55" font-size="15">${value}</text>`).join("");
const rails = rays.map((ray, rayIndex) => {
  const y = 190 + rayIndex * 135;
  const color = colors[ray.shiftClass];
  const connectors = ray.landmarks.map((landmark) => `
      <line x1="${x(landmark.emitterCoordinate).toFixed(2)}" y1="${y - 13}" x2="${x(landmark.observerCoordinate).toFixed(2)}" y2="${y + 13}" stroke="${color}" stroke-opacity="0.28" />
      <circle cx="${x(landmark.emitterCoordinate).toFixed(2)}" cy="${y - 13}" r="3.5" fill="#d8eef0" fill-opacity="0.35" />
      <circle cx="${x(landmark.observerCoordinate).toFixed(2)}" cy="${y + 13}" r="7" fill="#061012" stroke="${color}" stroke-width="2" />`).join("");
  return `
    <g data-ray="${escapeXml(ray.rayId)}">
      <text x="64" y="${y - 4}" fill="#efffff" font-size="22" font-family="Georgia,serif">${escapeXml(ray.rayId)}</text>
      <text x="64" y="${y + 20}" fill="${color}" fill-opacity="0.78" font-size="13" font-family="monospace">g=${ray.redshiftFactor.toFixed(9)} / ${escapeXml(ray.shiftClass)}</text>
      <line x1="${left}" y1="${y}" x2="${right}" y2="${y}" stroke="#d9f7fa" stroke-opacity="0.13" />
      ${connectors}
      <text x="${right}" y="${y + 38}" text-anchor="end" fill="#cce6e9" fill-opacity="0.44" font-size="12" font-family="monospace">rank 1 / nullity 4 / covariance upper bound only</text>
    </g>`;
}).join("");
const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title description">
  <title id="title">Orbit Atlas V487 dimensionless photon metrology atlas</title>
  <description id="description">Four sparse Kerr disk rays with twenty dimensionless emitter and observer frequency landmarks. This is a coordinate diagnostic, not an intensity spectrum or detector image.</description>
  <metadata>payload-sha256:${payloadSha256}; reference-frequency:unavailable; bandpass:unavailable; intensity:unavailable</metadata>
  <rect width="1440" height="900" fill="#020607" />
  <rect x="28" y="28" width="1384" height="844" rx="28" fill="#061012" stroke="#bfeef3" stroke-opacity="0.13" />
  <text x="64" y="72" fill="#79eaff" font-size="13" font-family="monospace" letter-spacing="4">V487 / DIMENSIONLESS PHOTON METROLOGY</text>
  <text x="64" y="117" fill="#f0ffff" font-size="34" font-family="Georgia,serif">Sparse redshift coordinate atlas</text>
  <text x="${right}" y="72" text-anchor="end" fill="#c5e5e8" fill-opacity="0.38" font-size="12" font-family="monospace">20 landmarks / 4 rays / payload ${payloadSha256.slice(0, 16)}</text>
  ${grid}
  ${rails}
  <g transform="translate(64 738)">
    <rect width="1312" height="104" rx="15" fill="#000" fill-opacity="0.27" stroke="#bfeef3" stroke-opacity="0.1" />
    <text x="24" y="31" fill="#e8ffff" fill-opacity="0.72" font-size="14" font-family="monospace">ν / νref — dimensionless; νref remains unspecified</text>
    <text x="24" y="58" fill="#ffcf83" fill-opacity="0.72" font-size="13" font-family="monospace">Authority: coordinate transport + deterministic correlated upper bound + algebraic rank 1/5</text>
    <text x="24" y="83" fill="#ff9270" fill-opacity="0.68" font-size="13" font-family="monospace">Unavailable: Hz, line identity, bandpass, throughput, intensity, likelihood, FITS/PNG and science raster</text>
    <text x="1288" y="58" text-anchor="end" fill="#79eaff" fill-opacity="0.66" font-size="13" font-family="monospace">Science display / linear / zero bloom / zero grade</text>
  </g>
</svg>
`;
atomicText(paths.svg, svg);
const svgSha256 = digest(Buffer.from(svg, "utf8"));
const sourcePaths = [
  paths.v479,
  paths.v480,
  paths.v481,
  paths.v482,
  paths.v483,
  paths.v484,
  paths.dense,
  paths.formal,
  "scripts/build-kerr-dimensionless-photon-atlas-v487.mjs",
];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const unsigned = {
  version: "v487-kerr-dimensionless-photon-atlas-artifact-v1",
  generatedAt: "2026-08-01T00:00:00Z",
  status: "dimensionless-photon-atlas-qualified-physical-observables-blocked-browser-pending",
  sourceArtifactSha256: Object.fromEntries(
    Object.entries(sources).map(([id, artifact]) => [id, artifact.artifactSha256]),
  ),
  contract: {
    rayCount: 4,
    landmarkCountPerRay: 5,
    landmarkCount: 20,
    coordinateSystem: "dimensionless-frequency-over-unspecified-reference",
    commonScaleModeCount: 1,
    nullspaceModeCount: 4,
    identifiableDimensionPerRay: 1,
    unidentifiableDimensionPerRay: 4,
    deterministicUpperBoundOnly: true,
    statisticalOneSigmaAuthorityGranted: false,
    diagnosticVectorPlotOnly: true,
    boundedSummaryOnly: true,
    maximumResponseBytes: 128 * 1024,
    localShadowOnly: true,
    formalProductPointer: "v263",
  },
  rays,
  payloadSha256,
  vectorDiagnostic: {
    path: paths.svg,
    mediaType: "image/svg+xml; charset=utf-8",
    width,
    height,
    fileSha256: svgSha256,
    deterministic: true,
    linearDisplay: true,
    bloomIntensity: 0,
    colorGradeIntensity: 0,
    scientificFieldMutationAllowed: false,
  },
  audit: {
    joinedRayCount: rays.length,
    joinedLandmarkCount: rays.flatMap((ray) => ray.landmarks).length,
    blueshiftRayCount: rays.filter((ray) => ray.shiftClass === "blueshift").length,
    redshiftRayCount: rays.filter((ray) => ray.shiftClass === "redshift").length,
    maximumTransportRelativeResidual: maximumTransportResidual,
    monotonicRayCount: rays.length,
    matrixElementCountCopied: 0,
    projectionRecordCountCopied: 0,
    detectorObservableRows: 0,
    observedIntensityRows: 0,
    sciencePixelRows: 0,
    fitsProducts: 0,
    pngProducts: 0,
  },
  lifecycle: {
    existingCanvasCount: 1,
    newCanvasCreated: false,
    sceneRevisionDelta: 0,
    workers: 0,
    gpuBuffers: 0,
    textures: 0,
    renderTargets: 0,
    objectUrls: 0,
    cameraLeases: 0,
    allResourcesAtBaseline: true,
  },
  boundary: {
    dimensionlessCoordinateAtlasAuthorityGranted: true,
    diagnosticSvgAuthorityGranted: true,
    absoluteFrequencyAuthorityGranted: false,
    physicalLineIdentityAuthorityGranted: false,
    physicalBandpassAuthorityGranted: false,
    detectorThroughputAuthorityGranted: false,
    observedIntensityAuthorityGranted: false,
    statisticalLikelihoodAuthorityGranted: false,
    scienceRasterAuthorityGranted: false,
    fitsWriteAllowed: false,
    pngWriteAllowed: false,
    denseShardRunAllowed: false,
    denseCampaignStatus: "incomplete-0-of-49",
    browserQualification: "not-run",
    visualMatrixQualification: "not-run",
    soakQualification: "not-run",
    rtxWebGpuQualification: "not-run",
  },
  sourceManifest,
  sourceSha256: canonicalSha(sourceManifest),
  formalProductPointer: "v263",
  formalDefaultKernel: "legacy-eih-1pn",
};
const artifact = { ...unsigned, artifactSha256: canonicalSha(unsigned) };
atomicJson(paths.artifact, artifact);
console.log(JSON.stringify({
  status: artifact.status,
  artifactSha256: artifact.artifactSha256,
  payloadSha256,
  svgSha256,
  rays: 4,
  landmarks: 20,
  rank: "1/5",
  sciencePixels: 0,
  denseCampaign: "0/49",
}, null, 2));
