import type { WebAcceptanceMatrixV662, WebAcceptanceRowV662,
  WebAcceptanceGroupV662, WebAcceptanceStateV662 } from
  "./mainlineAWebAcceptanceV662";

export type VisualAssetKindV666 = "a-local-image" | "beta-derived-preview"
  | "beta-official-raw" | "unavailable";
export type VisualReviewReasonV666 = "ready-for-local-inspection"
  | "no-image-for-object" | "identity-hold" | "source-hold"
  | "route-rejected" | "digest-missing" | "delivery-mismatch"
  | "boundary-invalid";

export interface VisualDeliveryV666 {
  route: string;
  sha256: string;
  bytes: number;
  width: number;
  height: number;
  mimeType: string;
  variant: string;
  path?: string;
}

export interface VisualReviewPlanV666 {
  key: string;
  id: string;
  title: string;
  group: WebAcceptanceGroupV662;
  reviewState: WebAcceptanceStateV662;
  kind: VisualAssetKindV666;
  reason: VisualReviewReasonV666;
  requestAllowed: boolean;
  route: string | null;
  expectedSha256: string | null;
  expectedMimeType: string | null;
  expectedBytes: number | null;
  expectedWidth: number | null;
  expectedHeight: number | null;
  sourceUrl: string;
  rights: "pending";
  candidateOnly: true;
  hold: true;
  notAdmitted: true;
  scientificPayloadWriteback: false;
}

export type VisualReviewLensV666 = "all" | "a-images"
  | "beta-images" | "source-holds" | "identity-holds";

export interface VisualReviewIndexV666 {
  status: "valid-candidate-hold" | "invalid-all-held";
  issues: string[];
  plans: VisualReviewPlanV666[];
  counts: {
    total: number;
    aImages: number;
    betaImages: number;
    derivedPreviews: number;
    officialRaw: number;
    sourceHolds: number;
    identityHolds: number;
    noLocalImage: number;
    rightsSigned: 0;
    runtimeAdmitted: 0;
  };
  boundary: {
    candidateOnly: true;
    hold: true;
    notAdmitted: true;
    scientificPayloadWriteback: false;
    publicWebReleaseApproved: false;
  };
}

const SHA256 = /^[a-f0-9]{64}$/;
const A_LOCAL = /^public\/textures\/mainline-a\/[a-z0-9][a-z0-9._-]*\.(?:jpg|jpeg|png|webp)$/i;
const BETA_DERIVED = /^\/api\/atlas\/mainline-a-nebula-review\/([a-z0-9-]+)\/detail$/;
const BETA_RAW_R71 = /^\/api\/atlas\/mainline-a-r71-source\/([a-z0-9-]+)\/image$/;
const BETA_RAW_R72 = /^\/api\/atlas\/mainline-a-r72-source\/([a-z0-9-]+)$/;
const MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const BOUNDARY = Object.freeze({ candidateOnly: true, hold: true,
  notAdmitted: true, scientificPayloadWriteback: false,
  publicWebReleaseApproved: false } as const);

function safeSha(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const lowered = value.toLowerCase();
  return SHA256.test(lowered) ? lowered : null;
}

function validSource(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && !parsed.username
      && !parsed.password && !parsed.hash;
  } catch { return false; }
}

function validBoundary(row: WebAcceptanceRowV662): boolean {
  return row.candidateOnly === true && row.hold === true
    && row.notAdmitted === true && row.scientificPayloadWriteback === false
    && row.rights === "pending" && validSource(row.sourceUrl);
}

function unavailable(row: WebAcceptanceRowV662,
  reason: VisualReviewReasonV666): VisualReviewPlanV666 {
  return { key: row.key, id: row.id, title: row.title,
    group: row.group, reviewState: row.state,
    kind: "unavailable", reason, requestAllowed: false,
    route: null, expectedSha256: null, expectedMimeType: null,
    expectedBytes: null, expectedWidth: null, expectedHeight: null,
    sourceUrl: row.sourceUrl, rights: "pending",
    candidateOnly: true, hold: true, notAdmitted: true,
    scientificPayloadWriteback: false };
}

