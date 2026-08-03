export const KERR_IDEAL_POLARIMETER_VERSION_V410 = "v410-kerr-ideal-dual-beam-polarimeter-v1" as const;
export const KERR_IDEAL_POLARIMETER_ARTIFACT_VERSION_V410 = "v410-kerr-ideal-dual-beam-polarimeter-artifact-v1" as const;
export const KERR_IDEAL_POLARIMETER_SUMMARY_VERSION_V410 = "v410-kerr-ideal-dual-beam-polarimeter-summary-v1" as const;
export const KERR_IDEAL_POLARIMETER_RESPONSE_VERSION_V410 = "v410-kerr-ideal-dual-beam-polarimeter-response-v1" as const;
export const KERR_SCATTERING_CORRECTED_ARTIFACT_SHA256_V409 = "78a3e9c63b2d6318e172c688c0f5dc789821e7d0428bf5acad98e2038224a263" as const;
export const DETECTOR_RESPONSE_INSPECT_ARTIFACT_SHA256_V368_V410 = "c9552032c671f07f2dc7832ef8f1069a793eb2f1ac18416294b6fa0b2aaa0e7e" as const;
export const PATAT_ROMANIELLO_AR5IV_SHA256_V410 = "dbba3111aa35ef0a4cad3f69f0cf0b4abfc42b165e4da9b106972c057ea9598e" as const;

type RayIdV410 = "disk-00" | "disk-01" | "disk-02" | "disk-03";
type TransportV410 = "walker-penrose" | "independent-ks-parallel-transport";
type FrequencyV410 = 1e16 | 1e17 | 1e18;
type HwpIndexV410 = 0 | 1 | 2 | 3;
type HwpAngleV410 = 0 | 22.5 | 45 | 67.5;

export type KerrIdealDualBeamRowV410 = Readonly<{
  rayId: RayIdV410;
  rayIndex: 12 | 13 | 14 | 15;
  observedFrequencyHz: FrequencyV410;
  transportMethod: TransportV410;
  hwpIndex: HwpIndexV410;
  hwpAngleDeg: HwpAngleV410;
  ordinaryIntensity: number;
  extraordinaryIntensity: number;
  beamSumIntensity: number;
  normalizedFluxDifference: number;
  polarizationOnlyUncertainty: Readonly<{
    normalizedFluxDifferenceAbsolute: number;
    ordinaryIntensityAbsolute: number;
    extraordinaryIntensityAbsolute: number;
    combination: "linear-no-rss-no-independence-claim";
    totalInstrumentUncertaintyAvailable: false;
  }>;
}>;

export type KerrIdealStokesReconstructionV410 = Readonly<{
  rayId: RayIdV410;
  rayIndex: 12 | 13 | 14 | 15;
  observedFrequencyHz: FrequencyV410;
  transportMethod: TransportV410;
  source: Readonly<{ i: number; q: number; u: number; linearFraction: number; evpaDeg: number }>;
  reconstructed: Readonly<{ i: number; q: number; u: number; linearFraction: number; evpaDeg: number; circularV: "unavailable-not-measured" }>;
  residuals: Readonly<{ intensityRelative: number; qRelativeDiagnostic: number; uRelativeDiagnostic: number; qNormalizedAbsolute: number; uNormalizedAbsolute: number; linearFractionAbsolute: number; evpaDeg: number; maximumBeamSumRelative: number; maximumFluxLawAbsolute: number }>;
}>;

