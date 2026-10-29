import generated from "../data/mainlineAWebReadinessV663.generated.json";

export type ReadinessGroupV663 = "stellar-component" | "nebula-image";
export type ReadinessStateV663 = "component-review-hold"
  | "image-acquisition-policy-hold";
export type ReadinessGateKeyV663 = "stellar-component"
  | "nebula-image" | "a-rights" | "beta-rights"
  | "human-visual" | "production-performance";

export interface ReadinessPinV663 {
  path: string;
  bytes: number;
  sha256: string;
  role?: string;
}
export interface ReadinessStarV663 {
  id: string;
  wdsSystemId: string;
  heroIdentifier: string;
  primaryCrossId: string;
  crossIdMatched: true;
  rawCsv: ReadinessPinV663;
  pairCount: number;
  pairArtifact: ReadinessPinV663;
  reviewQuestion: string;
  warningCodes: string[];
  physicalComponentConfirmed: false;
  state: "component-review-hold";
  runtimeAdmission: "candidate-only";
  hold: true;
  notAdmitted: true;
  scientificPayloadWriteback: false;
}
export interface ReadinessNebulaV663 {
  id: string;
  sourceKey: string;
  officialPageUrl: string;
  officialPageRaw: ReadinessPinV663;
  title: string;
  credit: string;
  partnerMarkers: string[];
  pageIdentity: "page-identity-confirmed";
  conflictingSources: Array<{ sourceKey: string;
    pageUrl: string; issueCodes: string[] }>;
  imageRequestIntent: { url: string; listedFormat: string | null;
    listedDimensions: string | null; requestExecuted: false;
    responseCaptured: 0; rawArtifact: null };
  oldItemPolicyBlockers: string[];
  imageAcquisitionAllowed: false;
  imageRequestExecuted: false;
  imageResponseCaptured: 0;
  rightsSigned: false;
  visualSignoff: false;
  state: "image-acquisition-policy-hold";
  runtimeAdmission: "candidate-only";
  hold: true;
  notAdmitted: true;
  scientificPayloadWriteback: false;
}
export interface ReadinessSnapshotV663 {
  schema: string;
  fingerprint: string;
  evidenceClass: string;
  sourcePins: ReadinessPinV663[];
  stars: ReadinessStarV663[];
  nebulae: ReadinessNebulaV663[];
  gates: {
    aLineRuntimeObjects: number;
    betaStarEntries: number;
    betaConstellationEntries: number;
    betaNebulaEntries: number;
    identityReviewsPending: number;
    blockedImageAcquisitions: number;
    rawImagesCapturedForBlockedTargets: number;
    aNebulaRightsSigned: number;
    betaNebulaRightsSigned: number;
    humanVisualSignoffs: number;
    localLongRuns: number;
    physicalMobileRuns: number;
    publicWebReleaseAllowed: false;
  };
  boundary: { candidateOnly: true; hold: true;
    notAdmitted: true; scientificPayloadWriteback: false;
    runtimeWrites: false; measurementWrites: false;
    publicWebReleaseApproved: false };
  claims: { copyrightApproval: false;
    scientificValidity: false; productionPerformance: false;
    realUserValidation: false; physicalMobile: false;
    publicWebReleaseApproved: false };
}
export interface ReadinessGateV663 {
  key: ReadinessGateKeyV663;
  label: string;
  value: string;
  reason: string;
  status: "pending";
}
export interface ReadinessItemV663 {
  key: string;
  id: string;
  group: ReadinessGroupV663;
  state: ReadinessStateV663;
  title: string;
  subtitle: string;
  sourceUrl: string;
  rawEvidenceCount: number;
  reviewQuestion: string;
  issueCodes: string[];
  requestExecuted: false;
  responseCaptured: 0 | 1;
  rightsSigned: false;
  runtimeAdmission: "candidate-only";
}
export interface ReadinessViewV663 {
  status: "valid-candidate-hold" | "invalid-all-held";
  issues: string[];
  fingerprint: string | null;
  gates: ReadinessGateV663[];
  rows: ReadinessItemV663[];
  publicWebReleaseAllowed: false;
  scientificPayloadWriteback: false;
}

