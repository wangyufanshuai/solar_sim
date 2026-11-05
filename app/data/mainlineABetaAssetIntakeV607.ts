import { MAINLINE_A_BETA_HERO_EVIDENCE_INTAKE } from "./mainlineABetaHeroEvidenceIntakeV607";
import { NEBULAE, type NebulaDef } from "./nebulaCatalog";

/**
 * R47 turns the Beta art backlog into an executable, fail-closed intake
 * contract.  The queue describes work that may be admitted later; it does
 * not claim that a source image, a licence, or a measurement already exists.
 */
export type MainlineABetaAssetKindV607 = "hero-star" | "nebula";
export type MainlineABetaIntakeStatusV607 =
  | "awaiting-source"
  | "source-captured"
  | "rights-review"
  | "rights-cleared"
  | "runtime-admitted";
export type MainlineABetaAdmissionV607 = "not-admitted" | "admitted";

export type MainlineABetaEvidenceRefV607 = {
  sourceUrl: string;
  sourceId: string;
  retrievedAt: string;
  sourceDigest: string;
  evidencePath: string;
};

export type MainlineABetaRightsRefV607 = {
  license: string;
  rightsUrl: string;
  credit: string;
  reviewedAt: string;
  policyId: string;
};

export type MainlineABetaImageManifestV607 = {
  localPath: string;
  imageUrl: string;
  byteSize: number;
  sha256: string;
  width: number;
  height: number;
};

export type MainlineABetaAssetRecordV607 = {
  id: string;
  displayName: string;
  kind: MainlineABetaAssetKindV607;
  queueOrder: number;
  status: MainlineABetaIntakeStatusV607;
  admission: MainlineABetaAdmissionV607;
  source: MainlineABetaEvidenceRefV607 | null;
  rights: MainlineABetaRightsRefV607 | null;
  image: MainlineABetaImageManifestV607 | null;
  blockingReasons: readonly string[];
};

export type MainlineABetaIntakeSummaryV607 = {
  total: number;
  byKind: Readonly<Record<MainlineABetaAssetKindV607, number>>;
  byStatus: Readonly<Record<MainlineABetaIntakeStatusV607, number>>;
  admitted: number;
  blocked: number;
  readyForReview: number;
};

export type MainlineABetaIntakeFilterV607 = {
  kind?: MainlineABetaAssetKindV607;
  status?: MainlineABetaIntakeStatusV607;
  admission?: MainlineABetaAdmissionV607;
  search?: string;
};

const PENDING_NEBULA_IDS = [
  "m17",
  "ic434",
  "ngc7000",
  "ic1396",
  "ngc281",
  "m43",
  "ngc2024",
  "ic1848",
  "ic1805",
  "ngc6334",
  "ngc604",
  "rho_oph",
] as const;

const STATUS_ORDER: readonly MainlineABetaIntakeStatusV607[] = [
  "awaiting-source",
  "source-captured",
  "rights-review",
  "rights-cleared",
  "runtime-admitted",
];

const EMPTY_SOURCE: null = null;
const EMPTY_RIGHTS: null = null;
const EMPTY_IMAGE: null = null;

function emptyRecord(
  id: string,
  displayName: string,
  kind: MainlineABetaAssetKindV607,
  queueOrder: number,
): MainlineABetaAssetRecordV607 {
  return {
    id,
    displayName,
    kind,
    queueOrder,
    status: "awaiting-source",
    admission: "not-admitted",
    source: EMPTY_SOURCE,
    rights: EMPTY_RIGHTS,
    image: EMPTY_IMAGE,
    blockingReasons: ["source-snapshot-required"],
  };
}

function nebulaLabel(id: string): string {
  const row: NebulaDef | undefined = NEBULAE.find((candidate) => candidate.id === id);
  return row ? `${row.commonName} · ${row.catalogName}` : id;
}

function buildPendingHeroRecords(): MainlineABetaAssetRecordV607[] {
  return MAINLINE_A_BETA_HERO_EVIDENCE_INTAKE.map((hero, index) => ({
    ...emptyRecord(hero.id, hero.displayName, "hero-star", index + 1),
    blockingReasons: [
      "source-snapshot-required",
      "per-image-rights-review-required",
      "local-manifest-required",
      "measurement-admission-closed",
      "portrait-asset-required",
    ],
  }));
}

function buildPendingNebulaRecords(startOrder: number): MainlineABetaAssetRecordV607[] {
  return PENDING_NEBULA_IDS.map((id, index) => ({
    ...emptyRecord(id, nebulaLabel(id), "nebula", startOrder + index),
    blockingReasons: [
      "source-image-required",
      "per-image-rights-review-required",
      "local-manifest-required",
    ],
  }));
}

