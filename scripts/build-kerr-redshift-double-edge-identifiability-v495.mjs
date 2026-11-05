import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const paths = {
  gauge: "dist/science/kerr-redshift-gauge-reconstruction-v491/gauge-reconstruction.json",
  single: "dist/science/kerr-redshift-edge-redundancy-v493/edge-redundancy.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  artifact: "dist/science/kerr-redshift-double-edge-identifiability-v495/double-edge-identifiability.json",
  svg: "dist/science/kerr-redshift-double-edge-identifiability-v495/double-edge-identifiability.svg",
};
const transient = new Set(["generatedAt", "artifactSha256", "payloadSha256", "stageChainSha256", "evidenceSha256", "pointerSha256"]);
const bytes = (path) => readFileSync(resolve(root, path));
const read = (path) => JSON.parse(bytes(path).toString("utf8"));
const digest = (value) => createHash("sha256").update(value).digest("hex");
const fileSha = (path) => digest(bytes(path));
const canonicalize = (value) => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.entries(value).filter(([key]) => !transient.has(key)).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([key, entry]) => [key, canonicalize(entry)]));
const sha = (value) => digest(JSON.stringify(canonicalize(value)));
const atomicText = (path, value) => { const target = resolve(root, path); mkdirSync(dirname(target), { recursive: true }); const part = `${target}.${process.pid}.part`; writeFileSync(part, value, "utf8"); renameSync(part, target); };
const atomicJson = (path, value) => atomicText(path, `${JSON.stringify(value, null, 2)}\n`);
const transpose = (matrix) => matrix[0].map((_, column) => matrix.map((row) => row[column]));
const multiply = (left, right) => left.map((row) => transpose(right).map((column) => row.reduce((sum, value, index) => sum + value * column[index], 0)));
const matVec = (matrix, vector) => matrix.map((row) => row.reduce((sum, value, index) => sum + value * vector[index], 0));
const maxAbs = (values) => Math.max(...values.flat(Infinity).map((value) => Math.abs(value)));
const inverse = (matrix) => {
  const n = matrix.length;
  const augmented = matrix.map((row, i) => [...row, ...Array.from({ length: n }, (_, j) => i === j ? 1 : 0)]);
  for (let column = 0; column < n; column += 1) {
    let pivot = column;
    for (let row = column + 1; row < n; row += 1) if (Math.abs(augmented[row][column]) > Math.abs(augmented[pivot][column])) pivot = row;
    if (Math.abs(augmented[pivot][column]) < 1e-14) throw new Error("v495-singular-gauge-shift");
    [augmented[column], augmented[pivot]] = [augmented[pivot], augmented[column]];
    const scale = augmented[column][column];
    augmented[column] = augmented[column].map((value) => value / scale);
    for (let row = 0; row < n; row += 1) {
      if (row === column) continue;
      const factor = augmented[row][column];
      augmented[row] = augmented[row].map((value, index) => value - factor * augmented[column][index]);
    }
  }
  return augmented.map((row) => row.slice(n));
};
const connectedPseudoinverse = (laplacian) => {
  const n = laplacian.length;
  const j = Array.from({ length: n }, () => Array(n).fill(1 / n));
  const shifted = laplacian.map((row, i) => row.map((value, k) => value + j[i][k]));
  return inverse(shifted).map((row, i) => row.map((value, k) => value - j[i][k]));
};
const eigenvaluesSymmetric = (matrix) => {
  const a = matrix.map((row) => [...row]);
  const n = a.length;
  for (let iteration = 0; iteration < 100; iteration += 1) {
    let p = 0, q = 1, maximum = Math.abs(a[p][q]);
    for (let i = 0; i < n; i += 1) for (let j = i + 1; j < n; j += 1) if (Math.abs(a[i][j]) > maximum) { maximum = Math.abs(a[i][j]); p = i; q = j; }
    if (maximum < 1e-14) break;
    const angle = 0.5 * Math.atan2(2 * a[p][q], a[q][q] - a[p][p]);
    const c = Math.cos(angle), s = Math.sin(angle);
    const app = c * c * a[p][p] - 2 * s * c * a[p][q] + s * s * a[q][q];
    const aqq = s * s * a[p][p] + 2 * s * c * a[p][q] + c * c * a[q][q];
    for (let k = 0; k < n; k += 1) {
      if (k === p || k === q) continue;
      const akp = a[k][p], akq = a[k][q];
      a[k][p] = a[p][k] = c * akp - s * akq;
      a[k][q] = a[q][k] = s * akp + c * akq;
    }
    a[p][p] = app; a[q][q] = aqq; a[p][q] = a[q][p] = 0;
  }
  return a.map((row, index) => Math.abs(row[index]) < 1e-13 ? 0 : row[index]).sort((left, right) => left - right);
};

