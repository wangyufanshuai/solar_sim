import { createHash } from "node:crypto";

export type FreezeKindV622 = "nebula" | "constellation" | "stellar";
export type FreezeRouteV622 = Readonly<{ id: string; kind: FreezeKindV622; targetId: string; href: string }>;
export type FreezeLifecycleV622 = Readonly<{ id: string; allocated: number; released: number; activeResources: number; canvasCount: number }>;
export type FreezeRosterV622 = Readonly<{ kind: FreezeKindV622; ids: readonly string[] }>;
export type FreezePreflightInputV622 = Readonly<{ rosters: readonly FreezeRosterV622[]; routes: readonly FreezeRouteV622[]; lifecycle: readonly FreezeLifecycleV622[]; candidateOnly: boolean; scientificPayloadWriteback: false }>;
export type FreezeIssueCodeV622 = "roster-missing" | "roster-duplicate" | "roster-count" | "roster-kind-duplicate" | "route-target-missing" | "route-kind-mismatch" | "route-href-outside" | "route-evidence-missing" | "route-duplicate" | "lifecycle-evidence-missing" | "lifecycle-duplicate" | "lifecycle-target-missing" | "lifecycle-leak" | "lifecycle-negative" | "canvas-count" | "boundary-open" | "runtime-observation-missing";
export type FreezeIssueV622 = Readonly<{ code: FreezeIssueCodeV622; kind?: FreezeKindV622; id?: string; detail?: string }>;
export type FreezeGateReportV622 = Readonly<{ schema: "mainline-a-freeze-preflight-v622"; passed: boolean; contractValid: boolean; evidenceClass: "static"; runtimeObserved: false; coverage: Readonly<Record<FreezeKindV622, number>>; issues: readonly FreezeIssueV622[]; fingerprint: string; boundary: Readonly<{ candidateOnly: boolean; scientificPayloadWriteback: false }> }>;
export type FreezeManifestEntryV622 = Readonly<{ kind: FreezeKindV622; id: string; route: string; sourceSha256: string; lifecycleId: string }>;
export type FreezeManifestDiffV622 = Readonly<{ added: readonly string[]; removed: readonly string[]; changed: readonly string[]; duplicate: readonly string[]; stable: boolean; fingerprint: string }>;
export type FreezeRouteDiagnosticV622 = Readonly<{ routeId: string; targetId: string; reachable: boolean; cycles: number; outDegree: number; issues: readonly string[] }>;
export type FreezeLifecycleTransitionV622 = Readonly<{ id: string; event: "allocate" | "release"; sequence: number; activeAfter: number; valid: boolean }>;
export type FreezePendingClassificationV622 = "ready" | "pending-source" | "pending-visual" | "pending-lifecycle" | "blocked-boundary";

export const FREEZE_TARGET_COUNTS_V622: Readonly<Record<FreezeKindV622, number>> = Object.freeze({ nebula: 12, constellation: 12, stellar: 12 });

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value as Record<string, unknown>).sort().map((key) => [key, canonical((value as Record<string, unknown>)[key])]));
}

export function freezePreflightFingerprintV622(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(canonical(value)), "utf8").digest("hex");
}

export function normalizeFreezeIdV622(value: string): string { return value.trim().toLocaleLowerCase().replace(/[\s_]+/g, "-"); }

export function rosterCoverageV622(roster: FreezeRosterV622): number {
  const expected = FREEZE_TARGET_COUNTS_V622[roster.kind];
  return expected === 0 ? 0 : Math.round((new Set(roster.ids.map(normalizeFreezeIdV622)).size / expected) * 100);
}

export function rosterDuplicateIdsV622(roster: FreezeRosterV622): readonly string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const id of roster.ids) { const normalized = normalizeFreezeIdV622(id); if (seen.has(normalized)) duplicates.add(normalized); seen.add(normalized); }
  return Object.freeze([...duplicates].sort());
}

