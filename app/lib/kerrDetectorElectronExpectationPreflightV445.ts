export const KERR_DETECTOR_ELECTRON_EXPECTATION_PREFLIGHT_VERSION_V445 = "v445-kerr-detector-electron-expectation-preflight-v1" as const;
export const KERR_DETECTOR_ELECTRON_EXPECTATION_PREFLIGHT_ARTIFACT_VERSION_V445 = "v445-kerr-detector-electron-expectation-preflight-inspect-v1" as const;
export const KERR_DETECTOR_ELECTRON_EXPECTATION_PREFLIGHT_API_VERSION_V445 = "v445-kerr-detector-electron-expectation-preflight-api-v1" as const;
export const KERR_DETECTOR_ELECTRON_EXPECTATION_PREFLIGHT_PATH_V445 = "dist/science/kerr-detector-electron-expectation-v445" as const;

const SHA256 = /^[a-f0-9]{64}$/;
const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const record = (value: unknown): Record<string, unknown> | null => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
const freeze = <T>(value: T): T => { if (value && typeof value === "object" && !Object.isFrozen(value)) { Object.freeze(value); for (const child of Object.values(value as Record<string, unknown>)) freeze(child); } return value; };

export const V445_GATE_IDS = ["collecting-area", "pixel-solid-angle", "exposure", "gain", "read-noise", "dark-current", "background"] as const;
export type KerrDetectorElectronExpectationGateIdV445 = (typeof V445_GATE_IDS)[number];
export type KerrDetectorElectronExpectationGateStatusV445 = "qualified" | "partial" | "missing" | "blocked";

export type KerrDetectorElectronExpectationGateV445 = Readonly<{
  id: KerrDetectorElectronExpectationGateIdV445;
  status: KerrDetectorElectronExpectationGateStatusV445;
  reason: string;
  sourceArtifactSha256: string | null;
}>;

export type KerrDetectorElectronExpectationRowV445 = Readonly<{
  rayIndex: 12 | 13 | 14 | 15;
  spinA: number;
  throughputWeightedPhotonRadiancePerSM2Sr: number;
  detectorElectronExpectationApplicable: false;
  computationalElectronExpectationPerPixel: null;
  computationalExpectationStatus: "blocked";
  observedCount: null;
  observedCountStatus: "unavailable";
  scienceImagePixel: null;
  scienceImageStatus: "blocked";
}>;

export type KerrDetectorElectronExpectationPreflightV445 = Readonly<{
  version: typeof KERR_DETECTOR_ELECTRON_EXPECTATION_PREFLIGHT_ARTIFACT_VERSION_V445;
  generatedAt: string;
  status: "blocked-detector-calibration-unavailable" | "partial-photon-envelope-only";
  sourceManifest: readonly Readonly<{ id: string; path: string; fileSha256: string; artifactSha256: string | null }>[];
  sourceSha256: string;
  gates: readonly KerrDetectorElectronExpectationGateV445[];
  rows: readonly KerrDetectorElectronExpectationRowV445[];
  counts: Readonly<{ photonResponseRows: 4; computationalElectronExpectationRows: 0; observedCountRows: 0; scienceImageRows: 0 }>;
  qualification: Readonly<{
    photonResponseEnvelopeQualified: true;
    computationalElectronExpectationAvailable: false;
    detectorCalibrationAuthority: false;
    observedCountsAvailable: false;
    scienceImageAvailable: false;
    scienceRasterAllowed: false;
    measuredAuthorityGranted: false;
    runtimePackagingAllowed: false;
    sciencePayloadMutationAllowed: false;
    cinematicScienceWritebackForbidden: true;
    browserQualification: "not-run";
    denseAuthority: false;
  }>;
  boundary: Readonly<{
    computationalExpectation: "blocked-calibration-inputs";
    detectorCalibrationAuthority: "unavailable";
    observedCounts: "unavailable";
    scienceImage: "blocked";
    scienceRaster: "blocked";
    cinematicScienceWriteback: "forbidden";
  }>;
  networkAttempted: false;
  automaticRetryApplied: false;
  formalProductPointer: "v263";
  denseCampaignStatus: "incomplete-0-of-49";
  artifactSha256: string;
}>;

export type KerrDetectorElectronExpectationSummaryV445 = Readonly<{
  version: typeof KERR_DETECTOR_ELECTRON_EXPECTATION_PREFLIGHT_VERSION_V445;
  status: KerrDetectorElectronExpectationPreflightV445["status"];
  artifactSha256: string;
  sourceSha256: string;
  gates: readonly KerrDetectorElectronExpectationGateV445[];
  rows: readonly KerrDetectorElectronExpectationRowV445[];
  counts: KerrDetectorElectronExpectationPreflightV445["counts"];
  qualification: KerrDetectorElectronExpectationPreflightV445["qualification"];
  boundary: KerrDetectorElectronExpectationPreflightV445["boundary"];
}>;

export type KerrDetectorElectronExpectationApiV445 = Readonly<{
  version: typeof KERR_DETECTOR_ELECTRON_EXPECTATION_PREFLIGHT_API_VERSION_V445;
  available: boolean;
  reason: "ready" | "lite-boundary" | "local-shadow-only" | "evidence-corrupt" | "request-failed";
  summary: KerrDetectorElectronExpectationSummaryV445 | null;
}>;

