export const MAINLINE_A_RELEASE_ALIGNMENT_SCHEMA_V626 =
  "mainline-a-release-alignment-v626" as const;
export const MAINLINE_A_RELEASE_ALIGNMENT_VERSION_V626 =
  "v626-mainline-a-readonly-root-next-web-alignment" as const;
export const MAINLINE_A_RELEASE_PACKAGE_SCHEMA_V626 =
  "mainline-a-release-package-v626" as const;
export const MAINLINE_A_RELEASE_BOUNDARY_V626 =
  "R66 compares a read-only root mirror with next-web release inputs; it does not mutate the parent repository, promote candidate art, write scientific payloads, or alter EIH, Newton N-body, 2PN/Lense–Thirring, or Kerr kernels." as const;

export const MAINLINE_A_EXPECTED_COUNTS_V626 = Object.freeze({
  canonicalStars: 12,
  canonicalNebulae: 12,
  canonicalConstellations: 12,
  betaHeroStars: 24,
  betaNebulaSources: 24,
} as const);

export type MainlineAReleaseEvidenceClassV626 =
  | "static"
  | "http"
  | "visual"
  | "browser"
  | "performance"
  | "external-source"
  | "release-package";

export type MainlineAReleaseGateStateV626 =
  | "passed"
  | "pending"
  | "blocked"
  | "not-run"
  | "not-applicable";

export type MainlineAReleaseBoundaryV626 = Readonly<{
  candidateOnly: true;
  hold: true;
  notAdmitted: true;
  scientificPayloadWriteback: false;
  parentGitMutation: false;
  physicsKernelMutation: false;
  runtimePromotion: "closed";
}>;

export type MainlineAFileDigestV626 = Readonly<{
  relativePath: string;
  bytes: number;
  sha256: string;
  kind: "source" | "asset" | "manifest" | "package" | "unknown";
}>;

export type MainlineARootMirrorV626 = Readonly<{
  path: string;
  packageName: string;
  packageType: string;
  packageScripts: Readonly<Record<string, string>>;
  entrypoints: readonly MainlineAFileDigestV626[];
  sourceFiles: readonly MainlineAFileDigestV626[];
  publicFiles: readonly MainlineAFileDigestV626[];
  hasGitDirectory: boolean;
  readable: boolean;
  errors: readonly string[];
}>;

export type MainlineANextWebMirrorV626 = Readonly<{
  path: string;
  packageName: string;
  packageType: string;
  branch: string;
  head: string;
  build: MainlineAReleaseBuildIdentityV626;
  sourceFiles: readonly MainlineAFileDigestV626[];
  runtimeFiles: readonly MainlineAFileDigestV626[];
  manifests: readonly MainlineAFileDigestV626[];
  readable: boolean;
  errors: readonly string[];
}>;

export type MainlineAReleaseBuildIdentityV626 = Readonly<{
  buildId: string;
  runtimeBuildId: string;
  branch: string;
  head: string;
  profile: string;
  sourceStable: boolean;
  receiptPath: string;
}>;

export type MainlineAReleaseManifestSnapshotV626 = Readonly<{
  canonicalStars: number;
  canonicalNebulae: number;
  canonicalConstellations: number;
  betaHeroStars: number;
  betaNebulaSources: number;
  runtimeCleared: number;
  signoffPending: number;
  rightsPending: number;
  candidateOnly: boolean;
  hold: boolean;
  notAdmitted: boolean;
  scientificPayloadWriteback: boolean;
  schemas: readonly string[];
}>;

export type MainlineAReleaseSourceClosureV626 = Readonly<{
  stellarRawResponses: number;
  stellarStructuredCandidates: number;
  stellarComponentConfirmed: number;
  nebulaCaptured: number;
  nebulaRightsPending: number;
  externalSourceEvidence: boolean;
  sourceReferencesPresent: boolean;
  fixturePromotionDetected: boolean;
  syntheticResponseDetected: boolean;
  status: MainlineAReleaseGateStateV626;
  blockers: readonly string[];
}>;

export type MainlineAReleaseRightsClosureV626 = Readonly<{
  canonicalRightsPending: number;
  nebulaRightsPending: number;
  signedItems: number;
  rightsEvidencePresent: boolean;
  declaredLicensesPresent: boolean;
  status: MainlineAReleaseGateStateV626;
  blockers: readonly string[];
}>;

