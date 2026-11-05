export type R74AlternativeStateV661 =
  | "page-captured-rights-hold"
  | "identity-conflict-hold"
  | "page-captured-inspection-hold"
  | "request-failed-hold";

export type R74IdentityStateV661 =
  | "page-identity-confirmed"
  | "identity-conflict"
  | "identity-unverified"
  | "request-failed";

export interface R74ArtifactPinV661 {
  path: string;
  bytes: number;
  sha256: string;
}

export interface R74DownloadV661 {
  name: string;
  format: string | null;
  size?: string | null;
  url: string;
}

export interface R74AlternativeV661 {
  sourceKey: string;
  kind: "photojournal" | "hubble-asset";
  sourceUrl: string;
  sourceState: R74AlternativeStateV661;
  responseCaptured: 0 | 1;
  httpStatus: number | null;
  contentType: string | null;
  finalUrl: string | null;
  requestFingerprint: string;
  retryCount: number;
  timeout: boolean;
  errorClass: string | null;
  rawArtifact: R74ArtifactPinV661 | null;
  title: string | null;
  nasaId: string | null;
  target: string | null;
  objectName: string | null;
  credit: string | null;
  partnerMarkers: string[];
  downloads: R74DownloadV661[];
  identityState: R74IdentityStateV661;
  inspectionIssues: string[];
  rightsStatus: "pending";
  imageRequestExecuted: false;
  imageResponseCaptured: 0;
  hold: true;
  notAdmitted: true;
  runtimeAdmission: "candidate-only";
  scientificPayloadWriteback: false;
}

export interface R74TargetV661 {
  id: string;
  alternatives: R74AlternativeV661[];
  preferredSourceKey: string | null;
  pageIdentityCandidate: boolean;
  conflicts: string[];
  imageState: "policy-hold-unrequested";
  imageRequestExecuted: false;
  imageResponseCaptured: 0;
  rightsStatus: "pending";
  rightsSigned: false;
  visualSignoff: false;
  runtimeAdmission: "candidate-only";
  hold: true;
  notAdmitted: true;
  scientificPayloadWriteback: false;
}

export interface R74OverlayV661 {
  schema: "mainline-a-r74-alternative-overlay-v661";
  evidenceClass: "offline-replayed-official-page-candidate";
  generatedAt: string;
  ledger: R74ArtifactPinV661;
  counts: {
    heldTargets: number;
    officialPagesAttempted: number;
    officialPagesCaptured: number;
    pageIdentityCandidates: number;
    conflictingPages: number;
    imageRequestsExecuted: 0;
    imageResponsesCaptured: 0;
    rightsSigned: 0;
    runtimeAdmitted: 0;
  };
  rows: R74TargetV661[];
  boundary: {
    candidateOnly: true;
    hold: true;
    notAdmitted: true;
    rightsSigned: false;
    runtimeAdmitted: false;
    scientificPayloadWriteback: false;
    publicWebReleaseApproved: false;
  };
}

export type R74FilterV661 = "all" | "identity-conflict" | "page-candidate";

const TARGET_IDS = ["ring-nebula", "dumbbell-nebula", "bubble-nebula",
  "cats-eye-nebula", "omega-nebula"] as const;

const SOURCE_KEYS: Record<string, readonly string[]> = {
  "ring-nebula": ["ring-photojournal"],
  "dumbbell-nebula": ["dumbbell-spitzer", "dumbbell-hubble"],
  "bubble-nebula": ["bubble-hubble"],
  "cats-eye-nebula": ["cats-eye-photojournal"],
  "omega-nebula": ["omega-photojournal"],
};

const SHA = /^[a-f0-9]{64}$/;

function isOfficialPage(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:"
      && parsed.hostname === "science.nasa.gov"
      && parsed.username === "" && parsed.password === ""
      && parsed.hash === "";
  } catch {
    return false;
  }
}

function isPinnedArtifact(pin: R74ArtifactPinV661 | null): boolean {
  return Boolean(pin && pin.path.startsWith("docs/release/v607/nebula-r74-v661/raw/")
    && pin.path.endsWith(`${pin.sha256}.html`)
    && Number.isInteger(pin.bytes) && pin.bytes >= 10_000
    && SHA.test(pin.sha256));
}