export function rosterMissingSlotsV622(roster: FreezeRosterV622): number {
  return Math.max(0, FREEZE_TARGET_COUNTS_V622[roster.kind] - new Set(roster.ids.map(normalizeFreezeIdV622)).size);
}

export function rosterCountValidV622(roster: FreezeRosterV622): boolean {
  return roster.ids.length === FREEZE_TARGET_COUNTS_V622[roster.kind] && rosterDuplicateIdsV622(roster).length === 0;
}

export function routeHrefWithinFreezeV622(route: FreezeRouteV622): boolean {
  return route.href.startsWith("/" ) && !route.href.includes("..") && route.href.includes(normalizeFreezeIdV622(route.targetId));
}

export function lifecycleReleasedV622(entry: FreezeLifecycleV622): boolean {
  return Number.isInteger(entry.allocated) && Number.isInteger(entry.released) && Number.isInteger(entry.activeResources) && Number.isInteger(entry.canvasCount) && entry.allocated >= 0 && entry.released >= 0 && entry.activeResources >= 0 && entry.canvasCount >= 0 && entry.released === entry.allocated && entry.activeResources === 0 && entry.canvasCount === 0;
}

export function lifecycleLeakCountV622(entries: readonly FreezeLifecycleV622[]): number {
  return entries.filter((entry) => !lifecycleReleasedV622(entry)).length;
}

function addRosterIssues(roster: FreezeRosterV622, issues: FreezeIssueV622[]): void {
  if (roster.ids.length !== FREEZE_TARGET_COUNTS_V622[roster.kind]) issues.push({ code: "roster-count", kind: roster.kind, detail: `${roster.ids.length}/${FREEZE_TARGET_COUNTS_V622[roster.kind]}` });
  for (const id of rosterDuplicateIdsV622(roster)) issues.push({ code: "roster-duplicate", kind: roster.kind, id });
  if (rosterMissingSlotsV622(roster) > 0) issues.push({ code: "roster-missing", kind: roster.kind, detail: String(rosterMissingSlotsV622(roster)) });
}

function addRouteIssues(routes: readonly FreezeRouteV622[], rosters: readonly FreezeRosterV622[], issues: FreezeIssueV622[]): void {
  const ids = new Map<FreezeKindV622, Set<string>>(rosters.map((roster) => [roster.kind, new Set(roster.ids.map(normalizeFreezeIdV622))]));
  const targets = new Set<string>();
  const routeIds = new Set<string>();
  for (const route of routes) {
    const target = normalizeFreezeIdV622(route.targetId);
    const key = `${route.kind}|${target}`;
    const routeId = normalizeFreezeIdV622(route.id);
    if (targets.has(key) || routeIds.has(routeId)) issues.push({ code: "route-duplicate", kind: route.kind, id: route.id, detail: key });
    targets.add(key);
    routeIds.add(routeId);
    if (!ids.get(route.kind)?.has(target)) issues.push({ code: "route-target-missing", kind: route.kind, id: route.id, detail: route.targetId });
    if (!routeHrefWithinFreezeV622(route)) issues.push({ code: "route-href-outside", kind: route.kind, id: route.id });
    const mismatched = [...ids.entries()].some(([kind, rosterIds]) => kind !== route.kind && rosterIds.has(target));
    if (mismatched) issues.push({ code: "route-kind-mismatch", kind: route.kind, id: route.id });
  }
  for (const roster of rosters) {
    for (const id of new Set(roster.ids.map(normalizeFreezeIdV622))) {
      if (!targets.has(`${roster.kind}|${id}`)) issues.push({ code: "route-evidence-missing", kind: roster.kind, id });
    }
  }
}

