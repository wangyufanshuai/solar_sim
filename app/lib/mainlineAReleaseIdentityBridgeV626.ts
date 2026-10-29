export const MAINLINE_A_RELEASE_IDENTITY_BRIDGE_SCHEMA_V626 =
  "mainline-a-release-identity-bridge-v626" as const;
export const MAINLINE_A_RELEASE_IDENTITY_BRIDGE_VERSION_V626 =
  "v626-mainline-a-release-identity-bridge" as const;
export const MAINLINE_A_RELEASE_IDENTITY_V626 = "solar-sim-mainline-a" as const;
export const MAINLINE_A_RELEASE_IDENTITY_BOUNDARY_V626 =
  "The identity bridge maps a read-only root mirror to next-web release metadata. It does not claim source parity, legal clearance, scientific validity, production performance, or candidate promotion, and it never mutates the parent Git repository or physics kernels." as const;

export type MainlineAIdentityEvidenceClassV626 =
  | "root-package"
  | "next-web-package"
  | "source-digest"
  | "build-receipt"
  | "manifest"
  | "rollback";

export type MainlineAIdentityGateStateV626 =
  | "passed"
  | "pending"
  | "blocked"
  | "not-run";

export type MainlineAIdentityBoundaryV626 = Readonly<{
  candidateOnly: true;
  hold: true;
  notAdmitted: true;
  scientificPayloadWriteback: false;
  parentGitMutation: false;
  physicsKernelMutation: false;
  runtimePromotion: "closed";
}>;

export type MainlineAPackageIdentityV626 = Readonly<{
  packageName: string;
  releaseIdentity: string;
  packageType: string;
  packageVersion: string;
  lockSha256: string | null;
  packageSha256: string | null;
  runtimeName: string;
  releaseIdentityDeclared: boolean;
  path: string;
  evidenceClass: MainlineAIdentityEvidenceClassV626;
}>;

export type MainlineASourceDigestV626 = Readonly<{
  path: string;
  bytes: number;
  sha256: string;
  kind: "source" | "asset" | "manifest" | "package";
}>;

export type MainlineASourceIdentityV626 = Readonly<{
  inputSha256: string;
  entries: readonly MainlineASourceDigestV626[];
  entryCount: number;
  sourceStable: boolean;
  readOnly: boolean;
  hasGitDirectory: boolean;
  manifestPresent: boolean;
  manifestSha256: string | null;
}>;

export type MainlineABuildIdentityBridgeV626 = Readonly<{
  nextBuildId: string;
  runtimeBuildId: string;
  branch: string;
  head: string;
  profile: string;
  sourceStable: boolean;
  receiptPath: string;
  receiptSha256: string | null;
  evidenceClass: "build-receipt";
}>;

export type MainlineAIdentityMappingV626 = Readonly<{
  rootReleaseIdentity: string;
  nextWebReleaseIdentity: string;
  releaseIdentityMatch: boolean;
  rootRuntimeName: string;
  nextWebRuntimeName: string;
  runtimeNameMatch: boolean;
  runtimeNameDifferenceIntentional: boolean;
  sourceDigestMatch: boolean;
  sourceDigestRelation: "same" | "different-code-lines" | "missing";
  rootBuildIdentityPresent: boolean;
  nextWebBuildIdentityPresent: boolean;
  buildIdentityRelation: "next-web-bound" | "root-missing" | "both-missing";
}>;

export type MainlineAIdentityIssueV626 = Readonly<{
  code: string;
  severity: "info" | "warning" | "error";
  detail: string;
  evidenceClass: MainlineAIdentityEvidenceClassV626;
}>;

export type MainlineAIdentityGateV626 = Readonly<{
  id: string;
  label: string;
  state: MainlineAIdentityGateStateV626;
  required: boolean;
  evidenceClass: MainlineAIdentityEvidenceClassV626;
  blockers: readonly string[];
  notes: readonly string[];
}>;

export type MainlineAIdentityRollbackV626 = Readonly<{
  baselineCommit: string;
  currentHead: string;
  preservedBuildReceipt: string;
  releaseIdentity: string;
  steps: readonly string[];
  forbiddenActions: readonly string[];
  reversible: boolean;
}>;