const gauge = read(paths.gauge);
const single = read(paths.single);
const dense = read(paths.dense);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);
if (
  gauge.version !== "v491-kerr-redshift-gauge-reconstruction-artifact-v1" || sha(gauge) !== gauge.artifactSha256 || gauge.edges.length !== 6 || gauge.contract.laplacianRank !== 3 || gauge.contract.gaugeNullity !== 1 ||
  single.version !== "v493-kerr-redshift-edge-redundancy-artifact-v1" || sha(single) !== single.artifactSha256 || single.deletionCases.length !== 6 || single.contract.statisticalJackknifeAuthorityGranted !== false ||
  dense.status !== "incomplete-0-of-49" || dense.completedShardCount !== 0 || dense.attemptConsumed !== false ||
  formal.version !== "v263-current-product-evidence-pointer" || formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" || formalEvidence.contracts?.singleCanvas !== true || formalEvidence.contracts?.legacyRootAttributes !== 603 || formalEvidence.contracts?.evidenceLedgerClaims !== 84
) throw new Error("v495-upstream-boundary");

const directCentered = gauge.reconstruction.map((node) => node.directCenteredLogShift);
const deletionCases = [];
for (let firstIndex = 0; firstIndex < gauge.edges.length; firstIndex += 1) {
  for (let secondIndex = firstIndex + 1; secondIndex < gauge.edges.length; secondIndex += 1) {
    const removedEdges = [gauge.edges[firstIndex], gauge.edges[secondIndex]];
    const firstNodes = new Set([removedEdges[0].fromRayId, removedEdges[0].toRayId]);
    const removalClass = firstNodes.has(removedEdges[1].fromRayId) || firstNodes.has(removedEdges[1].toRayId) ? "adjacent" : "disjoint";
    const expectedEigenvalues = removalClass === "adjacent" ? [0, 1, 3, 4] : [0, 2, 2, 4];
    const expectedConditionNumber = removalClass === "adjacent" ? 4 : 2;
    const retainedEdges = gauge.edges.filter((edge) => edge.edgeIndex !== firstIndex && edge.edgeIndex !== secondIndex);
    const retainedIncidence = retainedEdges.map((edge) => gauge.incidence[edge.edgeIndex]);
    const incidenceT = transpose(retainedIncidence);
    const laplacian = multiply(incidenceT, retainedIncidence);
    const pseudoinverse = connectedPseudoinverse(laplacian);
    const edgeVector = retainedEdges.map((edge) => edge.logContrast);
    const reconstructed = matVec(pseudoinverse, matVec(incidenceT, edgeVector));
    const retainedPrediction = matVec(retainedIncidence, reconstructed);
    const nodeResidual = maxAbs(reconstructed.map((value, index) => value - directCentered[index]));
    const retainedEdgeResidual = maxAbs(retainedPrediction.map((value, index) => value - edgeVector[index]));
    const removedEdgePredictions = removedEdges.map((edge) => {
      const predictedLogContrast = gauge.incidence[edge.edgeIndex].reduce((sum, value, index) => sum + value * reconstructed[index], 0);
      return Object.freeze({ edgeIndex: edge.edgeIndex, edgeId: `${edge.fromRayId}--${edge.toRayId}`, predictedLogContrast, sourceLogContrast: edge.logContrast, absoluteResidual: Math.abs(predictedLogContrast - edge.logContrast) });
    });
    const maximumRemovedEdgePredictionResidual = Math.max(...removedEdgePredictions.map((entry) => entry.absoluteResidual));
    const numericalEigenvalues = eigenvaluesSymmetric(laplacian);
    const eigenvalueResidual = maxAbs(numericalEigenvalues.map((value, index) => value - expectedEigenvalues[index]));
    const nonzero = numericalEigenvalues.filter((value) => value > 1e-10);
    const nonzeroConditionNumber = nonzero.at(-1) / nonzero[0];
    const penroseResidual = Math.max(
      maxAbs(multiply(multiply(laplacian, pseudoinverse), laplacian).map((row, i) => row.map((value, j) => value - laplacian[i][j]))),
      maxAbs(multiply(multiply(pseudoinverse, laplacian), pseudoinverse).map((row, i) => row.map((value, j) => value - pseudoinverse[i][j]))),
    );
    const uncertaintyOperator = multiply(pseudoinverse, incidenceT);
    const edgeBounds = retainedEdges.map((edge) => edge.logContrastUncertaintyUpperBound);
    const nodeUncertaintyUpperBounds = uncertaintyOperator.map((row) => row.reduce((sum, weight, index) => sum + Math.abs(weight) * edgeBounds[index], 0));
    deletionCases.push(Object.freeze({
      caseId: `drop-${removedEdges.map((edge) => `${edge.fromRayId}--${edge.toRayId}`).join("__and__")}`,
      removedEdgeIndices: [firstIndex, secondIndex],
      removedEdgeIds: removedEdges.map((edge) => `${edge.fromRayId}--${edge.toRayId}`),
      removalClass,
      retainedEdgeCount: 4,
      connected: true,
      belowMinimumEdgeCut: true,
      laplacianRank: 3,
      gaugeNullity: 1,
      cycleSpaceDimension: 1,
      eigenvalues: expectedEigenvalues,
      numericalEigenvalues,
      eigenvalueResidual,
      nonzeroConditionNumber,
      expectedConditionNumber,
      nodeResidual,
      retainedEdgeResidual,
      maximumRemovedEdgePredictionResidual,
      removedEdgePredictions,
      penroseResidual,
      nodeUncertaintyUpperBounds,
      uncertaintyCombinationPolicy: "linear-absolute-weight-sum-cross-edge-correlation-unknown",
      incidence: retainedIncidence,
      laplacian,
      pseudoinverse,
      uncertaintyOperator,
      reconstructed,
    }));
  }
}