function addLifecycleIssues(entries: readonly FreezeLifecycleV622[], rosters: readonly FreezeRosterV622[], issues: FreezeIssueV622[]): void {
  const expected = new Set(rosters.flatMap((roster) => roster.ids.map(normalizeFreezeIdV622)));
  const observed = new Set<string>();
  for (const entry of entries) {
    const id = normalizeFreezeIdV622(entry.id);
    if (observed.has(id)) issues.push({ code: "lifecycle-duplicate", id });
    if (!expected.has(id)) issues.push({ code: "lifecycle-target-missing", id });
    observed.add(id);
    if ([entry.allocated, entry.released, entry.activeResources, entry.canvasCount].some((value) => !Number.isInteger(value) || value < 0)) issues.push({ code: "lifecycle-negative", id: entry.id });
    else if (!lifecycleReleasedV622(entry)) issues.push({ code: "lifecycle-leak", id: entry.id, detail: `${entry.released}/${entry.allocated} released; active=${entry.activeResources}; canvas=${entry.canvasCount}` });
    if (entry.canvasCount > 1) issues.push({ code: "canvas-count", id: entry.id });
  }
  for (const id of expected) {
    if (!observed.has(id)) issues.push({ code: "lifecycle-evidence-missing", id });
  }
}

export function validateFreezePreflightBoundaryV622(input: FreezePreflightInputV622): readonly FreezeIssueV622[] {
  const issues: FreezeIssueV622[] = [];
  if (!input.candidateOnly || input.scientificPayloadWriteback !== false) issues.push({ code: "boundary-open" });
  return Object.freeze(issues);
}

export function runFreezePreflightV622(input: FreezePreflightInputV622): FreezeGateReportV622 {
  const issues: FreezeIssueV622[] = [...validateFreezePreflightBoundaryV622(input)];
  const rosters = new Map(input.rosters.map((roster) => [roster.kind, roster]));
  const seenKinds = new Set<FreezeKindV622>();
  for (const roster of input.rosters) {
    if (seenKinds.has(roster.kind)) issues.push({ code: "roster-kind-duplicate", kind: roster.kind });
    seenKinds.add(roster.kind);
  }
  for (const kind of Object.keys(FREEZE_TARGET_COUNTS_V622) as FreezeKindV622[]) {
    const roster = rosters.get(kind);
    if (!roster) issues.push({ code: "roster-missing", kind, detail: "roster absent" });
    else addRosterIssues(roster, issues);
  }
  addRouteIssues(input.routes, input.rosters, issues);
  addLifecycleIssues(input.lifecycle, input.rosters, issues);
  const contractValid = issues.length === 0;
  issues.push({ code: "runtime-observation-missing", detail: "Counter and route contracts do not authenticate runtime observation, build identity, route reachability or resource release." });
  const coverage = Object.fromEntries((Object.keys(FREEZE_TARGET_COUNTS_V622) as FreezeKindV622[]).map((kind) => [kind, rosterCoverageV622(rosters.get(kind) ?? { kind, ids: [] })])) as Record<FreezeKindV622, number>;
  const fingerprint = freezePreflightFingerprintV622({ rosters: input.rosters, routes: input.routes, lifecycle: input.lifecycle, coverage, boundary: { candidateOnly: input.candidateOnly, scientificPayloadWriteback: input.scientificPayloadWriteback } });
  return Object.freeze({ schema: "mainline-a-freeze-preflight-v622", passed: false, contractValid, evidenceClass: "static", runtimeObserved: false, coverage: Object.freeze(coverage), issues: Object.freeze(issues), fingerprint, boundary: Object.freeze({ candidateOnly: input.candidateOnly, scientificPayloadWriteback: false }) });
}

export function freezeGateStatusLabelV622(report: FreezeGateReportV622): string { return report.passed ? "freeze preflight passed" : `freeze blocked · ${report.issues.length} issues`; }
export function freezeGateIssueCountsV622(report: FreezeGateReportV622): Readonly<Record<FreezeIssueCodeV622, number>> {
  const codes: readonly FreezeIssueCodeV622[] = ["roster-missing", "roster-duplicate", "roster-count", "roster-kind-duplicate", "route-target-missing", "route-kind-mismatch", "route-href-outside", "route-evidence-missing", "route-duplicate", "lifecycle-evidence-missing", "lifecycle-duplicate", "lifecycle-target-missing", "lifecycle-leak", "lifecycle-negative", "canvas-count", "boundary-open", "runtime-observation-missing"];
  const counts = Object.fromEntries(codes.map((code) => [code, 0])) as Record<FreezeIssueCodeV622, number>;
  for (const issue of report.issues) counts[issue.code] = (counts[issue.code] ?? 0) + 1;
  return Object.freeze(counts);
}

