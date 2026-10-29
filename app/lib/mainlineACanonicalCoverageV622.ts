export type CoverageKindV622 = "star" | "nebula" | "constellation";
export type CoverageStatusV622 = "runtime-cleared" | "asset-delivered" | "signoff-pending" | "rights-pending" | "payload-pending" | "evidence-pending";
export type CoverageLifecycleV622 = "runtime-cleared" | "asset-delivered" | "catalog-mapped";

export type CoverageRouteV622 = Readonly<{
  assetId: string | null;
  assetPath: string | null;
  assetHash: string | null;
  route: string;
}>;

export type CoverageSourceV622 = Readonly<{
  sourceId: string;
  sourceUrl: string;
  license: string;
  credit: string | null;
}>;

export type CoverageRowV622 = Readonly<{
  id: string;
  kind: CoverageKindV622;
  displayName: string;
  route: CoverageRouteV622;
  source: CoverageSourceV622;
  sourceHash: string;
  lifecycle: CoverageLifecycleV622;
  status: CoverageStatusV622;
  signoff: "pending" | "not-applicable";
  pendingReasons: readonly string[];
  candidateOnly: true;
  runtimeAdmission: "candidate-only";
  measurementAdmission: "not-admitted";
  scientificPayloadWriteback: false;
  rowHash: string;
}>;

export type CoveragePackV622 = Readonly<{
  schema: "mainline-a-canonical-coverage-v622";
  counts: Readonly<{ total: number; stars: number; nebulae: number; constellations: number }>;
  records: readonly CoverageRowV622[];
  manifestDigest: string;
}>;

const HASH = /^[a-f0-9]{64}$/i;
const KINDS: readonly CoverageKindV622[] = ["star", "nebula", "constellation"];
const TARGETS: Readonly<Record<CoverageKindV622, number>> = { star: 12, nebula: 12, constellation: 12 };

export function coverageTargetCountV622(kind: CoverageKindV622): number {
  return TARGETS[kind];
}

export function coverageKindsV622(): readonly CoverageKindV622[] {
  return Object.freeze([...KINDS]);
}

export function normalizeCoverageIdV622(value: string): string {
  return value.trim().toLocaleLowerCase().replace(/[\s_]+/g, "-");
}

export function normalizeCoverageRouteV622(route: CoverageRouteV622): CoverageRouteV622 {
  return Object.freeze({
    assetId: route.assetId?.trim() || null,
    assetPath: route.assetPath?.replaceAll("\\", "/") || null,
    assetHash: route.assetHash?.toLocaleLowerCase() || null,
    route: route.route.trim(),
  });
}

export function normalizeCoverageSourceV622(source: CoverageSourceV622): CoverageSourceV622 {
  return Object.freeze({
    sourceId: source.sourceId.trim(),
    sourceUrl: source.sourceUrl.trim(),
    license: source.license.trim(),
    credit: source.credit?.trim() || null,
  });
}

export function normalizeCoverageRowV622(row: CoverageRowV622): CoverageRowV622 {
  return Object.freeze({
    ...row,
    id: normalizeCoverageIdV622(row.id),
    displayName: row.displayName.trim(),
    route: normalizeCoverageRouteV622(row.route),
    source: normalizeCoverageSourceV622(row.source),
    sourceHash: row.sourceHash.toLocaleLowerCase(),
    pendingReasons: Object.freeze([...new Set(row.pendingReasons.map((reason) => reason.trim()).filter(Boolean))].sort()),
  });
}

export function coverageRowIdentityV622(row: CoverageRowV622): string {
  return `${row.kind}:${normalizeCoverageIdV622(row.id)}`;
}

export function coverageRowHasValidSourceV622(row: CoverageRowV622): boolean {
  return /^https:\/\//i.test(row.source.sourceUrl)
    && row.source.sourceId.length > 0
    && row.source.license.length > 0
    && HASH.test(row.sourceHash);
}