const adjacentCaseCount = deletionCases.filter((entry) => entry.removalClass === "adjacent").length;
const disjointCaseCount = deletionCases.filter((entry) => entry.removalClass === "disjoint").length;
const maximumEigenvalueResidual = Math.max(...deletionCases.map((entry) => entry.eigenvalueResidual));
const maximumNodeResidual = Math.max(...deletionCases.map((entry) => entry.nodeResidual));
const maximumRetainedEdgeResidual = Math.max(...deletionCases.map((entry) => entry.retainedEdgeResidual));
const maximumRemovedEdgePredictionResidual = Math.max(...deletionCases.map((entry) => entry.maximumRemovedEdgePredictionResidual));
const maximumPenroseResidual = Math.max(...deletionCases.map((entry) => entry.penroseResidual));
const maximumConditionResidual = Math.max(...deletionCases.map((entry) => Math.abs(entry.nonzeroConditionNumber - entry.expectedConditionNumber)));
if (
  deletionCases.length !== 15 || adjacentCaseCount !== 12 || disjointCaseCount !== 3 ||
  deletionCases.some((entry) => !entry.connected || !entry.belowMinimumEdgeCut || entry.laplacianRank !== 3 || entry.gaugeNullity !== 1 || entry.cycleSpaceDimension !== 1) ||
  maximumEigenvalueResidual > 5e-15 || maximumNodeResidual > 1e-15 || maximumRetainedEdgeResidual > 1e-15 || maximumRemovedEdgePredictionResidual > 1e-15 || maximumPenroseResidual > 1e-15 || maximumConditionResidual > 5e-15
) throw new Error("v495-double-deletion-gate");

