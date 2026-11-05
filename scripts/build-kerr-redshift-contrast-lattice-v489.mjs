import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = Object.freeze({
  atlas: "dist/science/kerr-dimensionless-photon-atlas-v487/atlas.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  artifact: "dist/science/kerr-redshift-contrast-lattice-v489/contrast-lattice.json",
  svg: "dist/science/kerr-redshift-contrast-lattice-v489/contrast-lattice.svg",
});
const transient = new Set(["generatedAt", "artifactSha256", "payloadSha256", "stageChainSha256", "evidenceSha256", "pointerSha256"]);
const bytes = (path) => readFileSync(resolve(root, path));
const read = (path) => JSON.parse(bytes(path).toString("utf8"));
const digest = (value) => createHash("sha256").update(value).digest("hex");
const fileSha = (path) => digest(bytes(path));
const canonicalize = (value) => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.entries(value).filter(([key]) => !transient.has(key)).sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0).map(([key, entry]) => [key, canonicalize(entry)]));
const canonicalSha = (value) => digest(JSON.stringify(canonicalize(value)));
const atomicText = (path, value) => { const target = resolve(root, path); mkdirSync(dirname(target), { recursive: true }); const part = `${target}.${process.pid}.part`; writeFileSync(part, value, "utf8"); renameSync(part, target); };
const atomicJson = (path, value) => atomicText(path, `${JSON.stringify(value, null, 2)}\n`);

const atlas = read(paths.atlas), dense = read(paths.dense), formal = read(paths.formal), formalEvidence = read(formal.source);
if (
  atlas.version !== "v487-kerr-dimensionless-photon-atlas-artifact-v1" || canonicalSha(atlas) !== atlas.artifactSha256 || canonicalSha(atlas.rays) !== atlas.payloadSha256 ||
  atlas.rays.length !== 4 || atlas.rays.flatMap((ray) => ray.landmarks).length !== 20 || atlas.boundary.dimensionlessCoordinateAtlasAuthorityGranted !== true ||
  dense.status !== "incomplete-0-of-49" || dense.completedShardCount !== 0 || dense.attemptConsumed !== false ||
  formal.version !== "v263-current-product-evidence-pointer" || formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" || formalEvidence.contracts?.singleCanvas !== true || formalEvidence.contracts?.legacyRootAttributes !== 603 || formalEvidence.contracts?.evidenceLedgerClaims !== 84
) throw new Error("v489-upstream-boundary");