function eligible(row: WebAcceptanceRowV662,
  kind: Exclude<VisualAssetKindV666, "unavailable">,
  route: string, sha: string, delivery: VisualDeliveryV666 | null,
): VisualReviewPlanV666 {
  return { key: row.key, id: row.id, title: row.title,
    group: row.group, reviewState: row.state,
    kind, reason: "ready-for-local-inspection", requestAllowed: true,
    route, expectedSha256: sha,
    expectedMimeType: delivery?.mimeType ?? null,
    expectedBytes: delivery?.bytes ?? null,
    expectedWidth: delivery?.width ?? null,
    expectedHeight: delivery?.height ?? null,
    sourceUrl: row.sourceUrl, rights: "pending",
    candidateOnly: true, hold: true, notAdmitted: true,
    scientificPayloadWriteback: false };
}

function validDelivery(delivery: VisualDeliveryV666 | null,
  row: WebAcceptanceRowV662, sha: string): boolean {
  if (!delivery || delivery.route !== row.imageRoute
    || safeSha(delivery.sha256) !== sha
    || !Number.isSafeInteger(delivery.bytes) || delivery.bytes <= 0
    || !Number.isSafeInteger(delivery.width) || delivery.width <= 0
    || !Number.isSafeInteger(delivery.height) || delivery.height <= 0
    || !MIME.has(delivery.mimeType)) return false;
  return delivery.variant === "derived-preview"
    || delivery.variant === "official-raw";
}

export function visualReviewPlanV666(row: WebAcceptanceRowV662,
  delivery: VisualDeliveryV666 | null = null): VisualReviewPlanV666 {
  if (!validBoundary(row)) return unavailable(row, "boundary-invalid");
  if (row.state === "identity-hold") {
    return unavailable(row, "identity-hold");
  }
  if (row.group === "beta-nebula" && row.state === "source-hold") {
    return unavailable(row, "source-hold");
  }
  if (row.group !== "a-nebula" && row.group !== "beta-nebula") {
    return unavailable(row, "no-image-for-object");
  }
  if (!row.imageRoute) return unavailable(row, "source-hold");
  const digest = safeSha(row.imageSha256);
  if (!digest) return unavailable(row, "digest-missing");
  if (row.group === "a-nebula") {
    if (!A_LOCAL.test(row.imageRoute) || row.imageRoute.includes("..")) {
      return unavailable(row, "route-rejected");
    }
    return eligible(row, "a-local-image",
      "/" + row.imageRoute.slice("public/".length), digest, null);
  }
  const derived = BETA_DERIVED.exec(row.imageRoute);
  const officialRaw = BETA_RAW_R71.exec(row.imageRoute)
    ?? BETA_RAW_R72.exec(row.imageRoute);
  if ((!derived && !officialRaw)
    || (derived?.[1] ?? officialRaw?.[1]) !== row.id) {
    return unavailable(row, "route-rejected");
  }
  if (!validDelivery(delivery, row, digest)) {
    return unavailable(row, "delivery-mismatch");
  }
  if ((derived && delivery!.variant !== "derived-preview")
    || (officialRaw && delivery!.variant !== "official-raw")) {
    return unavailable(row, "delivery-mismatch");
  }
  return eligible(row, officialRaw
    ? "beta-official-raw" : "beta-derived-preview",
  row.imageRoute, digest, delivery);
}

export function visualDeliveryByIdV666(catalog: unknown):
  Map<string, VisualDeliveryV666> {
  const result = new Map<string, VisualDeliveryV666>();
  if (!catalog || typeof catalog !== "object" || !("rows" in catalog)
    || !Array.isArray(catalog.rows)) return result;
  for (const value of catalog.rows) {
    if (!value || typeof value !== "object") continue;
    const row = value as { id?: unknown; delivery?: unknown };
    if (typeof row.id !== "string" || !row.delivery
      || typeof row.delivery !== "object" || result.has(row.id)) continue;
    result.set(row.id, row.delivery as VisualDeliveryV666);
  }
  return result;
}

