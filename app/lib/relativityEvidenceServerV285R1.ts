import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import type { AtlasRelativityEvidenceSnapshotV285, RelativityWorkbenchEvidenceStatusV285 } from "./relativityWorkbenchEvidenceV285";

const INPUT_MAX_BYTES = 2 * 1024 * 1024;
const TOKEN_GROUPS = ["sky", "solar", "catalog", "postFx", "strongGravity", "launch", "exoplanet", "hud"] as const;
const EVIDENCE_FILES = {
  v282: { relative: "dist/science/relativity-reference-v282/validation-evidence.json", hashField: "evidenceSha256" },
  v283: { relative: "dist/science/kerr-reference-v283/short-gate-evidence.json", hashField: "evidenceSha256" },
  v284: { relative: "dist/science/kerr-campaign-v284/campaign-state.json", hashField: "stateSha256" },
  v285: { relative: "dist/science/science-cinematic-v285r1-shadow-evidence.json", fallbackRelative: "dist/science/science-cinematic-v285-shadow-evidence.json", hashField: "evidenceSha256" },
  truthV286: { relative: "dist/science/scientific-evidence-truth-audit-v286.json", hashField: "evidenceSha256" },
  v287: { relative: "dist/science/relativity-reference-v282r2/identity-fetch-evidence.json", hashField: "evidenceSha256" },
  v288: { relative: "dist/science/kerr-reference-v288/short-gate-evidence.json", hashField: "evidenceSha256" },
  campaignV288: { relative: "dist/science/kerr-campaign-v288r1/campaign-state.json", hashField: "stateSha256" },
  v288Envelope: { relative: "dist/science/kerr-reference-v288/portable-envelope-v290.json", hashField: "evidenceSha256" },
  v291: { relative: "dist/science/kerr-reference-v291/coordinate-event-diagnostic.json", hashField: "evidenceSha256" },
  v292: { relative: "dist/science/kerr-reference-v292/geometry-redshift-short-gate.json", hashField: "evidenceSha256" },
  v293: { relative: "dist/science/kerr-reference-v293/polarization-gate.json", hashField: "evidenceSha256" },
  v296Diagnostic: { relative: "dist/science/kerr-reference-v296/constraint-stability-diagnostic.json", hashField: "evidenceSha256" },
  v296Gate: { relative: "dist/science/kerr-reference-v296/geometry-redshift-short-gate.json", hashField: "evidenceSha256" },
  // These envelopes are Python-canonical artifacts.  Keep their immutable
  // byte locks here instead of re-serializing IEEE-754 values in JavaScript.
  v296Envelope: { relative: "dist/science/kerr-reference-v296/portable-envelope.json", hashField: "evidenceSha256", fileSha256: "ee45ae3476be8e02ddde55c6833e253bb58d8194d76e48c681726696386a4963" },
  v297Envelope: { relative: "dist/science/kerr-reference-v297/portable-envelope.json", hashField: "evidenceSha256", fileSha256: "ad6aa08f96d9ad5b89ae42e9d1d1d5dfa59f5dd51f1d6eb2554895df87cbdf84" },
  campaignV298: { relative: "dist/science/kerr-campaign-v298/campaign-state.json", hashField: "stateSha256" },
  campaignV298R1: { relative: "dist/science/kerr-campaign-v298r1/campaign-state.json", hashField: "stateSha256" },
  shadowV299: { relative: "dist/science/orbit-atlas-shadow-v299-evidence.json", hashField: "evidenceSha256" },
  v312Gate: { relative: "dist/science/kerr-reference-v312/geometry-redshift-tolerance-short-gate.json", hashField: "evidenceSha256", fileSha256: "eb664b3b9dbd062f3848206471b2cfb82596df742f7aae6fd46751b2aed3db91" },
  v313Gate: { relative: "dist/science/kerr-reference-v313/polarization-short-gate.json", hashField: "evidenceSha256", fileSha256: "b102cff3adcd9f5c0f4b6e51c9a05e6baaa2516b21d7fa816ed86dbe6f0ec12b" },
  campaignV314: { relative: "dist/science/kerr-campaign-v314/campaign-state.json", hashField: "stateSha256" },
  shadowV315: { relative: "dist/science/orbit-atlas-shadow-v315-evidence.json", hashField: "evidenceSha256" },
  shadowV316: { relative: "dist/science/orbit-atlas-shadow-v316-evidence.json", hashField: "evidenceSha256" },
  shadowV317: { relative: "dist/science/orbit-atlas-shadow-v317-evidence.json", hashField: "evidenceSha256" },
  shadowV318: { relative: "dist/science/orbit-atlas-shadow-v318-evidence.json", hashField: "evidenceSha256" },
  shadowV319: { relative: "dist/science/orbit-atlas-shadow-v319-evidence.json", hashField: "evidenceSha256" },
  shadowV320: { relative: "dist/science/orbit-atlas-shadow-v320-evidence.json", hashField: "evidenceSha256" },
  shadowV321: { relative: "dist/science/orbit-atlas-shadow-v321-evidence.json", hashField: "evidenceSha256" },
  shadowV322: { relative: "dist/science/orbit-atlas-shadow-v322-evidence.json", hashField: "evidenceSha256" },
  shadowV323: { relative: "dist/science/orbit-atlas-shadow-v323-evidence.json", hashField: "evidenceSha256" },
} as const;

type EvidenceDocument = Record<string, unknown>;
type CachedDocument = {
  fingerprint: string;
  lastAccess: number;
  promise: Promise<{ document: EvidenceDocument; sha256: string; fileSha256: string }>;
};

const DOCUMENT_CACHE_LIMIT = 4;
const documentCache = new Map<string, CachedDocument>();
let documentCacheAccess = 0;

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value as EvidenceDocument)
    .filter(([key]) => !["generatedAt", "host", "pid", "absolutePath"].includes(key))
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, entry]) => [key, canonicalize(entry)]));
}

function canonicalSha(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
}