export type MainlineAIdentityBridgeReceiptV626 = Readonly<{
  schema: typeof MAINLINE_A_RELEASE_IDENTITY_BRIDGE_SCHEMA_V626;
  version: typeof MAINLINE_A_RELEASE_IDENTITY_BRIDGE_VERSION_V626;
  generatedAt: string;
  workspace: string;
  rootMirror: string;
  boundary: MainlineAIdentityBoundaryV626;
  rootPackage: MainlineAPackageIdentityV626;
  nextWebPackage: MainlineAPackageIdentityV626;
  rootSource: MainlineASourceIdentityV626;
  nextWebSource: MainlineASourceIdentityV626;
  build: MainlineABuildIdentityBridgeV626;
  mapping: MainlineAIdentityMappingV626;
  gates: readonly MainlineAIdentityGateV626[];
  rollback: MainlineAIdentityRollbackV626;
  evidenceIndex: Readonly<Record<MainlineAIdentityEvidenceClassV626, readonly string[]>>;
  status: MainlineAIdentityGateStateV626;
  blockers: readonly string[];
  notes: readonly string[];
}>;

export function createMainlineAIdentityBoundaryV626(): MainlineAIdentityBoundaryV626 {
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

function stringValue(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

function integerValue(value: unknown, fallback = 0): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : fallback;
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => stringValue(value)).filter(Boolean))].sort();
}

function freezeEntries(entries: readonly MainlineASourceDigestV626[]): readonly MainlineASourceDigestV626[] {
  return Object.freeze(entries.map((entry) => Object.freeze({
    path: stringValue(entry.path, "unknown"),
    bytes: integerValue(entry.bytes),
    sha256: stringValue(entry.sha256, "missing"),
    kind: entry.kind === "source" || entry.kind === "asset" || entry.kind === "manifest" || entry.kind === "package" ? entry.kind : "source",
  })));
}

export function normalizeMainlineAPackageIdentityV626(
  value: Partial<MainlineAPackageIdentityV626> = {},
  evidenceClass: MainlineAIdentityEvidenceClassV626 = "next-web-package",
): MainlineAPackageIdentityV626 {
  const runtimeName = stringValue(value.runtimeName, stringValue(value.packageName, "unknown-package"));
  const releaseIdentity = stringValue(value.releaseIdentity, runtimeName);
  return Object.freeze({
    packageName: stringValue(value.packageName, "unknown-package"),
    releaseIdentity,
    packageType: stringValue(value.packageType, "unknown-type"),
    packageVersion: stringValue(value.packageVersion, "absent"),
    lockSha256: value.lockSha256 ? stringValue(value.lockSha256) : null,
    packageSha256: value.packageSha256 ? stringValue(value.packageSha256) : null,
    runtimeName,
    releaseIdentityDeclared: value.releaseIdentityDeclared === true,
    path: stringValue(value.path, "unknown-path"),
    evidenceClass,
  });
}

export function normalizeMainlineASourceIdentityV626(
  value: Partial<MainlineASourceIdentityV626> = {},
): MainlineASourceIdentityV626 {
  const entries = freezeEntries(value.entries ?? []);
  return Object.freeze({
    inputSha256: stringValue(value.inputSha256, "missing"),
    entries,
    entryCount: integerValue(value.entryCount, entries.length),
    sourceStable: value.sourceStable === true,
    readOnly: value.readOnly === true,
    hasGitDirectory: value.hasGitDirectory === true,
    manifestPresent: value.manifestPresent === true,
    manifestSha256: value.manifestSha256 ? stringValue(value.manifestSha256) : null,
  });
}

export function normalizeMainlineABuildIdentityBridgeV626(
  value: Partial<MainlineABuildIdentityBridgeV626> = {},
): MainlineABuildIdentityBridgeV626 {
  return Object.freeze({
    nextBuildId: stringValue(value.nextBuildId, "unknown-build"),
    runtimeBuildId: stringValue(value.runtimeBuildId, "unknown-runtime-build"),
    branch: stringValue(value.branch, "unknown-branch"),
    head: stringValue(value.head, "unknown-head"),
    profile: stringValue(value.profile, "unknown-profile"),
    sourceStable: value.sourceStable === true,
    receiptPath: stringValue(value.receiptPath, "missing"),
    receiptSha256: value.receiptSha256 ? stringValue(value.receiptSha256) : null,
    evidenceClass: "build-receipt",
  });
}