export function coverageRowHasValidRouteV622(row: CoverageRowV622): boolean {
  const route = row.route;
  if (!route.route || route.route.includes("..") || route.route.includes("\\")) return false;
  if (route.assetHash !== null && !HASH.test(route.assetHash)) return false;
  if (route.assetPath !== null && (route.assetPath.includes("..") || route.assetPath.startsWith("/"))) return false;
  return true;
}

export function coverageRowLifecycleValidV622(row: CoverageRowV622): boolean {
  if (row.lifecycle === "runtime-cleared") return row.status === "runtime-cleared";
  if (row.lifecycle === "asset-delivered") return row.status === "rights-pending" || row.status === "asset-delivered";
  return row.status !== "runtime-cleared" && row.pendingReasons.length > 0;
}

export function coverageRowBoundaryValidV622(row: CoverageRowV622): boolean {
  return row.candidateOnly === true
    && row.runtimeAdmission === "candidate-only"
    && row.measurementAdmission === "not-admitted"
    && row.scientificPayloadWriteback === false;
}

export function coverageRowValidationErrorsV622(row: CoverageRowV622): readonly string[] {
  const errors: string[] = [];
  if (!KINDS.includes(row.kind)) errors.push("kind-invalid");
  if (!row.id.trim()) errors.push("id-missing");
  if (!row.displayName.trim()) errors.push("display-name-missing");
  if (!coverageRowHasValidSourceV622(row)) errors.push("source-invalid");
  if (!coverageRowHasValidRouteV622(row)) errors.push("route-invalid");
  if (!coverageRowLifecycleValidV622(row)) errors.push("lifecycle-invalid");
  if (!coverageRowBoundaryValidV622(row)) errors.push("boundary-invalid");
  if (row.kind === "constellation" && row.signoff !== "pending") errors.push("constellation-signoff-opened");
  return Object.freeze(errors);
}

export function coveragePackCountV622(pack: CoveragePackV622, kind: CoverageKindV622): number {
  return pack.records.filter((row) => row.kind === kind).length;
}

export function coveragePackTargetValidV622(pack: CoveragePackV622): boolean {
  return KINDS.every((kind) => coveragePackCountV622(pack, kind) === TARGETS[kind]);
}

export function coveragePackDuplicateIdsV622(pack: CoveragePackV622): readonly string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const row of pack.records) {
    const key = coverageRowIdentityV622(row);
    if (seen.has(key)) duplicates.add(key);
    seen.add(key);
  }
  return Object.freeze([...duplicates].sort());
}

export function coveragePackMissingKindsV622(pack: CoveragePackV622): readonly CoverageKindV622[] {
  return Object.freeze(KINDS.filter((kind) => coveragePackCountV622(pack, kind) === 0));
}

export function coveragePackValidationErrorsV622(pack: CoveragePackV622): readonly string[] {
  const errors: string[] = [];
  if (pack.schema !== "mainline-a-canonical-coverage-v622") errors.push("schema-invalid");
  if (!coveragePackTargetValidV622(pack)) errors.push("target-count-invalid");
  errors.push(...coveragePackDuplicateIdsV622(pack).map((id) => `${id}:duplicate`));
  errors.push(...coveragePackMissingKindsV622(pack).map((kind) => `${kind}:missing`));
  for (const row of pack.records) errors.push(...coverageRowValidationErrorsV622(row).map((error) => `${coverageRowIdentityV622(row)}:${error}`));
  return Object.freeze(errors);
}

export function validateCoverageCountsV622(records: readonly CoverageRowV622[]): readonly string[] {
  const errors: string[] = [];
  for (const kind of KINDS) {
    const actual = records.filter((row) => row.kind === kind).length;
    if (actual !== TARGETS[kind]) errors.push(`${kind}:expected-${TARGETS[kind]}-got-${actual}`);
  }
  return Object.freeze(errors);
}