export type KerrIdealPolarimeterViewV410 = Readonly<{
  version: typeof KERR_IDEAL_POLARIMETER_VERSION_V410;
  status: "qualified-ideal-dual-beam-polarimeter-operator-detector-projection-unavailable";
  sourceReferences: Readonly<{
    primary: Readonly<{ title: "Error Analysis for Dual-Beam Optical Linear Polarimetry"; authors: "F. Patat; M. Romaniello"; journal: "Publications of the Astronomical Society of the Pacific"; volume: "118"; issue: "839"; pages: "146-161"; publicationYear: 2006; arxivYear: 2005; doi: "10.1086/497581"; arxivId: "astro-ph/0509153"; semanticScholarPaperId: "c20a3cd257e2ce5f55dfd5a922722e8fbf40f742"; ar5ivHtmlSha256: typeof PATAT_ROMANIELLO_AR5IV_SHA256_V410; verification: "crossref-semantic-scholar-and-ar5iv-equations-1-through-7-verified" }>;
    independentDeviceContext: Readonly<{ title: "Stellar Spectropolarimetry with Retarder Waveplate and Beam Splitter Devices"; authors: string; journal: "Publications of the Astronomical Society of the Pacific"; volume: "121"; issue: "883"; pages: "993-1015"; year: 2009; doi: "10.1086/605654"; semanticScholarPaperId: "b40ae6ad27c33e03ece1df01d50daed7eeb60706"; verification: "crossref-and-semantic-scholar-device-family-verified" }>;
    rejectedDoiCandidate: Readonly<{ doi: "10.1051/0004-6361:20064992"; actualTitle: "UBVRI twilight sky brightness at ESO-Paranal"; rejection: "doi-title-mismatch-not-a-polarimetry-method-source" }>;
    formulaTranscriptionSha256: string;
  }>;
  authority: Readonly<{ v409CorrectedStokesArtifactSha256: typeof KERR_SCATTERING_CORRECTED_ARTIFACT_SHA256_V409; v368DetectorResponseInspectArtifactSha256: typeof DETECTOR_RESPONSE_INSPECT_ARTIFACT_SHA256_V368_V410; v368DetectorAuthorityStatus: "unavailable-v367-authority-artifacts-missing"; denseAggregateSha256: null }>;
  operator: Readonly<{
    device: "ideal-half-wave-plate-plus-ideal-wollaston-dual-beam";
    hwpAnglesDeg: readonly [0, 22.5, 45, 67.5];
    ordinaryLaw: "fO=0.5*(I+Q*cos(4theta)+U*sin(4theta))";
    extraordinaryLaw: "fE=0.5*(I-Q*cos(4theta)-U*sin(4theta))";
    normalizedDifferenceLaw: "F=(fO-fE)/(fO+fE)=q*cos(4theta)+u*sin(4theta)";
    reconstruction: "q=0.5*(F0-F2),u=0.5*(F1-F3),I=mean(fO+fE)";
    outputUnit: "same-linear-radiance-normalization-as-v409-observed-stokes";
    photonOrElectronCountsProduced: false;
  }>;
  counts: Readonly<{ sourceSampleCount: 24; hwpStateCount: 4; modulationRowCount: 96; beamIntensityCount: 192; reconstructionCount: 24 }>;
  modulationRows: readonly KerrIdealDualBeamRowV410[];
  reconstructions: readonly KerrIdealStokesReconstructionV410[];
  maxima: Readonly<{ beamSumRelative: number; normalizedFluxLawAbsolute: number; intensityReconstructionRelative: number; qRelativeDiagnostic: number; uRelativeDiagnostic: number; qNormalizedAbsolute: number; uNormalizedAbsolute: number; linearFractionAbsolute: number; evpaDeg: number; deterministicReplayDifference: 0 }>;
  thresholds: Readonly<{ beamSumRelative: 1e-15; normalizedFluxLawAbsolute: 1e-15; normalizedStokesAbsolute: 1e-15; componentRelativeDiagnostic: 5e-14; linearFractionAbsolute: 1e-14; evpaDeg: 1e-12 }>;
  detectorProjection: Readonly<{ status: "unavailable-ideal-analyzer-not-calibrated-and-v368-authority-missing"; expectedElectronCountsAvailable: false; observedCountsAvailable: false; syntheticFallbackUsed: false; missingCalibration: readonly ["wavelength-dependent-hwp-retardance", "wollaston-beam-throughput-ratio", "polarizer-extinction-ratio", "analyzer-angle-zero-point", "instrument-mueller-matrix-and-covariance"] }>;
  qualification: Readonly<{ idealDualBeamAlgebraQualified: true; correctedStokesReconstructionQualified: true; measuredPolarimeterQualified: false; detectorElectronProjectionQualified: false; circularPolarizationQualified: false; denseImageQualified: false }>;
  gates: Readonly<Record<string, true>>;
  networkAttemptedByBuild: false;
  automaticRetryApplied: false;
  denseShardExecuted: false;
  release: Readonly<{ formalProductPointer: "v263"; formalProductPointerAdvanced: false; defaultKernel: "legacy-eih-1pn"; workerPhysicsMutation: "not-applied"; localShadowDefaultApplied: false }>;
  boundary: "ideal-dual-beam-algebra-and-v409-stokes-reconstruction-only-no-calibrated-polarimeter-electrons-observed-counts-v-or-dense-image";
}>;

