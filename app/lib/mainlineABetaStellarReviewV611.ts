import { MAINLINE_A_BETA_STELLAR_PROJECTION } from "../data/mainlineABetaStellarProjectionV607.generated";
import { STELLAR_HEROES_V592 } from "../data/stellarHeroesV592.generated";

/**
 * R51 evidence review is deliberately separate from the A4 runtime roster.
 * A source row can become presentation-ready without becoming a measurement
 * authority or entering the runtime allowlist.
 */
export type MainlineABetaStellarReviewStateV611 =
  | "blocked"
  | "identity-review"
  | "presentation-ready"
  | "runtime-admitted";

export type MainlineABetaStellarReviewRiskV611 =
  | "source-identifier-missing"
  | "source-digest-invalid"
  | "resolution-class-unknown"
  | "component-identity-ambiguous"
  | "positive-parallax-missing"
  | "parallax-error-missing"
  | "upstream-reference-missing"
  | "source-patch-unsealed"
  | "source-snapshot-seal-invalid"
  | "source-snapshot-replay"
  | "runtime-allowlist-closed"
  | "measurement-admission-closed";

export type MainlineABetaStellarReviewRowV611 = {
  id: string;
  displayName: string;
  simbadIdentifier: string | null;
  sourceRecordDigest: string;
  resolutionClass: string;
  parallaxMas: number | null;
  errorMas: number | null;
  bibcode: string | null;
  snapshotSha256: string;
  retrievedAt: string;
  risks: readonly MainlineABetaStellarReviewRiskV611[];
  state: MainlineABetaStellarReviewStateV611;
  runtimeAdmission: "candidate-only";
  measurementAdmission: "not-admitted";
  sciencePayloadWriteback: false;
};

export type MainlineABetaStellarReviewSummaryV611 = {
  total: number;
  blocked: number;
  identityReview: number;
  presentationReady: number;
  runtimeAdmitted: number;
  riskCounts: Readonly<Partial<Record<MainlineABetaStellarReviewRiskV611, number>>>;
};

export type MainlineABetaStellarReviewFilterV611 = {
  state?: MainlineABetaStellarReviewStateV611;
  risk?: MainlineABetaStellarReviewRiskV611;
  query?: string;
};

export type MainlineABetaStellarReviewSourcePatchV611 = {
  simbadIdentifier?: string | null;
  resolutionClass?: string;
  parallaxMas?: number | null;
  errorMas?: number | null;
  bibcode?: string | null;
  sourceRecordDigest?: string;
  snapshotSha256?: string;
  retrievedAt?: string;
};

export type MainlineABetaStellarReviewEvidenceCheckV611 = {
  id: string;
  matchesSealedProjection: boolean;
  digestFormatValid: boolean;
  snapshotSealMatches: boolean;
  sourceFieldsComplete: boolean;
  state: MainlineABetaStellarReviewStateV611;
  risks: readonly MainlineABetaStellarReviewRiskV611[];
};

const PENDING_IDS = new Set(["acrux", "spica", "regulus", "polaris"]);
const HERO_NAMES = new Map(STELLAR_HEROES_V592.map((hero) => [hero.id, hero.name]));
const AMBIGUOUS_RESOLUTIONS = new Set(["system-only-component-ambiguous"]);
const BLOCKING_RISKS = new Set<MainlineABetaStellarReviewRiskV611>([
  "source-identifier-missing",
  "source-digest-invalid",
  "resolution-class-unknown",
  "positive-parallax-missing",
  "parallax-error-missing",
  "upstream-reference-missing",
  "source-patch-unsealed",
  "source-snapshot-seal-invalid",
]);

function uniqueRisks(risks: readonly MainlineABetaStellarReviewRiskV611[]): MainlineABetaStellarReviewRiskV611[] {
  return risks.filter((risk, index) => risks.indexOf(risk) === index);
}

function sealedProjectionRow(id: string) {
  return MAINLINE_A_BETA_STELLAR_PROJECTION.rows.find((candidate) => candidate.id === id);
}