export function createMainlineAIdentityMappingV626(value: Partial<MainlineAIdentityMappingV626> = {}): MainlineAIdentityMappingV626 {
  const sourceDigestRelation = value.sourceDigestRelation === "same" || value.sourceDigestRelation === "different-code-lines" || value.sourceDigestRelation === "missing"
    ? value.sourceDigestRelation
    : "missing";
  const buildIdentityRelation = value.buildIdentityRelation === "next-web-bound" || value.buildIdentityRelation === "root-missing" || value.buildIdentityRelation === "both-missing"
    ? value.buildIdentityRelation
    : "both-missing";
  return Object.freeze({
    rootReleaseIdentity: stringValue(value.rootReleaseIdentity, "unknown-release-identity"),
    nextWebReleaseIdentity: stringValue(value.nextWebReleaseIdentity, "unknown-release-identity"),
    releaseIdentityMatch: value.releaseIdentityMatch === true,
    rootRuntimeName: stringValue(value.rootRuntimeName, "unknown-root-runtime"),
    nextWebRuntimeName: stringValue(value.nextWebRuntimeName, "unknown-next-web-runtime"),
    runtimeNameMatch: value.runtimeNameMatch === true,
    runtimeNameDifferenceIntentional: value.runtimeNameDifferenceIntentional === true,
    sourceDigestMatch: value.sourceDigestMatch === true,
    sourceDigestRelation,
    rootBuildIdentityPresent: value.rootBuildIdentityPresent === true,
    nextWebBuildIdentityPresent: value.nextWebBuildIdentityPresent === true,
    buildIdentityRelation,
  });
}

export function compareMainlineAIdentityV626(args: {
  rootPackage: MainlineAPackageIdentityV626;
  nextWebPackage: MainlineAPackageIdentityV626;
  rootSource: MainlineASourceIdentityV626;
  nextWebSource: MainlineASourceIdentityV626;
  build: MainlineABuildIdentityBridgeV626;
}): Readonly<{ mapping: MainlineAIdentityMappingV626; issues: readonly MainlineAIdentityIssueV626[]; status: MainlineAIdentityGateStateV626 }> {
  const rootPackage = normalizeMainlineAPackageIdentityV626(args.rootPackage, "root-package");
  const nextWebPackage = normalizeMainlineAPackageIdentityV626(args.nextWebPackage, "next-web-package");
  const rootSource = normalizeMainlineASourceIdentityV626(args.rootSource);
  const nextWebSource = normalizeMainlineASourceIdentityV626(args.nextWebSource);
  const build = normalizeMainlineABuildIdentityBridgeV626(args.build);
  const issues: MainlineAIdentityIssueV626[] = [];
  const releaseIdentityMatch = rootPackage.releaseIdentity === nextWebPackage.releaseIdentity && rootPackage.releaseIdentity !== "unknown-release-identity";
  const runtimeNameMatch = rootPackage.runtimeName === nextWebPackage.runtimeName;
  const runtimeNameDifferenceIntentional = !runtimeNameMatch && nextWebPackage.releaseIdentityDeclared && releaseIdentityMatch;
  const sourceDigestMatch = rootSource.inputSha256 === nextWebSource.inputSha256 && rootSource.inputSha256 !== "missing";
  const sourceDigestRelation = sourceDigestMatch ? "same" : rootSource.inputSha256 === "missing" || nextWebSource.inputSha256 === "missing" ? "missing" : "different-code-lines";
  const nextWebBuildIdentityPresent = build.nextBuildId !== "unknown-build" && build.runtimeBuildId !== "unknown-runtime-build" && build.head !== "unknown-head" && build.sourceStable;
  const rootBuildIdentityPresent = false;
  const buildIdentityRelation = nextWebBuildIdentityPresent ? "root-missing" : rootBuildIdentityPresent ? "next-web-bound" : "both-missing";
  if (!releaseIdentityMatch) issues.push({ code: "release-identity-mismatch", severity: "error", detail: `root=${rootPackage.releaseIdentity} next-web=${nextWebPackage.releaseIdentity}`, evidenceClass: "root-package" });
  if (!runtimeNameMatch) issues.push({ code: "runtime-package-name-diff", severity: runtimeNameDifferenceIntentional ? "info" : "warning", detail: `root runtime=${rootPackage.runtimeName} next-web runtime=${nextWebPackage.runtimeName}`, evidenceClass: "next-web-package" });
  if (!sourceDigestMatch) issues.push({ code: "source-lines-differ", severity: "info", detail: sourceDigestRelation === "missing" ? "one source digest is unavailable" : "root and next-web remain separate source trees", evidenceClass: "source-digest" });
  if (!nextWebBuildIdentityPresent) issues.push({ code: "next-web-build-identity-missing", severity: "error", detail: "next-web preserved build identity is incomplete or unstable", evidenceClass: "build-receipt" });
  if (!rootSource.readOnly || rootSource.hasGitDirectory) issues.push({ code: "root-read-only-boundary", severity: "error", detail: "root input must be read-only and must not expose a Git directory", evidenceClass: "root-package" });
  const mapping = createMainlineAIdentityMappingV626({
    rootReleaseIdentity: rootPackage.releaseIdentity,
    nextWebReleaseIdentity: nextWebPackage.releaseIdentity,
    releaseIdentityMatch,
    rootRuntimeName: rootPackage.runtimeName,
    nextWebRuntimeName: nextWebPackage.runtimeName,
    runtimeNameMatch,
    runtimeNameDifferenceIntentional,
    sourceDigestMatch,
    sourceDigestRelation,
    rootBuildIdentityPresent,
    nextWebBuildIdentityPresent,
    buildIdentityRelation,
  });
  const status = issues.some((issue) => issue.severity === "error") ? "blocked" : issues.length > 0 ? "pending" : "passed";
  return Object.freeze({ mapping, issues: Object.freeze(issues), status });
}