export type KerrIdealPolarimeterArtifactV410 = Readonly<{ version: typeof KERR_IDEAL_POLARIMETER_ARTIFACT_VERSION_V410; generatedAt: string; view: KerrIdealPolarimeterViewV410; deterministicReplay: true; v409HistoricalArtifactMutated: false; artifactSha256: string }>;
export type KerrIdealPolarimeterSummaryV410 = Readonly<{ version: typeof KERR_IDEAL_POLARIMETER_SUMMARY_VERSION_V410; status: KerrIdealPolarimeterViewV410["status"]; artifactSha256: string; sourceReferences: KerrIdealPolarimeterViewV410["sourceReferences"]; operator: KerrIdealPolarimeterViewV410["operator"]; counts: KerrIdealPolarimeterViewV410["counts"]; representativeRays: readonly Readonly<{ rayId: RayIdV410; linearFraction: number; evpaDeg: number; maximumBeamAsymmetry: number; maximumPolarizationOnlyUncertainty: number }>[]; maxima: KerrIdealPolarimeterViewV410["maxima"]; detectorProjection: KerrIdealPolarimeterViewV410["detectorProjection"]; qualification: KerrIdealPolarimeterViewV410["qualification"]; fullArtifactAvailable: true; browserQualification: "not-run"; boundary: "summary-only-no-96-modulation-row-or-24-reconstruction-arrays-in-react-state" }>;
export type KerrIdealPolarimeterResponseV410 = Readonly<{ version: typeof KERR_IDEAL_POLARIMETER_RESPONSE_VERSION_V410; available: boolean; reason: "ready" | "lite-boundary" | "local-shadow-only" | "evidence-corrupt" | "request-failed"; summary: KerrIdealPolarimeterSummaryV410 | null }>;

const SHA = /^[a-f0-9]{64}$/; const finite = (...values: number[]) => values.every(Number.isFinite); const record = (value: unknown, label: string): Record<string, unknown> => { if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`v410-${label}`); return value as Record<string, unknown>; };

