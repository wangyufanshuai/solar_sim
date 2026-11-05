import {
  MAINLINE_A_NEBULA_ATLAS_CANDIDATES,
  MAINLINE_A_NEBULA_ATLAS_ENTRIES,
  type NebulaAtlasEntry,
} from "./mainlineANebulaAtlasV609";
import { MAINLINE_A_BETA_NEBULA_PROJECTION_V609 } from "../data/mainlineABetaNebulaProjectionV609.generated";

/**
 * Review states describe the evidence workflow for a candidate image. They
 * are deliberately separate from the runtime admission flag on the atlas;
 * moving a card through review never mutates the scientific registry.
 */
export const REVIEW_STATES = [
  "source-captured",
  "rights-review",
  "visual-review",
  "admission-ready",
  "blocked",
  "runtime-admitted",
] as const;

export type NebulaReviewState = (typeof REVIEW_STATES)[number];

export const REVIEW_STATE_LABELS: Readonly<Record<NebulaReviewState, string>> = Object.freeze({
  "source-captured": "来源已捕获",
  "rights-review": "权利待复核",
  "visual-review": "视觉待复核",
  "admission-ready": "可申请接入",
  blocked: "存在阻塞",
  "runtime-admitted": "已进入运行时",
});

export type NebulaReviewRisk =
  | "candidate-only"
  | "rights-unresolved"
  | "credit-missing"
  | "source-page-missing"
  | "image-path-missing"
  | "image-digest-invalid"
  | "image-dimensions-invalid"
  | "image-bytes-invalid"
  | "scientific-authority-closed"
  | "catalog-coordinate-missing"
  | "visual-review-required"
  | "runtime-allowlist-closed";

export type NebulaReviewRow = {
  id: string;
  displayName: string;
  catalogName: string;
  sourceTarget: string | null;
  sourcePage: string | null;
  sourceImagePath: string | null;
  sourceCredit: string | null;
  sourceLicense: string | null;
  sourceSha256: string | null;
  sourceBytes: number | null;
  sourceDimensions: { width: number; height: number } | null;
  tier: NebulaAtlasEntry["tier"];
  runtimeAdmission: NebulaAtlasEntry["runtimeAdmission"];
  state: NebulaReviewState;
  risks: readonly NebulaReviewRisk[];
  candidateOnly: boolean;
  scienceAuthority: false;
};

export type NebulaReviewSummary = {
  total: number;
  byState: Readonly<Record<NebulaReviewState, number>>;
  withRisks: number;
  candidateOnly: number;
  rightsReview: number;
  visualReview: number;
  admissionReady: number;
  runtimeAdmitted: number;
};

const SHA256_PATTERN = /^[a-f0-9]{64}$/i;
const REVIEW_SEQUENCE: readonly NebulaReviewState[] = [
  "source-captured",
  "rights-review",
  "visual-review",
  "admission-ready",
];

type ProjectionAsset = (typeof MAINLINE_A_BETA_NEBULA_PROJECTION_V609)[number];

function projectionFor(entry: NebulaAtlasEntry): ProjectionAsset | undefined {
  return (MAINLINE_A_BETA_NEBULA_PROJECTION_V609 as readonly ProjectionAsset[]).find(
    (asset) => asset.catalogName === entry.catalogName || asset.target === entry.sourceTarget,
  );
}

function uniqueRisks(risks: readonly NebulaReviewRisk[]): NebulaReviewRisk[] {
  return risks.filter((risk, index, list) => list.indexOf(risk) === index);
}

function hasText(value: string | null): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function deriveRisks(entry: NebulaAtlasEntry): NebulaReviewRisk[] {
  const risks: NebulaReviewRisk[] = [];
  const isCandidate = entry.tier === "candidate";
  if (isCandidate) risks.push("candidate-only", "runtime-allowlist-closed");
  if (entry.rights !== "cleared") risks.push("rights-unresolved");
  // Current A assets already passed their own sealed delivery gate. The
  // candidate queue, however, must carry every image-level field before a
  // future review can advance it, so apply these checks only to candidates.
  if (isCandidate) {
    if (!hasText(entry.sourcePage)) risks.push("source-page-missing");
    if (!hasText(entry.sourceCredit)) risks.push("credit-missing");
    if (!hasText(entry.sourceImagePath)) risks.push("image-path-missing");
    if (!entry.sourceSha256 || !SHA256_PATTERN.test(entry.sourceSha256)) risks.push("image-digest-invalid");
    const dimensions = entry.sourceDimensions;
    if (!dimensions || dimensions.width < 256 || dimensions.height < 256) risks.push("image-dimensions-invalid");
    if (!Number.isInteger(entry.sourceBytes) || (entry.sourceBytes ?? 0) <= 0) risks.push("image-bytes-invalid");
  }
  if (!Number.isFinite(entry.galLonDeg) || !Number.isFinite(entry.galLatDeg) || entry.distancePc === null || entry.distancePc <= 0) risks.push("catalog-coordinate-missing");
  if (entry.scienceAuthority !== false) risks.push("scientific-authority-closed");
  if (isCandidate) risks.push("visual-review-required");
  return uniqueRisks(risks);
}