export function createMainlineAIdentityGatesV626(args: {
  comparison: Readonly<{ mapping: MainlineAIdentityMappingV626; issues: readonly MainlineAIdentityIssueV626[]; status: MainlineAIdentityGateStateV626 }>;
  rootSource: MainlineASourceIdentityV626;
  nextWebSource: MainlineASourceIdentityV626;
  build: MainlineABuildIdentityBridgeV626;
  manifestParity: MainlineAIdentityGateStateV626;
}): readonly MainlineAIdentityGateV626[] {
  const issueCodes = (filter: (issue: MainlineAIdentityIssueV626) => boolean): readonly string[] => Object.freeze(unique(args.comparison.issues.filter(filter).map((issue) => issue.code)));
  const gate = (id: string, label: string, state: MainlineAIdentityGateStateV626, required: boolean, evidenceClass: MainlineAIdentityEvidenceClassV626, blockers: readonly string[], notes: readonly string[] = []): MainlineAIdentityGateV626 => Object.freeze({ id, label, state, required, evidenceClass, blockers: Object.freeze(unique(blockers)), notes: Object.freeze(unique(notes)) });
  const identityState = args.comparison.mapping.releaseIdentityMatch ? "passed" : "blocked";
  const runtimeNameNotes = args.comparison.mapping.runtimeNameDifferenceIntentional ? ["Runtime package names differ but both lines declare the same Mainline A release identity."] : [];
  const sourceState = args.rootSource.inputSha256 !== "missing" && args.nextWebSource.inputSha256 !== "missing" ? "passed" : "blocked";
  const buildState = args.build.sourceStable && args.build.nextBuildId !== "unknown-build" ? "passed" : "blocked";
  return Object.freeze([
    gate("release-identity", "Mainline A release identity", identityState, true, "root-package", identityState === "passed" ? [] : ["release-identity-mismatch"], runtimeNameNotes),
    gate("runtime-package-names", "runtime package names recorded", args.comparison.mapping.runtimeNameDifferenceIntentional ? "passed" : args.comparison.mapping.runtimeNameMatch ? "passed" : "pending", false, "next-web-package", [], runtimeNameNotes),
    gate("root-source-digest", "root source digest read-only", sourceState, true, "source-digest", sourceState === "passed" ? [] : ["root-source-digest-missing"]),
    gate("next-web-source-digest", "next-web source digest stable", args.nextWebSource.sourceStable ? "passed" : "blocked", true, "source-digest", args.nextWebSource.sourceStable ? [] : ["next-web-source-unstable"]),
    gate("source-parity", "source parity classification", args.comparison.mapping.sourceDigestRelation === "different-code-lines" ? "pending" : args.comparison.mapping.sourceDigestRelation === "same" ? "passed" : "blocked", true, "source-digest", args.comparison.mapping.sourceDigestRelation === "different-code-lines" ? ["different-code-lines-require-review"] : args.comparison.mapping.sourceDigestRelation === "missing" ? ["source-digest-missing"] : [], ["Different source digests are reported explicitly and never treated as identical."]),
    gate("build-identity", "next-web preserved build identity", buildState, true, "build-receipt", buildState === "passed" ? [] : ["build-identity-missing"]),
    gate("root-build-identity", "root build identity", args.comparison.mapping.rootBuildIdentityPresent ? "passed" : "pending", false, "build-receipt", args.comparison.mapping.rootBuildIdentityPresent ? [] : ["root-build-receipt-not-provided"], ["The root mirror has no independent signed build receipt."]),
    gate("manifest-parity", "root/next-web manifest parity", args.manifestParity, true, "manifest", args.manifestParity === "passed" ? [] : ["root-manifest-not-present"]),
    gate("boundary", "release identity boundary", "passed", true, "rollback", [], [MAINLINE_A_RELEASE_IDENTITY_BOUNDARY_V626]),
    gate("rollback", "reversible rollback metadata", "passed", true, "rollback", [], ["Rollback references preserved build directories and does not issue destructive Git commands."]),
    gate("comparison-issues", "comparison issues are classified", args.comparison.status === "blocked" ? "blocked" : args.comparison.issues.length === 0 ? "passed" : "pending", false, "source-digest", issueCodes((issue) => issue.severity === "error"), args.comparison.issues.map((issue) => issue.detail)),
  ]);
}