export function parseKerrIdealPolarimeterViewV410(value: unknown): KerrIdealPolarimeterViewV410 {
  const source = record(value, "view"); const refs = record(source.sourceReferences, "sources"); const primary = record(refs.primary, "primary-source"); const context = record(refs.independentDeviceContext, "context-source"); const rejected = record(refs.rejectedDoiCandidate, "rejected-doi"); const authority = record(source.authority, "authority"); const operator = record(source.operator, "operator"); const counts = record(source.counts, "counts"); const maxima = record(source.maxima, "maxima"); const thresholds = record(source.thresholds, "thresholds"); const detector = record(source.detectorProjection, "detector"); const qualification = record(source.qualification, "qualification"); const gates = record(source.gates, "gates"); const release = record(source.release, "release"); const rows = source.modulationRows; const reconstructions = source.reconstructions;
  const invalidRows = !Array.isArray(rows) || rows.length !== 96 || rows.some((entry) => { const row = record(entry, "row"); const uncertainty = record(row.polarizationOnlyUncertainty, "row-uncertainty"); return !finite(Number(row.observedFrequencyHz), Number(row.hwpAngleDeg), Number(row.ordinaryIntensity), Number(row.extraordinaryIntensity), Number(row.beamSumIntensity), Number(row.normalizedFluxDifference), Number(uncertainty.normalizedFluxDifferenceAbsolute), Number(uncertainty.ordinaryIntensityAbsolute), Number(uncertainty.extraordinaryIntensityAbsolute)) || Number(row.ordinaryIntensity) < 0 || Number(row.extraordinaryIntensity) < 0 || uncertainty.combination !== "linear-no-rss-no-independence-claim" || uncertainty.totalInstrumentUncertaintyAvailable !== false; });
  const invalidReconstructions = !Array.isArray(reconstructions) || reconstructions.length !== 24 || reconstructions.some((entry) => { const item = record(entry, "reconstruction"); const reconstructed = record(item.reconstructed, "reconstructed-stokes"); const residuals = record(item.residuals, "reconstruction-residuals"); return !finite(Number(reconstructed.i), Number(reconstructed.q), Number(reconstructed.u), Number(reconstructed.linearFraction), Number(reconstructed.evpaDeg), Number(residuals.intensityRelative), Number(residuals.qRelativeDiagnostic), Number(residuals.uRelativeDiagnostic), Number(residuals.qNormalizedAbsolute), Number(residuals.uNormalizedAbsolute), Number(residuals.linearFractionAbsolute), Number(residuals.evpaDeg), Number(residuals.maximumBeamSumRelative), Number(residuals.maximumFluxLawAbsolute)) || reconstructed.circularV !== "unavailable-not-measured"; });
  if (source.version !== KERR_IDEAL_POLARIMETER_VERSION_V410 || source.status !== "qualified-ideal-dual-beam-polarimeter-operator-detector-projection-unavailable" || primary.doi !== "10.1086/497581" || primary.arxivId !== "astro-ph/0509153" || primary.semanticScholarPaperId !== "c20a3cd257e2ce5f55dfd5a922722e8fbf40f742" || primary.ar5ivHtmlSha256 !== PATAT_ROMANIELLO_AR5IV_SHA256_V410 || primary.verification !== "crossref-semantic-scholar-and-ar5iv-equations-1-through-7-verified" || context.doi !== "10.1086/605654" || context.semanticScholarPaperId !== "b40ae6ad27c33e03ece1df01d50daed7eeb60706" || rejected.doi !== "10.1051/0004-6361:20064992" || rejected.rejection !== "doi-title-mismatch-not-a-polarimetry-method-source" || !SHA.test(String(refs.formulaTranscriptionSha256 ?? "")) || authority.v409CorrectedStokesArtifactSha256 !== KERR_SCATTERING_CORRECTED_ARTIFACT_SHA256_V409 || authority.v368DetectorResponseInspectArtifactSha256 !== DETECTOR_RESPONSE_INSPECT_ARTIFACT_SHA256_V368_V410 || authority.v368DetectorAuthorityStatus !== "unavailable-v367-authority-artifacts-missing" || authority.denseAggregateSha256 !== null || operator.device !== "ideal-half-wave-plate-plus-ideal-wollaston-dual-beam" || JSON.stringify(operator.hwpAnglesDeg) !== "[0,22.5,45,67.5]" || operator.photonOrElectronCountsProduced !== false || counts.sourceSampleCount !== 24 || counts.hwpStateCount !== 4 || counts.modulationRowCount !== 96 || counts.beamIntensityCount !== 192 || counts.reconstructionCount !== 24 || invalidRows || invalidReconstructions || !finite(Number(maxima.beamSumRelative), Number(maxima.normalizedFluxLawAbsolute), Number(maxima.intensityReconstructionRelative), Number(maxima.qRelativeDiagnostic), Number(maxima.uRelativeDiagnostic), Number(maxima.qNormalizedAbsolute), Number(maxima.uNormalizedAbsolute), Number(maxima.linearFractionAbsolute), Number(maxima.evpaDeg)) || Number(maxima.beamSumRelative) >= 1e-15 || Number(maxima.normalizedFluxLawAbsolute) >= 1e-15 || Number(maxima.intensityReconstructionRelative) >= 1e-14 || Number(maxima.qRelativeDiagnostic) >= 5e-14 || Number(maxima.uRelativeDiagnostic) >= 5e-14 || Number(maxima.qNormalizedAbsolute) >= 1e-15 || Number(maxima.uNormalizedAbsolute) >= 1e-15 || Number(maxima.linearFractionAbsolute) >= 1e-14 || Number(maxima.evpaDeg) >= 1e-12 || maxima.deterministicReplayDifference !== 0 || thresholds.beamSumRelative !== 1e-15 || thresholds.normalizedStokesAbsolute !== 1e-15 || thresholds.componentRelativeDiagnostic !== 5e-14 || detector.status !== "unavailable-ideal-analyzer-not-calibrated-and-v368-authority-missing" || detector.expectedElectronCountsAvailable !== false || detector.observedCountsAvailable !== false || detector.syntheticFallbackUsed !== false || !Array.isArray(detector.missingCalibration) || detector.missingCalibration.length !== 5 || qualification.idealDualBeamAlgebraQualified !== true || qualification.correctedStokesReconstructionQualified !== true || qualification.measuredPolarimeterQualified !== false || qualification.detectorElectronProjectionQualified !== false || qualification.circularPolarizationQualified !== false || qualification.denseImageQualified !== false || Object.keys(gates).length !== 11 || Object.values(gates).some((gate) => gate !== true) || source.networkAttemptedByBuild !== false || source.automaticRetryApplied !== false || source.denseShardExecuted !== false || release.formalProductPointer !== "v263" || release.formalProductPointerAdvanced !== false || release.defaultKernel !== "legacy-eih-1pn" || release.workerPhysicsMutation !== "not-applied" || release.localShadowDefaultApplied !== false || source.boundary !== "ideal-dual-beam-algebra-and-v409-stokes-reconstruction-only-no-calibrated-polarimeter-electrons-observed-counts-v-or-dense-image") throw new Error("v410-ideal-polarimeter-view-identity");
  return value as KerrIdealPolarimeterViewV410;
}