export type MainlineAReleaseRuntimeClosureV626 = Readonly<{
  canonicalCoveragePresent: boolean;
  runtimeCleared: number;
  lifecycleEvidence: MainlineAReleaseGateStateV626;
  desktopBrowser: MainlineAReleaseGateStateV626;
  mobileViewport: MainlineAReleaseGateStateV626;
  physicalMobile: MainlineAReleaseGateStateV626;
  longRun: MainlineAReleaseGateStateV626;
  status: MainlineAReleaseGateStateV626;
  blockers: readonly string[];
}>;

export type MainlineAReleaseAlignmentIssueV626 = Readonly<{
  code: string;
  severity: "info" | "warning" | "error";
  detail: string;
  evidenceClass: MainlineAReleaseEvidenceClassV626;
}>;

export type MainlineAReleaseAlignmentComparisonV626 = Readonly<{
  root: MainlineARootMirrorV626;
  nextWeb: MainlineANextWebMirrorV626;
  packageIdentityMatch: boolean;
  sourceIdentityMatch: boolean;
  buildIdentityMatch: boolean;
  manifestIdentityMatch: boolean;
  issues: readonly MainlineAReleaseAlignmentIssueV626[];
  status: MainlineAReleaseGateStateV626;
}>;

export type MainlineAReleaseGateV626 = Readonly<{
  id: string;
  label: string;
  state: MainlineAReleaseGateStateV626;
  evidenceClass: MainlineAReleaseEvidenceClassV626;
  required: boolean;
  blockers: readonly string[];
}>;

export type MainlineAReleaseRollbackV626 = Readonly<{
  packageId: string;
  baseline: string;
  activeBuildId: string;
  activeBranch: string;
  activeHead: string;
  preservedBuildReceipt: string;
  rollbackSteps: readonly string[];
  forbiddenActions: readonly string[];
  reversible: boolean;
}>;

export type MainlineAReleasePackageV626 = Readonly<{
  schema: typeof MAINLINE_A_RELEASE_PACKAGE_SCHEMA_V626;
  version: typeof MAINLINE_A_RELEASE_ALIGNMENT_VERSION_V626;
  packageId: string;
  generatedAt: string;
  workspace: string;
  rootMirror: string;
  branch: string;
  head: string;
  build: MainlineAReleaseBuildIdentityV626;
  boundary: MainlineAReleaseBoundaryV626;
  manifest: MainlineAReleaseManifestSnapshotV626;
  comparison: MainlineAReleaseAlignmentComparisonV626;
  sourceClosure: MainlineAReleaseSourceClosureV626;
  rightsClosure: MainlineAReleaseRightsClosureV626;
  runtimeClosure: MainlineAReleaseRuntimeClosureV626;
  gates: readonly MainlineAReleaseGateV626[];
  rollback: MainlineAReleaseRollbackV626;
  evidenceIndex: Readonly<Record<MainlineAReleaseEvidenceClassV626, readonly string[]>>;
  status: MainlineAReleaseGateStateV626;
  blockers: readonly string[];
  notes: readonly string[];
}>;

export function createMainlineAReleaseBoundaryV626(): MainlineAReleaseBoundaryV626 {
  return Object.freeze({
    candidateOnly: true,
    hold: true,
    notAdmitted: true,
    scientificPayloadWriteback: false,
    parentGitMutation: false,
    physicsKernelMutation: false,
    runtimePromotion: "closed",
  });
}

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

function count(value: unknown): number {
  const numberValue = typeof value === "number" ? value : Number(value);
  return Number.isSafeInteger(numberValue) && numberValue >= 0 ? numberValue : 0;
}

function bool(value: unknown): boolean {
  return value === true;
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => text(value)).filter(Boolean))].sort();
}

function freezeRecord<T extends Record<string, unknown>>(value: T): T {
  return Object.freeze(value);
}

export function normalizeMainlineAFileDigestV626(value: Partial<MainlineAFileDigestV626>): MainlineAFileDigestV626 {
  const rawKind = value.kind;
  const kind = rawKind === "source" || rawKind === "asset" || rawKind === "manifest" || rawKind === "package"
    ? rawKind
    : "unknown";
  return Object.freeze({
    relativePath: text(value.relativePath, "unknown"),
    bytes: count(value.bytes),
    sha256: text(value.sha256, "missing"),
    kind,
  });
}