function sourceFieldsMatchSealedProjection(row: Pick<MainlineABetaStellarReviewRowV611, "id" | "simbadIdentifier" | "sourceRecordDigest" | "resolutionClass" | "parallaxMas" | "errorMas" | "bibcode">): boolean {
  const sealed = sealedProjectionRow(row.id);
  if (!sealed) return false;
  return row.simbadIdentifier === sealed.simbadIdentifier
    && row.sourceRecordDigest === sealed.sourceRecordDigest
    && row.resolutionClass === sealed.resolutionClass
    && row.parallaxMas === sealed.parallaxMas
    && row.errorMas === sealed.errorMas
    && row.bibcode === sealed.bibcode;
}

function sourceRisks(row: Pick<MainlineABetaStellarReviewRowV611, "simbadIdentifier" | "sourceRecordDigest" | "resolutionClass" | "parallaxMas" | "errorMas" | "bibcode">): MainlineABetaStellarReviewRiskV611[] {
  const risks: MainlineABetaStellarReviewRiskV611[] = ["source-snapshot-replay", "runtime-allowlist-closed", "measurement-admission-closed"];
  if (typeof row.simbadIdentifier !== "string" || row.simbadIdentifier.trim().length === 0) risks.push("source-identifier-missing");
  if (!/^[a-f0-9]{64}$/i.test(row.sourceRecordDigest)) risks.push("source-digest-invalid");
  if (!["exact-component", "exact-named-star", ...AMBIGUOUS_RESOLUTIONS].includes(row.resolutionClass)) risks.push("resolution-class-unknown");
  if (AMBIGUOUS_RESOLUTIONS.has(row.resolutionClass)) risks.push("component-identity-ambiguous");
  if (typeof row.parallaxMas !== "number" || !Number.isFinite(row.parallaxMas) || row.parallaxMas <= 0) risks.push("positive-parallax-missing");
  if (typeof row.errorMas !== "number" || !Number.isFinite(row.errorMas) || row.errorMas < 0) risks.push("parallax-error-missing");
  if (typeof row.bibcode !== "string" || row.bibcode.trim().length === 0) risks.push("upstream-reference-missing");
  return uniqueRisks(risks);
}

function sourceRisksForReviewRow(row: MainlineABetaStellarReviewRowV611): MainlineABetaStellarReviewRiskV611[] {
  const risks = sourceRisks(row);
  if (!sourceFieldsMatchSealedProjection(row)) risks.push("source-patch-unsealed");
  if (row.snapshotSha256 !== MAINLINE_A_BETA_STELLAR_PROJECTION.snapshotSha256) risks.push("source-snapshot-seal-invalid");
  return uniqueRisks(risks);
}

function reviewState(risks: readonly MainlineABetaStellarReviewRiskV611[], resolutionClass: string): MainlineABetaStellarReviewStateV611 {
  if (risks.some((risk) => BLOCKING_RISKS.has(risk))) return "blocked";
  if (AMBIGUOUS_RESOLUTIONS.has(resolutionClass)) return "identity-review";
  return "presentation-ready";
}

function rowFromProjection(row: (typeof MAINLINE_A_BETA_STELLAR_PROJECTION.rows)[number]): MainlineABetaStellarReviewRowV611 {
  const risks = sourceRisks(row);
  return Object.freeze({
    id: row.id,
    displayName: HERO_NAMES.get(row.id) ?? row.id,
    simbadIdentifier: row.simbadIdentifier,
    sourceRecordDigest: row.sourceRecordDigest,
    resolutionClass: row.resolutionClass,
    parallaxMas: row.parallaxMas,
    errorMas: row.errorMas,
    bibcode: row.bibcode,
    snapshotSha256: MAINLINE_A_BETA_STELLAR_PROJECTION.snapshotSha256,
    retrievedAt: MAINLINE_A_BETA_STELLAR_PROJECTION.retrievedAt,
    risks,
    state: reviewState(risks, row.resolutionClass),
    runtimeAdmission: "candidate-only",
    measurementAdmission: "not-admitted",
    sciencePayloadWriteback: false,
  });
}