export function validateCoverageRowV622(row: CoverageRowV622): readonly string[] {
  return coverageRowValidationErrorsV622(row);
}

export function coverageRowsByKindV622(pack: CoveragePackV622, kind: CoverageKindV622): readonly CoverageRowV622[] {
  return Object.freeze(pack.records.filter((row) => row.kind === kind).sort((left, right) => coverageRowIdentityV622(left).localeCompare(coverageRowIdentityV622(right))));
}

export function coverageStatusCountsV622(pack: CoveragePackV622): Readonly<Record<CoverageStatusV622, number>> {
  const counts = Object.fromEntries(["runtime-cleared", "asset-delivered", "signoff-pending", "rights-pending", "payload-pending", "evidence-pending"].map((status) => [status, 0])) as Record<CoverageStatusV622, number>;
  for (const row of pack.records) counts[row.status] += 1;
  return Object.freeze(counts);
}

export function coverageLifecycleCountsV622(pack: CoveragePackV622): Readonly<Record<CoverageLifecycleV622, number>> {
  const counts = Object.fromEntries(["runtime-cleared", "asset-delivered", "catalog-mapped"].map((status) => [status, 0])) as Record<CoverageLifecycleV622, number>;
  for (const row of pack.records) counts[row.lifecycle] += 1;
  return Object.freeze(counts);
}

export function coveragePendingRowsV622(pack: CoveragePackV622): readonly CoverageRowV622[] {
  return Object.freeze(pack.records.filter((row) => row.pendingReasons.length > 0));
}

export function coverageReadyRowsV622(pack: CoveragePackV622): readonly CoverageRowV622[] {
  return Object.freeze(pack.records.filter((row) => row.pendingReasons.length === 0 && coverageRowValidationErrorsV622(row).length === 0));
}

export function coverageSignoffPendingRowsV622(pack: CoveragePackV622): readonly CoverageRowV622[] {
  return Object.freeze(pack.records.filter((row) => row.signoff === "pending"));
}

export function coverageRightsPendingRowsV622(pack: CoveragePackV622): readonly CoverageRowV622[] {
  return Object.freeze(pack.records.filter((row) => row.status === "rights-pending" || row.status === "payload-pending"));
}

export function coverageRouteInventoryV622(pack: CoveragePackV622): Readonly<Record<string, number>> {
  const inventory: Record<string, number> = {};
  for (const row of pack.records) inventory[row.route.route] = (inventory[row.route.route] ?? 0) + 1;
  return Object.freeze(Object.fromEntries(Object.entries(inventory).sort(([left], [right]) => left.localeCompare(right))));
}

export function coverageSourceInventoryV622(pack: CoveragePackV622): Readonly<Record<string, number>> {
  const inventory: Record<string, number> = {};
  for (const row of pack.records) inventory[row.source.sourceId] = (inventory[row.source.sourceId] ?? 0) + 1;
  return Object.freeze(Object.fromEntries(Object.entries(inventory).sort(([left], [right]) => left.localeCompare(right))));
}

export function coverageManifestSummaryV622(pack: CoveragePackV622) {
  return Object.freeze({
    counts: pack.counts,
    status: coverageStatusCountsV622(pack),
    lifecycle: coverageLifecycleCountsV622(pack),
    routes: coverageRouteInventoryV622(pack),
    sources: coverageSourceInventoryV622(pack),
    pending: coveragePendingRowsV622(pack).length,
    ready: coverageReadyRowsV622(pack).length,
    signoffPending: coverageSignoffPendingRowsV622(pack).length,
    rightsPending: coverageRightsPendingRowsV622(pack).length,
    errors: coveragePackValidationErrorsV622(pack),
  });
}

export function coverageManifestBoundaryV622(pack: CoveragePackV622): boolean {
  return pack.records.length > 0 && pack.records.every(coverageRowBoundaryValidV622);
}

export function coverageKindCoveragePercentV622(pack: CoveragePackV622, kind: CoverageKindV622): number {
  return Math.round((coveragePackCountV622(pack, kind) / TARGETS[kind]) * 100);
}