export function normalizeMainlineABuildIdentityV626(value: Partial<MainlineAReleaseBuildIdentityV626> = {}): MainlineAReleaseBuildIdentityV626 {
  return Object.freeze({
    buildId: text(value.buildId, "unknown-build"),
    runtimeBuildId: text(value.runtimeBuildId, text(value.buildId, "unknown-build")),
    branch: text(value.branch, "unknown-branch"),
    head: text(value.head, "unknown-head"),
    profile: text(value.profile, "unknown-profile"),
    sourceStable: value.sourceStable === true,
    receiptPath: text(value.receiptPath, "missing"),
  });
}

export function normalizeMainlineARootMirrorV626(value: Partial<MainlineARootMirrorV626> = {}): MainlineARootMirrorV626 {
  const digestList = (entries: readonly MainlineAFileDigestV626[] | undefined): readonly MainlineAFileDigestV626[] =>
    Object.freeze((entries ?? []).map((entry) => normalizeMainlineAFileDigestV626(entry)));
  return Object.freeze({
    path: text(value.path, "unknown-root"),
    packageName: text(value.packageName, "unknown-package"),
    packageType: text(value.packageType, "unknown-type"),
    packageScripts: freezeRecord({ ...(value.packageScripts ?? {}) }),
    entrypoints: digestList(value.entrypoints),
    sourceFiles: digestList(value.sourceFiles),
    publicFiles: digestList(value.publicFiles),
    hasGitDirectory: value.hasGitDirectory === true,
    readable: value.readable === true,
    errors: Object.freeze(unique(value.errors ?? [])),
  });
}

export function normalizeMainlineANextWebMirrorV626(value: Partial<MainlineANextWebMirrorV626> = {}): MainlineANextWebMirrorV626 {
  const digestList = (entries: readonly MainlineAFileDigestV626[] | undefined): readonly MainlineAFileDigestV626[] =>
    Object.freeze((entries ?? []).map((entry) => normalizeMainlineAFileDigestV626(entry)));
  return Object.freeze({
    path: text(value.path, "unknown-next-web"),
    packageName: text(value.packageName, "unknown-package"),
    packageType: text(value.packageType, "unknown-type"),
    branch: text(value.branch, "unknown-branch"),
    head: text(value.head, "unknown-head"),
    build: normalizeMainlineABuildIdentityV626(value.build),
    sourceFiles: digestList(value.sourceFiles),
    runtimeFiles: digestList(value.runtimeFiles),
    manifests: digestList(value.manifests),
    readable: value.readable === true,
    errors: Object.freeze(unique(value.errors ?? [])),
  });
}

export function createMainlineAReleaseManifestSnapshotV626(value: Partial<MainlineAReleaseManifestSnapshotV626> = {}): MainlineAReleaseManifestSnapshotV626 {
  const schemas = unique(value.schemas ?? []);
  return Object.freeze({
    canonicalStars: count(value.canonicalStars),
    canonicalNebulae: count(value.canonicalNebulae),
    canonicalConstellations: count(value.canonicalConstellations),
    betaHeroStars: count(value.betaHeroStars),
    betaNebulaSources: count(value.betaNebulaSources),
    runtimeCleared: count(value.runtimeCleared),
    signoffPending: count(value.signoffPending),
    rightsPending: count(value.rightsPending),
    candidateOnly: bool(value.candidateOnly),
    hold: bool(value.hold),
    notAdmitted: bool(value.notAdmitted),
    scientificPayloadWriteback: value.scientificPayloadWriteback === true,
    schemas: Object.freeze(schemas),
  });
}

export function createMainlineASourceClosureV626(value: Partial<MainlineAReleaseSourceClosureV626> = {}): MainlineAReleaseSourceClosureV626 {
  const blockers = unique(value.blockers ?? []);
  const status = value.status === "passed" || value.status === "pending" || value.status === "blocked" || value.status === "not-run"
    ? value.status
    : blockers.length > 0 ? "blocked" : "pending";
  return Object.freeze({
    stellarRawResponses: count(value.stellarRawResponses),
    stellarStructuredCandidates: count(value.stellarStructuredCandidates),
    stellarComponentConfirmed: count(value.stellarComponentConfirmed),
    nebulaCaptured: count(value.nebulaCaptured),
    nebulaRightsPending: count(value.nebulaRightsPending),
    externalSourceEvidence: bool(value.externalSourceEvidence),
    sourceReferencesPresent: bool(value.sourceReferencesPresent),
    fixturePromotionDetected: bool(value.fixturePromotionDetected),
    syntheticResponseDetected: bool(value.syntheticResponseDetected),
    status,
    blockers: Object.freeze(blockers),
  });
}

