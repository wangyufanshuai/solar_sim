import {
  ATLAS_SCIENCE_CINEMATIC_V7_ID_V457,
  auditAtlasScienceCinematicV7BoundaryV457,
} from "./atlasScienceCinematicV7V457";

export const SCIENCE_PRODUCT_PROMOTION_VERSION_V457 =
  "v457-science-product-promotion-gate-v1" as const;
export const SCIENCE_PRODUCT_PROMOTION_SUMMARY_VERSION_V457 =
  "v457-science-product-promotion-summary-v1" as const;
export const SCIENCE_PRODUCT_PROMOTION_API_VERSION_V457 =
  "v457-science-product-promotion-api-v1" as const;

export const SCIENCE_PRODUCT_GATE_IDS_V457 = Object.freeze([
  "fits-header",
  "provenance-graph",
  "measured-detector-inputs",
  "detector-pixel-values",
  "dense-aggregate",
  "selection-bias",
  "browser",
  "visual-matrix",
  "soak",
  "rtx-webgpu",
] as const);

export type ScienceProductGateIdV457 =
  (typeof SCIENCE_PRODUCT_GATE_IDS_V457)[number];
export type ScienceProductGateStatusV457 =
  | "qualified"
  | "blocked"
  | "incomplete"
  | "unquantified"
  | "not-run";
export type ScienceProductGateEntryV457 = Readonly<{
  id: ScienceProductGateIdV457;
  label: string;
  status: ScienceProductGateStatusV457;
  evidence: string;
  blocker: boolean;
}>;
export type ScienceProductPromotionDecisionV457 = Readonly<{
  promotionAllowed: boolean;
  fitsWriteAllowed: boolean;
  pngWriteAllowed: boolean;
  localShadowDefaultApplied: false;
  blockerIds: readonly ScienceProductGateIdV457[];
}>;

export type ScienceProductPromotionGateV457 = Readonly<{
  version: typeof SCIENCE_PRODUCT_PROMOTION_VERSION_V457;
  generatedAt: string;
  status: "blocked-science-product-promotion-structure-qualified-value-authority-missing";
  source: Readonly<{
    v456ArtifactSha256: string;
    v451ArtifactSha256: string;
    v314StateSha256: string;
  }>;
  gates: readonly ScienceProductGateEntryV457[];
  counts: Readonly<{
    gateCount: 10;
    qualifiedCount: number;
    blockerCount: number;
    measuredDetectorRequired: 6;
    measuredDetectorReady: number;
    denseShardsCompleted: number;
    denseShardsPlanned: 49;
  }>;
  decisions: ScienceProductPromotionDecisionV457;
  visualProfile: ReturnType<typeof auditAtlasScienceCinematicV7BoundaryV457>;
  boundary: Readonly<{
    fitsHeaderStructureQualified: true;
    provenanceGraphQualified: true;
    detectorPixelAuthority: false;
    scienceProductAuthority: false;
    fitsHduEmitted: false;
    pngEmitted: false;
    scienceAndCinematicSeparated: true;
    networkAttempted: false;
    automaticRetryApplied: false;
  }>;
  formalProductPointer: "v263";
  formalDefaultKernel: "legacy-eih-1pn";
  artifactSha256: string;
}>;

export type ScienceProductPromotionSummaryV457 = Readonly<{
  version: typeof SCIENCE_PRODUCT_PROMOTION_SUMMARY_VERSION_V457;
  status: ScienceProductPromotionGateV457["status"];
  artifactSha256: string;
  gates: ScienceProductPromotionGateV457["gates"];
  counts: ScienceProductPromotionGateV457["counts"];
  decisions: ScienceProductPromotionGateV457["decisions"];
  visualProfile: ScienceProductPromotionGateV457["visualProfile"];
  boundary: ScienceProductPromotionGateV457["boundary"];
}>;

export type ScienceProductPromotionApiV457 = Readonly<{
  version: typeof SCIENCE_PRODUCT_PROMOTION_API_VERSION_V457;
  available: boolean;
  reason:
    | "ready"
    | "lite-boundary"
    | "local-shadow-only"
    | "evidence-corrupt"
    | "request-failed";
  summary: ScienceProductPromotionSummaryV457 | null;
}>;

const SHA256 = /^[a-f0-9]{64}$/;
const STATUS = new Set<ScienceProductGateStatusV457>([
  "qualified",
  "blocked",
  "incomplete",
  "unquantified",
  "not-run",
]);
const transientKeys = new Set([
  "generatedAt",
  "artifactSha256",
  "evidenceSha256",
  "pointerSha256",
]);

function freezeDeep<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) {
      freezeDeep(child);
    }
  }
  return value;
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !transientKeys.has(key))
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, canonicalize(entry)]),
  );
}