async function readDocument(root: string, relative: string, hashField: string): Promise<{ document: EvidenceDocument; sha256: string; fileSha256: string }> {
  const path = resolve(root, relative);
  const metadata = await stat(path);
  if (!metadata.isFile() || metadata.size <= 0 || metadata.size > INPUT_MAX_BYTES) throw new Error("relativity-evidence-input-boundary");
  const fingerprint = `${metadata.size}:${metadata.mtimeMs}`;
  const cached = documentCache.get(path);
  if (cached?.fingerprint === fingerprint) {
    cached.lastAccess = ++documentCacheAccess;
    return cached.promise;
  }
  const promise = (async () => {
    const bytes = await readFile(path);
    if (bytes.byteLength !== metadata.size) throw new Error("relativity-evidence-changed-during-read");
    const document = JSON.parse(bytes.toString("utf8")) as EvidenceDocument;
    const expected = document[hashField];
    if (typeof expected !== "string" || !/^[a-f0-9]{64}$/.test(expected)) throw new Error("relativity-evidence-sha-missing");
    return { document, sha256: expected, fileSha256: createHash("sha256").update(bytes).digest("hex") };
  })();
  documentCache.set(path, { fingerprint, lastAccess: ++documentCacheAccess, promise });
  if (documentCache.size > DOCUMENT_CACHE_LIMIT) {
    const oldest = [...documentCache.entries()].sort((left, right) => left[1].lastAccess - right[1].lastAccess)[0]?.[0];
    if (oldest && oldest !== path) documentCache.delete(oldest);
  }
  try {
    return await promise;
  } catch (error) {
    if (documentCache.get(path)?.promise === promise) documentCache.delete(path);
    throw error;
  }
}

function record(value: unknown): EvidenceDocument {
  return value && typeof value === "object" && !Array.isArray(value) ? value as EvidenceDocument : {};
}

function integer(value: unknown, fallback: number): number {
  return Number.isSafeInteger(value) ? Number(value) : fallback;
}

function status(value: RelativityWorkbenchEvidenceStatusV285): RelativityWorkbenchEvidenceStatusV285 {
  return value;
}

async function readVerifiedOptional(
  root: string,
  entry: { relative: string; hashField: string; fileSha256?: string },
): Promise<Awaited<ReturnType<typeof readDocument>> | null> {
  try {
    const source = await readDocument(root, entry.relative, entry.hashField);
    if (entry.fileSha256) {
      if (source.fileSha256 !== entry.fileSha256) throw new Error("optional-evidence-file-lock-mismatch");
      return source;
    }
    const unsigned = { ...source.document };
    delete unsigned[entry.hashField];
    if (canonicalSha(unsigned) !== source.sha256) throw new Error("optional-evidence-sha-mismatch");
    return source;
  } catch {
    return null;
  }
}