export function freezeReportDeterministicEqualV622(left: FreezeGateReportV622, right: FreezeGateReportV622): boolean { return left.fingerprint === right.fingerprint && JSON.stringify(left.coverage) === JSON.stringify(right.coverage) && JSON.stringify(left.issues) === JSON.stringify(right.issues); }
export function freezeReportJsonV622(report: FreezeGateReportV622): string { return `${JSON.stringify(report, null, 2)}\n`; }

export function freezeKindLabelV622(kind: FreezeKindV622): string {
  return ({ nebula: "星云", constellation: "星座", stellar: "恒星" } as const)[kind];
}

export function freezeRosterIdsV622(input: FreezePreflightInputV622, kind: FreezeKindV622): readonly string[] {
  const roster = input.rosters.find((entry) => entry.kind === kind);
  return Object.freeze((roster?.ids ?? []).map(normalizeFreezeIdV622));
}

export function freezeCoverageCompleteV622(report: FreezeGateReportV622): boolean {
  return (Object.keys(FREEZE_TARGET_COUNTS_V622) as FreezeKindV622[])
    .every((kind) => report.coverage[kind] === 100);
}

export function freezeRouteCountV622(input: FreezePreflightInputV622, kind: FreezeKindV622): number {
  return input.routes.filter((route) => route.kind === kind).length;
}

export function freezeLifecycleResourceTotalV622(entries: readonly FreezeLifecycleV622[]): number {
  return entries.reduce((total, entry) => total + entry.activeResources, 0);
}

export function freezeLifecycleCanvasTotalV622(entries: readonly FreezeLifecycleV622[]): number {
  return entries.reduce((total, entry) => total + entry.canvasCount, 0);
}

export function freezeLifecycleReleaseRatioV622(entry: FreezeLifecycleV622): number {
  if (entry.allocated <= 0) return entry.released === 0 ? 1 : 0;
  return Math.min(1, Math.max(0, entry.released / entry.allocated));
}

export function freezeLifecycleLabelsV622(entries: readonly FreezeLifecycleV622[]): readonly string[] {
  return Object.freeze(entries.map((entry) => `${entry.id} · ${Math.round(freezeLifecycleReleaseRatioV622(entry) * 100)}% released`));
}

export function freezeReportIssueCodesV622(report: FreezeGateReportV622): readonly FreezeIssueCodeV622[] {
  return Object.freeze([...new Set(report.issues.map((issue) => issue.code))].sort());
}

export function freezeReportIssueDetailsV622(report: FreezeGateReportV622): readonly string[] {
  return Object.freeze(report.issues.map((issue) => [issue.code, issue.kind ?? "", issue.id ?? "", issue.detail ?? ""].filter(Boolean).join(":")));
}

export function freezeInputFingerprintV622(input: FreezePreflightInputV622): string {
  return freezePreflightFingerprintV622({ rosters: input.rosters, routes: input.routes, lifecycle: input.lifecycle });
}

export function freezeReportFingerprintMatchesInputV622(report: FreezeGateReportV622, input: FreezePreflightInputV622): boolean {
  const expected = freezePreflightFingerprintV622({ rosters: input.rosters, routes: input.routes, lifecycle: input.lifecycle, coverage: report.coverage, boundary: { candidateOnly: input.candidateOnly, scientificPayloadWriteback: input.scientificPayloadWriteback } });
  return expected === report.fingerprint;
}

export function freezeCanAdmitRuntimeV622(): false {
  return false;
}

export function freezeCanWriteScientificPayloadV622(): false {
  return false;
}