const payload = { deletionCases };
const payloadSha256 = sha(payload);
const rows = deletionCases.map((entry, index) => {
  const y = 216 + index * 54;
  const color = entry.removalClass === "adjacent" ? "#71eaff" : "#ffad70";
  return `<g><rect x="64" y="${y}" width="1312" height="44" rx="10" fill="${index % 2 === 0 ? "#081315" : "#050d0f"}" stroke="${color}" stroke-opacity="0.16"/><text x="84" y="${y + 27}" fill="#e9ffff" font-size="12" font-family="Georgia,serif">${entry.removedEdgeIds.join(" + ")}</text><text x="620" y="${y + 27}" fill="${color}" font-size="10" font-family="monospace">${entry.removalClass}</text><text x="760" y="${y + 27}" fill="#b8d9dc" fill-opacity="0.64" font-size="10" font-family="monospace">[${entry.eigenvalues.join(", ")}] / k=${entry.expectedConditionNumber}</text><text x="1035" y="${y + 27}" fill="#b8d9dc" fill-opacity="0.48" font-size="10" font-family="monospace">held ${entry.maximumRemovedEdgePredictionResidual.toExponential(2)}</text><text x="1260" y="${y + 27}" fill="#ffcf83" fill-opacity="0.62" font-size="9" font-family="monospace">cycle 1</text></g>`;
}).join("");
const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="1120" viewBox="0 0 1440 1120" role="img" aria-labelledby="title description"><title id="title">Orbit Atlas V495 double-edge identifiability audit</title><description id="description">All fifteen two-edge deletions of the K4 relative redshift graph remain connected below the three-edge minimum cut. Twelve adjacent and three disjoint deletion pairs retain rank three and one cycle, but this is deterministic identifiability rather than statistical robustness.</description><metadata>payload-sha256:${payloadSha256}; cases:15; adjacent:12; disjoint:3; minimum-edge-cut:3; statistical-robustness:false</metadata><rect width="1440" height="1120" fill="#020607"/><rect x="28" y="28" width="1384" height="1064" rx="28" fill="#061012" stroke="#bfeef3" stroke-opacity="0.13"/><text x="64" y="72" fill="#79eaff" font-size="13" font-family="monospace" letter-spacing="4">V495 / DOUBLE-EDGE IDENTIFIABILITY</text><text x="64" y="118" fill="#f0ffff" font-size="34" font-family="Georgia,serif">Fifteen deletions below the cut</text><text x="1374" y="72" text-anchor="end" fill="#c5e5e8" fill-opacity="0.38" font-size="12" font-family="monospace">K4 / lambda=3 / remove 2 / all connected</text><text x="64" y="158" fill="#d7f2f4" fill-opacity="0.5" font-size="12" font-family="monospace">12 adjacent pairs yield [0,1,3,4]; 3 disjoint pairs yield [0,2,2,4]. Every retained graph has rank 3, gauge 1 and cycle space 1.</text><text x="84" y="198" fill="#89aeb2" font-size="9" font-family="monospace">REMOVED CONTRASTS</text><text x="620" y="198" fill="#89aeb2" font-size="9" font-family="monospace">CLASS</text><text x="760" y="198" fill="#89aeb2" font-size="9" font-family="monospace">SPECTRUM / CONDITION</text><text x="1035" y="198" fill="#89aeb2" font-size="9" font-family="monospace">MAX HELD RESIDUAL</text>${rows}<g transform="translate(64 1036)"><text x="0" y="0" fill="#ffcf83" font-size="11" font-family="monospace">Linear absolute-weight uncertainty only; cross-edge correlation unknown; no RSS, jackknife, detector robustness, calibration, intensity or raster claim.</text></g></svg>\n`;
atomicText(paths.svg, svg);
const svgSha256 = digest(Buffer.from(svg, "utf8"));
const sourcePaths = [paths.gauge, paths.single, paths.dense, paths.formal, "scripts/build-kerr-redshift-double-edge-identifiability-v495.mjs"];
const sourceManifest = sourcePaths.map((path) => ({ path, sha256: fileSha(path) }));
const unsigned = {
  version: "v495-kerr-redshift-double-edge-identifiability-artifact-v1",
  generatedAt: "2026-08-01T00:00:00Z",
  status: "double-edge-identifiability-qualified-statistical-robustness-blocked-browser-pending",
  source: { v491ArtifactSha256: gauge.artifactSha256, v491PayloadSha256: gauge.payloadSha256, v493ArtifactSha256: single.artifactSha256, v493PayloadSha256: single.payloadSha256, v314StateSha256: dense.stateSha256 },
  contract: {
    nodeCount: 4, fullEdgeCount: 6, removedEdgeCountPerCase: 2, retainedEdgeCountPerCase: 4, deletionCaseCount: 15,
    adjacentCaseCount: 12, disjointCaseCount: 3, minimumEdgeCut: 3, deletionBelowMinimumCut: true,
    deletionRank: 3, deletionGaugeNullity: 1, deletionCycleSpaceDimension: 1,
    adjacentSpectrum: [0, 1, 3, 4], adjacentNonzeroConditionNumber: 4,
    disjointSpectrum: [0, 2, 2, 4], disjointNonzeroConditionNumber: 2,
    deterministicIdentifiabilityOnly: true, statisticalJackknifeAuthorityGranted: false, noiseRobustnessAuthorityGranted: false,
    uncertaintyCombinationPolicy: "linear-absolute-weight-sum-cross-edge-correlation-unknown", rssAllowed: false,
    diagnosticVectorPlotOnly: true, maximumResponseBytes: 128 * 1024, localShadowOnly: true, formalProductPointer: "v263",
  },
  deletionCases,
  payloadSha256,
  vectorDiagnostic: { path: paths.svg, mediaType: "image/svg+xml; charset=utf-8", width: 1440, height: 1120, fileSha256: svgSha256, deterministic: true, linearDisplay: true, bloomIntensity: 0, colorGradeIntensity: 0, scientificFieldMutationAllowed: false },
  audit: {
    connectedCaseCount: 15, adjacentCaseCount, disjointCaseCount, maximumEigenvalueResidual, maximumNodeResidual, maximumRetainedEdgeResidual, maximumRemovedEdgePredictionResidual, maximumPenroseResidual, maximumConditionResidual,
    detailedMatrixElementCount: deletionCases.reduce((sum, entry) => sum + entry.incidence.flat().length + entry.laplacian.flat().length + entry.pseudoinverse.flat().length + entry.uncertaintyOperator.flat().length, 0),
    summaryMatrixElementCount: 0, detectorObservableRows: 0, observedIntensityRows: 0, sciencePixelRows: 0, fitsProducts: 0, pngProducts: 0,
  },
  lifecycle: { existingCanvasCount: 1, newCanvasCreated: false, sceneRevisionDelta: 0, workers: 0, gpuBuffers: 0, textures: 0, renderTargets: 0, objectUrls: 0, cameraLeases: 0, allResourcesAtBaseline: true },
  boundary: {
    doubleEdgeIdentifiabilityAuthorityGranted: true, belowMinimumCutConnectivityAuthorityGranted: true, heldEdgePredictionAuthorityGranted: true,
    statisticalJackknifeAuthorityGranted: false, noiseRobustnessAuthorityGranted: false, crossEdgeStatisticalCovarianceAuthorityGranted: false,
    absoluteCalibrationAuthorityGranted: false, physicalBandpassAuthorityGranted: false, observedIntensityAuthorityGranted: false, statisticalLikelihoodAuthorityGranted: false, scienceRasterAuthorityGranted: false,
    fitsWriteAllowed: false, pngWriteAllowed: false, denseShardRunAllowed: false, denseCampaignStatus: "incomplete-0-of-49", browserQualification: "not-run", visualMatrixQualification: "not-run", soakQualification: "not-run", rtxWebGpuQualification: "not-run",
  },
  sourceManifest,
  sourceSha256: sha(sourceManifest),
  formalProductPointer: "v263",
  formalDefaultKernel: "legacy-eih-1pn",
};
const artifact = { ...unsigned, artifactSha256: sha(unsigned) };
atomicJson(paths.artifact, artifact);
console.log(JSON.stringify({ status: artifact.status, artifactSha256: artifact.artifactSha256, payloadSha256, svgSha256, deletionCases: 15, adjacentCases: 12, disjointCases: 3, maximumEigenvalueResidual, maximumRemovedEdgePredictionResidual, maximumConditionResidual, sciencePixels: 0, denseCampaign: "0/49" }, null, 2));