/** The complete Beta backlog, intentionally separate from runtime-admitted A assets. */
export const MAINLINE_A_BETA_INTAKE_QUEUE: readonly MainlineABetaAssetRecordV607[] = Object.freeze([
  ...buildPendingHeroRecords(),
  ...buildPendingNebulaRecords(MAINLINE_A_BETA_HERO_EVIDENCE_INTAKE.length + 1),
]);

export const MAINLINE_A_BETA_INTAKE_TARGETS = Object.freeze({
  heroStars: 24,
  constellations: 12,
  nebulae: 24,
  pendingHeroStars: MAINLINE_A_BETA_HERO_EVIDENCE_INTAKE.length,
  pendingNebulae: 12,
});

function hasNonEmpty(value: string | undefined | null): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function validDigest(value: string | undefined | null): boolean {
  return hasNonEmpty(value) && /^[a-f0-9]{64}$/i.test(value);
}

function validDate(value: string | undefined | null): boolean {
  return hasNonEmpty(value) && !Number.isNaN(Date.parse(value));
}

function validateSource(source: MainlineABetaEvidenceRefV607 | null): string[] {
  if (!source) return ["source-snapshot-required"];
  const reasons: string[] = [];
  if (!hasNonEmpty(source.sourceId)) reasons.push("source-id-required");
  if (!/^https?:\/\//i.test(source.sourceUrl)) reasons.push("source-url-required");
  if (!validDate(source.retrievedAt)) reasons.push("source-retrieval-date-required");
  if (!validDigest(source.sourceDigest)) reasons.push("source-sha256-required");
  if (!hasNonEmpty(source.evidencePath)) reasons.push("source-evidence-path-required");
  return reasons;
}

function validateRights(rights: MainlineABetaRightsRefV607 | null): string[] {
  if (!rights) return ["per-image-rights-review-required"];
  const reasons: string[] = [];
  if (!hasNonEmpty(rights.license)) reasons.push("license-required");
  if (!/^https?:\/\//i.test(rights.rightsUrl)) reasons.push("rights-url-required");
  if (!hasNonEmpty(rights.credit)) reasons.push("credit-required");
  if (!validDate(rights.reviewedAt)) reasons.push("rights-review-date-required");
  if (!hasNonEmpty(rights.policyId)) reasons.push("rights-policy-required");
  return reasons;
}

function validateImage(image: MainlineABetaImageManifestV607 | null): string[] {
  if (!image) return ["local-manifest-required"];
  const reasons: string[] = [];
  if (!hasNonEmpty(image.localPath)) reasons.push("local-path-required");
  if (!/^https?:\/\//i.test(image.imageUrl)) reasons.push("image-url-required");
  if (!Number.isInteger(image.byteSize) || image.byteSize <= 0) reasons.push("positive-byte-size-required");
  if (!validDigest(image.sha256)) reasons.push("image-sha256-required");
  if (!Number.isInteger(image.width) || image.width < 256) reasons.push("image-width-too-small");
  if (!Number.isInteger(image.height) || image.height < 256) reasons.push("image-height-too-small");
  return reasons;
}

function validateRecordShape(record: MainlineABetaAssetRecordV607): string[] {
  const reasons: string[] = [];
  if (!hasNonEmpty(record.id)) reasons.push("asset-id-required");
  if (!hasNonEmpty(record.displayName)) reasons.push("asset-display-name-required");
  if (record.kind !== "hero-star" && record.kind !== "nebula") reasons.push("asset-kind-invalid");
  if (!Number.isInteger(record.queueOrder) || record.queueOrder < 1) reasons.push("asset-queue-order-invalid");
  if (!STATUS_ORDER.includes(record.status)) reasons.push("asset-status-invalid");
  if (record.admission !== "admitted" && record.admission !== "not-admitted") reasons.push("asset-admission-invalid");
  if (!Array.isArray(record.blockingReasons) || !record.blockingReasons.every((reason) => hasNonEmpty(reason))) {
    reasons.push("asset-blocking-reasons-invalid");
  }
  return reasons;
}

function uniqueReasons(reasons: readonly string[]): string[] {
  return reasons.filter((reason, index, all) => all.indexOf(reason) === index);
}

function evidenceReasons(record: MainlineABetaAssetRecordV607): string[] {
  return uniqueReasons([
    ...validateSource(record.source),
    ...validateRights(record.rights),
    ...validateImage(record.image),
  ]);
}

function includesNormalizedBlocker(record: MainlineABetaAssetRecordV607, reason: string): boolean {
  if (!Array.isArray(record.blockingReasons)) return false;
  if (record.blockingReasons.includes(reason)) return true;
  // Nebula intake uses a more specific source-image label for the same
  // fail-closed source-snapshot gate used by hero-star intake.
  return reason === "source-snapshot-required"
    && record.kind === "nebula"
    && record.blockingReasons.includes("source-image-required");
}

function expectedStatus(record: MainlineABetaAssetRecordV607): MainlineABetaIntakeStatusV607 {
  if (record.admission === "admitted") return "runtime-admitted";
  if (validateSource(record.source).length > 0) return "awaiting-source";
  if (!record.rights) return "source-captured";
  if (validateRights(record.rights).length > 0) return "rights-review";
  if (validateImage(record.image).length > 0) return "rights-cleared";
  return "rights-cleared";
}

/** Recompute status and blocking reasons without mutating the input record. */
export function normalizeMainlineABetaAssetV607(record: MainlineABetaAssetRecordV607): MainlineABetaAssetRecordV607 {
  const shapeReasons = validateRecordShape(record);
  const evidenceReasonsForRecord = evidenceReasons(record);
  const safeForRuntime = shapeReasons.length === 0 && evidenceReasonsForRecord.length === 0;
  // Admission is a claim derived from the current evidence, never a trusted
  // persisted flag. If a source, rights row, image manifest, or identity field
  // changes after admission, immediately downgrade it and expose the blockers.
  const effectiveAdmission: MainlineABetaAdmissionV607 = record.admission === "admitted" && safeForRuntime
    ? "admitted"
    : "not-admitted";
  const blockingReasons = effectiveAdmission === "admitted"
    ? []
    : uniqueReasons([...shapeReasons, ...evidenceReasonsForRecord]);
  const normalizedStatus = effectiveAdmission === "admitted"
    ? "runtime-admitted"
    : expectedStatus({ ...record, admission: "not-admitted" });
  return { ...record, admission: effectiveAdmission, status: normalizedStatus, blockingReasons };
}

export function validateMainlineABetaAssetV607(record: MainlineABetaAssetRecordV607): readonly string[] {
  return normalizeMainlineABetaAssetV607(record).blockingReasons;
}

export function canAdmitMainlineABetaAssetV607(record: MainlineABetaAssetRecordV607): boolean {
  const normalized = normalizeMainlineABetaAssetV607({ ...record, admission: "not-admitted" });
  return normalized.blockingReasons.length === 0 && normalized.status === "rights-cleared";
}

export function admitMainlineABetaAssetV607(record: MainlineABetaAssetRecordV607): MainlineABetaAssetRecordV607 {
  if (!canAdmitMainlineABetaAssetV607(record)) {
    const reasons = validateMainlineABetaAssetV607(record);
    throw new Error(`Cannot admit ${record.kind}:${record.id}; ${reasons.join(", ")}`);
  }
  return normalizeMainlineABetaAssetV607({ ...record, admission: "admitted" });
}

export function captureMainlineABetaSourceV607(
  record: MainlineABetaAssetRecordV607,
  source: MainlineABetaEvidenceRefV607,
): MainlineABetaAssetRecordV607 {
  return normalizeMainlineABetaAssetV607({ ...record, source });
}

export function attachMainlineABetaRightsV607(
  record: MainlineABetaAssetRecordV607,
  rights: MainlineABetaRightsRefV607,
): MainlineABetaAssetRecordV607 {
  return normalizeMainlineABetaAssetV607({ ...record, rights });
}

export function attachMainlineABetaImageV607(
  record: MainlineABetaAssetRecordV607,
  image: MainlineABetaImageManifestV607,
): MainlineABetaAssetRecordV607 {
  return normalizeMainlineABetaAssetV607({ ...record, image });
}

export function findMainlineABetaAssetV607(id: string): MainlineABetaAssetRecordV607 | undefined {
  return MAINLINE_A_BETA_INTAKE_QUEUE.find((record) => record.id === id);
}

export function filterMainlineABetaAssetsV607(
  records: readonly MainlineABetaAssetRecordV607[],
  filter: MainlineABetaIntakeFilterV607 = {},
): readonly MainlineABetaAssetRecordV607[] {
  const query = filter.search?.trim().toLocaleLowerCase();
  return records.filter((record) => {
    if (filter.kind && record.kind !== filter.kind) return false;
    if (filter.status && record.status !== filter.status) return false;
    if (filter.admission && record.admission !== filter.admission) return false;
    if (query && !`${record.id} ${record.displayName}`.toLocaleLowerCase().includes(query)) return false;
    return true;
  });
}

function statusCounts(records: readonly MainlineABetaAssetRecordV607[]): Record<MainlineABetaIntakeStatusV607, number> {
  return STATUS_ORDER.reduce((counts, status) => {
    counts[status] = records.filter((record) => record.status === status).length;
    return counts;
  }, {} as Record<MainlineABetaIntakeStatusV607, number>);
}

export function summarizeMainlineABetaIntakeV607(
  records: readonly MainlineABetaAssetRecordV607[] = MAINLINE_A_BETA_INTAKE_QUEUE,
): MainlineABetaIntakeSummaryV607 {
  const byKind = {
    "hero-star": records.filter((record) => record.kind === "hero-star").length,
    nebula: records.filter((record) => record.kind === "nebula").length,
  } as const;
  const byStatus = statusCounts(records);
  return {
    total: records.length,
    byKind,
    byStatus,
    admitted: records.filter((record) => record.admission === "admitted").length,
    blocked: records.filter((record) => record.blockingReasons.length > 0).length,
    readyForReview: records.filter((record) => record.status === "rights-review").length,
  };
}

export function sortMainlineABetaAssetsV607(
  records: readonly MainlineABetaAssetRecordV607[],
): readonly MainlineABetaAssetRecordV607[] {
  return [...records].sort((left, right) => left.queueOrder - right.queueOrder || left.id.localeCompare(right.id));
}

export function mergeMainlineABetaAssetUpdatesV607(
  base: readonly MainlineABetaAssetRecordV607[],
  updates: readonly MainlineABetaAssetRecordV607[],
): readonly MainlineABetaAssetRecordV607[] {
  const baseById = new Map<string, MainlineABetaAssetRecordV607>();
  const baseOrders = new Set<number>();
  for (const record of base) {
    if (baseById.has(record.id)) throw new Error(`Duplicate Beta intake id in base: ${record.id}`);
    if (baseOrders.has(record.queueOrder)) throw new Error(`Duplicate Beta queue order in base: ${record.queueOrder}`);
    baseById.set(record.id, record);
    baseOrders.add(record.queueOrder);
  }
  const updateById = new Map<string, MainlineABetaAssetRecordV607>();
  for (const update of updates) {
    if (!baseById.has(update.id)) throw new Error(`Unknown Beta intake update id: ${update.id}`);
    if (updateById.has(update.id)) throw new Error(`Duplicate Beta intake update id: ${update.id}`);
    const baseRecord = baseById.get(update.id)!;
    if (update.kind !== baseRecord.kind) throw new Error(`Beta intake kind mismatch: ${update.id}`);
    if (update.displayName !== baseRecord.displayName) throw new Error(`Beta intake label mismatch: ${update.id}`);
    if (update.queueOrder !== baseRecord.queueOrder) throw new Error(`Beta intake order mismatch: ${update.id}`);
    updateById.set(update.id, update);
  }
  const merged = sortMainlineABetaAssetsV607(base.map((record) => updateById.get(record.id) ?? record));
  assertMainlineABetaQueueIntegrityV607(merged);
  return merged;
}

export function assertMainlineABetaQueueIntegrityV607(
  records: readonly MainlineABetaAssetRecordV607[] = MAINLINE_A_BETA_INTAKE_QUEUE,
): void {
  const ids = new Set<string>();
  const orders = new Set<number>();
  for (const record of records) {
    if (ids.has(record.id)) throw new Error(`Duplicate Beta intake id: ${record.id}`);
    ids.add(record.id);
    const shapeReasons = validateRecordShape(record);
    if (shapeReasons.includes("asset-id-required")) throw new Error(`Missing Beta intake id`);
    if (shapeReasons.includes("asset-display-name-required")) throw new Error(`Missing Beta intake label: ${record.id}`);
    if (shapeReasons.includes("asset-kind-invalid")) throw new Error(`Invalid Beta intake kind: ${record.id}`);
    if (shapeReasons.includes("asset-status-invalid")) throw new Error(`Invalid Beta intake status: ${record.id}`);
    if (shapeReasons.includes("asset-admission-invalid")) throw new Error(`Invalid Beta intake admission: ${record.id}`);
    if (shapeReasons.includes("asset-blocking-reasons-invalid")) throw new Error(`Invalid Beta intake blockers: ${record.id}`);
    if (!Number.isInteger(record.queueOrder) || record.queueOrder < 1) throw new Error(`Invalid queue order: ${record.id}`);
    if (orders.has(record.queueOrder)) throw new Error(`Duplicate Beta queue order: ${record.queueOrder}`);
    orders.add(record.queueOrder);
    if (record.admission === "admitted" && !canAdmitMainlineABetaAssetV607(record)) throw new Error(`Unsafe admitted record: ${record.id}`);
    const normalized = normalizeMainlineABetaAssetV607(record);
    if (record.status !== normalized.status) throw new Error(`Stale Beta intake status: ${record.id}`);
    for (const reason of normalized.blockingReasons) {
      if (!includesNormalizedBlocker(record, reason)) throw new Error(`Missing Beta intake blocker: ${record.id}:${reason}`);
    }
  }
}

assertMainlineABetaQueueIntegrityV607();