export function freezeCoverageTableV622(report: FreezeGateReportV622): readonly Readonly<{ kind: FreezeKindV622; label: string; percent: number; target: number }>[] {
  return Object.freeze((Object.keys(FREEZE_TARGET_COUNTS_V622) as FreezeKindV622[]).map((kind) => Object.freeze({ kind, label: freezeKindLabelV622(kind), percent: report.coverage[kind], target: FREEZE_TARGET_COUNTS_V622[kind] })));
}

export function freezeRouteTargetsV622(input: FreezePreflightInputV622, kind: FreezeKindV622): readonly string[] {
  return Object.freeze(input.routes.filter((route) => route.kind === kind).map((route) => normalizeFreezeIdV622(route.targetId)).sort());
}

export function freezeLifecycleAllReleasedV622(entries: readonly FreezeLifecycleV622[]): boolean {
  return entries.length > 0 && entries.every(lifecycleReleasedV622);
}

export function freezeReportSummaryV622(report: FreezeGateReportV622): Readonly<{ status: string; issueCount: number; issueCodes: readonly FreezeIssueCodeV622[]; coverageComplete: boolean; runtimeAdmission: false; scientificPayloadWriteback: false }> {
  return Object.freeze({ status: freezeGateStatusLabelV622(report), issueCount: report.issues.length, issueCodes: freezeReportIssueCodesV622(report), coverageComplete: freezeCoverageCompleteV622(report), runtimeAdmission: false as const, scientificPayloadWriteback: false as const });
}

function manifestKeyV622(entry: FreezeManifestEntryV622): string {
  return `${entry.kind}|${normalizeFreezeIdV622(entry.id)}`;
}

export function canonicalFreezeManifestV622(entries: readonly FreezeManifestEntryV622[]): readonly FreezeManifestEntryV622[] {
  return Object.freeze([...entries].map((entry) => Object.freeze({ ...entry, id: normalizeFreezeIdV622(entry.id), route: entry.route.trim(), sourceSha256: entry.sourceSha256.toLocaleLowerCase() })).sort((left, right) => manifestKeyV622(left).localeCompare(manifestKeyV622(right))));
}

export function diffFreezeManifestsV622(previous: readonly FreezeManifestEntryV622[], current: readonly FreezeManifestEntryV622[]): FreezeManifestDiffV622 {
  const left = new Map(canonicalFreezeManifestV622(previous).map((entry) => [manifestKeyV622(entry), entry]));
  const right = new Map(canonicalFreezeManifestV622(current).map((entry) => [manifestKeyV622(entry), entry]));
  const added = [...right.keys()].filter((key) => !left.has(key)).sort();
  const removed = [...left.keys()].filter((key) => !right.has(key)).sort();
  const changed = [...right.keys()].filter((key) => left.has(key) && JSON.stringify(left.get(key)) !== JSON.stringify(right.get(key))).sort();
  const duplicate = current.map(manifestKeyV622).filter((key, index, all) => all.indexOf(key) !== index).filter((key, index, all) => all.indexOf(key) === index).sort();
  const stable = added.length === 0 && removed.length === 0 && changed.length === 0 && duplicate.length === 0;
  return Object.freeze({ added: Object.freeze(added), removed: Object.freeze(removed), changed: Object.freeze(changed), duplicate: Object.freeze(duplicate), stable, fingerprint: freezePreflightFingerprintV622({ previous: canonicalFreezeManifestV622(previous), current: canonicalFreezeManifestV622(current) }) });
}

export function freezeManifestDiffJsonV622(diff: FreezeManifestDiffV622): string { return `${JSON.stringify(diff, null, 2)}\n`; }

export function freezeManifestDiffCsvV622(diff: FreezeManifestDiffV622): string {
  const rows = [["change", "key"], ...diff.added.map((key) => ["added", key]), ...diff.removed.map((key) => ["removed", key]), ...diff.changed.map((key) => ["changed", key]), ...diff.duplicate.map((key) => ["duplicate", key])];
  return `${rows.map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(",")).join("\n")}\n`;
}