export async function loadAtlasRelativityEvidenceSnapshotV285R1(root = process.cwd()): Promise<AtlasRelativityEvidenceSnapshotV285> {
  try {
    let v285Source;
    try {
      v285Source = await readDocument(root, EVIDENCE_FILES.v285.relative, EVIDENCE_FILES.v285.hashField);
    } catch {
      v285Source = await readDocument(root, EVIDENCE_FILES.v285.fallbackRelative, EVIDENCE_FILES.v285.hashField);
    }
    const v285Unsigned = { ...v285Source.document };
    delete v285Unsigned[EVIDENCE_FILES.v285.hashField];
    if (canonicalSha(v285Unsigned) !== v285Source.sha256) throw new Error("relativity-v285-evidence-sha-mismatch");
    const evidenceManifest = record(v285Source.document.evidence);
    const [v282Source, v283Source, v284Source] = await Promise.all((["v282", "v283", "v284"] as const).map(async (phase) => {
      const entry = EVIDENCE_FILES[phase];
      const source = await readDocument(root, entry.relative, entry.hashField);
      const manifestEntry = record(evidenceManifest[phase]);
      if (manifestEntry.sha256 !== source.fileSha256) throw new Error(`relativity-${phase}-file-sha-mismatch`);
      return source;
    }));
    const v282 = v282Source.document;
    const v283 = v283Source.document;
    const v284 = v284Source.document;
    const v285 = v285Source.document;
    const [truthSource, v287Source, v288Source, campaignV288Source, v288EnvelopeSource, v291Source, v292Source, v293Source, v296DiagnosticSource, v296GateSource, v296EnvelopeSource, v297EnvelopeSource, campaignV298Source, campaignV298R1Source, shadowV299Source, v312GateSource, v313GateSource, campaignV314Source, shadowV315Source, shadowV316Source, shadowV317Source, shadowV318Source, shadowV319Source, shadowV320Source, shadowV321Source, shadowV322Source, shadowV323Source] = await Promise.all([
      readVerifiedOptional(root, EVIDENCE_FILES.truthV286),
      readVerifiedOptional(root, EVIDENCE_FILES.v287),
      readVerifiedOptional(root, EVIDENCE_FILES.v288),
      readVerifiedOptional(root, EVIDENCE_FILES.campaignV288),
      readVerifiedOptional(root, EVIDENCE_FILES.v288Envelope),
      readVerifiedOptional(root, EVIDENCE_FILES.v291),
      readVerifiedOptional(root, EVIDENCE_FILES.v292),
      readVerifiedOptional(root, EVIDENCE_FILES.v293),
      readVerifiedOptional(root, EVIDENCE_FILES.v296Diagnostic),
      readVerifiedOptional(root, EVIDENCE_FILES.v296Gate),
      readVerifiedOptional(root, EVIDENCE_FILES.v296Envelope),
      readVerifiedOptional(root, EVIDENCE_FILES.v297Envelope),
      readVerifiedOptional(root, EVIDENCE_FILES.campaignV298),
      readVerifiedOptional(root, EVIDENCE_FILES.campaignV298R1),
      readVerifiedOptional(root, EVIDENCE_FILES.shadowV299),
      readVerifiedOptional(root, EVIDENCE_FILES.v312Gate),
      readVerifiedOptional(root, EVIDENCE_FILES.v313Gate),
      readVerifiedOptional(root, EVIDENCE_FILES.campaignV314),
      readVerifiedOptional(root, EVIDENCE_FILES.shadowV315),
      readVerifiedOptional(root, EVIDENCE_FILES.shadowV316),
      readVerifiedOptional(root, EVIDENCE_FILES.shadowV317),
      readVerifiedOptional(root, EVIDENCE_FILES.shadowV318),
      readVerifiedOptional(root, EVIDENCE_FILES.shadowV319),
      readVerifiedOptional(root, EVIDENCE_FILES.shadowV320),
      readVerifiedOptional(root, EVIDENCE_FILES.shadowV321),
      readVerifiedOptional(root, EVIDENCE_FILES.shadowV322),
      readVerifiedOptional(root, EVIDENCE_FILES.shadowV323),
    ]);
    const truth = record(truthSource?.document);
    const truthV283 = record(truth.v283);
    const truthV284 = record(truth.v284);
    const v287 = record(v287Source?.document);
    const envelope = record(v288EnvelopeSource?.document);
    const v288 = Object.keys(record(envelope.shortGate)).length > 0 ? record(envelope.shortGate) : record(v288Source?.document);
    const campaignV288 = Object.keys(record(envelope.campaign)).length > 0 ? record(envelope.campaign) : record(campaignV288Source?.document);
    const targetIdentity = record(v282.targetIdentity);
    const identityValidation = record(targetIdentity.validation);
    const mismatches = Array.isArray(identityValidation.mismatches) ? identityValidation.mismatches.length : 0;
    const capabilities = record(v285.capabilities);
    const runtime = record(v285.runtime);
    const consumed = Array.isArray(runtime.consumedTokenGroups)
      ? runtime.consumedTokenGroups.filter((entry): entry is string => typeof entry === "string" && TOKEN_GROUPS.includes(entry as typeof TOKEN_GROUPS[number]))
      : [];
    const v287Partial = v287.status === "identity-cache-partial-1-of-9";
    const v282Status = v287Partial ? status("partial") : v282.referenceInfrastructure === "shadow-qualified" ? status("qualified") : status("blocked");
    const v283Withdrawn = truthV283.status === "structural-gate-passed-science-qualification-withdrawn";
    const v284Quarantined = truthV284.status === "quarantined-nonauthoritative-1-of-49";
    const v288Present = v288.version === "v288-corrected-kerr-authority-short-gate-v1";
    const v283Status = v288Present ? v288.gatePassed === true ? status("qualified") : status("blocked") : v283Withdrawn ? status("qualification-withdrawn") : v283.gatePassed === true ? status("qualified") : status("blocked");
    const campaignV288Present = campaignV288.version === "v288r1-corrected-kerr-dense-campaign-state-v1";
    const v284Status = campaignV288Present ? campaignV288.status === "complete" ? status("qualified") : campaignV288.status === "blocked-short-gate" ? status("blocked") : status("incomplete") : v284Quarantined ? status("quarantined") : v284.status === "complete" ? status("qualified") : status("incomplete");
    const classCounts = record(v288.classCounts);
    const carterClassCounts = record(classCounts["carter-mino-dop853-v288"]);
    const ksClassCounts = record(classCounts["cartesian-kerr-schild-hamiltonian-dop853-v288"]);
    const capturedRayCount = v288Present
      ? integer(carterClassCounts.capture, 0) + integer(ksClassCounts.capture, 0)
      : integer(truthV283.carterCaptureCount, 0) + integer(truthV283.kerrSchildCaptureCount, 0);
    const truthReasons = v288Present && Array.isArray(v288.failureReasons)
      ? v288.failureReasons.filter((entry): entry is string => typeof entry === "string")
      : Array.isArray(truthV283.reasons) ? truthV283.reasons.filter((entry): entry is string => typeof entry === "string") : [];
    const v285Status = capabilities.v285 === "qualified" ? status("qualified") : status("implemented-awaiting-qualification");
    const v296Envelope = record(v296EnvelopeSource?.document);
    const v297Envelope = record(v297EnvelopeSource?.document);
    const v297History = record(v297Envelope.history);
    const v291 = Object.keys(record(v296Envelope.diagnostic)).length > 0 ? record(v296Envelope.diagnostic) : record(v296DiagnosticSource?.document ?? v291Source?.document);
    const v292 = Object.keys(record(v297History.v292)).length > 0 ? record(v297History.v292) : record(v292Source?.document);
    const v293 = Object.keys(record(v297History.v293)).length > 0 ? record(v297History.v293) : record(v293Source?.document);
    const v296 = Object.keys(record(v296Envelope.geometry)).length > 0 ? record(v296Envelope.geometry) : record(v296GateSource?.document);
    const v297 = record(v297Envelope.polarization);
    const v298 = record(campaignV298Source?.document);
    const v298r1 = record(campaignV298R1Source?.document);
    const v299 = record(shadowV299Source?.document);
    const v299Capabilities = record(v299.capabilities);
    const v299Runtime = record(v299.runtime);
    const v299Campaign = record(v299.campaign);
    const v312 = record(v312GateSource?.document);
    const v312Convergence = record(v312.toleranceConvergence);
    const v312Resource = record(v312.resource);
    const v313 = record(v313GateSource?.document);
    const v313Thresholds = record(v313.thresholds);
    const v314 = record(campaignV314Source?.document);
    const v315 = record(shadowV315Source?.document);
    const v315Authority = record(v315.authority);
    const v315Geometry = record(v315Authority.geometry);
    const v315Polarization = record(v315Authority.polarization);
    const v315RayPlan = record(v315Authority.rayPlan);
    const v315Runtime = record(v315.runtime);
    const v315Campaign = record(v315.correctedCampaign);
    const v316 = record(shadowV316Source?.document);
    const v316Visual = record(v316.visual);
    const v317 = record(shadowV317Source?.document);
    const v317Integrity = record(v317.integrity);
    const v317Interactive = record(v317.interactive);
    const v317Lifecycle = record(v317.lifecycle);
    const v318 = record(shadowV318Source?.document);
    const v318Differential = record(v318.differential);
    const v318Browser = record(v318.browser);
    const v319 = record(shadowV319Source?.document);
    const v319Science = record(v319.science);
    const v319Maxima = record(v319Science.maxima);
    const v319Artifact = record(v319.artifact);
    const v320 = record(shadowV320Source?.document);
    const v320Science = record(v320.science);
    const v320Maxima = record(v320Science.maxima);
    const v320Artifact = record(v320.artifact);
    const v321 = record(shadowV321Source?.document);
    const v321Runtime = record(v321.runtime);
    const v321Artifact = record(v321.artifact);
    const v322 = record(shadowV322Source?.document);
    const v322Runtime = record(v322.runtime);
    const v323 = record(shadowV323Source?.document);
    const v323Runtime = record(v323.runtime);
    const v291Thresholds = record(v291.thresholds);
    const v292Thresholds = record(v292.thresholds);
    const v293SelfTest = record(v293.implementationSelfTest);
    const v297Thresholds = record(v297.thresholds);
    const v291Status = v291.status === "diagnostics-qualified" ? "diagnostics-qualified" : v291.status === "diagnostics-failed" ? "diagnostics-failed" : "unavailable";
    const v292Status = v292.status === "geometry-redshift-qualified" ? "geometry-redshift-qualified" : v292.status === "geometry-redshift-failed" ? "geometry-redshift-failed" : "unavailable";
    const v293Status = v293.status === "polarization-qualified" ? "polarization-qualified" : v293.status === "blocked-by-geometry" ? "blocked-by-geometry" : v293.status === "polarization-failed" ? "polarization-failed" : "unavailable";
    const v296Status = v296.status === "geometry-redshift-qualified" ? "geometry-redshift-qualified" : v296.status === "geometry-redshift-failed" ? "geometry-redshift-failed" : "unavailable";
    const v297Status = v297.status === "full-kerr-short-authority-qualified" ? "full-kerr-short-authority-qualified" : v297.status === "polarization-short-gate-failed" ? "polarization-short-gate-failed" : "unavailable";
    const v298Status = v298.status === "incomplete-0-of-49" ? "incomplete-0-of-49" : v298.status === "blocked-by-v297" ? "blocked-by-v297" : "unavailable";
    const v298r1Status = typeof v298r1.status === "string" && (/^incomplete-\d+-of-49$/.test(v298r1.status)
      || /^running-shard-\d+$/.test(v298r1.status)
      || ["failed-no-automatic-retry", "aggregate-failed-no-automatic-retry", "complete-awaiting-aggregate", "complete"].includes(v298r1.status))
      ? v298r1.status : "unavailable";
    const v298r1TruthStatus = v299Campaign.truthAuditStatus === "failed-tolerance-ladder-degenerate"
      ? "failed-tolerance-ladder-degenerate" : "unavailable";
    const v298r1ErrorBudgetStatus = v299Runtime.denseErrorBudget === "componentwise-audited-no-rss-no-cross-dimension-sum"
      ? "componentwise-audited-no-rss"
      : v299Runtime.denseErrorBudget === "componentwise-structural-audit-preserved-tolerance-convergence-withdrawn"
        ? "componentwise-structural-tolerance-withdrawn"
        : "pending";
    const v299Implemented = v299Capabilities.v299 === "implemented-awaiting-browser-qualification";
    const v300Implemented = v299Capabilities.visualV6 === "manual-local-shadow-only-not-default";
    const v292Reasons = Array.isArray(v292.failureReasons) ? v292.failureReasons.filter((entry): entry is string => typeof entry === "string").slice(0, 8) : [];
    return {
      version: "v285r1-relativity-evidence-snapshot",
      status: "ready",
      phases: {
        v282: { status: v282Status, mismatchCount: v287Partial ? 8 : Math.min(12, Math.max(0, mismatches)), artifactSha256: v287Source?.sha256 ?? v282Source.sha256 },
        v283: { status: v283Status, executionCount: Math.min(128, Math.max(0, integer(v288Present ? v288.executionCount : v283.executionCount, 0))), criticalBracketCount: Math.min(40, Math.max(0, integer(v288Present ? v288.criticalBracketCount : v283.criticalBracketCount, 0))), capturedRayCount: Math.min(128, Math.max(0, capturedRayCount)), degenerateMetricCount: Math.min(8, truthReasons.length), truthReason: truthReasons.join(", ").slice(0, 160) || null, artifactSha256: v288EnvelopeSource?.sha256 ?? v288Source?.sha256 ?? truthSource?.sha256 ?? v283Source.sha256 },
        v284: { status: v284Status, completedShardCount: Math.min(49, Math.max(0, integer(campaignV288Present ? campaignV288.completedShardCount : v284.completedShardCount, 0))), plannedShardCount: Math.min(49, Math.max(1, integer(campaignV288Present ? campaignV288.plannedShardCount : v284.plannedShardCount, 49))), nextShardIndex: (campaignV288Present ? campaignV288.nextShardIndex : v284.nextShardIndex) == null ? null : Math.min(48, Math.max(0, integer(campaignV288Present ? campaignV288.nextShardIndex : v284.nextShardIndex, 0))), authority: campaignV288Present ? "corrected-v288" : v284Quarantined ? "legacy-withdrawn-v283" : "unavailable", artifactSha256: v288EnvelopeSource?.sha256 ?? campaignV288Source?.sha256 ?? truthSource?.sha256 ?? v284Source.sha256 },
        v285: { status: v285Status, consumedTokenGroups: consumed, artifactSha256: v285Source.sha256 },
      },
      current: {
        v291: { status: v291Status, capture02Agreement: v291Thresholds.capture02Agreement === true, maxMassShellResidualRaw: typeof v291Thresholds.maxMassShellResidualRaw === "number" ? v291Thresholds.maxMassShellResidualRaw : null, artifactSha256: v296EnvelopeSource?.sha256 ?? v296DiagnosticSource?.sha256 ?? v291Source?.sha256 ?? null },
        v292: { status: v292Status, executionCount: Math.min(128, Math.max(0, integer(v292.executionCount, 0))), criticalBracketCount: Math.min(40, Math.max(0, integer(v292.criticalBracketCount, 0))), classificationAgreement: typeof v292Thresholds.classificationAgreement === "number" ? Math.min(1, Math.max(0, v292Thresholds.classificationAgreement)) : null, failureReasons: v292Reasons, artifactSha256: v297EnvelopeSource?.sha256 ?? v292Source?.sha256 ?? null },
        v293: { status: v293Status, implementationSelfTestPassed: v293SelfTest.passed === true, applicableExecutionCount: Math.min(128, Math.max(0, integer(v293.applicableExecutionCount, 0))), artifactSha256: v297EnvelopeSource?.sha256 ?? v293Source?.sha256 ?? null },
        v294: { status: "implemented-awaiting-browser-qualification", scientificPayloadSha256: v297.qualified === true ? v297EnvelopeSource?.sha256 ?? null : v296EnvelopeSource?.sha256 ?? v296GateSource?.sha256 ?? null, browserQualificationRun: false },
        v296: { status: v296Status, executionCount: Math.min(128, Math.max(0, integer(v296.executionCount, 0))), criticalBracketCount: Math.min(40, Math.max(0, integer(v296.criticalBracketCount, 0))), artifactSha256: v296EnvelopeSource?.sha256 ?? v296GateSource?.sha256 ?? null },
        v297: { status: v297Status, applicableExecutionCount: Math.min(16, Math.max(0, integer(v297.applicableExecutionCount, 0))), maxReleaseEvpaDifferenceDeg: typeof v297Thresholds.maxReleaseEvpaDifferenceDeg === "number" ? Math.min(180, Math.max(0, v297Thresholds.maxReleaseEvpaDifferenceDeg)) : null, maxInternalEvpaDifferenceDeg: typeof v297Thresholds.maxInternalEvpaDifferenceDeg === "number" ? Math.min(180, Math.max(0, v297Thresholds.maxInternalEvpaDifferenceDeg)) : null, artifactSha256: v297EnvelopeSource?.sha256 ?? null },
        v298: { status: v298Status, completedShardCount: Math.min(49, Math.max(0, integer(v298.completedShardCount, 0))), plannedShardCount: Math.min(49, Math.max(1, integer(v298.plannedShardCount, 49))), nextShardIndex: v298.nextShardIndex == null ? null : Math.min(48, Math.max(0, integer(v298.nextShardIndex, 0))), runNextAvailable: false, artifactSha256: campaignV298Source?.sha256 ?? null },
        v298r1: { status: v298r1Status as AtlasRelativityEvidenceSnapshotV285["current"]["v298r1"]["status"], completedShardCount: Math.min(49, Math.max(0, integer(v298r1.completedShardCount, 0))), plannedShardCount: Math.min(49, Math.max(1, integer(v298r1.plannedShardCount, 49))), nextShardIndex: v298r1.nextShardIndex == null ? null : Math.min(48, Math.max(0, integer(v298r1.nextShardIndex, 0))), runNextAvailable: v298r1.runNextAvailable === true && v298r1TruthStatus !== "failed-tolerance-ladder-degenerate", peakRssBytes: typeof v298r1.peakRssBytes === "number" && Number.isFinite(v298r1.peakRssBytes) && v298r1.peakRssBytes > 0 ? v298r1.peakRssBytes : null, peakRssTelemetry: record(v299Campaign.peakRssTelemetry).status === "corrected-probe-qualified-shard0-unmeasured" ? "corrected-probe-qualified-shard0-unmeasured" : v298r1.rssTelemetry && record(v298r1.rssTelemetry).status === "measured" ? "measured" : v298r1.peakRssBytes === 0 ? "historical-invalid-zero" : "pending", auditedShardCount: Math.min(49, Math.max(0, integer(v299Campaign.auditedShardCount, 0))), errorBudgetStatus: v298r1ErrorBudgetStatus, truthAuditStatus: v298r1TruthStatus, toleranceLadderQualified: v299Campaign.toleranceLadderQualified === true, continuation: v299Campaign.continuation === "requires-corrected-authority-and-new-campaign-namespace" ? "requires-corrected-authority-and-new-campaign-namespace" : "unavailable", artifactSha256: campaignV298R1Source?.sha256 ?? null },
        v299: { status: v299Implemented ? "implemented-awaiting-browser-qualification" : "unavailable", scienceAuthority: v299Implemented ? "v296-v297-short-gate-sparse" : "unavailable", denseAuthorityAccepted: v299Implemented && v299Runtime.denseAuthorityAccepted === true, gpuBackend: v299Implemented ? "webgpu-shadow-pending-differential" : "unavailable", gpuAuthority: v299Implemented && v299Capabilities.gpuAuthorityLock === "qualified-v296-v297-portable-envelope" ? "cpu-v296-v297-portable-envelope" : "unavailable", scienceDisplay: v299Implemented && v299Capabilities.scienceDisplay === "static-qualified-linear-no-grade-browser-pending" ? "linear-no-grade-postfx-bypassed" : "unavailable", resourceLifecycle: v299Implemented && v299Capabilities.resourceLifecycle === "static-qualified-browser-baseline-pending" ? "static-qualified-browser-baseline-pending" : "unavailable", visualAssetRuntime: v299Implemented && v299Runtime.visualAssetRuntime === "licensed-2k-local-shadow-v4-v5-v6-intent-only" ? "licensed-2k-local-shadow-v4-v5-v6-intent-only" : "unavailable", visualProfile: v299Implemented ? "science-cinematic-v5-v299" : "unavailable", visualProfileCandidates: v299Implemented ? ["science-cinematic-v5-v299" as const, ...(v300Implemented ? ["science-cinematic-v6-v300" as const] : [])] : [], artifactSha256: shadowV299Source?.sha256 ?? null },
        v312: { status: v312.status === "corrected-authority-qualified" ? "corrected-authority-qualified" : v312.status === "corrected-authority-failed" ? "corrected-authority-failed" : "unavailable", executionCount: Math.min(128, Math.max(0, integer(v312.executionCount, 0))), strictSolverLadderPairCount: Math.min(64, Math.max(0, integer(v312Convergence.strictSolverLadderPairCount, 0))), expectedSolverLadderPairCount: 64, distinctConvergenceObservableCount: Math.min(256, Math.max(0, integer(v312Convergence.distinctConvergenceObservableCount, 0))), convergenceObservableCount: Math.min(256, Math.max(0, integer(v312Convergence.convergenceObservableCount, 0))), peakRssGiB: typeof v312Resource.peakRssGiB === "number" && Number.isFinite(v312Resource.peakRssGiB) ? Math.min(2, Math.max(0, v312Resource.peakRssGiB)) : null, polarizationStatus: v312.polarizationStatus === "requires-v312-locked-polarization-requalification" ? "requires-v312-locked-polarization-requalification" : v312.polarizationStatus === "blocked-by-v312" ? "blocked-by-v312" : "unavailable", correctedDenseCampaignCreated: false, artifactSha256: v312GateSource?.sha256 ?? null },
        v313: { status: v313.status === "full-kerr-short-authority-qualified" ? "full-kerr-short-authority-qualified" : v313.status === "polarization-requalification-failed" ? "polarization-requalification-failed" : "unavailable", applicableExecutionCount: Math.min(16, Math.max(0, integer(v313.applicableExecutionCount, 0))), maxReleaseEvpaDifferenceDeg: typeof v313Thresholds.maxReleaseEvpaDifferenceDeg === "number" ? Math.min(180, Math.max(0, v313Thresholds.maxReleaseEvpaDifferenceDeg)) : null, maxInternalEvpaDifferenceDeg: typeof v313Thresholds.maxInternalEvpaDifferenceDeg === "number" ? Math.min(180, Math.max(0, v313Thresholds.maxInternalEvpaDifferenceDeg)) : null, geometryAuthoritySha256: typeof v313.geometryEvidenceSha256 === "string" && /^[a-f0-9]{64}$/.test(v313.geometryEvidenceSha256) ? v313.geometryEvidenceSha256 : null, correctedDenseCampaignCreated: false, artifactSha256: v313GateSource?.sha256 ?? null },
        v314: { status: v314.status === "incomplete-0-of-49" ? "incomplete-0-of-49" : "unavailable", plannedRayCount: Math.min(3097, Math.max(0, integer(v314.plannedRayCount, 3097))), plannedShardCount: Math.min(49, Math.max(1, integer(v314.plannedShardCount, 49))), completedShardCount: Math.min(49, Math.max(0, integer(v314.completedShardCount, 0))), nextShardIndex: v314.nextShardIndex == null ? null : Math.min(48, Math.max(0, integer(v314.nextShardIndex, 0))), attemptConsumed: false, runNextAvailable: false, aggregateAvailable: false, artifactSha256: campaignV314Source?.sha256 ?? null },
        v315: { status: v315.status === "science-runtime-upgraded-corrected-dense-incomplete-0-of-49" ? "implemented-awaiting-browser-qualification" : "unavailable", scienceAuthority: v315Runtime.scienceAuthority === "v312-v313-short-gate-sparse" ? "v312-v313-short-gate-sparse" : "unavailable", fullShortAuthoritySha256: typeof v315Authority.fullShortAuthoritySha256 === "string" && /^[a-f0-9]{64}$/.test(v315Authority.fullShortAuthoritySha256) ? v315Authority.fullShortAuthoritySha256 : null, geometryAuthoritySha256: typeof v315Geometry.evidenceSha256 === "string" && /^[a-f0-9]{64}$/.test(v315Geometry.evidenceSha256) ? v315Geometry.evidenceSha256 : null, polarizationAuthoritySha256: typeof v315Polarization.evidenceSha256 === "string" && /^[a-f0-9]{64}$/.test(v315Polarization.evidenceSha256) ? v315Polarization.evidenceSha256 : null, rayPlanAuthoritySha256: typeof v315RayPlan.planSha256 === "string" && /^[a-f0-9]{64}$/.test(v315RayPlan.planSha256) ? v315RayPlan.planSha256 : null, denseStatus: v315Campaign.status === "incomplete-0-of-49" ? "incomplete-0-of-49" : "unavailable", denseAggregateAccepted: false, browserQualificationRun: false, artifactSha256: shadowV315Source?.sha256 ?? null },
        v316: { status: v316.status === "visual-token-fields-qualified-browser-pending-dense-incomplete-0-of-49" ? "static-qualified-browser-pending" : "unavailable", requiredFieldCount: Math.min(46, Math.max(0, integer(v316Visual.requiredFieldCount, 46))), declaredFieldCount: Math.min(46, Math.max(0, integer(v316Visual.declaredFieldCount, 0))), runtimeGroupSignature: v316Visual.runtimeGroupSignature === "resolved-profile-exact-v300" ? "resolved-profile-exact-v300" : "unavailable", localShadowManualAbOnly: v316Visual.localShadowManualAbOnly === true, browserQualificationRun: false, artifactSha256: shadowV316Source?.sha256 ?? null },
        v317: { status: v317.status === "buffer-integrity-qualified-browser-pending-dense-incomplete-0-of-49" ? "static-qualified-browser-pending" : "unavailable", scientificTypedArrayCount: Math.min(67, Math.max(0, integer(v317Integrity.scientificTypedArrayCount, 0))), digestAlgorithm: v317Integrity.digestAlgorithm === "sha-256-field-framed-byte-exact" ? "sha-256-field-framed-byte-exact" : "unavailable", beforeAfterRasterDigestRequired: v317Integrity.beforeAfterRasterDigestRequired === true, rasterBufferDisjointRequired: v317Integrity.scienceRasterBufferDisjointRequired === true, interactiveAuthoritySha256: typeof v317Interactive.authoritySha256 === "string" && /^[a-f0-9]{64}$/.test(v317Interactive.authoritySha256) ? v317Interactive.authoritySha256 : null, historicalV299MutationApplied: v317Interactive.historicalV299MutationApplied === true, webGpuDifferential: v317Interactive.webGpuDifferential === "pending" ? "pending" : "unavailable", lifecycleBaselineReturnTelemetry: v317Lifecycle.baselineReturnDigestTelemetry === "wired-browser-pending" ? "wired-browser-pending" : "unavailable", browserQualificationRun: false, artifactSha256: shadowV317Source?.sha256 ?? null },
        v318: { status: v318.status === "gpu-differential-reference-qualified-hardware-pending-dense-incomplete-0-of-49" ? "reference-qualified-hardware-pending" : "unavailable", authoritySha256: typeof v318Differential.authoritySha256 === "string" && /^[a-f0-9]{64}$/.test(v318Differential.authoritySha256) ? v318Differential.authoritySha256 : null, sampleCount: Math.min(16, Math.max(0, integer(v318Differential.sampleCount, 0))), criticalBracketCount: Math.min(40, Math.max(0, integer(v318Differential.criticalBracketCount, 0))), cpuAuthorityPreserved: v318Differential.cpuAuthority === "v312-geometry+v313-polarization" && v318Differential.gpuScientificAuthority === false, webGpuDifferential: v318Differential.hardwareResult === "pending" ? "pending" : "unavailable", browserGate: v318Browser.status === "authored-not-run" ? "authored-not-run" : "unavailable", artifactSha256: shadowV318Source?.sha256 ?? null },
        v319: { status: v319.status === "thin-disk-spectrum-qualified-browser-pending-dense-incomplete-0-of-49" ? "derived-spectrum-qualified-browser-pending" : "unavailable", applicableDiskRayCount: Math.min(4, Math.max(0, integer(v319Science.applicableDiskRayCount, 0))), liouvilleInvariantRelativeResidual: typeof v319Maxima.liouvilleInvariantRelativeResidual === "number" && Number.isFinite(v319Maxima.liouvilleInvariantRelativeResidual) ? Math.max(0, v319Maxima.liouvilleInvariantRelativeResidual) : null, diskQuadratureRelative: typeof v319Maxima.diskQuadratureRelative === "number" && Number.isFinite(v319Maxima.diskQuadratureRelative) ? Math.max(0, v319Maxima.diskQuadratureRelative) : null, formulaSpectralRelative: typeof v319Maxima.formulaSpectralRelative === "number" && Number.isFinite(v319Maxima.formulaSpectralRelative) ? Math.max(0, v319Maxima.formulaSpectralRelative) : null, spectralArtifactSha256: typeof v319Artifact.canonicalSha256 === "string" && /^[a-f0-9]{64}$/.test(v319Artifact.canonicalSha256) ? v319Artifact.canonicalSha256 : null, denseAggregateAccepted: false, browserQualificationRun: false, artifactSha256: shadowV319Source?.sha256 ?? null },
        v320: { status: v320.status === "fixed-band-science-color-qualified-browser-pending-dense-incomplete-0-of-49" ? "fixed-band-qualified-browser-pending" : "unavailable", applicableDiskRayCount: Math.min(4, Math.max(0, integer(v320Science.applicableDiskRayCount, 0))), bandCount: Math.min(3, Math.max(0, integer(v320Science.bandCount, 0))), bandQuadratureRelativeDifference: typeof v320Maxima.bandQuadratureRelativeDifference === "number" && Number.isFinite(v320Maxima.bandQuadratureRelativeDifference) ? Math.max(0, v320Maxima.bandQuadratureRelativeDifference) : null, coveredBolometricFraction: typeof v320Maxima.coveredBolometricFraction === "number" && Number.isFinite(v320Maxima.coveredBolometricFraction) ? Math.min(1 + 1e-6, Math.max(0, v320Maxima.coveredBolometricFraction)) : null, saturatedChannelCount: Math.min(12, Math.max(0, integer(v320Science.saturatedChannelCount, 0))), normalizationPolicy: v320Science.normalizationPolicy === "fixed-physical-reference-no-data-adaptive-rescale" ? "fixed-physical-reference-no-data-adaptive-rescale" : "unavailable", bandArtifactSha256: typeof v320Artifact.canonicalSha256 === "string" && /^[a-f0-9]{64}$/.test(v320Artifact.canonicalSha256) ? v320Artifact.canonicalSha256 : null, denseAggregateAccepted: false, browserQualificationRun: false, artifactSha256: shadowV320Source?.sha256 ?? null },
        v321: { status: v321.status === "runtime-fixed-band-science-raster-static-qualified-browser-pending-dense-incomplete-0-of-49" ? "runtime-wired-browser-pending" : "unavailable", fixedBandColoredDiskRayCount: Math.min(4, Math.max(0, integer(v321Runtime.fixedBandColoredDiskRayCount, 0))), fixedBandCount: Math.min(3, Math.max(0, integer(v321Runtime.fixedBandCount, 0))), payloadUnchanged: v321Runtime.payloadUnchanged === true, bandViewUnchanged: v321Runtime.bandViewUnchanged === true, rasterBufferDisjoint: v321Runtime.rasterBufferDisjoint === true, cinematicBufferShared: typeof v321Runtime.cinematicBufferShared === "boolean" ? v321Runtime.cinematicBufferShared : null, rasterArtifactSha256: typeof v321Artifact.canonicalSha256 === "string" && /^[a-f0-9]{64}$/.test(v321Artifact.canonicalSha256) ? v321Artifact.canonicalSha256 : null, rasterFileSha256: typeof v321Artifact.rasterFileSha256 === "string" && /^[a-f0-9]{64}$/.test(v321Artifact.rasterFileSha256) ? v321Artifact.rasterFileSha256 : null, bandArtifactSha256: typeof v321Runtime.bandArtifactSha256 === "string" && /^[a-f0-9]{64}$/.test(v321Runtime.bandArtifactSha256) ? v321Runtime.bandArtifactSha256 : null, bandViewDigestSha256: typeof v321Runtime.bandViewDigestSha256 === "string" && /^[a-f0-9]{64}$/.test(v321Runtime.bandViewDigestSha256) ? v321Runtime.bandViewDigestSha256 : null, browserGate: v321Runtime.browserGate === "authored-not-run" ? "authored-not-run" : "unavailable", denseAggregateAccepted: false, artifactSha256: shadowV321Source?.sha256 ?? null },
        v322: { status: v322.status === "hud-runtime-wired-browser-pending-dense-incomplete-0-of-49" ? "hud-runtime-wired-browser-pending" : "unavailable", profileTokenSources: Array.isArray(v322Runtime.profileTokenSources) ? v322Runtime.profileTokenSources.filter((entry): entry is "v5" | "v6" | "legacy" => entry === "v5" || entry === "v6" || entry === "legacy").slice(0, 3) : [], displayTransform: v322Runtime.displayTransform === "linear-no-grade" ? "linear-no-grade" : "unavailable", diskRayCount: Math.min(4, Math.max(0, integer(v322Runtime.diskRayCount, 0))), bandCount: Math.min(3, Math.max(0, integer(v322Runtime.bandCount, 0))), saturationCount: Math.min(12, Math.max(0, integer(v322Runtime.saturationCount, 0))), payloadUnchanged: v322Runtime.payloadUnchanged === true, bandViewUnchanged: v322Runtime.bandViewUnchanged === true, cinematicBufferShared: typeof v322Runtime.cinematicBufferShared === "boolean" ? v322Runtime.cinematicBufferShared : null, browserQualificationRun: false, artifactSha256: shadowV322Source?.sha256 ?? null },
        v323: { status: v323.status === "provenance-export-wired-browser-pending-dense-incomplete-0-of-49" ? "provenance-export-wired-browser-pending" : "unavailable", profileTokenSources: Array.isArray(v323Runtime.profileTokenSources) ? v323Runtime.profileTokenSources.filter((entry): entry is "v5" | "v6" => entry === "v5" || entry === "v6").slice(0, 2) : [], jsonExport: v323Runtime.jsonExport === true, csvExport: v323Runtime.csvExport === true, noRayBuffer: v323Runtime.noRayBuffer === true, noScreenshot: v323Runtime.noScreenshot === true, objectUrlTracked: v323Runtime.objectUrlTracked === true, browserQualificationRun: false, artifactSha256: shadowV323Source?.sha256 ?? null },
      },
      artifacts: [],
      defaultKernel: "legacy-eih-1pn",
      surveyCompleteness: "unavailable",
      boundary: "sanitized-read-only-local-shadow-evidence",
    };
  } catch {
    return {
      version: "v285r1-relativity-evidence-snapshot",
      status: "corrupt",
      phases: {
        v282: { status: "unavailable", mismatchCount: 0, artifactSha256: null },
        v283: { status: "unavailable", executionCount: 0, criticalBracketCount: 0, capturedRayCount: 0, degenerateMetricCount: 0, truthReason: null, artifactSha256: null },
        v284: { status: "unavailable", completedShardCount: 0, plannedShardCount: 49, nextShardIndex: null, authority: "unavailable", artifactSha256: null },
        v285: { status: "unavailable", consumedTokenGroups: [], artifactSha256: null },
      },
      current: {
        v291: { status: "unavailable", capture02Agreement: false, maxMassShellResidualRaw: null, artifactSha256: null },
        v292: { status: "unavailable", executionCount: 0, criticalBracketCount: 0, classificationAgreement: null, failureReasons: [], artifactSha256: null },
        v293: { status: "unavailable", implementationSelfTestPassed: false, applicableExecutionCount: 0, artifactSha256: null },
        v294: { status: "unavailable", scientificPayloadSha256: null, browserQualificationRun: false },
        v296: { status: "unavailable", executionCount: 0, criticalBracketCount: 0, artifactSha256: null },
        v297: { status: "unavailable", applicableExecutionCount: 0, maxReleaseEvpaDifferenceDeg: null, maxInternalEvpaDifferenceDeg: null, artifactSha256: null },
        v298: { status: "unavailable", completedShardCount: 0, plannedShardCount: 49, nextShardIndex: null, runNextAvailable: false, artifactSha256: null },
        v298r1: { status: "unavailable", completedShardCount: 0, plannedShardCount: 49, nextShardIndex: null, runNextAvailable: false, peakRssBytes: null, peakRssTelemetry: "unavailable", auditedShardCount: 0, errorBudgetStatus: "unavailable", truthAuditStatus: "unavailable", toleranceLadderQualified: false, continuation: "unavailable", artifactSha256: null },
        v299: { status: "unavailable", scienceAuthority: "unavailable", denseAuthorityAccepted: false, gpuBackend: "unavailable", gpuAuthority: "unavailable", scienceDisplay: "unavailable", resourceLifecycle: "unavailable", visualAssetRuntime: "unavailable", visualProfile: "unavailable", visualProfileCandidates: [], artifactSha256: null },
        v312: { status: "unavailable", executionCount: 0, strictSolverLadderPairCount: 0, expectedSolverLadderPairCount: 64, distinctConvergenceObservableCount: 0, convergenceObservableCount: 256, peakRssGiB: null, polarizationStatus: "unavailable", correctedDenseCampaignCreated: false, artifactSha256: null },
        v313: { status: "unavailable", applicableExecutionCount: 0, maxReleaseEvpaDifferenceDeg: null, maxInternalEvpaDifferenceDeg: null, geometryAuthoritySha256: null, correctedDenseCampaignCreated: false, artifactSha256: null },
        v314: { status: "unavailable", plannedRayCount: 3097, plannedShardCount: 49, completedShardCount: 0, nextShardIndex: null, attemptConsumed: false, runNextAvailable: false, aggregateAvailable: false, artifactSha256: null },
        v315: { status: "unavailable", scienceAuthority: "unavailable", fullShortAuthoritySha256: null, geometryAuthoritySha256: null, polarizationAuthoritySha256: null, rayPlanAuthoritySha256: null, denseStatus: "unavailable", denseAggregateAccepted: false, browserQualificationRun: false, artifactSha256: null },
        v316: { status: "unavailable", requiredFieldCount: 46, declaredFieldCount: 0, runtimeGroupSignature: "unavailable", localShadowManualAbOnly: false, browserQualificationRun: false, artifactSha256: null },
        v317: { status: "unavailable", scientificTypedArrayCount: 0, digestAlgorithm: "unavailable", beforeAfterRasterDigestRequired: false, rasterBufferDisjointRequired: false, interactiveAuthoritySha256: null, historicalV299MutationApplied: false, webGpuDifferential: "unavailable", lifecycleBaselineReturnTelemetry: "unavailable", browserQualificationRun: false, artifactSha256: null },
        v318: { status: "unavailable", authoritySha256: null, sampleCount: 0, criticalBracketCount: 0, cpuAuthorityPreserved: false, webGpuDifferential: "unavailable", browserGate: "unavailable", artifactSha256: null },
        v319: { status: "unavailable", applicableDiskRayCount: 0, liouvilleInvariantRelativeResidual: null, diskQuadratureRelative: null, formulaSpectralRelative: null, spectralArtifactSha256: null, denseAggregateAccepted: false, browserQualificationRun: false, artifactSha256: null },
        v320: { status: "unavailable", applicableDiskRayCount: 0, bandCount: 0, bandQuadratureRelativeDifference: null, coveredBolometricFraction: null, saturatedChannelCount: 0, normalizationPolicy: "unavailable", bandArtifactSha256: null, denseAggregateAccepted: false, browserQualificationRun: false, artifactSha256: null },
        v321: { status: "unavailable", fixedBandColoredDiskRayCount: 0, fixedBandCount: 0, payloadUnchanged: false, bandViewUnchanged: false, rasterBufferDisjoint: false, cinematicBufferShared: null, rasterArtifactSha256: null, rasterFileSha256: null, bandArtifactSha256: null, bandViewDigestSha256: null, browserGate: "unavailable", denseAggregateAccepted: false, artifactSha256: null },
        v322: { status: "unavailable", profileTokenSources: [], displayTransform: "unavailable", diskRayCount: 0, bandCount: 0, saturationCount: 0, payloadUnchanged: false, bandViewUnchanged: false, cinematicBufferShared: null, browserQualificationRun: false, artifactSha256: null },
        v323: { status: "unavailable", profileTokenSources: [], jsonExport: false, csvExport: false, noRayBuffer: false, noScreenshot: false, objectUrlTracked: false, browserQualificationRun: false, artifactSha256: null },
      },
      artifacts: [],
      defaultKernel: "legacy-eih-1pn",
      surveyCompleteness: "unavailable",
      boundary: "sanitized-read-only-local-shadow-evidence",
    };
  }
}