export function coverageOverallPercentV622(pack: CoveragePackV622): number {
  const total = KINDS.reduce((sum, kind) => sum + TARGETS[kind], 0);
  return Math.round((pack.records.length / total) * 100);
}

export function coverageGateOpenReasonsV622(pack: CoveragePackV622): readonly string[] {
  const reasons: string[] = [];
  if (!coveragePackTargetValidV622(pack)) reasons.push("12/12/12 coverage incomplete");
  if (coveragePackDuplicateIdsV622(pack).length) reasons.push("duplicate canonical ids");
  if (coverageSignoffPendingRowsV622(pack).length) reasons.push("constellation visual signoff pending");
  if (coverageRightsPendingRowsV622(pack).length) reasons.push("nebula rights or payload pending");
  if (coveragePendingRowsV622(pack).some((row) => row.kind === "star")) reasons.push("stellar evidence pending");
  if (!coverageManifestBoundaryV622(pack)) reasons.push("admission boundary invalid");
  return Object.freeze(reasons);
}

export function coverageNextActionV622(pack: CoveragePackV622): string {
  const reasons = coverageGateOpenReasonsV622(pack);
  if (reasons.includes("constellation visual signoff pending")) return "complete constellation visual signoff";
  if (reasons.includes("nebula rights or payload pending")) return "complete nebula rights and payload evidence";
  if (reasons.includes("stellar evidence pending")) return "complete stellar source evidence";
  if (reasons.length) return "resolve canonical coverage blockers";
  return "submit freeze review";
}

export function coverageRowReportV622(row: CoverageRowV622) {
  return Object.freeze({ id: row.id, kind: row.kind, route: row.route.route, lifecycle: row.lifecycle, status: row.status, pending: row.pendingReasons.length, sourceValid: coverageRowHasValidSourceV622(row), routeValid: coverageRowHasValidRouteV622(row), boundaryValid: coverageRowBoundaryValidV622(row) });
}

export function coverageReportRowsV622(pack: CoveragePackV622) {
  return Object.freeze(pack.records.map(coverageRowReportV622).sort((left, right) => `${left.kind}:${left.id}`.localeCompare(`${right.kind}:${right.id}`)));
}

export function coverageReportJsonlV622(pack: CoveragePackV622): string {
  const lines = [JSON.stringify({ section: "summary", ...coverageManifestSummaryV622(pack) })];
  for (const row of coverageReportRowsV622(pack)) lines.push(JSON.stringify({ section: "row", ...row }));
  return `${lines.join("\n")}\n`;
}

export function coverageFreezeCandidateV622(pack: CoveragePackV622): Readonly<{ eligible: boolean; reasons: readonly string[]; nextAction: string; boundary: boolean }> {
  const reasons = coverageGateOpenReasonsV622(pack);
  return Object.freeze({ eligible: reasons.length === 0, reasons, nextAction: coverageNextActionV622(pack), boundary: coverageManifestBoundaryV622(pack) });
}

export function coverageManifestDeltaV622(previous: CoveragePackV622, current: CoveragePackV622) {
  const before = new Map(previous.records.map((row) => [coverageRowIdentityV622(row), row]));
  const after = new Map(current.records.map((row) => [coverageRowIdentityV622(row), row]));
  const added: string[] = [];
  const removed: string[] = [];
  const changed: string[] = [];
  for (const key of before.keys()) if (!after.has(key)) removed.push(key);
  for (const [key, row] of after) {
    const old = before.get(key);
    if (!old) added.push(key);
    else if (JSON.stringify(coverageRowReportV622(old)) !== JSON.stringify(coverageRowReportV622(row))) changed.push(key);
  }
  return Object.freeze({ added: Object.freeze(added.sort()), removed: Object.freeze(removed.sort()), changed: Object.freeze(changed.sort()) });
}