function sourceIssues(row: R74TargetV661,
  source: R74AlternativeV661): string[] {
  const issues: string[] = [];
  if (!SOURCE_KEYS[row.id]?.includes(source.sourceKey)
    || !isOfficialPage(source.sourceUrl)
    || source.finalUrl !== source.sourceUrl && source.responseCaptured === 1
    || !SHA.test(source.requestFingerprint)
    || source.retryCount !== 0
    || source.rightsStatus !== "pending"
    || source.runtimeAdmission !== "candidate-only"
    || source.imageRequestExecuted !== false
    || source.imageResponseCaptured !== 0
    || source.hold !== true || source.notAdmitted !== true
    || source.scientificPayloadWriteback !== false) {
    issues.push("source-contract-invalid");
  }
  if (source.responseCaptured === 1) {
    if (source.httpStatus !== 200
      || !source.contentType?.toLowerCase().startsWith("text/html")
      || source.errorClass !== null || source.timeout !== false
      || !isPinnedArtifact(source.rawArtifact)
      || !source.title || !source.credit
      || source.downloads.length === 0) issues.push("captured-page-invalid");
  } else if (source.responseCaptured === 0) {
    if (source.rawArtifact !== null || source.errorClass === null
      || source.identityState !== "request-failed"
      || source.downloads.length !== 0) issues.push("failed-page-fabrication");
  } else issues.push("response-captured-invalid");
  if (source.sourceState === "identity-conflict-hold"
    && (source.identityState !== "identity-conflict"
      || !source.inspectionIssues.includes("target-identity-conflict"))) {
    issues.push("identity-conflict-erased");
  }
  if (source.identityState === "page-identity-confirmed"
    && source.inspectionIssues.length > 0) {
    issues.push("page-identity-issues-disagree");
  }
  for (const download of source.downloads) {
    try {
      const url = new URL(download.url);
      if (url.protocol !== "https:" || url.hostname !== "assets.science.nasa.gov") {
        issues.push("download-link-not-official");
      }
    } catch { issues.push("download-link-invalid"); }
  }
  return issues;
}