/** Build only the four unresolved hero rows; the twelve ready rows stay in A4. */
export function buildMainlineABetaStellarReviewRowsV611(): readonly MainlineABetaStellarReviewRowV611[] {
  return Object.freeze(MAINLINE_A_BETA_STELLAR_PROJECTION.rows.filter((row) => PENDING_IDS.has(row.id)).map(rowFromProjection));
}

export const MAINLINE_A_BETA_STELLAR_REVIEW_ROWS_V611 = buildMainlineABetaStellarReviewRowsV611();

export function normalizeMainlineABetaStellarReviewRowV611(row: MainlineABetaStellarReviewRowV611): MainlineABetaStellarReviewRowV611 {
  const risks = sourceRisksForReviewRow(row);
  const state = reviewState(risks, row.resolutionClass);
  return Object.freeze({ ...row, risks, state, runtimeAdmission: "candidate-only", measurementAdmission: "not-admitted", sciencePayloadWriteback: false });
}

/**
 * Return the evidence boundary used by the review panel and pack builder.
 * A valid-looking SHA is not enough: source fields must still match the
 * sealed projection generated from the local source snapshot.
 */
export function inspectMainlineABetaStellarReviewEvidenceV611(
  row: MainlineABetaStellarReviewRowV611,
): MainlineABetaStellarReviewEvidenceCheckV611 {
  const normalized = normalizeMainlineABetaStellarReviewRowV611(row);
  const digestFormatValid = /^[a-f0-9]{64}$/i.test(row.sourceRecordDigest);
  const snapshotSealMatches = row.snapshotSha256 === MAINLINE_A_BETA_STELLAR_PROJECTION.snapshotSha256;
  const sourceFieldsComplete = typeof row.simbadIdentifier === "string"
    && row.simbadIdentifier.trim().length > 0
    && typeof row.resolutionClass === "string"
    && row.resolutionClass.trim().length > 0
    && typeof row.parallaxMas === "number"
    && Number.isFinite(row.parallaxMas)
    && row.parallaxMas > 0
    && typeof row.errorMas === "number"
    && Number.isFinite(row.errorMas)
    && row.errorMas >= 0
    && typeof row.bibcode === "string"
    && row.bibcode.trim().length > 0;
  return Object.freeze({
    id: row.id,
    matchesSealedProjection: sourceFieldsMatchSealedProjection(row),
    digestFormatValid,
    snapshotSealMatches,
    sourceFieldsComplete,
    state: normalized.state,
    risks: normalized.risks,
  });
}

export function isMainlineABetaStellarReviewSourceSealedV611(row: MainlineABetaStellarReviewRowV611): boolean {
  return inspectMainlineABetaStellarReviewEvidenceV611(row).matchesSealedProjection;
}

/** Apply a newly captured source row while retaining the candidate boundary. */
export function patchMainlineABetaStellarReviewRowV611(
  row: MainlineABetaStellarReviewRowV611,
  patch: MainlineABetaStellarReviewSourcePatchV611,
): MainlineABetaStellarReviewRowV611 {
  if (!PENDING_IDS.has(row.id)) throw new Error(`Not an R51 pending hero: ${row.id}`);
  return normalizeMainlineABetaStellarReviewRowV611({ ...row, ...patch });
}

export function reviewRiskLabelV611(risk: MainlineABetaStellarReviewRiskV611): string {
  const labels: Record<MainlineABetaStellarReviewRiskV611, string> = {
    "source-identifier-missing": "来源标识缺失",
    "source-digest-invalid": "来源摘要无效",
    "resolution-class-unknown": "身份解析类别未知",
    "component-identity-ambiguous": "组件身份待确认",
    "positive-parallax-missing": "正视差缺失或无效",
    "parallax-error-missing": "视差误差缺失或无效",
    "upstream-reference-missing": "上游文献引用缺失",
    "source-patch-unsealed": "来源补丁尚未重新封存",
    "source-snapshot-seal-invalid": "来源快照封印无效",
    "source-snapshot-replay": "使用封存快照重放",
    "runtime-allowlist-closed": "运行时白名单关闭",
    "measurement-admission-closed": "测量准入关闭",
  };
  return labels[risk];
}