function stateFor(entry: NebulaAtlasEntry, risks: readonly NebulaReviewRisk[]): NebulaReviewState {
  if (entry.runtimeAdmission === "current") return "runtime-admitted";
  if (risks.some((risk) => risk === "source-page-missing" || risk === "image-path-missing" || risk === "image-digest-invalid" || risk === "image-dimensions-invalid" || risk === "image-bytes-invalid")) {
    return "blocked";
  }
  if (entry.rights !== "cleared") return "rights-review";
  if (risks.includes("visual-review-required")) return "visual-review";
  return "admission-ready";
}

function toReviewRow(entry: NebulaAtlasEntry): NebulaReviewRow {
  const projection = projectionFor(entry);
  const sourcePage = entry.sourcePage;
  const sourceImagePath = entry.sourceImagePath ?? projection?.source.localPath ?? null;
  const sourceCredit = entry.sourceCredit;
  const sourceLicense = entry.sourceLicense;
  const sourceSha256 = entry.sourceSha256;
  const sourceBytes = entry.sourceBytes;
  const sourceDimensions = entry.sourceDimensions;
  const hydratedEntry: NebulaAtlasEntry = {
    ...entry,
    sourcePage,
    sourceImagePath,
    sourceCredit,
    sourceLicense,
    sourceSha256,
    sourceBytes,
    sourceDimensions,
  };
  const risks = deriveRisks(hydratedEntry);
  const candidateOnly = entry.runtimeAdmission === "candidate-only";
  return Object.freeze({
    id: entry.id,
    displayName: entry.displayName,
    catalogName: entry.catalogName,
    sourceTarget: entry.sourceTarget,
    sourcePage,
    sourceImagePath,
    sourceCredit,
    sourceLicense,
    sourceSha256,
    sourceBytes,
    sourceDimensions,
    tier: entry.tier,
    runtimeAdmission: entry.runtimeAdmission,
    state: stateFor(entry, risks),
    risks,
    candidateOnly,
    scienceAuthority: false,
  });
}

/** Build immutable review rows; default scope is the complete 30-card atlas. */
export function nebulaReviewRows(entries: readonly NebulaAtlasEntry[] = MAINLINE_A_NEBULA_ATLAS_ENTRIES): readonly NebulaReviewRow[] {
  return Object.freeze(entries.map(toReviewRow));
}

/** Candidate-only view used by the Beta review queue. */
export function nebulaCandidateReviewRows(): readonly NebulaReviewRow[] {
  return nebulaReviewRows(MAINLINE_A_NEBULA_ATLAS_CANDIDATES);
}

function emptyStateCounts(): Record<NebulaReviewState, number> {
  return REVIEW_STATES.reduce((counts, state) => {
    counts[state] = 0;
    return counts;
  }, {} as Record<NebulaReviewState, number>);
}

export function nebulaReviewSummary(rows: readonly NebulaReviewRow[]): NebulaReviewSummary {
  const byState = emptyStateCounts();
  for (const row of rows) byState[row.state] += 1;
  return Object.freeze({
    total: rows.length,
    byState: Object.freeze(byState),
    withRisks: rows.filter((row) => row.risks.length > 0).length,
    candidateOnly: rows.filter((row) => row.candidateOnly).length,
    rightsReview: byState["rights-review"],
    visualReview: byState["visual-review"],
    admissionReady: byState["admission-ready"],
    runtimeAdmitted: byState["runtime-admitted"],
  });
}

function stateIndex(state: NebulaReviewState): number {
  return REVIEW_SEQUENCE.indexOf(state);
}

function hasBlockingRisk(row: NebulaReviewRow): boolean {
  return row.risks.some((risk) => [
    "source-page-missing",
    "image-path-missing",
    "image-digest-invalid",
    "image-dimensions-invalid",
    "image-bytes-invalid",
    "credit-missing",
    "catalog-coordinate-missing",
  ].includes(risk));
}

/**
 * Check a proposed state transition without changing the row. A candidate
 * can be prepared for admission, but cannot transition to runtime-admitted
 * until a future runtime allowlist change explicitly removes candidate-only.
 */