export function canonicalScienceProductPromotionPayloadV457(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

export function evaluateScienceProductPromotionV457(
  gates: readonly ScienceProductGateEntryV457[],
): ScienceProductPromotionDecisionV457 {
  const byId = new Map(gates.map((gate) => [gate.id, gate]));
  if (
    byId.size !== SCIENCE_PRODUCT_GATE_IDS_V457.length ||
    SCIENCE_PRODUCT_GATE_IDS_V457.some((id) => !byId.has(id))
  ) {
    throw new Error("v457-promotion-gate-inventory");
  }
  const blockerIds = SCIENCE_PRODUCT_GATE_IDS_V457.filter(
    (id) => byId.get(id)?.status !== "qualified",
  );
  const promotionAllowed = blockerIds.length === 0;
  return freezeDeep({
    promotionAllowed,
    fitsWriteAllowed: promotionAllowed,
    pngWriteAllowed: promotionAllowed,
    localShadowDefaultApplied: false,
    blockerIds,
  });
}

function validGate(value: unknown): value is ScienceProductGateEntryV457 {
  const gate = value as Partial<ScienceProductGateEntryV457> | null;
  return Boolean(
    gate &&
      SCIENCE_PRODUCT_GATE_IDS_V457.includes(gate.id as ScienceProductGateIdV457) &&
      typeof gate.label === "string" &&
      gate.label.length > 0 &&
      gate.label.length <= 80 &&
      STATUS.has(gate.status as ScienceProductGateStatusV457) &&
      typeof gate.evidence === "string" &&
      gate.evidence.length > 0 &&
      gate.evidence.length <= 160 &&
      gate.blocker === (gate.status !== "qualified"),
  );
}

export function parseScienceProductPromotionGateV457(
  value: unknown,
): ScienceProductPromotionGateV457 {
  const artifact =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Partial<ScienceProductPromotionGateV457>)
      : null;
  if (
    !artifact ||
    artifact.version !== SCIENCE_PRODUCT_PROMOTION_VERSION_V457 ||
    artifact.status !==
      "blocked-science-product-promotion-structure-qualified-value-authority-missing" ||
    !SHA256.test(artifact.artifactSha256 ?? "") ||
    !artifact.source ||
    Object.values(artifact.source).some((entry) => !SHA256.test(entry)) ||
    artifact.gates?.length !== SCIENCE_PRODUCT_GATE_IDS_V457.length ||
    artifact.gates.some((gate) => !validGate(gate)) ||
    new Set(artifact.gates.map((gate) => gate.id)).size !== artifact.gates.length ||
    artifact.counts?.gateCount !== 10 ||
    artifact.counts.qualifiedCount !== 2 ||
    artifact.counts.blockerCount !== 8 ||
    artifact.counts.measuredDetectorRequired !== 6 ||
    artifact.counts.measuredDetectorReady !== 0 ||
    artifact.counts.denseShardsCompleted !== 0 ||
    artifact.counts.denseShardsPlanned !== 49 ||
    artifact.decisions?.promotionAllowed !== false ||
    artifact.decisions.fitsWriteAllowed !== false ||
    artifact.decisions.pngWriteAllowed !== false ||
    artifact.decisions.localShadowDefaultApplied !== false ||
    artifact.decisions.blockerIds.length !== 8 ||
    artifact.visualProfile?.profileId !== ATLAS_SCIENCE_CINEMATIC_V7_ID_V457 ||
    artifact.visualProfile.scienceLinearDisplay !== true ||
    artifact.visualProfile.scienceBloomDisabled !== true ||
    artifact.visualProfile.scienceGradeDisabled !== true ||
    artifact.visualProfile.scientificFieldMutation !== false ||
    artifact.visualProfile.localShadowOnly !== true ||
    artifact.visualProfile.defaultApplied !== false ||
    artifact.boundary?.fitsHeaderStructureQualified !== true ||
    artifact.boundary.provenanceGraphQualified !== true ||
    artifact.boundary.detectorPixelAuthority !== false ||
    artifact.boundary.scienceProductAuthority !== false ||
    artifact.boundary.fitsHduEmitted !== false ||
    artifact.boundary.pngEmitted !== false ||
    artifact.boundary.scienceAndCinematicSeparated !== true ||
    artifact.boundary.networkAttempted !== false ||
    artifact.boundary.automaticRetryApplied !== false ||
    artifact.formalProductPointer !== "v263" ||
    artifact.formalDefaultKernel !== "legacy-eih-1pn"
  ) {
    throw new Error("v457-science-product-promotion-identity");
  }
  const recomputed = evaluateScienceProductPromotionV457(artifact.gates);
  if (
    JSON.stringify(recomputed) !== JSON.stringify(artifact.decisions) ||
    artifact.gates.find((gate) => gate.id === "fits-header")?.status !== "qualified" ||
    artifact.gates.find((gate) => gate.id === "provenance-graph")?.status !==
      "qualified"
  ) {
    throw new Error("v457-science-product-promotion-decision");
  }
  return freezeDeep(value as ScienceProductPromotionGateV457);
}

export function createScienceProductPromotionSummaryV457(
  value: unknown,
): ScienceProductPromotionSummaryV457 {
  const artifact = parseScienceProductPromotionGateV457(value);
  return freezeDeep({
    version: SCIENCE_PRODUCT_PROMOTION_SUMMARY_VERSION_V457,
    status: artifact.status,
    artifactSha256: artifact.artifactSha256,
    gates: artifact.gates,
    counts: artifact.counts,
    decisions: artifact.decisions,
    visualProfile: artifact.visualProfile,
    boundary: artifact.boundary,
  });
}

export function parseScienceProductPromotionApiV457(
  value: unknown,
): ScienceProductPromotionApiV457 {
  const api =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Partial<ScienceProductPromotionApiV457>)
      : null;
  if (
    !api ||
    api.version !== SCIENCE_PRODUCT_PROMOTION_API_VERSION_V457 ||
    typeof api.available !== "boolean" ||
    ![
      "ready",
      "lite-boundary",
      "local-shadow-only",
      "evidence-corrupt",
      "request-failed",
    ].includes(api.reason ?? "") ||
    (api.available && !api.summary) ||
    (!api.available && api.summary !== null)
  ) {
    throw new Error("v457-science-product-promotion-api-identity");
  }
  return freezeDeep(value as ScienceProductPromotionApiV457);
}