const nodes = atlas.rays.map((ray) => {
  const logShift = Math.log(ray.redshiftFactor);
  const relativeUncertaintyUpperBound = Math.max(...ray.landmarks.map((entry) => entry.relativeCoordinateUncertaintyUpperBound));
  if (!Number.isFinite(logShift) || !Number.isFinite(relativeUncertaintyUpperBound) || relativeUncertaintyUpperBound < 0) throw new Error(`v489-node:${ray.rayId}`);
  return Object.freeze({ rayId: ray.rayId, redshiftFactor: ray.redshiftFactor, shiftClass: ray.shiftClass, logShift, logShiftUncertaintyUpperBound: relativeUncertaintyUpperBound, uncertaintyCombinationPolicy: "linear-sum-correlation-between-rays-unknown", sourceRayIdentitySha256: canonicalSha(ray) });
});
const meanLogShift = nodes.reduce((sum, node) => sum + node.logShift, 0) / nodes.length;
const centeredNodes = nodes.map((node) => Object.freeze({ rayId: node.rayId, centeredLogShift: node.logShift - meanLogShift, centeredFactor: Math.exp(node.logShift - meanLogShift) }));
const centeredSumResidual = Math.abs(centeredNodes.reduce((sum, node) => sum + node.centeredLogShift, 0));
const matrix = nodes.flatMap((from, rowIndex) => nodes.map((to, columnIndex) => {
  const self = rowIndex === columnIndex;
  return Object.freeze({
    rowIndex,
    columnIndex,
    fromRayId: from.rayId,
    toRayId: to.rayId,
    factorRatio: to.redshiftFactor / from.redshiftFactor,
    logContrast: to.logShift - from.logShift,
    logContrastUncertaintyUpperBound: self ? 0 : from.logShiftUncertaintyUpperBound + to.logShiftUncertaintyUpperBound,
    uncertaintyCombinationPolicy: self ? "exact-self-identity" : "linear-sum-correlation-between-rays-unknown",
  });
}));
const cell = (from, to) => matrix.find((entry) => entry.fromRayId === from && entry.toRayId === to);
let maximumLandmarkLogContrastResidual = 0;
const pairs = [];
for (let fromIndex = 0; fromIndex < atlas.rays.length; fromIndex += 1) {
  for (let toIndex = fromIndex + 1; toIndex < atlas.rays.length; toIndex += 1) {
    const from = atlas.rays[fromIndex], to = atlas.rays[toIndex], contrast = cell(from.rayId, to.rayId);
    const landmarkAudits = from.landmarks.map((landmark, anchorIndex) => {
      const other = to.landmarks[anchorIndex];
      if (landmark.emitterCoordinate !== other.emitterCoordinate) throw new Error(`v489-anchor:${from.rayId}:${to.rayId}:${anchorIndex}`);
      const direct = Math.log(other.observerCoordinate / landmark.observerCoordinate);
      const residual = Math.abs(direct - contrast.logContrast);
      maximumLandmarkLogContrastResidual = Math.max(maximumLandmarkLogContrastResidual, residual);
      return Object.freeze({ anchorIndex, emitterCoordinate: landmark.emitterCoordinate, directObserverLogContrast: direct, redshiftFactorLogContrast: contrast.logContrast, absoluteResidual: residual });
    });
    pairs.push(Object.freeze({ pairId: `${from.rayId}--${to.rayId}`, fromRayId: from.rayId, toRayId: to.rayId, factorRatio: contrast.factorRatio, logContrast: contrast.logContrast, logContrastUncertaintyUpperBound: contrast.logContrastUncertaintyUpperBound, uncertaintyCombinationPolicy: contrast.uncertaintyCombinationPolicy, landmarkAudits }));
  }
}
let maximumAntisymmetryResidual = 0;
for (const entry of matrix) maximumAntisymmetryResidual = Math.max(maximumAntisymmetryResidual, Math.abs(entry.logContrast + cell(entry.toRayId, entry.fromRayId).logContrast));
let maximumCycleClosureResidual = 0;
let cycleAuditCount = 0;
for (const first of nodes) for (const second of nodes) for (const third of nodes) {
  if (new Set([first.rayId, second.rayId, third.rayId]).size !== 3) continue;
  const closure = cell(first.rayId, second.rayId).logContrast + cell(second.rayId, third.rayId).logContrast + cell(third.rayId, first.rayId).logContrast;
  maximumCycleClosureResidual = Math.max(maximumCycleClosureResidual, Math.abs(closure)); cycleAuditCount += 1;
}
if (matrix.length !== 16 || pairs.length !== 6 || pairs.flatMap((pair) => pair.landmarkAudits).length !== 30 || cycleAuditCount !== 24 || maximumAntisymmetryResidual > 1e-15 || maximumCycleClosureResidual > 1e-15 || maximumLandmarkLogContrastResidual > 1e-15 || centeredSumResidual > 1e-15) throw new Error("v489-invariant-gate");

