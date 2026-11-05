export type WebAcceptanceGroupV662 = "a-star" | "a-constellation" | "a-nebula"
  | "beta-star" | "beta-constellation" | "beta-nebula";
export type WebAcceptanceStateV662 = "reviewable" | "source-hold"
  | "identity-hold" | "signoff-hold";

export type WebAcceptanceRowV662 = Readonly<{
  key: string;
  id: string;
  title: string;
  group: WebAcceptanceGroupV662;
  state: WebAcceptanceStateV662;
  route: string | null;
  sourceUrl: string;
  sourceSha256: string | null;
  imageRoute: string | null;
  imageSha256: string | null;
  rights: "pending";
  componentIdentity: "pending" | "not-applicable";
  notes: readonly string[];
  alternatives: readonly WebAcceptanceAlternativeV662[];
  candidateOnly: true;
  hold: true;
  notAdmitted: true;
  scientificPayloadWriteback: false;
}>;

export type WebAcceptanceAlternativeV662 = Readonly<{
  key: string;
  url: string;
  pageIdentity: "confirmed" | "conflict" | "unknown";
  pageSha256: string | null;
  imageRequested: false;
}>;

export type WebAcceptanceMatrixV662 = Readonly<{
  status: "valid" | "invalid";
  issues: readonly string[];
  rows: readonly WebAcceptanceRowV662[];
  counts: Readonly<{
    aStars: number;
    aConstellations: number;
    aNebulae: number;
    betaStars: number;
    betaConstellations: number;
    betaNebulae: number;
    existingStars: number;
    identityHolds: number;
    reviewImages: number;
    imageHolds: number;
    rightsSigned: 0;
    runtimeAdmitted: 0;
  }>;
  boundary: Readonly<{
    candidateOnly: true;
    hold: true;
    notAdmitted: true;
    scientificPayloadWriteback: false;
    publicWebReleaseApproved: false;
  }>;
}>;

type Bag = Record<string, unknown>;
const SHA = /^[a-f0-9]{64}$/;
const EXPECTED_HOLDS = new Set(["acrux", "spica", "regulus", "polaris"]);
const GROUPS: readonly WebAcceptanceGroupV662[] = ["a-star", "a-constellation",
  "a-nebula", "beta-star", "beta-constellation", "beta-nebula"];
const BOUNDARY = Object.freeze({ candidateOnly: true, hold: true,
  notAdmitted: true, scientificPayloadWriteback: false,
  publicWebReleaseApproved: false } as const);

function bag(value: unknown): Bag | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Bag : null;
}
function array(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}
function string(value: unknown): string {
  return typeof value === "string" ? value : "";
}
function sha(value: unknown): string | null {
  const normalized = string(value).toLowerCase();
  return SHA.test(normalized) ? normalized : null;
}
function https(value: unknown): string {
  const source = string(value);
  try {
    const url = new URL(source);
    return url.protocol === "https:" && !url.username && !url.password
      ? source : "";
  } catch { return ""; }
}
function boundary(row: Bag | null, inheritedCandidate = false): boolean {
  if (!row) return false;
  return (row.candidateOnly === true
      || (inheritedCandidate && row.candidateOnly === undefined))
    && row.scientificPayloadWriteback === false
    && (row.notAdmitted === true || row.measurementAdmission === "not-admitted")
    && (row.runtimeAdmission === undefined || row.runtimeAdmission === "candidate-only");
}
function emptyCounts() {
  return { aStars: 0, aConstellations: 0, aNebulae: 0,
    betaStars: 0, betaConstellations: 0, betaNebulae: 0,
    existingStars: 0, identityHolds: 0, reviewImages: 0,
    imageHolds: 0, rightsSigned: 0 as const, runtimeAdmitted: 0 as const };
}
function rowBase(key: string, id: string, title: string,
  group: WebAcceptanceGroupV662): Pick<WebAcceptanceRowV662,
  "key" | "id" | "title" | "group" | "rights" | "componentIdentity"
  | "alternatives" | "candidateOnly" | "hold" | "notAdmitted"
  | "scientificPayloadWriteback"> {
  return { key, id, title, group, rights: "pending",
    componentIdentity: "not-applicable", alternatives: [],
    candidateOnly: true, hold: true, notAdmitted: true,
    scientificPayloadWriteback: false };
}
function issue(issues: string[], code: string, id?: string) {
  issues.push(id ? `${code}:${id}` : code);
}
function assertBoundary(issues: string[], value: unknown, code: string) {
  const row = bag(value);
  if (!row || row.candidateOnly !== true || row.hold !== true
    || row.notAdmitted !== true || row.scientificPayloadWriteback !== false
    || (row.runtimeAdmitted !== undefined && row.runtimeAdmitted !== 0
      && row.runtimeAdmitted !== false)
    || (row.rightsSigned !== undefined && row.rightsSigned !== 0
      && row.rightsSigned !== false)) {
    issue(issues, code);
  }
}
function itemBoundary(issues: string[], value: Bag | null, id: string,
  inheritedCandidate = false) {
  if (!boundary(value, inheritedCandidate)) issue(issues, "item-boundary", id);
}
function sourceUrl(issues: string[], value: unknown, id: string) {
  const url = https(value);
  if (!url) issue(issues, "source-url", id);
  return url;
}
function sourceHash(issues: string[], value: unknown, id: string,
  required = true): string | null {
  const digest = sha(value);
  if (required && !digest) issue(issues, "source-sha", id);
  return digest;
}

