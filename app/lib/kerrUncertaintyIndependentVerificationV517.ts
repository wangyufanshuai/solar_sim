export const KERR_UNCERTAINTY_INDEPENDENT_VERIFICATION_VERSION_V517 =
  "v517-kerr-uncertainty-independent-verification-receipt-v1" as const;
export const KERR_UNCERTAINTY_INDEPENDENT_VERIFICATION_API_VERSION_V517 =
  "v517-kerr-uncertainty-independent-verification-api-v1" as const;

export type KerrUncertaintyIndependentVerificationReceiptV517 = Readonly<{
  version: typeof KERR_UNCERTAINTY_INDEPENDENT_VERIFICATION_VERSION_V517;
  generatedAt: string;
  status: "independent-replay-witness-verification-qualified";
  source: Readonly<{
    v516WitnessArtifactSha256: string;
    v516WitnessFileSha256: string;
    v516RuntimeArtifactSha256: string;
    v516EvidenceSha256: string;
    v516PointerSha256: string;
    verifierSourceSha256: string;
  }>;
  verification: Readonly<{
    independentImplementation: true;
    importedV516Parser: false;
    importedV516Builder: false;
    artifactCanonicalValid: true;
    sourceManifestValid: true;
    sourceManifestEntryCount: number;
    transitionCount: 512;
    witnessCount: 512;
    recomputedWitnessCount: 512;
    checkpointCount: 8;
    matchedCheckpointCount: 8;
    passCount: 2;
    chainHeadSha256: string;
    repeatHeadSha256: string;
    chainHeadMatches: true;
    witnessMismatchCount: 0;
    checkpointMismatchCount: 0;
    sequenceMismatchCount: 0;
    invalidShaCount: 0;
    boundaryViolationCount: 0;
    artifactBytes: number;
    artifactMaximumBytes: 131072;
  }>;
  lifecycle: Readonly<{
    filesystemReadsBounded: true;
    networkRequestCount: 0;
    workerCreated: false;
    objectUrlCount: 0;
    canvasCreated: false;
    sceneRevisionDelta: 0;
  }>;
  boundary: Readonly<{
    detectorCalibrationStatus: "incomplete-0-of-6";
    detectorAuthorityAvailable: false;
    scienceRasterAvailable: false;
    denseCampaignStatus: "incomplete-0-of-49";
    browserQualification: "not-run";
    localShadowDefaultApplied: false;
    formalProductPointer: "v263";
    formalDefaultKernel: "legacy-eih-1pn";
  }>;
  sourceManifest: readonly Readonly<{ path: string; sha256: string }>[];
  sourceSha256: string;
  artifactSha256: string;
}>;

export type KerrUncertaintyIndependentVerificationSummaryV517 = Pick<
  KerrUncertaintyIndependentVerificationReceiptV517,
  "version" | "status" | "source" | "verification" | "lifecycle" | "boundary" | "artifactSha256"
>;

export type KerrUncertaintyIndependentVerificationApiV517 = Readonly<{
  version: typeof KERR_UNCERTAINTY_INDEPENDENT_VERIFICATION_API_VERSION_V517;
  available: boolean;
  reason: "ready" | "lite-boundary" | "local-shadow-only" | "evidence-corrupt";
  summary: KerrUncertaintyIndependentVerificationSummaryV517 | null;
}>;

const SHA = /^[a-f0-9]{64}$/;
const transient = new Set([
  "generatedAt",
  "artifactSha256",
  "evidenceSha256",
  "pointerSha256",
]);
const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);
const canonicalize = (value: unknown): unknown =>
  Array.isArray(value)
    ? value.map(canonicalize)
    : !isRecord(value)
      ? value
      : Object.fromEntries(
          Object.entries(value)
            .filter(([key]) => !transient.has(key))
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, entry]) => [key, canonicalize(entry)]),
        );

export const canonicalKerrUncertaintyIndependentVerificationV517 = (value: unknown) =>
  JSON.stringify(canonicalize(value));