const payload = Object.freeze({ nodes, centeredNodes, matrix, pairs });
const payloadSha256 = canonicalSha(payload);
const maxAbsContrast = Math.max(...matrix.map((entry) => Math.abs(entry.logContrast)));
const color = (value) => value > 0 ? "#66e7ff" : value < 0 ? "#ff8a68" : "#9ab0b3";
const opacity = (value) => value === 0 ? 0.08 : 0.12 + 0.5 * Math.abs(value) / maxAbsContrast;
const gridX = 145, gridY = 205, cellSize = 132;
const matrixSvg = matrix.map((entry) => {
  const x = gridX + entry.columnIndex * cellSize, y = gridY + entry.rowIndex * cellSize;
  return `<g><rect x="${x}" y="${y}" width="118" height="118" rx="15" fill="${color(entry.logContrast)}" fill-opacity="${opacity(entry.logContrast).toFixed(3)}" stroke="${color(entry.logContrast)}" stroke-opacity="0.26"/><text x="${x + 59}" y="${y + 52}" text-anchor="middle" fill="#efffff" font-size="17" font-family="monospace">${entry.logContrast.toFixed(5)}</text><text x="${x + 59}" y="${y + 78}" text-anchor="middle" fill="#d4ecef" fill-opacity="0.45" font-size="10" font-family="monospace">x${entry.factorRatio.toFixed(5)}</text></g>`;
}).join("");
const labels = nodes.map((node, index) => `<text x="${gridX + index * cellSize + 59}" y="180" text-anchor="middle" fill="#d9f5f7" fill-opacity="0.58" font-size="12" font-family="monospace">to ${node.rayId}</text><text x="128" y="${gridY + index * cellSize + 64}" text-anchor="end" fill="#d9f5f7" fill-opacity="0.58" font-size="12" font-family="monospace">from ${node.rayId}</text>`).join("");
const barCenterX = 1085, barScale = 920;
const bars = centeredNodes.map((entry, index) => { const y = 265 + index * 95, end = barCenterX + entry.centeredLogShift * barScale; return `<g><text x="790" y="${y + 5}" fill="#e9ffff" font-size="17" font-family="Georgia,serif">${entry.rayId}</text><line x1="${barCenterX}" y1="${y}" x2="${end.toFixed(2)}" y2="${y}" stroke="${color(entry.centeredLogShift)}" stroke-width="8"/><circle cx="${end.toFixed(2)}" cy="${y}" r="7" fill="#061012" stroke="${color(entry.centeredLogShift)}" stroke-width="2"/><text x="1340" y="${y + 5}" text-anchor="end" fill="#d3edef" fill-opacity="0.48" font-size="12" font-family="monospace">${entry.centeredLogShift >= 0 ? "+" : ""}${entry.centeredLogShift.toFixed(6)}</text></g>`; }).join("");
const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="900" viewBox="0 0 1440 900" role="img" aria-labelledby="title description">
<title id="title">Orbit Atlas V489 relative redshift contrast lattice</title><description id="description">A deterministic matrix of dimensionless pairwise log redshift contrasts across four sparse Kerr disk rays. It is not an intensity spectrum, detector response or statistical likelihood.</description><metadata>payload-sha256:${payloadSha256}; uncertainty:linear-sum-correlation-unknown; detector-authority:false</metadata>
<rect width="1440" height="900" fill="#020607"/><rect x="28" y="28" width="1384" height="844" rx="28" fill="#061012" stroke="#bfeef3" stroke-opacity="0.13"/>
<text x="64" y="72" fill="#79eaff" font-size="13" font-family="monospace" letter-spacing="4">V489 / RELATIVE REDSHIFT CONTRAST LATTICE</text><text x="64" y="118" fill="#f0ffff" font-size="34" font-family="Georgia,serif">Gauge-free contrasts, bounded claims</text><text x="1374" y="72" text-anchor="end" fill="#c5e5e8" fill-opacity="0.38" font-size="12" font-family="monospace">16 directed cells / 6 pairs / 30 landmark audits</text>
<text x="145" y="157" fill="#d7f2f4" fill-opacity="0.48" font-size="12" font-family="monospace">Δ log g = log(g_to / g_from)</text>${labels}${matrixSvg}
<line x1="1085" y1="212" x2="1085" y2="610" stroke="#d9f7fa" stroke-opacity="0.16"/><text x="790" y="190" fill="#d7f2f4" fill-opacity="0.48" font-size="12" font-family="monospace">centered log-shift / mean removed</text>${bars}
<g transform="translate(64 748)"><rect width="1312" height="94" rx="15" fill="#000" fill-opacity="0.27" stroke="#bfeef3" stroke-opacity="0.1"/><text x="24" y="29" fill="#e8ffff" fill-opacity="0.72" font-size="13" font-family="monospace">Invariant gates: antisymmetry &lt; 1e-15 / 24 cycles &lt; 1e-15 / 30 landmark ratios &lt; 1e-15</text><text x="24" y="55" fill="#ffcf83" fill-opacity="0.72" font-size="13" font-family="monospace">Uncertainty: deterministic upper bounds combined linearly; cross-ray correlation unknown; no RSS and no 1σ claim</text><text x="24" y="79" fill="#ff9270" fill-opacity="0.68" font-size="13" font-family="monospace">Unavailable: Hz, bandpass, throughput, intensity, Fisher, likelihood, FITS/PNG and science raster</text></g></svg>\n`;
atomicText(paths.svg, svg);
const svgSha256 = digest(Buffer.from(svg, "utf8"));
const sourcePaths = [paths.atlas, paths.dense, paths.formal, "scripts/build-kerr-redshift-contrast-lattice-v489.mjs"];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const unsigned = {
  version: "v489-kerr-redshift-contrast-lattice-artifact-v1", generatedAt: "2026-08-01T00:00:00Z", status: "dimensionless-redshift-contrast-qualified-physical-observables-blocked-browser-pending",
  source: { v487ArtifactSha256: atlas.artifactSha256, v487PayloadSha256: atlas.payloadSha256, v314StateSha256: dense.stateSha256 },
  contract: { rayCount: 4, landmarkCount: 20, directedContrastCount: 16, independentPairCount: 6, landmarkRatioAuditCount: 30, cycleAuditCount: 24, coordinateSystem: "dimensionless-log-redshift-contrast", uncertaintyCombinationPolicy: "linear-sum-correlation-between-rays-unknown", rssAllowed: false, statisticalOneSigmaAuthorityGranted: false, diagnosticVectorPlotOnly: true, maximumResponseBytes: 128 * 1024, localShadowOnly: true, formalProductPointer: "v263" },
  nodes, centeredNodes, matrix, pairs, payloadSha256,
  vectorDiagnostic: { path: paths.svg, mediaType: "image/svg+xml; charset=utf-8", width: 1440, height: 900, fileSha256: svgSha256, deterministic: true, linearDisplay: true, bloomIntensity: 0, colorGradeIntensity: 0, scientificFieldMutationAllowed: false },
  audit: { maximumAntisymmetryResidual, maximumCycleClosureResidual, maximumLandmarkLogContrastResidual, centeredSumResidual, directedContrastCount: matrix.length, independentPairCount: pairs.length, landmarkRatioAuditCount: pairs.flatMap((pair) => pair.landmarkAudits).length, cycleAuditCount, matrixElementCountCopied: 0, detectorObservableRows: 0, observedIntensityRows: 0, sciencePixelRows: 0, fitsProducts: 0, pngProducts: 0 },
  lifecycle: { existingCanvasCount: 1, newCanvasCreated: false, sceneRevisionDelta: 0, workers: 0, gpuBuffers: 0, textures: 0, renderTargets: 0, objectUrls: 0, cameraLeases: 0, allResourcesAtBaseline: true },
  boundary: { dimensionlessRedshiftContrastAuthorityGranted: true, diagnosticSvgAuthorityGranted: true, crossRayStatisticalCovarianceAuthorityGranted: false, absoluteFrequencyAuthorityGranted: false, physicalBandpassAuthorityGranted: false, detectorThroughputAuthorityGranted: false, observedIntensityAuthorityGranted: false, fisherInformationAuthorityGranted: false, statisticalLikelihoodAuthorityGranted: false, scienceRasterAuthorityGranted: false, fitsWriteAllowed: false, pngWriteAllowed: false, denseShardRunAllowed: false, denseCampaignStatus: "incomplete-0-of-49", browserQualification: "not-run", visualMatrixQualification: "not-run", soakQualification: "not-run", rtxWebGpuQualification: "not-run" },
  sourceManifest, sourceSha256: canonicalSha(sourceManifest), formalProductPointer: "v263", formalDefaultKernel: "legacy-eih-1pn",
};
const artifact = { ...unsigned, artifactSha256: canonicalSha(unsigned) }; atomicJson(paths.artifact, artifact);
console.log(JSON.stringify({ status: artifact.status, artifactSha256: artifact.artifactSha256, payloadSha256, svgSha256, directedContrasts: 16, independentPairs: 6, landmarkAudits: 30, cycleAudits: 24, maximumCycleClosureResidual, sciencePixels: 0, denseCampaign: "0/49" }, null, 2));