export function assembleMainlineAWebAcceptanceV662(
  canonicalInput: unknown, skyInput: unknown,
  nebulaInput: unknown, alternativesInput: unknown,
): WebAcceptanceMatrixV662 {
  const issues: string[] = [];
  const rows: WebAcceptanceRowV662[] = [];
  const canonical = bag(canonicalInput);
  const sky = bag(skyInput);
  const nebula = bag(nebulaInput);
  const alternatives = bag(alternativesInput);
  for (const [name, pack] of [["canonical", canonical], ["sky", sky],
    ["nebula", nebula], ["alternatives", alternatives]] as const) {
    assertBoundary(issues, pack?.boundary, `${name}-boundary`);
  }
  const canonicalRows = array(canonical?.records);
  const skyStars = array(sky?.stars);
  const skyConstellations = array(sky?.constellations);
  const nebulaRows = array(nebula?.rows);
  const alternativeRows = array(alternatives?.rows);
  if (canonicalRows.length !== 36) issue(issues, "canonical-count");
  if (skyStars.length !== 24 || skyConstellations.length !== 12)
    issue(issues, "sky-count");
  if (nebulaRows.length !== 24 || alternativeRows.length !== 5)
    issue(issues, "nebula-or-alternative-count");
  const canonicalConstellations = new Map<string, Bag>();
  const heldAlternatives = new Map<string, Bag>();
  for (const raw of alternativeRows) {
    const item = bag(raw);
    const id = string(item?.id);
    if (!id || heldAlternatives.has(id)) issue(issues, "alternative-duplicate", id);
    if (item) heldAlternatives.set(id, item);
  }
  for (const raw of canonicalRows) {
    const item = bag(raw);
    const id = string(item?.id);
    const kind = string(item?.kind);
    if (!item || !id || !["star", "constellation", "nebula"].includes(kind)) {
      issue(issues, "canonical-row-shape", id); continue;
    }
    itemBoundary(issues, item, `a:${kind}:${id}`);
    const route = bag(item.route);
    const source = bag(item.source);
    const group = `a-${kind}` as WebAcceptanceGroupV662;
    const sourcePage = sourceUrl(issues, source?.sourceUrl, `a:${kind}:${id}`);
    const assetSha = kind === "nebula"
      ? sourceHash(issues, route?.assetHash, `a:${kind}:${id}:asset`)
      : null;
    if (kind === "nebula" && item.status !== "rights-pending")
      issue(issues, "a-nebula-rights", id);
    if (kind === "constellation") canonicalConstellations.set(id, item);
    rows.push({ ...rowBase(`a:${kind}:${id}`, id,
      string(item.displayName) || id, group),
      state: kind === "star" ? "source-hold" : "signoff-hold",
      route: string(route?.route) || null,
      sourceUrl: sourcePage,
      sourceSha256: sourceHash(issues, item.sourceHash, `a:${kind}:${id}`),
      imageRoute: kind === "nebula" ? string(route?.assetPath) || null : null,
      imageSha256: assetSha,
      notes: array(item.pendingReasons).map(string).filter(Boolean) });
  }
  for (const raw of skyStars) {
    const item = bag(raw);
    const id = string(item?.id);
    if (!item || !id) { issue(issues, "star-row-shape"); continue; }
    itemBoundary(issues, item, `beta:star:${id}`);
    const held = item.phase === "candidate-hold";
    if (held !== EXPECTED_HOLDS.has(id)
      || item.canFocusScene !== !held
      || (!held && item.phase !== "runtime-existing")) {
      issue(issues, "star-component-hold", id);
    }
    rows.push({ ...rowBase(`beta:star:${id}`, id,
      string(item.displayName) || id, "beta-star"),
      state: held ? "identity-hold" : "reviewable",
      route: held ? null : string(item.focusCatalogId) || null,
      sourceUrl: sourceUrl(issues, item.sourcePageUrl, `beta:star:${id}`),
      sourceSha256: sourceHash(issues, item.sourceSnapshotSha256,
        `beta:star:${id}`),
      imageRoute: null, imageSha256: null,
      componentIdentity: held ? "pending" : "not-applicable",
      notes: held ? [string(item.componentReason) || "component-review-pending"]
        : ["existing-runtime-reference"] });
  }
  for (const raw of skyConstellations) {
    const item = bag(raw);
    const id = string(item?.code);
    if (!item || !id) { issue(issues, "sky-constellation-shape"); continue; }
    itemBoundary(issues, item, `beta:constellation:${id}`);
    const canonicalItem = canonicalConstellations.get(id);
    if (!canonicalItem || item.coverageRowHash !== canonicalItem.rowHash
      || item.reviewState !== "signoff-pending"
      || item.routeCatalogId !== `constellation:${id}`) {
      issue(issues, "constellation-cross-reference", id);
    }
    rows.push({ ...rowBase(`beta:constellation:${id}`, id,
      string(item.displayName) || id, "beta-constellation"),
      state: "signoff-hold", route: string(item.routeCatalogId) || null,
      sourceUrl: sourceUrl(issues, item.sourcePageUrl,
        `beta:constellation:${id}`),
      sourceSha256: sourceHash(issues, item.sourceHash,
        `beta:constellation:${id}`),
      imageRoute: null, imageSha256: null,
      notes: ["canonical-figure-signoff-pending"] });
  }
  for (const raw of nebulaRows) {
    const item = bag(raw);
    const id = string(item?.id);
    if (!item || !id) { issue(issues, "beta-nebula-shape"); continue; }
    itemBoundary(issues, item, `beta:nebula:${id}`, true);
    const delivery = bag(item.delivery);
    const held = item.imageState === "policy-hold";
    if (held !== (delivery === null) || item.rightsStatus !== "pending"
      || item.runtimeAdmission !== "candidate-only") {
      issue(issues, "nebula-admission-or-image", id);
    }
    const alternative = heldAlternatives.get(id);
    if (held && !alternative) issue(issues, "held-alternative-missing", id);
    if (!held && alternative) issue(issues, "reviewable-has-held-alternative", id);
    const sourceAlternatives = array(alternative?.alternatives).map((rawAlternative) => {
      const entry = bag(rawAlternative);
      const pageIdentity: WebAcceptanceAlternativeV662["pageIdentity"] =
        entry?.identityState === "identity-conflict"
        ? "conflict" : entry?.identityState === "page-identity-confirmed"
          ? "confirmed" : "unknown";
      if (entry?.imageRequestExecuted !== false
        || entry?.imageResponseCaptured !== 0
        || entry?.responseCaptured !== 1)
        issue(issues, "alternative-request-boundary", id);
      return { key: string(entry?.sourceKey),
        url: sourceUrl(issues, entry?.sourceUrl, `alternative:${id}`),
        pageIdentity, pageSha256: sha(bag(entry?.rawArtifact)?.sha256),
        imageRequested: false as const };
    });
    rows.push({ ...rowBase(`beta:nebula:${id}`, id,
      string(item.title) || id, "beta-nebula"),
      state: held ? "source-hold" : "reviewable", route: null,
      sourceUrl: sourceUrl(issues, item.sourcePageUrl, `beta:nebula:${id}`),
      sourceSha256: sourceHash(issues, item.sourcePageSha256,
        `beta:nebula:${id}`),
      imageRoute: held ? null : string(delivery?.route) || null,
      imageSha256: held ? null : sourceHash(issues, delivery?.sha256,
        `beta:nebula:${id}:image`),
      alternatives: sourceAlternatives,
      notes: array(item.blockers).map(string).filter(Boolean) });
  }
  const keys = new Set<string>();
  for (const row of rows) {
    if (keys.has(row.key)) issue(issues, "duplicate-key", row.key);
    keys.add(row.key);
    if (!row.sourceUrl || !row.sourceSha256) issue(issues, "source-incomplete", row.key);
    if (!GROUPS.includes(row.group)) issue(issues, "group-invalid", row.key);
  }
  const count = (group: WebAcceptanceGroupV662) =>
    rows.filter((row) => row.group === group).length;
  const counts = { ...emptyCounts(), aStars: count("a-star"),
    aConstellations: count("a-constellation"), aNebulae: count("a-nebula"),
    betaStars: count("beta-star"), betaConstellations: count("beta-constellation"),
    betaNebulae: count("beta-nebula"),
    existingStars: rows.filter((row) => row.group === "beta-star"
      && row.state === "reviewable").length,
    identityHolds: rows.filter((row) => row.state === "identity-hold").length,
    reviewImages: rows.filter((row) => row.group === "beta-nebula"
      && Boolean(row.imageRoute)).length,
    imageHolds: rows.filter((row) => row.group === "beta-nebula"
      && !row.imageRoute).length };
  if (counts.aStars !== 12 || counts.aConstellations !== 12
    || counts.aNebulae !== 12 || counts.betaStars !== 24
    || counts.betaConstellations !== 12 || counts.betaNebulae !== 24
    || counts.existingStars !== 20 || counts.identityHolds !== 4
    || counts.reviewImages !== 19 || counts.imageHolds !== 5) {
    issue(issues, "coverage-counts");
  }
  if (bag(canonical?.counts)?.runtimeCleared !== 0
    || bag(sky?.counts)?.componentConfirmed !== 0
    || bag(nebula?.counts)?.rightsSigned !== 0
    || bag(alternatives?.counts)?.rightsSigned !== 0
    || bag(alternatives?.counts)?.imageResponsesCaptured !== 0) {
    issue(issues, "promotion-or-rights-claim");
  }
  return { status: issues.length ? "invalid" : "valid",
    issues, rows: issues.length ? [] : rows, counts, boundary: BOUNDARY };
}

export function filterMainlineAWebAcceptanceV662(
  rows: readonly WebAcceptanceRowV662[],
  group: WebAcceptanceGroupV662 | "all",
  state: WebAcceptanceStateV662 | "all", query: string,
): WebAcceptanceRowV662[] {
  const needle = query.normalize("NFKC").trim().toLocaleLowerCase();
  return rows.filter((row) => (group === "all" || row.group === group)
    && (state === "all" || row.state === state)
    && (!needle || [row.id, row.title, row.route ?? "", row.sourceUrl,
      ...row.notes].some((value) => value.normalize("NFKC")
      .toLocaleLowerCase().includes(needle))));
}

export function mainlineAWebAcceptanceHttpRoutesV662(
  matrix: WebAcceptanceMatrixV662,
): { reviewImages: string[]; heldIds: string[] } {
  if (matrix.status !== "valid") return { reviewImages: [], heldIds: [] };
  const beta = matrix.rows.filter((row) => row.group === "beta-nebula");
  return { reviewImages: beta.flatMap((row) => row.imageRoute
    ? [row.imageRoute] : []),
  heldIds: beta.filter((row) => !row.imageRoute).map((row) => row.id) };
}