export function assembleVisualReviewIndexV666(
  matrix: WebAcceptanceMatrixV662,
  catalog: unknown,
): VisualReviewIndexV666 {
  const issues = [...matrix.issues];
  if (matrix.status !== "valid") issues.push("matrix-invalid");
  const delivery = visualDeliveryByIdV666(catalog);
  const plans = matrix.rows.map((row) => visualReviewPlanV666(
    row, delivery.get(row.id) ?? null));
  const routes = new Set<string>();
  for (const plan of plans) {
    if (plan.reason === "boundary-invalid"
      || plan.reason === "route-rejected"
      || plan.reason === "digest-missing"
      || plan.reason === "delivery-mismatch") {
      issues.push(`${plan.reason}:${plan.key}`);
    }
    if (!plan.requestAllowed) continue;
    if (!plan.route || routes.has(plan.route)) {
      issues.push(`duplicate-or-null-route:${plan.key}`);
    } else routes.add(plan.route);
  }
  const count = (kind: VisualAssetKindV666) =>
    plans.filter((plan) => plan.kind === kind).length;
  const counts = { total: plans.length,
    aImages: count("a-local-image"),
    betaImages: count("beta-derived-preview")
      + count("beta-official-raw"),
    derivedPreviews: count("beta-derived-preview"),
    officialRaw: count("beta-official-raw"),
    sourceHolds: plans.filter((plan) =>
      plan.reason === "source-hold" && plan.group === "beta-nebula").length,
    identityHolds: plans.filter((plan) =>
      plan.reason === "identity-hold").length,
    noLocalImage: plans.filter((plan) =>
      plan.reason === "no-image-for-object").length,
    rightsSigned: 0 as const, runtimeAdmitted: 0 as const };
  if (counts.total !== 96 || counts.aImages !== 12
    || counts.betaImages !== 19 || counts.sourceHolds !== 5
    || counts.identityHolds !== 4 || routes.size !== 31) {
    issues.push("visual-review-coverage");
  }
  return { status: issues.length ? "invalid-all-held"
    : "valid-candidate-hold",
  issues, plans: issues.length ? [] : plans, counts, boundary: BOUNDARY };
}

export function visualReviewLensV666(index: VisualReviewIndexV666,
  lens: VisualReviewLensV666): VisualReviewPlanV666[] {
  if (index.status !== "valid-candidate-hold") return [];
  if (lens === "a-images") return index.plans.filter((plan) =>
    plan.kind === "a-local-image");
  if (lens === "beta-images") return index.plans.filter((plan) =>
    plan.kind === "beta-derived-preview"
      || plan.kind === "beta-official-raw");
  if (lens === "source-holds") return index.plans.filter((plan) =>
    plan.group === "beta-nebula" && plan.reason === "source-hold");
  if (lens === "identity-holds") return index.plans.filter((plan) =>
    plan.reason === "identity-hold");
  return [...index.plans];
}

export function visualReviewReasonLabelV666(
  reason: VisualReviewReasonV666): string {
  if (reason === "ready-for-local-inspection") return "可手动检查本机候选图";
  if (reason === "identity-hold") return "物理组件身份待审；无图片请求";
  if (reason === "source-hold") return "原图链缺失或受策略阻断；无图片请求";
  if (reason === "no-image-for-object") return "此对象使用星图或参数化表现；无观测图请求";
  if (reason === "route-rejected") return "本机图片路径不符合允许清单";
  if (reason === "digest-missing") return "缺少可核对的图片 SHA-256";
  if (reason === "delivery-mismatch") return "图片交付记录与验收矩阵不一致";
  return "候选边界异常；已禁用图片请求";
}
