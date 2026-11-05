import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const generatedAt = process.env.ORBIT_ATLAS_EVIDENCE_GENERATED_AT ?? "2026-08-02T00:00:00Z";
const artifactPath = "dist/science/orbit-atlas-current-worktree-revalidation-v561.json";
const capabilityPath = "dist/release/orbit-atlas-current-capability-v561.json";
const paths = {
  v560Evidence: "dist/science/orbit-atlas-shadow-v560-evidence.json",
  v560Pointer: "dist/release/orbit-atlas-current-local-shadow-candidate-v560.json",
  v559Runtime: "dist/science/kerr-response-uncertainty-ledger-v559/runtime-audit.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  engineImport: "dist/science/orbit-relativity-engine-v561/import-manifest.json",
};
const transient = new Set(["generatedAt", "artifactSha256", "capabilitySha256", "evidenceSha256", "pointerSha256", "resultSha256"]);

const bytes = (path) => readFileSync(resolve(root, path));
const read = (path) => JSON.parse(bytes(path).toString("utf8"));
const fileSha = (path) => createHash("sha256").update(bytes(path)).digest("hex");
const canonicalize = (value) => Array.isArray(value)
  ? value.map(canonicalize)
  : !value || typeof value !== "object"
    ? value
    : Object.fromEntries(Object.entries(value)
      .filter(([key]) => !transient.has(key))
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, canonicalize(entry)]));
const sha = (value) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const atomic = (path, value) => {
  const target = resolve(root, path);
  mkdirSync(dirname(target), { recursive: true });
  const part = `${target}.${process.pid}.part`;
  writeFileSync(part, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  renameSync(part, target);
};

function git(command, args) {
  try {
    return execFileSync(command, args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return null;
  }
}

function gitSnapshot() {
  const status = git("git", ["status", "--porcelain=v1", "--", "."]) ?? "";
  const lines = status ? status.split(/\r?\n/).filter(Boolean) : [];
  return {
    branch: git("git", ["branch", "--show-current"]),
    head: git("git", ["rev-parse", "HEAD"]),
    entryCount: lines.length,
    modifiedCount: lines.filter((line) => /^(?: M|M |MM|AM|MA)/.test(line)).length,
    addedCount: lines.filter((line) => /^(?:A | A)/.test(line)).length,
    deletedCount: lines.filter((line) => /^(?:D | D)/.test(line)).length,
    untrackedCount: lines.filter((line) => /^\?\?/.test(line)).length,
  };
}

function auditManifest(manifest) {
  const entries = Array.isArray(manifest?.sourceManifest) ? manifest.sourceManifest : [];
  const mismatches = entries.map((entry) => {
    let actualSha256 = null;
    try {
      actualSha256 = fileSha(entry.path);
    } catch {
      actualSha256 = null;
    }
    return {
      path: entry.path,
      expectedSha256: entry.sha256,
      actualSha256,
      status: actualSha256 === null ? "missing" : actualSha256 === entry.sha256 ? "matching" : "drifted",
    };
  });
  return {
    entryCount: entries.length,
    matchingCount: mismatches.filter((entry) => entry.status === "matching").length,
    mismatchCount: mismatches.filter((entry) => entry.status !== "matching").length,
    mismatches: mismatches.filter((entry) => entry.status !== "matching"),
    sourceManifestSha256: sha(entries),
  };
}

const v560Evidence = read(paths.v560Evidence);
const v560Pointer = read(paths.v560Pointer);
const v559Runtime = read(paths.v559Runtime);
const formal = read(paths.formal);
const formalEvidence = read(formal.source);
const dense = read(paths.dense);
const engineImport = read(paths.engineImport);

if (v560Evidence.version !== "orbit-atlas-shadow-v560-evidence-v1" || sha(v560Evidence) !== v560Evidence.evidenceSha256) throw new Error("v561-v560-evidence-integrity");
if (v560Pointer.version !== "orbit-atlas-current-local-shadow-candidate-v560" || sha(v560Pointer) !== v560Pointer.pointerSha256) throw new Error("v561-v560-pointer-integrity");
if (formal.version !== "v263-current-product-evidence-pointer" || formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" || formalEvidence.contracts?.singleCanvas !== true || formalEvidence.contracts?.legacyRootAttributes !== 603 || formalEvidence.contracts?.evidenceLedgerClaims !== 84) throw new Error("v561-formal-boundary");
if (dense.status !== "incomplete-0-of-49" || dense.completedShardCount !== 0 || dense.aggregateAvailable !== false) throw new Error("v561-dense-boundary");
if (engineImport.version !== "v1-orbit-atlas-engine-import-v561" || engineImport.qualification?.cpuAuthority !== true || engineImport.qualification?.measuredAuthority !== false || engineImport.qualification?.grmhd !== false || engineImport.boundary?.formalProductPointer !== "v263") throw new Error("v561-engine-import-boundary");

const currentAudit = auditManifest(v560Evidence);
const historicalAudit = auditManifest(v559Runtime);
const sourceManifest = [
  paths.v560Evidence,
  paths.v560Pointer,
  paths.v559Runtime,
  paths.formal,
  paths.dense,
  paths.engineImport,
  "scripts/build-current-worktree-revalidation-v561.mjs",
  "scripts/verify-current-worktree-revalidation-v561.mjs",
].map((path) => ({ path, sha256: fileSha(path) })).sort((left, right) => left.path.localeCompare(right.path));

const status = currentAudit.mismatchCount === 0
  ? "v560-current-worktree-qualified-v559-historical-drift-audited"
  : "v560-current-worktree-drift-audited";
const unsigned = {
  version: "orbit-atlas-current-worktree-revalidation-v561",
  generatedAt,
  status,
  baseline: {
    localShadowVersion: "v560",
    formalProductPointer: "v263",
    defaultKernel: "legacy-eih-1pn",
    v560EvidenceSha256: v560Evidence.evidenceSha256,
    v560PointerSha256: v560Pointer.pointerSha256,
    v314StateSha256: dense.stateSha256,
    engineImportArtifactSha256: engineImport.artifactSha256,
  },
  currentWorktree: {
    root: root.replaceAll("\\", "/"),
    git: gitSnapshot(),
    sourceAudit: currentAudit,
  },
  historicalDrift: {
    source: "v559-runtime-audit",
    sourceManifestEntryCount: historicalAudit.entryCount,
    matchingSourceCount: historicalAudit.matchingCount,
    mismatchCount: historicalAudit.mismatchCount,
    mismatches: historicalAudit.mismatches,
    historicalEvidenceMutated: false,
    historicalFilesRewritten: false,
  },
  boundary: {
    measuredAuthorityGranted: false,
    measuredCalibrationFileCount: 0,
    observedFrameCount: 0,
    denseCampaignStatus: "incomplete-0-of-49",
    aggregateAvailable: false,
    browserQualification: "not-run",
    publicDeploymentBlocked: true,
    localShadowDefaultApplied: false,
    productionPromotionAllowed: false,
  },
  capabilities: {
    v561OrbitRelativityEngine: "qualified-cpu-reference-5-rays-kerr-transport-measured-unavailable-grmhd-unavailable",
  },
  revalidation: {
    currentWorktreeOnly: true,
    noHistoricalRewrite: true,
    noThresholdRelaxation: true,
    noNetworkFetch: true,
    v560SourceManifestReplayed: currentAudit.mismatchCount === 0,
    v559HistoricalDriftRecorded: true,
  },
  sourceManifest,
  sourceSha256: sha(sourceManifest),
};
const artifact = { ...unsigned, artifactSha256: sha(unsigned) };
atomic(artifactPath, artifact);

const capabilityUnsigned = {
  version: "orbit-atlas-current-capability-v561",
  generatedAt,
  status,
  baseline: {
    localShadowPointer: "v560",
    formalProductPointer: "v263",
    defaultKernel: "legacy-eih-1pn",
  },
  capabilities: {
    v560SparseObservationEnvelope: "qualified-12-rows-WP-independent-KS",
    v560MeasuredAuthority: "blocked-0-of-6-calibration-files",
    v560DenseScienceImage: "incomplete-0-of-49",
    v560BrowserQualification: "not-run",
    v559HistoricalDrift: `${historicalAudit.mismatchCount}-mismatch-recorded-no-history-rewrite`,
    v561OrbitRelativityEngine: "qualified-cpu-reference-5-rays-kerr-transport-measured-unavailable-grmhd-unavailable",
    currentWorktreeRevalidation: currentAudit.mismatchCount === 0 ? "qualified" : "drifted",
  },
  promotion: {
    promotionAllowed: false,
    publicDeploymentBlocked: true,
    localShadowDefaultApplied: false,
  },
  evidence: {
    revalidationPath: artifactPath,
    revalidationSha256: artifact.artifactSha256,
    v560EvidenceSha256: v560Evidence.evidenceSha256,
    v560PointerSha256: v560Pointer.pointerSha256,
  },
};
const capability = { ...capabilityUnsigned, capabilitySha256: sha(capabilityUnsigned) };
atomic(capabilityPath, capability);

console.log(JSON.stringify({
  status,
  artifactPath,
  artifactSha256: artifact.artifactSha256,
  capabilityPath,
  capabilitySha256: capability.capabilitySha256,
  v560CurrentMismatches: currentAudit.mismatchCount,
  v559HistoricalMismatches: historicalAudit.mismatchCount,
  formalProductPointer: "v263",
  denseCampaign: "0/49",
}, null, 2));