export function canAdvanceNebulaReview(row: NebulaReviewRow, next: NebulaReviewState): boolean {
  if (next === row.state) return true;
  if (next === "blocked") return hasBlockingRisk(row) || row.risks.includes("rights-unresolved") || row.risks.includes("visual-review-required");
  if (next === "runtime-admitted") return row.runtimeAdmission === "current" && row.risks.length === 0;
  if (row.runtimeAdmission === "candidate-only" && next === "admission-ready") return row.risks.length === 0;
  const currentIndex = stateIndex(row.state);
  const nextIndex = stateIndex(next);
  if (currentIndex < 0 || nextIndex < 0 || nextIndex !== currentIndex + 1) return false;
  if (next === "visual-review") {
    return row.sourceLicense?.toLocaleLowerCase().includes("cc by") === true
      && !row.risks.includes("rights-unresolved");
  }
  return !hasBlockingRisk(row) && !row.risks.includes("rights-unresolved");
}

/** Apply a permitted review transition while preserving immutable provenance. */
export function transitionNebulaReview(row: NebulaReviewRow, next: NebulaReviewState): NebulaReviewRow {
  if (!canAdvanceNebulaReview(row, next)) throw new Error(`Nebula review transition rejected: ${row.id} ${row.state} -> ${next}`);
  return Object.freeze({ ...row, state: next });
}

/** Runtime gate is intentionally stricter than review readiness. */
export function canAdmitNebulaReview(row: NebulaReviewRow): boolean {
  return row.state === "admission-ready"
    && row.runtimeAdmission === "candidate-only"
    && row.risks.length === 0
    && !row.candidateOnly
    && row.scienceAuthority === false;
}

export function reviewRiskLabel(risk: NebulaReviewRisk): string {
  const labels: Record<NebulaReviewRisk, string> = {
    "candidate-only": "候选记录",
    "rights-unresolved": "权利未清",
    "credit-missing": "署名缺失",
    "source-page-missing": "来源页缺失",
    "image-path-missing": "本地图像缺失",
    "image-digest-invalid": "SHA-256 无效",
    "image-dimensions-invalid": "图像尺寸不足",
    "image-bytes-invalid": "本地字节缺失",
    "scientific-authority-closed": "科学权威关闭",
    "catalog-coordinate-missing": "目录坐标缺失",
    "visual-review-required": "视觉复核必需",
    "runtime-allowlist-closed": "运行时白名单关闭",
  };
  return labels[risk];
}

export type NebulaReviewFilter = {
  state?: NebulaReviewState;
  risk?: NebulaReviewRisk;
  query?: string;
};

/** Filter a review queue without changing row identity or ordering. */
export function filterNebulaReviewRows(
  rows: readonly NebulaReviewRow[],
  filter: NebulaReviewFilter = {},
): NebulaReviewRow[] {
  const needle = filter.query?.trim().toLocaleLowerCase() ?? "";
  return rows.filter((row) => {
    if (filter.state && row.state !== filter.state) return false;
    if (filter.risk && !row.risks.includes(filter.risk)) return false;
    if (!needle) return true;
    return [row.id, row.displayName, row.catalogName, row.sourceTarget ?? "", row.sourceCredit ?? ""]
      .join(" ").toLocaleLowerCase().includes(needle);
  });
}

export function reviewStateIndex(state: NebulaReviewState): number {
  if (state === "blocked") return -1;
  if (state === "runtime-admitted") return REVIEW_SEQUENCE.length;
  return stateIndex(state);
}

export function reviewStateTransitionLabel(from: NebulaReviewState, to: NebulaReviewState): string {
  if (from === to) return "保持当前状态";
  if (to === "blocked") return "记录阻塞原因";
  if (to === "runtime-admitted") return "运行时准入（独立门禁）";
  return `${REVIEW_STATE_LABELS[from]} → ${REVIEW_STATE_LABELS[to]}`;
}

export function nebulaReviewRiskCounts(rows: readonly NebulaReviewRow[]): Readonly<Record<NebulaReviewRisk, number>> {
  const counts = {} as Record<NebulaReviewRisk, number>;
  for (const row of rows) {
    for (const risk of row.risks) counts[risk] = (counts[risk] ?? 0) + 1;
  }
  return Object.freeze(counts);
}

/** Progress is evidence completion only; it never reports runtime admission. */
export function nebulaReviewCompletion(rows: readonly NebulaReviewRow[]): number {
  if (rows.length === 0) return 0;
  const complete = rows.filter((row) => row.state === "admission-ready" || row.state === "runtime-admitted").length;
  return Math.round((complete / rows.length) * 100);
}

export function isNebulaReviewTerminal(state: NebulaReviewState): boolean {
  return state === "blocked" || state === "admission-ready" || state === "runtime-admitted";
}