export function createMainlineAIdentityRollbackV626(args: {
  baselineCommit?: string;
  currentHead?: string;
  preservedBuildReceipt?: string;
} = {}): MainlineAIdentityRollbackV626 {
  return Object.freeze({
    baselineCommit: stringValue(args.baselineCommit, "af61a2f"),
    currentHead: stringValue(args.currentHead, "unknown-head"),
    preservedBuildReceipt: stringValue(args.preservedBuildReceipt, "missing"),
    releaseIdentity: MAINLINE_A_RELEASE_IDENTITY_V626,
    steps: Object.freeze([
      "Stop the local server using the active preserved stage.",
      "Select a named earlier preserved build directory without deleting either stage.",
      "Re-run the identity bridge and R66 package checks.",
      "Keep root mirror inputs read-only and leave parent Git state untouched.",
      "Keep candidate-only, hold, not-admitted and scientificPayloadWriteback=false unchanged.",
    ]),
    forbiddenActions: Object.freeze(["git reset", "git clean", "git checkout", "parent Git commit", "candidate promotion", "scientific payload writeback"]),
    reversible: true,
  });
}

export function createMainlineAIdentityBridgeReceiptV626(args: {
  generatedAt: string;
  workspace: string;
  rootMirror: string;
  rootPackage: MainlineAPackageIdentityV626;
  nextWebPackage: MainlineAPackageIdentityV626;
  rootSource: MainlineASourceIdentityV626;
  nextWebSource: MainlineASourceIdentityV626;
  build: MainlineABuildIdentityBridgeV626;
  comparison: Readonly<{ mapping: MainlineAIdentityMappingV626; issues: readonly MainlineAIdentityIssueV626[]; status: MainlineAIdentityGateStateV626 }>;
  gates: readonly MainlineAIdentityGateV626[];
  evidenceIndex: Readonly<Record<MainlineAIdentityEvidenceClassV626, readonly string[]>>;
}): MainlineAIdentityBridgeReceiptV626 {
  const blockers = unique([
    ...args.comparison.issues.filter((issue) => issue.severity === "error").map((issue) => issue.code),
    ...args.gates.filter((gate) => gate.required && gate.state !== "passed").flatMap((gate) => gate.blockers.length > 0 ? gate.blockers : [gate.id]),
  ]);
  return Object.freeze({
    schema: MAINLINE_A_RELEASE_IDENTITY_BRIDGE_SCHEMA_V626,
    version: MAINLINE_A_RELEASE_IDENTITY_BRIDGE_VERSION_V626,
    generatedAt: stringValue(args.generatedAt, new Date(0).toISOString()),
    workspace: stringValue(args.workspace, "unknown-workspace"),
    rootMirror: stringValue(args.rootMirror, "unknown-root"),
    boundary: createMainlineAIdentityBoundaryV626(),
    rootPackage: normalizeMainlineAPackageIdentityV626(args.rootPackage, "root-package"),
    nextWebPackage: normalizeMainlineAPackageIdentityV626(args.nextWebPackage, "next-web-package"),
    rootSource: normalizeMainlineASourceIdentityV626(args.rootSource),
    nextWebSource: normalizeMainlineASourceIdentityV626(args.nextWebSource),
    build: normalizeMainlineABuildIdentityBridgeV626(args.build),
    mapping: createMainlineAIdentityMappingV626(args.comparison.mapping),
    gates: Object.freeze([...args.gates]),
    rollback: createMainlineAIdentityRollbackV626({ currentHead: args.build.head, preservedBuildReceipt: args.build.receiptPath }),
    evidenceIndex: Object.freeze({
      "root-package": Object.freeze([...(args.evidenceIndex["root-package"] ?? [])]),
      "next-web-package": Object.freeze([...(args.evidenceIndex["next-web-package"] ?? [])]),
      "source-digest": Object.freeze([...(args.evidenceIndex["source-digest"] ?? [])]),
      "build-receipt": Object.freeze([...(args.evidenceIndex["build-receipt"] ?? [])]),
      manifest: Object.freeze([...(args.evidenceIndex.manifest ?? [])]),
      rollback: Object.freeze([...(args.evidenceIndex.rollback ?? [])]),
    }),
    status: blockers.length > 0 ? "blocked" : args.comparison.issues.length > 0 ? "pending" : "passed",
    blockers: Object.freeze(blockers),
    notes: Object.freeze(unique([
      MAINLINE_A_RELEASE_IDENTITY_BOUNDARY_V626,
      "The release identity field is a declared compatibility mapping, not proof that source trees or manifests are identical.",
      "Runtime package-name differences are preserved as information when the declared Mainline A release identity matches.",
      "No root file is written, copied, deleted or staged by this bridge.",
    ])),
  });
}