export function createMainlineARightsClosureV626(value: Partial<MainlineAReleaseRightsClosureV626> = {}): MainlineAReleaseRightsClosureV626 {
  const blockers = unique(value.blockers ?? []);
  const status = value.status === "passed" || value.status === "pending" || value.status === "blocked" || value.status === "not-run"
    ? value.status
    : blockers.length > 0 ? "blocked" : "pending";
  return Object.freeze({
    canonicalRightsPending: count(value.canonicalRightsPending),
    nebulaRightsPending: count(value.nebulaRightsPending),
    signedItems: count(value.signedItems),
    rightsEvidencePresent: bool(value.rightsEvidencePresent),
    declaredLicensesPresent: bool(value.declaredLicensesPresent),
    status,
    blockers: Object.freeze(blockers),
  });
}

export function createMainlineARuntimeClosureV626(value: Partial<MainlineAReleaseRuntimeClosureV626> = {}): MainlineAReleaseRuntimeClosureV626 {
  const blockers = unique(value.blockers ?? []);
  const state = (candidate: MainlineAReleaseGateStateV626 | undefined): MainlineAReleaseGateStateV626 =>
    candidate === "passed" || candidate === "pending" || candidate === "blocked" || candidate === "not-run" || candidate === "not-applicable"
      ? candidate
      : "not-run";
  const status = value.status === "passed" || value.status === "pending" || value.status === "blocked" || value.status === "not-run"
    ? value.status
    : blockers.length > 0 ? "blocked" : "pending";
  return Object.freeze({
    canonicalCoveragePresent: bool(value.canonicalCoveragePresent),
    runtimeCleared: count(value.runtimeCleared),
    lifecycleEvidence: state(value.lifecycleEvidence),
    desktopBrowser: state(value.desktopBrowser),
    mobileViewport: state(value.mobileViewport),
    physicalMobile: state(value.physicalMobile),
    longRun: state(value.longRun),
    status,
    blockers: Object.freeze(blockers),
  });
}

function digestKey(entries: readonly MainlineAFileDigestV626[]): string {
  return entries
    .map((entry) => `${entry.relativePath}:${entry.bytes}:${entry.sha256}`)
    .sort()
    .join("|");
}

function packageKey(mirror: MainlineARootMirrorV626 | MainlineANextWebMirrorV626): string {
  return `${mirror.packageName}|${mirror.packageType}`;
}

export function compareMainlineAReleaseInputsV626(args: {
  root: MainlineARootMirrorV626;
  nextWeb: MainlineANextWebMirrorV626;
  manifestIdentityMatch?: boolean;
}): MainlineAReleaseAlignmentComparisonV626 {
  const root = normalizeMainlineARootMirrorV626(args.root);
  const nextWeb = normalizeMainlineANextWebMirrorV626(args.nextWeb);
  const issues: MainlineAReleaseAlignmentIssueV626[] = [];
  if (!root.readable) issues.push({ code: "root-unreadable", severity: "error", detail: root.errors.join("; ") || "root mirror could not be read", evidenceClass: "static" });
  if (!nextWeb.readable) issues.push({ code: "next-web-unreadable", severity: "error", detail: nextWeb.errors.join("; ") || "next-web could not be read", evidenceClass: "static" });
  if (root.hasGitDirectory) issues.push({ code: "root-git-boundary", severity: "error", detail: "root mirror contains a Git directory; R66 refuses parent Git operations", evidenceClass: "static" });
  const packageIdentityMatch = packageKey(root) === packageKey(nextWeb);
  if (!packageIdentityMatch) issues.push({ code: "package-identity", severity: "warning", detail: `root=${packageKey(root)} next-web=${packageKey(nextWeb)}`, evidenceClass: "static" });
  const sourceIdentityMatch = digestKey(root.sourceFiles) === digestKey(nextWeb.sourceFiles);
  if (!sourceIdentityMatch) issues.push({ code: "source-identity-diff", severity: "info", detail: "root and next-web are separate code lines with different source digests", evidenceClass: "static" });
  const buildIdentityMatch = nextWeb.build.sourceStable && nextWeb.build.buildId !== "unknown-build" && nextWeb.build.head !== "unknown-head";
  if (!buildIdentityMatch) issues.push({ code: "build-identity-missing", severity: "error", detail: "next-web build identity is not bound to a preserved build receipt", evidenceClass: "static" });
  const manifestIdentityMatch = args.manifestIdentityMatch === true;
  if (!manifestIdentityMatch) issues.push({ code: "manifest-identity-pending", severity: "warning", detail: "release manifests are not identical to the root mirror; parity remains an explicit review gate", evidenceClass: "static" });
  const hasError = issues.some((issue) => issue.severity === "error");
  return Object.freeze({
    root,
    nextWeb,
    packageIdentityMatch,
    sourceIdentityMatch,
    buildIdentityMatch,
    manifestIdentityMatch,
    issues: Object.freeze(issues),
    status: hasError ? "blocked" : issues.length > 0 ? "pending" : "passed",
  });
}