export function parseKerrDetectorElectronExpectationPreflightV445(value: unknown): KerrDetectorElectronExpectationPreflightV445 {
  const artifact = record(value);
  const gates = Array.isArray(artifact?.gates) ? artifact.gates : [];
  const rows = Array.isArray(artifact?.rows) ? artifact.rows : [];
  const sourceManifest = Array.isArray(artifact?.sourceManifest) ? artifact.sourceManifest : [];
  const counts = record(artifact?.counts);
  const qualification = record(artifact?.qualification);
  const boundary = record(artifact?.boundary);
  const validGate = (gate: unknown): boolean => { const entry = record(gate); return Boolean(entry && V445_GATE_IDS.includes(entry.id as KerrDetectorElectronExpectationGateIdV445) && ["qualified", "partial", "missing", "blocked"].includes(String(entry.status)) && typeof entry.reason === "string" && (entry.sourceArtifactSha256 === null || SHA256.test(String(entry.sourceArtifactSha256)))); };
  const validRow = (row: unknown): boolean => { const entry = record(row); return Boolean(entry && [12, 13, 14, 15].includes(Number(entry.rayIndex)) && finite(entry.spinA) && finite(entry.throughputWeightedPhotonRadiancePerSM2Sr) && entry.detectorElectronExpectationApplicable === false && entry.computationalElectronExpectationPerPixel === null && entry.computationalExpectationStatus === "blocked" && entry.observedCount === null && entry.observedCountStatus === "unavailable" && entry.scienceImagePixel === null && entry.scienceImageStatus === "blocked"); };
  if (!artifact || artifact.version !== KERR_DETECTOR_ELECTRON_EXPECTATION_PREFLIGHT_ARTIFACT_VERSION_V445 || !["blocked-detector-calibration-unavailable", "partial-photon-envelope-only"].includes(String(artifact.status)) || !SHA256.test(String(artifact.artifactSha256)) || !SHA256.test(String(artifact.sourceSha256)) || sourceManifest.length < 5 || sourceManifest.some((source) => { const entry = record(source); return !entry || typeof entry.id !== "string" || typeof entry.path !== "string" || !entry.path.startsWith("dist/") || !SHA256.test(String(entry.fileSha256)) || (entry.artifactSha256 !== null && !SHA256.test(String(entry.artifactSha256))); }) || gates.length !== 7 || gates.some((gate) => !validGate(gate)) || new Set(gates.map((gate) => record(gate)?.id)).size !== 7 || rows.length !== 4 || rows.some((row) => !validRow(row)) || counts?.photonResponseRows !== 4 || counts.computationalElectronExpectationRows !== 0 || counts.observedCountRows !== 0 || counts.scienceImageRows !== 0 || qualification?.photonResponseEnvelopeQualified !== true || qualification.computationalElectronExpectationAvailable !== false || qualification.detectorCalibrationAuthority !== false || qualification.observedCountsAvailable !== false || qualification.scienceImageAvailable !== false || qualification.scienceRasterAllowed !== false || qualification.measuredAuthorityGranted !== false || qualification.runtimePackagingAllowed !== false || qualification.sciencePayloadMutationAllowed !== false || qualification.cinematicScienceWritebackForbidden !== true || qualification.browserQualification !== "not-run" || qualification.denseAuthority !== false || boundary?.computationalExpectation !== "blocked-calibration-inputs" || boundary.detectorCalibrationAuthority !== "unavailable" || boundary.observedCounts !== "unavailable" || boundary.scienceImage !== "blocked" || boundary.scienceRaster !== "blocked" || boundary.cinematicScienceWriteback !== "forbidden" || artifact.networkAttempted !== false || artifact.automaticRetryApplied !== false || artifact.formalProductPointer !== "v263" || artifact.denseCampaignStatus !== "incomplete-0-of-49") throw new Error("v445-preflight-identity");
  return freeze(value as KerrDetectorElectronExpectationPreflightV445);
}

export function createKerrDetectorElectronExpectationSummaryV445(value: unknown): KerrDetectorElectronExpectationSummaryV445 {
  const artifact = parseKerrDetectorElectronExpectationPreflightV445(value);
  return freeze({ version: KERR_DETECTOR_ELECTRON_EXPECTATION_PREFLIGHT_VERSION_V445, status: artifact.status, artifactSha256: artifact.artifactSha256, sourceSha256: artifact.sourceSha256, gates: artifact.gates, rows: artifact.rows, counts: artifact.counts, qualification: artifact.qualification, boundary: artifact.boundary });
}

export function parseKerrDetectorElectronExpectationApiV445(value: unknown): KerrDetectorElectronExpectationApiV445 {
  const api = record(value);
  if (!api || api.version !== KERR_DETECTOR_ELECTRON_EXPECTATION_PREFLIGHT_API_VERSION_V445 || typeof api.available !== "boolean" || !["ready", "lite-boundary", "local-shadow-only", "evidence-corrupt", "request-failed"].includes(String(api.reason)) || (api.available && !api.summary) || (!api.available && api.summary !== null)) throw new Error("v445-api-identity");
  return freeze(value as KerrDetectorElectronExpectationApiV445);
}