export function freezeManifestDiffJsonlV622(diff: FreezeManifestDiffV622): string {
  return `${[...diff.added.map((key) => ({ change: "added", key })), ...diff.removed.map((key) => ({ change: "removed", key })), ...diff.changed.map((key) => ({ change: "changed", key })), ...diff.duplicate.map((key) => ({ change: "duplicate", key }))].map((row) => JSON.stringify(row)).join("\n")}\n`;
}

export function diagnoseFreezeRouteV622(route: FreezeRouteV622, routes: readonly FreezeRouteV622[]): FreezeRouteDiagnosticV622 {
  const outgoing = routes.filter((candidate) => candidate.id === route.targetId);
  const issues: string[] = [];
  if (!routeHrefWithinFreezeV622(route)) issues.push("href-outside");
  if (route.targetId === route.id) issues.push("self-cycle");
  if (outgoing.length > 4) issues.push("out-degree-high");
  return Object.freeze({ routeId: route.id, targetId: route.targetId, reachable: routeHrefWithinFreezeV622(route) && outgoing.length >= 0, cycles: route.targetId === route.id ? 1 : 0, outDegree: outgoing.length, issues: Object.freeze(issues) });
}

export function diagnoseFreezeRouteGraphV622(routes: readonly FreezeRouteV622[]): readonly FreezeRouteDiagnosticV622[] {
  return Object.freeze(routes.map((route) => diagnoseFreezeRouteV622(route, routes)));
}

export function freezeRouteGraphIssueCountV622(routes: readonly FreezeRouteV622[]): number {
  return diagnoseFreezeRouteGraphV622(routes).reduce((count, diagnostic) => count + diagnostic.issues.length, 0);
}

export function replayFreezeLifecycleTransitionsV622(transitions: readonly FreezeLifecycleTransitionV622[]): Readonly<{ valid: boolean; finalActive: number; issues: readonly string[] }> {
  let active = 0;
  const issues: string[] = [];
  for (const transition of [...transitions].sort((left, right) => left.sequence - right.sequence)) {
    if (transition.event === "allocate") active += 1;
    else if (active <= 0) issues.push(`release-before-allocate:${transition.id}`);
    else active -= 1;
    if (transition.activeAfter !== active) issues.push(`active-mismatch:${transition.id}`);
  }
  return Object.freeze({ valid: issues.length === 0 && active === 0, finalActive: active, issues: Object.freeze(issues) });
}

export function classifyFreezePendingV622(input: Readonly<{ sourceComplete: boolean; visualSignedOff: boolean; lifecycleReleased: boolean; boundaryClosed: boolean }>): FreezePendingClassificationV622 {
  if (!input.boundaryClosed) return "blocked-boundary";
  if (!input.sourceComplete) return "pending-source";
  if (!input.visualSignedOff) return "pending-visual";
  if (!input.lifecycleReleased) return "pending-lifecycle";
  return "ready";
}

export function freezeSignoffSummaryV622(values: readonly FreezePendingClassificationV622[]): Readonly<Record<FreezePendingClassificationV622, number>> {
  const summary: Record<FreezePendingClassificationV622, number> = { ready: 0, "pending-source": 0, "pending-visual": 0, "pending-lifecycle": 0, "blocked-boundary": 0 };
  for (const value of values) summary[value] += 1;
  return Object.freeze(summary);
}

export function freezeManifestEntryCsvV622(entry: FreezeManifestEntryV622): string {
  const values = [entry.kind, normalizeFreezeIdV622(entry.id), entry.route, entry.sourceSha256, entry.lifecycleId];
  return values.map((value) => `"${value.replaceAll('"', '""')}"`).join(",");
}

export function freezeManifestCsvV622(entries: readonly FreezeManifestEntryV622[]): string {
  return ["kind,id,route,sourceSha256,lifecycleId", ...canonicalFreezeManifestV622(entries).map(freezeManifestEntryCsvV622)].join("\n") + "\n";
}

export function freezeManifestJsonlV622(entries: readonly FreezeManifestEntryV622[]): string {
  return canonicalFreezeManifestV622(entries).map((entry) => JSON.stringify(entry)).join("\n") + "\n";
}