export function deriveMainlineASourceClosureV626(args: {
  stellar?: Record<string, unknown> | null;
  rawLedger?: Record<string, unknown> | null;
  nebula?: Record<string, unknown> | null;
  canonical?: Record<string, unknown> | null;
}): MainlineAReleaseSourceClosureV626 {
  const stellarCounts = (args.stellar?.counts ?? {}) as Record<string, unknown>;
  const rawCounts = (args.rawLedger?.counts ?? {}) as Record<string, unknown>;
  const nebulaCounts = (args.nebula?.counts ?? {}) as Record<string, unknown>;
  const blockers: string[] = [];
  const stellarRawResponses = count(rawCounts.responseCaptured ?? (args.stellar as Record<string, unknown> | undefined)?.responseCaptured ?? stellarCounts.responseCaptured ?? stellarCounts.rawResponsesCaptured ?? stellarCounts.captured);
  const stellarStructuredCandidates = count(stellarCounts.parsedCandidates ?? stellarCounts.parsedCandidate ?? stellarCounts.structured);
  const stellarComponentConfirmed = count(stellarCounts.componentConfirmed);
  const nebulaCaptured = count(nebulaCounts.captured);
  const nebulaRightsPending = count(nebulaCounts.rightsPending);
  if (stellarRawResponses < 4) blockers.push("stellar-raw-response-closure-pending");
  if (stellarStructuredCandidates < 4) blockers.push("stellar-structured-candidate-closure-pending");
  if (stellarComponentConfirmed < 4) blockers.push("stellar-component-identity-pending");
  if (nebulaCaptured < 24) blockers.push("beta-nebula-source-closure-pending");
  if (nebulaRightsPending > 0) blockers.push("nebula-rights-review-pending");
  const serialized = JSON.stringify([args.stellar, args.nebula, args.canonical]);
  const fixturePromotionDetected = /fixture|synthetic/i.test(serialized) && /promot|admit|writeback/i.test(serialized);
  const syntheticResponseDetected = /synthetic-response|generated-response/i.test(serialized);
  if (fixturePromotionDetected) blockers.push("fixture-promotion-detected");
  if (syntheticResponseDetected) blockers.push("synthetic-response-detected");
  const sourceReferencesPresent = [args.stellar, args.rawLedger, args.nebula].every((value) => value !== null && value !== undefined);
  if (!sourceReferencesPresent) blockers.push("source-ledger-missing");
  const externalSourceEvidence = nebulaCaptured > 0 || stellarRawResponses > 0;
  return createMainlineASourceClosureV626({
    stellarRawResponses,
    stellarStructuredCandidates,
    stellarComponentConfirmed,
    nebulaCaptured,
    nebulaRightsPending,
    externalSourceEvidence,
    sourceReferencesPresent,
    fixturePromotionDetected,
    syntheticResponseDetected,
    status: blockers.length === 0 ? "passed" : "blocked",
    blockers,
  });
}

export function deriveMainlineARightsClosureV626(args: {
  canonical?: Record<string, unknown> | null;
  nebula?: Record<string, unknown> | null;
}): MainlineAReleaseRightsClosureV626 {
  const canonicalCounts = (args.canonical?.counts ?? {}) as Record<string, unknown>;
  const nebulaCounts = (args.nebula?.counts ?? {}) as Record<string, unknown>;
  const canonicalRightsPending = count(canonicalCounts.rightsPending);
  const nebulaRightsPending = count(nebulaCounts.rightsPending);
  const blockers: string[] = [];
  if (canonicalRightsPending > 0) blockers.push("canonical-rights-signoff-pending");
  if (nebulaRightsPending > 0) blockers.push("nebula-rights-signoff-pending");
  const serialized = JSON.stringify([args.canonical, args.nebula]);
  const rightsEvidencePresent = /license|rights|credit|copyright/i.test(serialized);
  const declaredLicensesPresent = /licenseUrl|declaredLicense|license/i.test(serialized);
  if (!rightsEvidencePresent) blockers.push("rights-ledger-missing");
  if (!declaredLicensesPresent) blockers.push("declared-license-missing");
  const signedItems = Math.max(0, count(canonicalCounts.total) - canonicalRightsPending) + Math.max(0, count(nebulaCounts.total) - nebulaRightsPending);
  return createMainlineARightsClosureV626({
    canonicalRightsPending,
    nebulaRightsPending,
    signedItems,
    rightsEvidencePresent,
    declaredLicensesPresent,
    status: blockers.length === 0 ? "passed" : "blocked",
    blockers,
  });
}