export function inspectR74OverlayV661(overlay: R74OverlayV661): {
  ok: boolean; issues: string[];
} {
  const issues: string[] = [];
  if (overlay?.schema !== "mainline-a-r74-alternative-overlay-v661"
    || overlay?.evidenceClass !== "offline-replayed-official-page-candidate"
    || !SHA.test(overlay?.ledger?.sha256 ?? "")
    || !Number.isInteger(overlay?.ledger?.bytes)
    || overlay?.counts?.heldTargets !== 5
    || overlay?.counts?.officialPagesAttempted !== 6
    || overlay?.counts?.officialPagesCaptured !== 6
    || overlay?.counts?.pageIdentityCandidates !== 5
    || overlay?.counts?.conflictingPages !== 1
    || overlay?.counts?.imageRequestsExecuted !== 0
    || overlay?.counts?.imageResponsesCaptured !== 0
    || overlay?.counts?.rightsSigned !== 0
    || overlay?.counts?.runtimeAdmitted !== 0
    || overlay?.boundary?.candidateOnly !== true
    || overlay?.boundary?.hold !== true
    || overlay?.boundary?.notAdmitted !== true
    || overlay?.boundary?.rightsSigned !== false
    || overlay?.boundary?.runtimeAdmitted !== false
    || overlay?.boundary?.scientificPayloadWriteback !== false
    || overlay?.boundary?.publicWebReleaseApproved !== false) {
    issues.push("overlay-counts-or-boundary-invalid");
  }
  if (!Array.isArray(overlay?.rows)
    || overlay.rows.length !== TARGET_IDS.length
    || overlay.rows.some((row, index) => row?.id !== TARGET_IDS[index])) {
    issues.push("five-held-targets-invalid");
  }
  for (const row of overlay?.rows ?? []) {
    if (!Array.isArray(row?.alternatives)
      || row.alternatives.length !== SOURCE_KEYS[row.id]?.length
      || row.alternatives.some((source, index) =>
        source.sourceKey !== SOURCE_KEYS[row.id]?.[index])
      || row.imageState !== "policy-hold-unrequested"
      || row.imageRequestExecuted !== false
      || row.imageResponseCaptured !== 0
      || row.rightsStatus !== "pending" || row.rightsSigned !== false
      || row.visualSignoff !== false
      || row.runtimeAdmission !== "candidate-only"
      || row.hold !== true || row.notAdmitted !== true
      || row.scientificPayloadWriteback !== false) {
      issues.push(`${row?.id}:target-contract-invalid`);
    }
    for (const source of row?.alternatives ?? []) {
      issues.push(...sourceIssues(row, source).map((issue) =>
        `${row.id}/${source.sourceKey}:${issue}`));
    }
    const preferred = row?.alternatives?.find((source) =>
      source.sourceKey === row.preferredSourceKey) ?? null;
    if (!preferred || preferred.identityState !== "page-identity-confirmed"
      || !row.pageIdentityCandidate) issues.push(`${row?.id}:preferred-source-invalid`);
    const conflicts = row?.alternatives?.filter((source) =>
      source.identityState === "identity-conflict")
      .map((source) => source.sourceKey) ?? [];
    if (JSON.stringify(row.conflicts) !== JSON.stringify(conflicts)) {
      issues.push(`${row?.id}:conflict-list-invalid`);
    }
  }
  const dumbbell = overlay?.rows?.find((row) => row.id === "dumbbell-nebula");
  if (!dumbbell?.conflicts.includes("dumbbell-spitzer")
    || dumbbell.alternatives[0]?.target !== "Helix Nebula"
    || dumbbell.alternatives[0]?.identityState !== "identity-conflict"
    || dumbbell.alternatives[0]?.sourceState !== "identity-conflict-hold") {
    issues.push("known-dumbbell-target-conflict-missing");
  }
  return { ok: issues.length === 0, issues };
}

export function visibleR74TargetsV661(rows: readonly R74TargetV661[],
  filter: R74FilterV661, query: string): R74TargetV661[] {
  const needle = query.trim().toLocaleLowerCase();
  return rows.filter((row) => {
    if (filter === "identity-conflict" && row.conflicts.length === 0) return false;
    if (filter === "page-candidate" && !row.pageIdentityCandidate) return false;
    if (!needle) return true;
    const haystack = [row.id, ...row.alternatives.flatMap((source) =>
      [source.sourceKey, source.title ?? "", source.nasaId ?? "",
        source.target ?? "", source.objectName ?? "", source.credit ?? ""])]
      .join(" ").toLocaleLowerCase();
    return haystack.includes(needle);
  });
}

export function r74TargetLabelV661(id: string): string {
  const labels: Record<string, string> = {
    "ring-nebula": "Ring / 环状星云",
    "dumbbell-nebula": "Dumbbell / 哑铃星云",
    "bubble-nebula": "Bubble / 气泡星云",
    "cats-eye-nebula": "Cat’s Eye / 猫眼星云",
    "omega-nebula": "Omega / 欧米伽星云",
  };
  return labels[id] ?? id;
}

export function r74SourceStatusLabelV661(source: R74AlternativeV661): string {
  if (source.identityState === "identity-conflict") return "对象字段冲突 · 禁止晋级";
  if (source.identityState === "page-identity-confirmed") {
    return "页面身份候选 · 权利待审";
  }
  if (source.responseCaptured === 0) return "页面请求失败 · 响应未捕获";
  return "页面已存 · 身份或格式待复核";
}

export function r74NextActionV661(row: R74TargetV661): string {
  if (row.conflicts.length > 0) {
    return "先排除冲突页面，仅以另一个逐图页面继续身份与权利核对";
  }
  if (!row.pageIdentityCandidate) return "补齐可核对的逐图页面与原图规格";
  return "逐项核对合作方权利和图像适用性；原图请求仍未执行";
}