export function freezeRouteDiagnosticCsvV622(entries: readonly FreezeRouteDiagnosticV622[]): string {
  const rows = ["routeId,targetId,reachable,cycles,outDegree,issues"];
  for (const entry of entries) rows.push([entry.routeId, entry.targetId, String(entry.reachable), String(entry.cycles), String(entry.outDegree), entry.issues.join("|")].join(","));
  return rows.join("\n") + "\n";
}

export function freezeLifecycleTransitionJsonlV622(entries: readonly FreezeLifecycleTransitionV622[]): string {
  return [...entries].sort((left, right) => left.sequence - right.sequence).map((entry) => JSON.stringify(entry)).join("\n") + "\n";
}

export function freezeLifecycleTransitionFingerprintV622(entries: readonly FreezeLifecycleTransitionV622[]): string {
  return freezePreflightFingerprintV622([...entries].sort((left, right) => left.sequence - right.sequence));
}

export function freezeGateSnapshotV622(report: FreezeGateReportV622): Readonly<{ schema: string; fingerprint: string; passed: boolean; contractValid: boolean; evidenceClass: "static"; runtimeObserved: false; coverage: Readonly<Record<FreezeKindV622, number>>; issueCodes: readonly FreezeIssueCodeV622[]; candidateOnly: true; hold: true; notAdmitted: true; scientificPayloadWriteback: false }> {
  return Object.freeze({ schema: report.schema, fingerprint: report.fingerprint, passed: report.passed, contractValid: report.contractValid, evidenceClass: "static", runtimeObserved: false, coverage: report.coverage, issueCodes: freezeReportIssueCodesV622(report), candidateOnly: true as const, hold: true as const, notAdmitted: true as const, scientificPayloadWriteback: false as const });
}

export function freezeGateSnapshotJsonV622(report: FreezeGateReportV622): string {
  return `${JSON.stringify(freezeGateSnapshotV622(report), null, 2)}\n`;
}

export function freezeGateSnapshotJsonlV622(reports: readonly FreezeGateReportV622[]): string {
  return reports.map((report) => JSON.stringify(freezeGateSnapshotV622(report))).join("\n") + "\n";
}

export function freezeGateCoverageDeltaV622(previous: FreezeGateReportV622, current: FreezeGateReportV622): Readonly<Record<FreezeKindV622, number>> {
  return Object.freeze({ nebula: current.coverage.nebula - previous.coverage.nebula, constellation: current.coverage.constellation - previous.coverage.constellation, stellar: current.coverage.stellar - previous.coverage.stellar });
}

export function freezeGateNoRegressionV622(previous: FreezeGateReportV622, current: FreezeGateReportV622): boolean {
  const delta = freezeGateCoverageDeltaV622(previous, current);
  return delta.nebula >= 0 && delta.constellation >= 0 && delta.stellar >= 0;
}

export function freezeRouteTargetsUniqueV622(routes: readonly FreezeRouteV622[]): boolean {
  const keys = routes.map((route) => `${route.kind}|${normalizeFreezeIdV622(route.targetId)}`);
  return new Set(keys).size === keys.length;
}

export function freezeLifecycleIdsUniqueV622(entries: readonly FreezeLifecycleV622[]): boolean {
  const ids = entries.map((entry) => normalizeFreezeIdV622(entry.id));
  return new Set(ids).size === ids.length;
}

export function freezePreflightReadyForVisualSignoffV622(report: FreezeGateReportV622): boolean {
  return report.runtimeObserved && report.passed && freezeCoverageCompleteV622(report) && report.issues.length === 0;
}

export function freezePreflightRequiresHumanSignoffV622(report: FreezeGateReportV622): boolean {
  return report.passed || report.issues.some((issue) => issue.code === "roster-count" || issue.code === "route-href-outside");
}

export function freezeReportRoundTripV622(report: FreezeGateReportV622): FreezeGateReportV622 {
  return Object.freeze(JSON.parse(freezeReportJsonV622(report)) as FreezeGateReportV622);
}