export function deriveMainlineARuntimeClosureV626(args: {
  canonical?: Record<string, unknown> | null;
  performance?: Record<string, unknown> | null;
}): MainlineAReleaseRuntimeClosureV626 {
  const canonicalCounts = (args.canonical?.counts ?? {}) as Record<string, unknown>;
  const performance = args.performance ?? {};
  const blockers: string[] = [];
  const runtimeCleared = count(canonicalCounts.runtimeCleared);
  const canonicalCoveragePresent = count(canonicalCounts.stars) === 12 && count(canonicalCounts.nebulae) === 12 && count(canonicalCounts.constellations) === 12;
  if (!canonicalCoveragePresent) blockers.push("canonical-12-12-12-missing");
  if (runtimeCleared < 36) blockers.push("canonical-runtime-clearance-pending");
  const performanceStatus = text(performance.status, "not-run");
  const desktopBrowser = performanceStatus === "measured" ? "passed" : performanceStatus === "blocked" ? "blocked" : "not-run";
  const mobileViewport = Array.isArray(performance.runs) && performance.runs.some((run) => (run as Record<string, unknown>).device === "mobile") ? "passed" : "not-run";
  const physicalMobile = (performance.blockers as unknown[] | undefined)?.includes("physical-device-not-run") ? "blocked" : "not-run";
  const longRun = (performance.blockers as unknown[] | undefined)?.includes("long-run-observation-required") ? "blocked" : "not-run";
  if (physicalMobile === "blocked") blockers.push("physical-mobile-not-run");
  if (longRun === "blocked") blockers.push("long-run-not-run");
  if (performanceStatus === "blocked") blockers.push("performance-receipt-blocked");
  const lifecycleEvidence = Array.isArray(performance.runs) && performance.runs.length > 0
    ? performance.runs.every((run) => (run as Record<string, unknown>).resources && ((run as Record<string, unknown>).resources as Record<string, unknown>).status === "baseline") ? "passed" : "blocked"
    : "not-run";
  return createMainlineARuntimeClosureV626({
    canonicalCoveragePresent,
    runtimeCleared,
    lifecycleEvidence,
    desktopBrowser,
    mobileViewport,
    physicalMobile,
    longRun,
    status: blockers.length === 0 ? "passed" : "blocked",
    blockers,
  });
}