function stableIdentityValueV626(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableIdentityValueV626);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => [key, stableIdentityValueV626(entry)]));
  return value;
}

export function stableMainlineAIdentityJsonV626(value: unknown): string {
  return JSON.stringify(stableIdentityValueV626(value));
}

export function digestMainlineAIdentityValueV626(value: unknown): string {
  const serialized = stableMainlineAIdentityJsonV626(value);
  let hash = 0x811c9dc5;
  for (let index = 0; index < serialized.length; index += 1) {
    hash ^= serialized.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

export function assertMainlineAIdentityBoundaryV626(receipt: Pick<MainlineAIdentityBridgeReceiptV626, "boundary">): void {
  const boundary = receipt.boundary;
  if (!boundary.candidateOnly || !boundary.hold || !boundary.notAdmitted || boundary.scientificPayloadWriteback || boundary.parentGitMutation || boundary.physicsKernelMutation || boundary.runtimePromotion !== "closed") {
    throw new Error("R66 identity bridge crossed a protected boundary");
  }
}

export function summarizeMainlineAIdentityGatesV626(gates: readonly MainlineAIdentityGateV626[]): Readonly<{ passed: number; pending: number; blocked: number; requiredOpen: number }> {
  return Object.freeze({
    passed: gates.filter((gate) => gate.state === "passed").length,
    pending: gates.filter((gate) => gate.state === "pending").length,
    blocked: gates.filter((gate) => gate.state === "blocked").length,
    requiredOpen: gates.filter((gate) => gate.required && gate.state !== "passed").length,
  });
}

export function createMainlineAIdentityCsvV626(gates: readonly MainlineAIdentityGateV626[]): string {
  const header = "id,label,state,required,evidenceClass,blockers,notes";
  const rows = gates.map((gate) => [gate.id, gate.label, gate.state, gate.required, gate.evidenceClass, gate.blockers.join("|"), gate.notes.join("|")].map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","));
  return [header, ...rows].join("\n");
}

export function isMainlineAIdentityBridgeClosedV626(receipt: MainlineAIdentityBridgeReceiptV626): boolean {
  return receipt.status === "passed" && summarizeMainlineAIdentityGatesV626(receipt.gates).requiredOpen === 0 && receipt.mapping.releaseIdentityMatch;
}

export function classifyMainlineAIdentityDifferenceV626(mapping: MainlineAIdentityMappingV626): "release-aligned" | "source-diverged" | "identity-unresolved" {
  if (!mapping.releaseIdentityMatch) return "identity-unresolved";
  if (mapping.sourceDigestRelation === "different-code-lines") return "source-diverged";
  return "release-aligned";
}

export function expectedMainlineAReleaseIdentityV626(): typeof MAINLINE_A_RELEASE_IDENTITY_V626 {
  return MAINLINE_A_RELEASE_IDENTITY_V626;
}