export function parseKerrIdealPolarimeterArtifactV410(value: unknown): KerrIdealPolarimeterArtifactV410 { const source = record(value, "artifact"); if (source.version !== KERR_IDEAL_POLARIMETER_ARTIFACT_VERSION_V410 || typeof source.generatedAt !== "string" || source.deterministicReplay !== true || source.v409HistoricalArtifactMutated !== false || !SHA.test(String(source.artifactSha256 ?? ""))) throw new Error("v410-ideal-polarimeter-artifact-identity"); parseKerrIdealPolarimeterViewV410(source.view); return value as KerrIdealPolarimeterArtifactV410; }
export function createKerrIdealPolarimeterSummaryV410(artifactValue: unknown): KerrIdealPolarimeterSummaryV410 { const artifact = parseKerrIdealPolarimeterArtifactV410(artifactValue); const representativeRays = (["disk-00", "disk-01", "disk-02", "disk-03"] as const).map((rayId) => { const reconstruction = artifact.view.reconstructions.find((entry) => entry.rayId === rayId); const rows = artifact.view.modulationRows.filter((entry) => entry.rayId === rayId); if (!reconstruction || rows.length < 4) throw new Error(`v410-summary-ray-${rayId}`); return Object.freeze({ rayId, linearFraction: reconstruction.reconstructed.linearFraction, evpaDeg: reconstruction.reconstructed.evpaDeg, maximumBeamAsymmetry: Math.max(...rows.map((row) => Math.abs(row.normalizedFluxDifference))), maximumPolarizationOnlyUncertainty: Math.max(...rows.map((row) => row.polarizationOnlyUncertainty.normalizedFluxDifferenceAbsolute)) }); }); return Object.freeze({ version: KERR_IDEAL_POLARIMETER_SUMMARY_VERSION_V410, status: artifact.view.status, artifactSha256: artifact.artifactSha256, sourceReferences: artifact.view.sourceReferences, operator: artifact.view.operator, counts: artifact.view.counts, representativeRays: Object.freeze(representativeRays), maxima: artifact.view.maxima, detectorProjection: artifact.view.detectorProjection, qualification: artifact.view.qualification, fullArtifactAvailable: true as const, browserQualification: "not-run" as const, boundary: "summary-only-no-96-modulation-row-or-24-reconstruction-arrays-in-react-state" as const }); }
export function parseKerrIdealPolarimeterSummaryV410(value: unknown): KerrIdealPolarimeterSummaryV410 { const source = record(value, "summary"); const counts = record(source.counts, "summary-counts"); const detector = record(source.detectorProjection, "summary-detector"); if (source.version !== KERR_IDEAL_POLARIMETER_SUMMARY_VERSION_V410 || source.status !== "qualified-ideal-dual-beam-polarimeter-operator-detector-projection-unavailable" || !SHA.test(String(source.artifactSha256 ?? "")) || !Array.isArray(source.representativeRays) || source.representativeRays.length !== 4 || counts.modulationRowCount !== 96 || detector.expectedElectronCountsAvailable !== false || source.fullArtifactAvailable !== true || source.browserQualification !== "not-run" || source.boundary !== "summary-only-no-96-modulation-row-or-24-reconstruction-arrays-in-react-state" || Object.hasOwn(source, "modulationRows") || Object.hasOwn(source, "reconstructions")) throw new Error("v410-ideal-polarimeter-summary-identity"); return value as KerrIdealPolarimeterSummaryV410; }
export function parseKerrIdealPolarimeterResponseV410(value: unknown): KerrIdealPolarimeterResponseV410 { const source = record(value, "response"); if (source.version !== KERR_IDEAL_POLARIMETER_RESPONSE_VERSION_V410) throw new Error("v410-ideal-polarimeter-response-version"); if (source.available === true && source.reason === "ready" && source.summary) return { version: KERR_IDEAL_POLARIMETER_RESPONSE_VERSION_V410, available: true, reason: "ready", summary: parseKerrIdealPolarimeterSummaryV410(source.summary) }; if (source.available === false && source.summary === null && ["lite-boundary", "local-shadow-only", "evidence-corrupt", "request-failed"].includes(String(source.reason))) return source as KerrIdealPolarimeterResponseV410; throw new Error("v410-ideal-polarimeter-response-identity"); }