export function createMainlineAReleaseGatesV626(args: {
  comparison: MainlineAReleaseAlignmentComparisonV626;
  source: MainlineAReleaseSourceClosureV626;
  rights: MainlineAReleaseRightsClosureV626;
  runtime: MainlineAReleaseRuntimeClosureV626;
  staticChecks?: MainlineAReleaseGateStateV626;
  httpChecks?: MainlineAReleaseGateStateV626;
  visualChecks?: MainlineAReleaseGateStateV626;
}): readonly MainlineAReleaseGateV626[] {
  const gate = (id: string, label: string, state: MainlineAReleaseGateStateV626, evidenceClass: MainlineAReleaseEvidenceClassV626, required: boolean, blockers: readonly string[] = []): MainlineAReleaseGateV626 => Object.freeze({ id, label, state, evidenceClass, required, blockers: Object.freeze(unique(blockers)) });
  return Object.freeze([
    gate("root-readonly", "root mirror read-only boundary", args.comparison.root.readable && !args.comparison.root.hasGitDirectory ? "passed" : "blocked", "static", true, args.comparison.root.errors),
    gate("next-web-source", "next-web source readable", args.comparison.nextWeb.readable ? "passed" : "blocked", "static", true, args.comparison.nextWeb.errors),
    gate("build-identity", "preserved build identity", args.comparison.buildIdentityMatch ? "passed" : "blocked", "static", true, args.comparison.issues.filter((issue) => issue.code.includes("build")).map((issue) => issue.code)),
    gate("canonical-coverage", "12/12/12 canonical coverage", args.runtime.canonicalCoveragePresent ? "passed" : "blocked", "static", true, args.runtime.blockers.filter((blocker) => blocker.includes("canonical"))),
    gate("external-source", "source ledger closure", args.source.status, "external-source", true, args.source.blockers),
    gate("rights", "rights and copyright closure", args.rights.status, "external-source", true, args.rights.blockers),
    gate("static", "static contract audit", args.staticChecks ?? "passed", "static", true),
    gate("http", "local production HTTP", args.httpChecks ?? "not-run", "http", true),
    gate("visual", "visual evidence", args.visualChecks ?? "not-run", "visual", true),
    gate("desktop-browser", "desktop browser evidence", args.runtime.desktopBrowser, "browser", true),
    gate("mobile-viewport", "mobile viewport evidence", args.runtime.mobileViewport, "browser", true),
    gate("performance", "performance and lifecycle evidence", args.runtime.status, "performance", true, args.runtime.blockers),
    gate("physical-mobile", "physical mobile device", args.runtime.physicalMobile, "performance", false, args.runtime.physicalMobile === "blocked" ? ["physical-device-not-run"] : []),
    gate("long-run", "long-run soak", args.runtime.longRun, "performance", false, args.runtime.longRun === "blocked" ? ["long-run-observation-required"] : []),
    gate("manifest-parity", "root/next-web manifest parity", args.comparison.manifestIdentityMatch ? "passed" : "pending", "static", true, args.comparison.manifestIdentityMatch ? [] : ["manifest-identity-pending"]),
  ]);
}

export function createMainlineARollbackV626(args: {
  packageId: string;
  baseline?: string;
  build: MainlineAReleaseBuildIdentityV626;
}): MainlineAReleaseRollbackV626 {
  const baseline = text(args.baseline, "156ec7790a99be2f89f5d8f44831cb118c9437e1");
  return Object.freeze({
    packageId: text(args.packageId, "mainline-a-r66-pending"),
    baseline,
    activeBuildId: args.build.buildId,
    activeBranch: args.build.branch,
    activeHead: args.build.head,
    preservedBuildReceipt: args.build.receiptPath,
    rollbackSteps: Object.freeze([
      "Stop serving the active preserved build directory.",
      "Restore the previously preserved build receipt and its dist directory.",
      "Re-run the release alignment audit in --check mode.",
      "Keep candidate-only, hold, not-admitted and scientificPayloadWriteback=false unchanged.",
      "Do not mutate the parent repository or any physics kernel.",
    ]),
    forbiddenActions: Object.freeze([
      "git reset", "git clean", "git checkout", "parent repository commit", "scientific payload writeback", "candidate promotion",
    ]),
    reversible: true,
  });
}