const STAR_IDS = ["acrux", "spica", "regulus", "polaris"];
const NEBULA_IDS = ["ring-nebula", "dumbbell-nebula",
  "bubble-nebula", "cats-eye-nebula", "omega-nebula"];
const SHA = /^[a-f0-9]{64}$/;
function urlHost(value: unknown, host: string): boolean {
  try {
    if (typeof value !== "string") return false;
    const parsed = new URL(value);
    return parsed.protocol === "https:" && parsed.hostname === host
      && !parsed.username && !parsed.password && !parsed.hash;
  } catch { return false; }
}
function sameIds(actual: string[], expected: string[]): boolean {
  return JSON.stringify(actual) === JSON.stringify(expected);
}
function baseGates(): ReadinessGateV663[] {
  return [
    { key: "stellar-component", label: "恒星组件身份",
      value: "0/4 已确认", reason: "交叉标识不是物理组件裁决", status: "pending" },
    { key: "nebula-image", label: "五张原图",
      value: "0/5 可获取", reason: "逐项策略仍禁止图像请求", status: "pending" },
    { key: "a-rights", label: "A 线星云版权",
      value: "0/12 已签", reason: "逐图签署待完成", status: "pending" },
    { key: "beta-rights", label: "Beta 星云版权",
      value: "0/24 已签", reason: "逐图签署待完成", status: "pending" },
    { key: "human-visual", label: "视觉签收",
      value: "待逐项签收", reason: "截图抽样不代替人工验收", status: "pending" },
    { key: "production-performance", label: "线上性能",
      value: "未验证", reason: "本机长跑不能代表真实用户", status: "pending" },
  ];
}
export function inspectReadinessV663(input: unknown): string[] {
  const issues: string[] = [];
  if (!input || typeof input !== "object") return ["snapshot-missing"];
  const value = input as ReadinessSnapshotV663;
  if (value.schema !== "mainline-a-r76-web-readiness-v663"
    || value.evidenceClass !== "offline-replayed-current-web-release-gates"
    || !SHA.test(value.fingerprint ?? "")
    || value.boundary?.candidateOnly !== true
    || value.boundary.hold !== true
    || value.boundary.notAdmitted !== true
    || value.boundary.scientificPayloadWriteback !== false
    || value.boundary.runtimeWrites !== false
    || value.boundary.measurementWrites !== false
    || value.boundary.publicWebReleaseApproved !== false
    || value.claims?.publicWebReleaseApproved !== false
    || value.claims.copyrightApproval !== false
    || value.claims.scientificValidity !== false
    || value.claims.productionPerformance !== false) {
    issues.push("candidate-boundary-invalid");
  }
  const gates = value.gates;
  if (!gates || gates.aLineRuntimeObjects !== 36
    || gates.betaStarEntries !== 24
    || gates.betaConstellationEntries !== 12
    || gates.betaNebulaEntries !== 24
    || gates.identityReviewsPending !== 4
    || gates.blockedImageAcquisitions !== 5
    || gates.rawImagesCapturedForBlockedTargets !== 0
    || gates.aNebulaRightsSigned !== 0
    || gates.betaNebulaRightsSigned !== 0
    || gates.humanVisualSignoffs !== 0
    || gates.localLongRuns !== 2
    || gates.physicalMobileRuns !== 0
    || gates.publicWebReleaseAllowed !== false) {
    issues.push("gate-count-or-promotion-invalid");
  }
  if (!Array.isArray(value.stars)
    || !sameIds(value.stars.map((row) => row.id), STAR_IDS)) {
    issues.push("star-set-invalid");
  }
  for (const row of value.stars ?? []) {
    if (!row.primaryCrossId?.startsWith("WDS J")
      || row.crossIdMatched !== true
      || !Number.isInteger(row.pairCount) || row.pairCount <= 0
      || row.reviewQuestion?.length < 30
      || row.physicalComponentConfirmed !== false
      || row.state !== "component-review-hold"
      || row.runtimeAdmission !== "candidate-only"
      || row.hold !== true || row.notAdmitted !== true
      || row.scientificPayloadWriteback !== false) {
      issues.push(`star-invalid:${row.id}`);
    }
  }
  if (!Array.isArray(value.nebulae)
    || !sameIds(value.nebulae.map((row) => row.id), NEBULA_IDS)) {
    issues.push("nebula-set-invalid");
  }
  for (const row of value.nebulae ?? []) {
    if (!urlHost(row.officialPageUrl, "science.nasa.gov")
      || !urlHost(row.imageRequestIntent?.url,
        "assets.science.nasa.gov")
      || row.pageIdentity !== "page-identity-confirmed"
      || !row.oldItemPolicyBlockers?.length
      || row.imageAcquisitionAllowed !== false
      || row.imageRequestExecuted !== false
      || row.imageResponseCaptured !== 0
      || row.imageRequestIntent?.requestExecuted !== false
      || row.imageRequestIntent.responseCaptured !== 0
      || row.imageRequestIntent.rawArtifact !== null
      || row.rightsSigned !== false
      || row.visualSignoff !== false
      || row.state !== "image-acquisition-policy-hold"
      || row.runtimeAdmission !== "candidate-only"
      || row.hold !== true || row.notAdmitted !== true
      || row.scientificPayloadWriteback !== false) {
      issues.push(`nebula-invalid:${row.id}`);
    }
  }
  const dumbbell = value.nebulae?.find((row) =>
    row.id === "dumbbell-nebula");
  if (!dumbbell?.conflictingSources?.some((row) =>
    row.sourceKey === "dumbbell-spitzer"
    && row.issueCodes.includes("target-identity-conflict"))) {
    issues.push("dumbbell-conflict-erased");
  }
  if (!Array.isArray(value.sourcePins)
    || value.sourcePins.length !== 20
    || new Set(value.sourcePins.map((pin) => pin.path)).size !== 20) {
    issues.push("source-pin-coverage-invalid");
  }
  return issues;
}
export function evaluateReadinessV663(input: unknown): ReadinessViewV663 {
  const issues = inspectReadinessV663(input);
  const gates = baseGates();
  if (issues.length) return { status: "invalid-all-held", issues,
    fingerprint: null, gates, rows: [],
    publicWebReleaseAllowed: false,
    scientificPayloadWriteback: false };
  const value = input as ReadinessSnapshotV663;
  const stars: ReadinessItemV663[] = value.stars.map((row) => ({
    key: `star:${row.id}`, id: row.id, group: "stellar-component",
    state: row.state, title: row.id[0].toUpperCase() + row.id.slice(1),
    subtitle: `${row.primaryCrossId} · ${row.pairCount} 条成对记录`,
    sourceUrl: "https://simbad.cds.unistra.fr/simbad/",
    rawEvidenceCount: 2, reviewQuestion: row.reviewQuestion,
    issueCodes: row.warningCodes,
    requestExecuted: false, responseCaptured: 1,
    rightsSigned: false, runtimeAdmission: "candidate-only",
  }));
  const nebulae: ReadinessItemV663[] = value.nebulae.map((row) => ({
    key: `nebula:${row.id}`, id: row.id, group: "nebula-image",
    state: row.state, title: row.title,
    subtitle: `${row.sourceKey} · 官方页面已保存`,
    sourceUrl: row.officialPageUrl,
    rawEvidenceCount: 1, reviewQuestion: "版权和适用性审核完成前，不请求或展示该原图。",
    issueCodes: [...row.oldItemPolicyBlockers,
      ...row.conflictingSources.flatMap((item) => item.issueCodes)],
    requestExecuted: false, responseCaptured: 0,
    rightsSigned: false, runtimeAdmission: "candidate-only",
  }));
  return { status: "valid-candidate-hold", issues: [],
    fingerprint: value.fingerprint, gates,
    rows: [...stars, ...nebulae],
    publicWebReleaseAllowed: false,
    scientificPayloadWriteback: false };
}
export function filterReadinessV663(rows: ReadinessItemV663[],
  group: ReadinessGroupV663 | "all", query: string): ReadinessItemV663[] {
  const normalized = query.trim().toLocaleLowerCase();
  return rows.filter((row) => (group === "all" || row.group === group)
    && (!normalized || [row.title, row.id, row.subtitle,
      row.sourceUrl, ...row.issueCodes]
      .some((part) => part.toLocaleLowerCase().includes(normalized))));
}
export function currentReadinessV663(): ReadinessViewV663 {
  return evaluateReadinessV663(generated);
}