export function filterMainlineABetaStellarReviewRowsV611(
  rows: readonly MainlineABetaStellarReviewRowV611[],
  filter: MainlineABetaStellarReviewFilterV611 = {},
): readonly MainlineABetaStellarReviewRowV611[] {
  const needle = filter.query?.trim().toLocaleLowerCase() ?? "";
  return rows.filter((row) => {
    if (filter.state && row.state !== filter.state) return false;
    if (filter.risk && !row.risks.includes(filter.risk)) return false;
    if (!needle) return true;
    return [row.id, row.displayName, row.simbadIdentifier ?? "", row.resolutionClass, row.bibcode ?? ""].join(" ").toLocaleLowerCase().includes(needle);
  });
}

export function summarizeMainlineABetaStellarReviewV611(
  rows: readonly MainlineABetaStellarReviewRowV611[] = MAINLINE_A_BETA_STELLAR_REVIEW_ROWS_V611,
): MainlineABetaStellarReviewSummaryV611 {
  const riskCounts: Partial<Record<MainlineABetaStellarReviewRiskV611, number>> = {};
  for (const row of rows) for (const risk of row.risks) riskCounts[risk] = (riskCounts[risk] ?? 0) + 1;
  return Object.freeze({
    total: rows.length,
    blocked: rows.filter((row) => row.state === "blocked").length,
    identityReview: rows.filter((row) => row.state === "identity-review").length,
    presentationReady: rows.filter((row) => row.state === "presentation-ready").length,
    runtimeAdmitted: rows.filter((row) => row.state === "runtime-admitted").length,
    riskCounts: Object.freeze(riskCounts),
  });
}

export function canAdvanceMainlineABetaStellarReviewV611(
  row: MainlineABetaStellarReviewRowV611,
  next: MainlineABetaStellarReviewStateV611,
): boolean {
  // Never advance from a stale or hand-edited state. Recompute the state from
  // the source fields first, then apply the monotonic review transitions.
  const canonical = normalizeMainlineABetaStellarReviewRowV611(row);
  if (row.state !== canonical.state) return false;
  if (next === row.state) return true;
  if (next === "runtime-admitted") return false;
  if (row.state === "blocked" && next === "identity-review") return !canonical.risks.some((risk) => BLOCKING_RISKS.has(risk));
  if (row.state === "identity-review" && next === "presentation-ready") {
    return !canonical.risks.includes("component-identity-ambiguous") && !canonical.risks.includes("source-patch-unsealed");
  }
  return false;
}

export function transitionMainlineABetaStellarReviewV611(
  row: MainlineABetaStellarReviewRowV611,
  next: MainlineABetaStellarReviewStateV611,
): MainlineABetaStellarReviewRowV611 {
  if (!canAdvanceMainlineABetaStellarReviewV611(row, next)) throw new Error(`R51 stellar review transition rejected: ${row.id} ${row.state} -> ${next}`);
  const canonical = normalizeMainlineABetaStellarReviewRowV611(row);
  return Object.freeze({ ...canonical, state: next });
}

/** Runtime admission remains impossible until a separate allowlist change exists. */
export function canAdmitMainlineABetaStellarReviewV611(row: MainlineABetaStellarReviewRowV611): boolean {
  // This utility intentionally has no authority to open the runtime gate.
  // A future release gate must explicitly replace the candidate-only policy.
  const canonical = normalizeMainlineABetaStellarReviewRowV611(row);
  return canonical.state === "runtime-admitted" && canonical.runtimeAdmission !== "candidate-only";
}

export function isMainlineABetaStellarReviewTerminalV611(state: MainlineABetaStellarReviewStateV611): boolean {
  return state === "presentation-ready" || state === "runtime-admitted";
}