export function createMainlineAReleasePackageV626(args: {
  packageId: string;
  generatedAt: string;
  workspace: string;
  rootMirror: string;
  branch: string;
  head: string;
  build: MainlineAReleaseBuildIdentityV626;
  manifest: MainlineAReleaseManifestSnapshotV626;
  comparison: MainlineAReleaseAlignmentComparisonV626;
  sourceClosure: MainlineAReleaseSourceClosureV626;
  rightsClosure: MainlineAReleaseRightsClosureV626;
  runtimeClosure: MainlineAReleaseRuntimeClosureV626;
  gates: readonly MainlineAReleaseGateV626[];
  evidenceIndex: Readonly<Record<MainlineAReleaseEvidenceClassV626, readonly string[]>>;
  baseline?: string;
  notes?: readonly string[];
}): MainlineAReleasePackageV626 {
  const blockers = unique([
    ...args.comparison.issues.filter((issue) => issue.severity !== "info").map((issue) => issue.code),
    ...args.sourceClosure.blockers,
    ...args.rightsClosure.blockers,
    ...args.runtimeClosure.blockers,
    ...args.gates.filter((gate) => gate.required && gate.state !== "passed").flatMap((gate) => gate.blockers.length > 0 ? gate.blockers : [gate.id]),
  ]);
  const status = blockers.length === 0 ? "passed" : "blocked";
  const boundary = createMainlineAReleaseBoundaryV626();
  return Object.freeze({
    schema: MAINLINE_A_RELEASE_PACKAGE_SCHEMA_V626,
    version: MAINLINE_A_RELEASE_ALIGNMENT_VERSION_V626,
    packageId: text(args.packageId, "mainline-a-r66-pending"),
    generatedAt: text(args.generatedAt, new Date(0).toISOString()),
    workspace: text(args.workspace, "unknown-workspace"),
    rootMirror: text(args.rootMirror, "unknown-root"),
    branch: text(args.branch, "unknown-branch"),
    head: text(args.head, "unknown-head"),
    build: normalizeMainlineABuildIdentityV626(args.build),
    boundary,
    manifest: createMainlineAReleaseManifestSnapshotV626(args.manifest),
    comparison: args.comparison,
    sourceClosure: args.sourceClosure,
    rightsClosure: args.rightsClosure,
    runtimeClosure: args.runtimeClosure,
    gates: Object.freeze([...args.gates]),
    rollback: createMainlineARollbackV626({ packageId: args.packageId, baseline: args.baseline, build: args.build }),
    evidenceIndex: Object.freeze({
      static: Object.freeze([...(args.evidenceIndex.static ?? [])]),
      http: Object.freeze([...(args.evidenceIndex.http ?? [])]),
      visual: Object.freeze([...(args.evidenceIndex.visual ?? [])]),
      browser: Object.freeze([...(args.evidenceIndex.browser ?? [])]),
      performance: Object.freeze([...(args.evidenceIndex.performance ?? [])]),
      "external-source": Object.freeze([...(args.evidenceIndex["external-source"] ?? [])]),
      "release-package": Object.freeze([...(args.evidenceIndex["release-package"] ?? [])]),
    }),
    status,
    blockers: Object.freeze(blockers),
    notes: Object.freeze(unique([
      MAINLINE_A_RELEASE_BOUNDARY_V626,
      "A release package is a manifest and rollback contract; it is not public deployment, legal clearance, scientific validation, production performance, or real-user validation.",
      ...(args.notes ?? []),
    ])),
  });
}

function stableMainlineAReleaseValueV626(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableMainlineAReleaseValueV626);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => [key, stableMainlineAReleaseValueV626(entry)]));
  }
  return value;
}

export function stableMainlineAReleaseJsonV626(value: unknown): string {
  return JSON.stringify(stableMainlineAReleaseValueV626(value));
}

export function digestMainlineAReleaseValueV626(value: unknown): string {
  const textValue = stableMainlineAReleaseJsonV626(value);
  let hash = 0x811c9dc5;
  for (let index = 0; index < textValue.length; index += 1) {
    hash ^= textValue.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

export function assertMainlineAReleaseBoundaryV626(packageValue: Pick<MainlineAReleasePackageV626, "boundary">): void {
  const boundary = packageValue.boundary;
  if (!boundary.candidateOnly || !boundary.hold || !boundary.notAdmitted || boundary.scientificPayloadWriteback || boundary.parentGitMutation || boundary.physicsKernelMutation || boundary.runtimePromotion !== "closed") {
    throw new Error("R66 release package crossed a protected boundary");
  }
}

export function releaseGateSummaryV626(gates: readonly MainlineAReleaseGateV626[]): Readonly<{ passed: number; pending: number; blocked: number; notRun: number; requiredOpen: number }> {
  const passed = gates.filter((gate) => gate.state === "passed").length;
  const pending = gates.filter((gate) => gate.state === "pending").length;
  const blocked = gates.filter((gate) => gate.state === "blocked").length;
  const notRun = gates.filter((gate) => gate.state === "not-run").length;
  const requiredOpen = gates.filter((gate) => gate.required && gate.state !== "passed").length;
  return Object.freeze({ passed, pending, blocked, notRun, requiredOpen });
}

export function createMainlineAReleaseCsvV626(packageValue: MainlineAReleasePackageV626): string {
  const header = "gateId,label,state,evidenceClass,required,blockers";
  const rows = packageValue.gates.map((gate) => [gate.id, gate.label, gate.state, gate.evidenceClass, gate.required, gate.blockers.join("|")].map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","));
  return [header, ...rows].join("\n");
}

export function isMainlineAReleasePackageClosedV626(packageValue: MainlineAReleasePackageV626): boolean {
  return packageValue.status === "passed" && releaseGateSummaryV626(packageValue.gates).requiredOpen === 0;
}

export function expectedMainlineAReleaseCountsV626(): typeof MAINLINE_A_EXPECTED_COUNTS_V626 {
  return MAINLINE_A_EXPECTED_COUNTS_V626;
}