export function parseKerrUncertaintyIndependentVerificationReceiptV517(
  value: unknown,
): KerrUncertaintyIndependentVerificationReceiptV517 {
  if (!isRecord(value)) throw new Error("v517-verification-shape");
  const receipt = value as Partial<KerrUncertaintyIndependentVerificationReceiptV517>;
  if (
    receipt.version !== KERR_UNCERTAINTY_INDEPENDENT_VERIFICATION_VERSION_V517 ||
    receipt.status !== "independent-replay-witness-verification-qualified" ||
    !receipt.source ||
    Object.values(receipt.source).some((entry) => !SHA.test(entry)) ||
    receipt.verification?.independentImplementation !== true ||
    receipt.verification.importedV516Parser !== false ||
    receipt.verification.importedV516Builder !== false ||
    receipt.verification.artifactCanonicalValid !== true ||
    receipt.verification.sourceManifestValid !== true ||
    !Number.isInteger(receipt.verification.sourceManifestEntryCount) ||
    receipt.verification.sourceManifestEntryCount <= 0 ||
    receipt.verification.transitionCount !== 512 ||
    receipt.verification.witnessCount !== 512 ||
    receipt.verification.recomputedWitnessCount !== 512 ||
    receipt.verification.checkpointCount !== 8 ||
    receipt.verification.matchedCheckpointCount !== 8 ||
    receipt.verification.passCount !== 2 ||
    !SHA.test(receipt.verification.chainHeadSha256) ||
    receipt.verification.chainHeadSha256 !== receipt.verification.repeatHeadSha256 ||
    receipt.verification.chainHeadMatches !== true ||
    receipt.verification.witnessMismatchCount !== 0 ||
    receipt.verification.checkpointMismatchCount !== 0 ||
    receipt.verification.sequenceMismatchCount !== 0 ||
    receipt.verification.invalidShaCount !== 0 ||
    receipt.verification.boundaryViolationCount !== 0 ||
    !Number.isInteger(receipt.verification.artifactBytes) ||
    receipt.verification.artifactBytes <= 0 ||
    receipt.verification.artifactBytes > 128 * 1024 ||
    receipt.verification.artifactMaximumBytes !== 128 * 1024 ||
    receipt.lifecycle?.filesystemReadsBounded !== true ||
    receipt.lifecycle.networkRequestCount !== 0 ||
    receipt.lifecycle.workerCreated !== false ||
    receipt.lifecycle.objectUrlCount !== 0 ||
    receipt.lifecycle.canvasCreated !== false ||
    receipt.lifecycle.sceneRevisionDelta !== 0 ||
    receipt.boundary?.detectorCalibrationStatus !== "incomplete-0-of-6" ||
    receipt.boundary.detectorAuthorityAvailable !== false ||
    receipt.boundary.scienceRasterAvailable !== false ||
    receipt.boundary.denseCampaignStatus !== "incomplete-0-of-49" ||
    receipt.boundary.browserQualification !== "not-run" ||
    receipt.boundary.localShadowDefaultApplied !== false ||
    receipt.boundary.formalProductPointer !== "v263" ||
    receipt.boundary.formalDefaultKernel !== "legacy-eih-1pn" ||
    !Array.isArray(receipt.sourceManifest) ||
    receipt.sourceManifest.some((entry) => !entry.path || !SHA.test(entry.sha256)) ||
    !SHA.test(receipt.sourceSha256 ?? "") ||
    !SHA.test(receipt.artifactSha256 ?? "")
  ) {
    throw new Error("v517-verification-boundary");
  }
  return receipt as KerrUncertaintyIndependentVerificationReceiptV517;
}

export function createKerrUncertaintyIndependentVerificationSummaryV517(
  value: unknown,
): KerrUncertaintyIndependentVerificationSummaryV517 {
  const receipt = parseKerrUncertaintyIndependentVerificationReceiptV517(value);
  return Object.freeze({
    version: receipt.version,
    status: receipt.status,
    source: receipt.source,
    verification: receipt.verification,
    lifecycle: receipt.lifecycle,
    boundary: receipt.boundary,
    artifactSha256: receipt.artifactSha256,
  });
}

function validateSummary(value: unknown) {
  if (!isRecord(value)) throw new Error("v517-summary-shape");
  parseKerrUncertaintyIndependentVerificationReceiptV517({
    ...value,
    generatedAt: "summary",
    sourceManifest: [],
    sourceSha256: "0".repeat(64),
  });
}

export function parseKerrUncertaintyIndependentVerificationApiV517(
  value: unknown,
): KerrUncertaintyIndependentVerificationApiV517 {
  if (
    !isRecord(value) ||
    value.version !== KERR_UNCERTAINTY_INDEPENDENT_VERIFICATION_API_VERSION_V517 ||
    typeof value.available !== "boolean" ||
    !["ready", "lite-boundary", "local-shadow-only", "evidence-corrupt"].includes(
      String(value.reason),
    )
  ) {
    throw new Error("v517-api-boundary");
  }
  if (value.available) validateSummary(value.summary);
  else if (value.summary !== null) throw new Error("v517-api-unavailable-summary");
  return value as unknown as KerrUncertaintyIndependentVerificationApiV517;
}
