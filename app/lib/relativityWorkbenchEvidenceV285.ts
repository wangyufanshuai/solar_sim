export type RelativityWorkbenchEvidenceStatusV285 = "qualified" | "implemented-awaiting-qualification" | "blocked" | "incomplete" | "unavailable" | "qualification-withdrawn" | "quarantined" | "partial";
export type RelativityEvidenceLoadStatusV285 = "loading" | "ready" | "unavailable" | "corrupt" | "error";

export type AtlasRelativityEvidenceSnapshotV285 = {
  version: "v285r1-relativity-evidence-snapshot";
  status: "ready" | "unavailable" | "corrupt";
  phases: {
    v282: { status: RelativityWorkbenchEvidenceStatusV285; mismatchCount: number; artifactSha256: string | null };
    v283: { status: RelativityWorkbenchEvidenceStatusV285; executionCount: number; criticalBracketCount: number; capturedRayCount: number; degenerateMetricCount: number; truthReason: string | null; artifactSha256: string | null };
    v284: { status: RelativityWorkbenchEvidenceStatusV285; completedShardCount: number; plannedShardCount: number; nextShardIndex: number | null; authority: "legacy-withdrawn-v283" | "corrected-v288" | "unavailable"; artifactSha256: string | null };
    v285: { status: RelativityWorkbenchEvidenceStatusV285; consumedTokenGroups: readonly string[]; artifactSha256: string | null };
  };
  current: RelativityWorkbenchEvidenceV294;
  artifacts: readonly { kind: "FITS" | "PNG"; label: string; url: string; sha256: string }[];
  defaultKernel: "legacy-eih-1pn";
  surveyCompleteness: "unavailable";
  boundary: "sanitized-read-only-local-shadow-evidence";
};

export type RelativityWorkbenchEvidenceV294 = {
  v291: {
    status: "diagnostics-qualified" | "diagnostics-failed" | "unavailable";
    capture02Agreement: boolean;
    maxMassShellResidualRaw: number | null;
    artifactSha256: string | null;
  };
  v292: {
    status: "geometry-redshift-qualified" | "geometry-redshift-failed" | "unavailable";
    executionCount: number;
    criticalBracketCount: number;
    classificationAgreement: number | null;
    failureReasons: readonly string[];
    artifactSha256: string | null;
  };
  v293: {
    status: "polarization-qualified" | "polarization-pending" | "blocked-by-geometry" | "polarization-failed" | "unavailable";
    implementationSelfTestPassed: boolean;
    applicableExecutionCount: number;
    artifactSha256: string | null;
  };
  v294: {
    status: "implemented-awaiting-browser-qualification" | "unavailable";
    scientificPayloadSha256: string | null;
    browserQualificationRun: false;
  };
  v296: {
    status: "geometry-redshift-qualified" | "geometry-redshift-failed" | "unavailable";
    executionCount: number;
    criticalBracketCount: number;
    artifactSha256: string | null;
  };
  v297: {
    status: "full-kerr-short-authority-qualified" | "polarization-short-gate-failed" | "unavailable";
    applicableExecutionCount: number;
    maxReleaseEvpaDifferenceDeg: number | null;
    maxInternalEvpaDifferenceDeg: number | null;
    artifactSha256: string | null;
  };
  v298: {
    status: "incomplete-0-of-49" | "blocked-by-v297" | "unavailable";
    completedShardCount: number;
    plannedShardCount: number;
    nextShardIndex: number | null;
    runNextAvailable: false;
    artifactSha256: string | null;
  };
  v298r1: {
    status: `incomplete-${number}-of-49` | `running-shard-${number}` | "failed-no-automatic-retry" | "aggregate-failed-no-automatic-retry" | "complete-awaiting-aggregate" | "complete" | "unavailable";
    completedShardCount: number;
    plannedShardCount: number;
    nextShardIndex: number | null;
    runNextAvailable: boolean;
    peakRssBytes: number | null;
    peakRssTelemetry: "measured" | "corrected-probe-qualified-shard0-unmeasured" | "historical-invalid-zero" | "pending" | "unavailable";
    auditedShardCount: number;
    errorBudgetStatus: "componentwise-audited-no-rss" | "componentwise-structural-tolerance-withdrawn" | "pending" | "unavailable";
    truthAuditStatus: "failed-tolerance-ladder-degenerate" | "unavailable";
    toleranceLadderQualified: boolean;
    continuation: "requires-corrected-authority-and-new-campaign-namespace" | "unavailable";
    artifactSha256: string | null;
  };
  v299: {
    status: "implemented-awaiting-browser-qualification" | "unavailable";
    scienceAuthority: "v296-v297-short-gate-sparse" | "unavailable";
    denseAuthorityAccepted: boolean;
    gpuBackend: "webgpu-shadow-pending-differential" | "bounded-worker" | "unavailable";
    gpuAuthority: "cpu-v296-v297-portable-envelope" | "unavailable";
    scienceDisplay: "linear-no-grade-postfx-bypassed" | "unavailable";
    resourceLifecycle: "static-qualified-browser-baseline-pending" | "unavailable";
    visualAssetRuntime: "licensed-2k-local-shadow-v4-v5-v6-intent-only" | "unavailable";
    visualProfile: "science-cinematic-v5-v299" | "unavailable";
    visualProfileCandidates: readonly ("science-cinematic-v5-v299" | "science-cinematic-v6-v300")[];
    artifactSha256: string | null;
  };
  v312: {
    status: "corrected-authority-qualified" | "corrected-authority-failed" | "unavailable";
    executionCount: number;
    strictSolverLadderPairCount: number;
    expectedSolverLadderPairCount: number;
    distinctConvergenceObservableCount: number;
    convergenceObservableCount: number;
    peakRssGiB: number | null;
    polarizationStatus: "requires-v312-locked-polarization-requalification" | "blocked-by-v312" | "unavailable";
    correctedDenseCampaignCreated: false;
    artifactSha256: string | null;
  };
  v313: {
    status: "full-kerr-short-authority-qualified" | "polarization-requalification-failed" | "unavailable";
    applicableExecutionCount: number;
    maxReleaseEvpaDifferenceDeg: number | null;
    maxInternalEvpaDifferenceDeg: number | null;
    geometryAuthoritySha256: string | null;
    correctedDenseCampaignCreated: false;
    artifactSha256: string | null;
  };
  v314: {
    status: "incomplete-0-of-49" | "unavailable";
    plannedRayCount: number;
    plannedShardCount: number;
    completedShardCount: number;
    nextShardIndex: number | null;
    attemptConsumed: false;
    runNextAvailable: false;
    aggregateAvailable: false;
    artifactSha256: string | null;
  };
  v315: {
    status: "implemented-awaiting-browser-qualification" | "unavailable";
    scienceAuthority: "v312-v313-short-gate-sparse" | "unavailable";
    fullShortAuthoritySha256: string | null;
    geometryAuthoritySha256: string | null;
    polarizationAuthoritySha256: string | null;
    rayPlanAuthoritySha256: string | null;
    denseStatus: "incomplete-0-of-49" | "unavailable";
    denseAggregateAccepted: false;
    browserQualificationRun: false;
    artifactSha256: string | null;
  };
  v316: {
    status: "static-qualified-browser-pending" | "unavailable";
    requiredFieldCount: number;
    declaredFieldCount: number;
    runtimeGroupSignature: "resolved-profile-exact-v300" | "unavailable";
    localShadowManualAbOnly: boolean;
    browserQualificationRun: false;
    artifactSha256: string | null;
  };
  v317: {
    status: "static-qualified-browser-pending" | "unavailable";
    scientificTypedArrayCount: number;
    digestAlgorithm: "sha-256-field-framed-byte-exact" | "unavailable";
    beforeAfterRasterDigestRequired: boolean;
    rasterBufferDisjointRequired: boolean;
    interactiveAuthoritySha256: string | null;
    historicalV299MutationApplied: boolean;
    webGpuDifferential: "pending" | "unavailable";
    lifecycleBaselineReturnTelemetry: "wired-browser-pending" | "unavailable";
    browserQualificationRun: false;
    artifactSha256: string | null;
  };
  v318: {
    status: "reference-qualified-hardware-pending" | "unavailable";
    authoritySha256: string | null;
    sampleCount: number;
    criticalBracketCount: number;
    cpuAuthorityPreserved: boolean;
    webGpuDifferential: "pending" | "unavailable";
    browserGate: "authored-not-run" | "unavailable";
    artifactSha256: string | null;
  };
  v319: {
    status: "derived-spectrum-qualified-browser-pending" | "unavailable";
    applicableDiskRayCount: number;
    liouvilleInvariantRelativeResidual: number | null;
    diskQuadratureRelative: number | null;
    formulaSpectralRelative: number | null;
    spectralArtifactSha256: string | null;
    denseAggregateAccepted: false;
    browserQualificationRun: false;
    artifactSha256: string | null;
  };
  v320: {
    status: "fixed-band-qualified-browser-pending" | "unavailable";
    applicableDiskRayCount: number;
    bandCount: number;
    bandQuadratureRelativeDifference: number | null;
    coveredBolometricFraction: number | null;
    saturatedChannelCount: number;
    normalizationPolicy: "fixed-physical-reference-no-data-adaptive-rescale" | "unavailable";
    bandArtifactSha256: string | null;
    denseAggregateAccepted: false;
    browserQualificationRun: false;
    artifactSha256: string | null;
  };
  v321: {
    status: "runtime-wired-browser-pending" | "unavailable";
    fixedBandColoredDiskRayCount: number;
    fixedBandCount: number;
    payloadUnchanged: boolean;
    bandViewUnchanged: boolean;
    rasterBufferDisjoint: boolean;
    cinematicBufferShared: boolean | null;
    rasterArtifactSha256: string | null;
    rasterFileSha256: string | null;
    bandArtifactSha256: string | null;
    bandViewDigestSha256: string | null;
    browserGate: "authored-not-run" | "unavailable";
    denseAggregateAccepted: false;
    artifactSha256: string | null;
  };
  v322: {
    status: "hud-runtime-wired-browser-pending" | "unavailable";
    profileTokenSources: readonly ("v5" | "v6" | "legacy")[];
    displayTransform: "linear-no-grade" | "unavailable";
    diskRayCount: number;
    bandCount: number;
    saturationCount: number;
    payloadUnchanged: boolean;
    bandViewUnchanged: boolean;
    cinematicBufferShared: boolean | null;
    browserQualificationRun: false;
    artifactSha256: string | null;
  };
  v323: {
    status: "provenance-export-wired-browser-pending" | "unavailable";
    profileTokenSources: readonly ("v5" | "v6")[];
    jsonExport: boolean;
    csvExport: boolean;
    noRayBuffer: boolean;
    noScreenshot: boolean;
    objectUrlTracked: boolean;
    browserQualificationRun: false;
    artifactSha256: string | null;
  };
};

export type RelativityEvidenceResponseV285 = {
  version: "v285r1-relativity-evidence-response";
  available: boolean;
  reason: "ready" | "lite-boundary" | "evidence-unavailable" | "evidence-corrupt";
  snapshot: AtlasRelativityEvidenceSnapshotV285 | null;
};

export type RelativityWorkbenchEvidenceModelV285 = {
  version: "v285r1-relativity-workbench-evidence-model";
  loadStatus: RelativityEvidenceLoadStatusV285;
  rows: readonly { id: "v282" | "v283" | "v284" | "v285"; status: RelativityWorkbenchEvidenceStatusV285; label: string; metric: string; artifactSha256: string | null }[];
  currentRows: readonly { id: "v291" | "v292" | "v293" | "v294" | "v296" | "v297" | "v298" | "v298r1" | "v299" | "v312" | "v313" | "v314" | "v315" | "v316" | "v317" | "v318" | "v319" | "v320" | "v321" | "v322" | "v323"; status: string; label: string; metric: string; artifactSha256: string | null }[];
  campaignProgress: { completed: number; planned: number; nextShardIndex: number | null; status: RelativityWorkbenchEvidenceStatusV285 };
  exports: readonly ["JSON", "CSV", "FITS", "PNG"];
  artifacts: AtlasRelativityEvidenceSnapshotV285["artifacts"];
  missionCapsuleBoundary: "scenario-and-artifact-sha-only";
  defaultKernel: "legacy-eih-1pn";
  surveyCompleteness: "unavailable";
};

const UNAVAILABLE_SNAPSHOT: AtlasRelativityEvidenceSnapshotV285 = {
  version: "v285r1-relativity-evidence-snapshot",
  status: "unavailable",
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

function isSha(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

function boundedInteger(value: unknown, minimum: number, maximum: number, fallback: number): number {
  return Number.isSafeInteger(value) ? Math.min(maximum, Math.max(minimum, Number(value))) : fallback;
}

function phaseStatus(value: unknown): RelativityWorkbenchEvidenceStatusV285 {
  return ["qualified", "implemented-awaiting-qualification", "blocked", "incomplete", "unavailable", "qualification-withdrawn", "quarantined", "partial"].includes(String(value))
    ? value as RelativityWorkbenchEvidenceStatusV285
    : "unavailable";
}

function finiteNumber(value: unknown, minimum: number, maximum: number): number | null {
  return typeof value === "number" && Number.isFinite(value) ? Math.min(maximum, Math.max(minimum, value)) : null;
}

function parseCurrentEvidenceV294(value: unknown): RelativityWorkbenchEvidenceV294 {
  const current = value && typeof value === "object" ? value as Partial<RelativityWorkbenchEvidenceV294> : {};
  const v291 = current.v291;
  const v292 = current.v292;
  const v293 = current.v293;
  const v294 = current.v294;
  const v296 = current.v296;
  const v297 = current.v297;
  const v298 = current.v298;
  const v298r1 = current.v298r1;
  const v299 = current.v299;
  const v312 = current.v312;
  const v313 = current.v313;
  const v314 = current.v314;
  const v315 = current.v315;
  const v316 = current.v316;
  const v317 = current.v317;
  const v318 = current.v318;
  const v319 = current.v319;
  const v320 = current.v320;
  const v321 = current.v321;
  const v322 = current.v322;
  const v323 = current.v323;
  return {
    v291: {
      status: v291?.status === "diagnostics-qualified" || v291?.status === "diagnostics-failed" ? v291.status : "unavailable",
      capture02Agreement: v291?.capture02Agreement === true,
      maxMassShellResidualRaw: finiteNumber(v291?.maxMassShellResidualRaw, 0, 1e300),
      artifactSha256: isSha(v291?.artifactSha256) ? v291.artifactSha256 : null,
    },
    v292: {
      status: v292?.status === "geometry-redshift-qualified" || v292?.status === "geometry-redshift-failed" ? v292.status : "unavailable",
      executionCount: boundedInteger(v292?.executionCount, 0, 128, 0),
      criticalBracketCount: boundedInteger(v292?.criticalBracketCount, 0, 40, 0),
      classificationAgreement: finiteNumber(v292?.classificationAgreement, 0, 1),
      failureReasons: Array.isArray(v292?.failureReasons) ? v292.failureReasons.filter((item): item is string => typeof item === "string").slice(0, 8).map((item) => item.slice(0, 96)) : [],
      artifactSha256: isSha(v292?.artifactSha256) ? v292.artifactSha256 : null,
    },
    v293: {
      status: v293?.status === "polarization-qualified" || v293?.status === "polarization-pending" || v293?.status === "blocked-by-geometry" || v293?.status === "polarization-failed" ? v293.status : "unavailable",
      implementationSelfTestPassed: v293?.implementationSelfTestPassed === true,
      applicableExecutionCount: boundedInteger(v293?.applicableExecutionCount, 0, 128, 0),
      artifactSha256: isSha(v293?.artifactSha256) ? v293.artifactSha256 : null,
    },
    v294: {
      status: v294?.status === "implemented-awaiting-browser-qualification" ? v294.status : "unavailable",
      scientificPayloadSha256: isSha(v294?.scientificPayloadSha256) ? v294.scientificPayloadSha256 : null,
      browserQualificationRun: false,
    },
    v296: {
      status: v296?.status === "geometry-redshift-qualified" || v296?.status === "geometry-redshift-failed" ? v296.status : "unavailable",
      executionCount: boundedInteger(v296?.executionCount, 0, 128, 0),
      criticalBracketCount: boundedInteger(v296?.criticalBracketCount, 0, 40, 0),
      artifactSha256: isSha(v296?.artifactSha256) ? v296.artifactSha256 : null,
    },
    v297: {
      status: v297?.status === "full-kerr-short-authority-qualified" || v297?.status === "polarization-short-gate-failed" ? v297.status : "unavailable",
      applicableExecutionCount: boundedInteger(v297?.applicableExecutionCount, 0, 16, 0),
      maxReleaseEvpaDifferenceDeg: finiteNumber(v297?.maxReleaseEvpaDifferenceDeg, 0, 180),
      maxInternalEvpaDifferenceDeg: finiteNumber(v297?.maxInternalEvpaDifferenceDeg, 0, 180),
      artifactSha256: isSha(v297?.artifactSha256) ? v297.artifactSha256 : null,
    },
    v298: {
      status: v298?.status === "incomplete-0-of-49" || v298?.status === "blocked-by-v297" ? v298.status : "unavailable",
      completedShardCount: boundedInteger(v298?.completedShardCount, 0, 49, 0),
      plannedShardCount: boundedInteger(v298?.plannedShardCount, 1, 49, 49),
      nextShardIndex: v298?.nextShardIndex == null ? null : boundedInteger(v298.nextShardIndex, 0, 48, 0),
      runNextAvailable: false,
      artifactSha256: isSha(v298?.artifactSha256) ? v298.artifactSha256 : null,
    },
    v298r1: {
      status: typeof v298r1?.status === "string" && (/^incomplete-\d+-of-49$/.test(v298r1.status)
        || /^running-shard-\d+$/.test(v298r1.status)
        || ["failed-no-automatic-retry", "aggregate-failed-no-automatic-retry", "complete-awaiting-aggregate", "complete"].includes(v298r1.status))
        ? v298r1.status as RelativityWorkbenchEvidenceV294["v298r1"]["status"] : "unavailable",
      completedShardCount: boundedInteger(v298r1?.completedShardCount, 0, 49, 0),
      plannedShardCount: boundedInteger(v298r1?.plannedShardCount, 1, 49, 49),
      nextShardIndex: v298r1?.nextShardIndex == null ? null : boundedInteger(v298r1.nextShardIndex, 0, 48, 0),
      runNextAvailable: v298r1?.runNextAvailable === true && v298r1?.truthAuditStatus !== "failed-tolerance-ladder-degenerate",
      peakRssBytes: typeof v298r1?.peakRssBytes === "number" && Number.isFinite(v298r1.peakRssBytes) && v298r1.peakRssBytes > 0
        ? Math.min(2 ** 41, v298r1.peakRssBytes)
        : null,
      peakRssTelemetry: v298r1?.peakRssTelemetry === "measured"
        || v298r1?.peakRssTelemetry === "corrected-probe-qualified-shard0-unmeasured"
        || v298r1?.peakRssTelemetry === "historical-invalid-zero"
        || v298r1?.peakRssTelemetry === "pending"
        ? v298r1.peakRssTelemetry
        : "unavailable",
      auditedShardCount: boundedInteger(v298r1?.auditedShardCount, 0, 49, 0),
      errorBudgetStatus: v298r1?.errorBudgetStatus === "componentwise-audited-no-rss" || v298r1?.errorBudgetStatus === "componentwise-structural-tolerance-withdrawn" || v298r1?.errorBudgetStatus === "pending"
        ? v298r1.errorBudgetStatus
        : "unavailable",
      truthAuditStatus: v298r1?.truthAuditStatus === "failed-tolerance-ladder-degenerate" ? v298r1.truthAuditStatus : "unavailable",
      toleranceLadderQualified: v298r1?.toleranceLadderQualified === true,
      continuation: v298r1?.continuation === "requires-corrected-authority-and-new-campaign-namespace" ? v298r1.continuation : "unavailable",
      artifactSha256: isSha(v298r1?.artifactSha256) ? v298r1.artifactSha256 : null,
    },
    v299: {
      status: v299?.status === "implemented-awaiting-browser-qualification" ? v299.status : "unavailable",
      scienceAuthority: v299?.scienceAuthority === "v296-v297-short-gate-sparse" ? v299.scienceAuthority : "unavailable",
      denseAuthorityAccepted: v299?.denseAuthorityAccepted === true,
      gpuBackend: v299?.gpuBackend === "webgpu-shadow-pending-differential" || v299?.gpuBackend === "bounded-worker" ? v299.gpuBackend : "unavailable",
      gpuAuthority: v299?.gpuAuthority === "cpu-v296-v297-portable-envelope" ? v299.gpuAuthority : "unavailable",
      scienceDisplay: v299?.scienceDisplay === "linear-no-grade-postfx-bypassed" ? v299.scienceDisplay : "unavailable",
      resourceLifecycle: v299?.resourceLifecycle === "static-qualified-browser-baseline-pending" ? v299.resourceLifecycle : "unavailable",
      visualAssetRuntime: v299?.visualAssetRuntime === "licensed-2k-local-shadow-v4-v5-v6-intent-only" ? v299.visualAssetRuntime : "unavailable",
      visualProfile: v299?.visualProfile === "science-cinematic-v5-v299" ? v299.visualProfile : "unavailable",
      visualProfileCandidates: Array.isArray(v299?.visualProfileCandidates)
        ? v299.visualProfileCandidates.filter((profile): profile is "science-cinematic-v5-v299" | "science-cinematic-v6-v300" => profile === "science-cinematic-v5-v299" || profile === "science-cinematic-v6-v300").slice(0, 2)
        : [],
      artifactSha256: isSha(v299?.artifactSha256) ? v299.artifactSha256 : null,
    },
    v312: {
      status: v312?.status === "corrected-authority-qualified" || v312?.status === "corrected-authority-failed" ? v312.status : "unavailable",
      executionCount: boundedInteger(v312?.executionCount, 0, 128, 0),
      strictSolverLadderPairCount: boundedInteger(v312?.strictSolverLadderPairCount, 0, 64, 0),
      expectedSolverLadderPairCount: boundedInteger(v312?.expectedSolverLadderPairCount, 64, 64, 64),
      distinctConvergenceObservableCount: boundedInteger(v312?.distinctConvergenceObservableCount, 0, 256, 0),
      convergenceObservableCount: boundedInteger(v312?.convergenceObservableCount, 0, 256, 256),
      peakRssGiB: finiteNumber(v312?.peakRssGiB, 0, 2),
      polarizationStatus: v312?.polarizationStatus === "requires-v312-locked-polarization-requalification" || v312?.polarizationStatus === "blocked-by-v312" ? v312.polarizationStatus : "unavailable",
      correctedDenseCampaignCreated: false,
      artifactSha256: isSha(v312?.artifactSha256) ? v312.artifactSha256 : null,
    },
    v313: {
      status: v313?.status === "full-kerr-short-authority-qualified" || v313?.status === "polarization-requalification-failed" ? v313.status : "unavailable",
      applicableExecutionCount: boundedInteger(v313?.applicableExecutionCount, 0, 16, 0),
      maxReleaseEvpaDifferenceDeg: finiteNumber(v313?.maxReleaseEvpaDifferenceDeg, 0, 180),
      maxInternalEvpaDifferenceDeg: finiteNumber(v313?.maxInternalEvpaDifferenceDeg, 0, 180),
      geometryAuthoritySha256: isSha(v313?.geometryAuthoritySha256) ? v313.geometryAuthoritySha256 : null,
      correctedDenseCampaignCreated: false,
      artifactSha256: isSha(v313?.artifactSha256) ? v313.artifactSha256 : null,
    },
    v314: {
      status: v314?.status === "incomplete-0-of-49" ? v314.status : "unavailable",
      plannedRayCount: boundedInteger(v314?.plannedRayCount, 3097, 3097, 3097),
      plannedShardCount: boundedInteger(v314?.plannedShardCount, 49, 49, 49),
      completedShardCount: boundedInteger(v314?.completedShardCount, 0, 49, 0),
      nextShardIndex: v314?.nextShardIndex == null ? null : boundedInteger(v314.nextShardIndex, 0, 48, 0),
      attemptConsumed: false,
      runNextAvailable: false,
      aggregateAvailable: false,
      artifactSha256: isSha(v314?.artifactSha256) ? v314.artifactSha256 : null,
    },
    v315: {
      status: v315?.status === "implemented-awaiting-browser-qualification" ? v315.status : "unavailable",
      scienceAuthority: v315?.scienceAuthority === "v312-v313-short-gate-sparse" ? v315.scienceAuthority : "unavailable",
      fullShortAuthoritySha256: isSha(v315?.fullShortAuthoritySha256) ? v315.fullShortAuthoritySha256 : null,
      geometryAuthoritySha256: isSha(v315?.geometryAuthoritySha256) ? v315.geometryAuthoritySha256 : null,
      polarizationAuthoritySha256: isSha(v315?.polarizationAuthoritySha256) ? v315.polarizationAuthoritySha256 : null,
      rayPlanAuthoritySha256: isSha(v315?.rayPlanAuthoritySha256) ? v315.rayPlanAuthoritySha256 : null,
      denseStatus: v315?.denseStatus === "incomplete-0-of-49" ? v315.denseStatus : "unavailable",
      denseAggregateAccepted: false,
      browserQualificationRun: false,
      artifactSha256: isSha(v315?.artifactSha256) ? v315.artifactSha256 : null,
    },
    v316: {
      status: v316?.status === "static-qualified-browser-pending" ? v316.status : "unavailable",
      requiredFieldCount: boundedInteger(v316?.requiredFieldCount, 46, 46, 46),
      declaredFieldCount: boundedInteger(v316?.declaredFieldCount, 0, 46, 0),
      runtimeGroupSignature: v316?.runtimeGroupSignature === "resolved-profile-exact-v300" ? v316.runtimeGroupSignature : "unavailable",
      localShadowManualAbOnly: v316?.localShadowManualAbOnly === true,
      browserQualificationRun: false,
      artifactSha256: isSha(v316?.artifactSha256) ? v316.artifactSha256 : null,
    },
    v317: {
      status: v317?.status === "static-qualified-browser-pending" ? v317.status : "unavailable",
      scientificTypedArrayCount: boundedInteger(v317?.scientificTypedArrayCount, 0, 67, 0),
      digestAlgorithm: v317?.digestAlgorithm === "sha-256-field-framed-byte-exact" ? v317.digestAlgorithm : "unavailable",
      beforeAfterRasterDigestRequired: v317?.beforeAfterRasterDigestRequired === true,
      rasterBufferDisjointRequired: v317?.rasterBufferDisjointRequired === true,
      interactiveAuthoritySha256: isSha(v317?.interactiveAuthoritySha256) ? v317.interactiveAuthoritySha256 : null,
      historicalV299MutationApplied: v317?.historicalV299MutationApplied === true,
      webGpuDifferential: v317?.webGpuDifferential === "pending" ? "pending" : "unavailable",
      lifecycleBaselineReturnTelemetry: v317?.lifecycleBaselineReturnTelemetry === "wired-browser-pending" ? "wired-browser-pending" : "unavailable",
      browserQualificationRun: false,
      artifactSha256: isSha(v317?.artifactSha256) ? v317.artifactSha256 : null,
    },
    v318: {
      status: v318?.status === "reference-qualified-hardware-pending" ? v318.status : "unavailable",
      authoritySha256: isSha(v318?.authoritySha256) ? v318.authoritySha256 : null,
      sampleCount: boundedInteger(v318?.sampleCount, 0, 16, 0),
      criticalBracketCount: boundedInteger(v318?.criticalBracketCount, 0, 40, 0),
      cpuAuthorityPreserved: v318?.cpuAuthorityPreserved === true,
      webGpuDifferential: v318?.webGpuDifferential === "pending" ? "pending" : "unavailable",
      browserGate: v318?.browserGate === "authored-not-run" ? "authored-not-run" : "unavailable",
      artifactSha256: isSha(v318?.artifactSha256) ? v318.artifactSha256 : null,
    },
    v319: {
      status: v319?.status === "derived-spectrum-qualified-browser-pending" ? v319.status : "unavailable",
      applicableDiskRayCount: boundedInteger(v319?.applicableDiskRayCount, 0, 4, 0),
      liouvilleInvariantRelativeResidual: finiteNumber(v319?.liouvilleInvariantRelativeResidual, 0, 1),
      diskQuadratureRelative: finiteNumber(v319?.diskQuadratureRelative, 0, 1),
      formulaSpectralRelative: finiteNumber(v319?.formulaSpectralRelative, 0, 1),
      spectralArtifactSha256: isSha(v319?.spectralArtifactSha256) ? v319.spectralArtifactSha256 : null,
      denseAggregateAccepted: false,
      browserQualificationRun: false,
      artifactSha256: isSha(v319?.artifactSha256) ? v319.artifactSha256 : null,
    },
    v320: {
      status: v320?.status === "fixed-band-qualified-browser-pending" ? v320.status : "unavailable",
      applicableDiskRayCount: boundedInteger(v320?.applicableDiskRayCount, 0, 4, 0),
      bandCount: boundedInteger(v320?.bandCount, 0, 3, 0),
      bandQuadratureRelativeDifference: finiteNumber(v320?.bandQuadratureRelativeDifference, 0, 1),
      coveredBolometricFraction: finiteNumber(v320?.coveredBolometricFraction, 0, 1 + 1e-6),
      saturatedChannelCount: boundedInteger(v320?.saturatedChannelCount, 0, 12, 0),
      normalizationPolicy: v320?.normalizationPolicy === "fixed-physical-reference-no-data-adaptive-rescale" ? v320.normalizationPolicy : "unavailable",
      bandArtifactSha256: isSha(v320?.bandArtifactSha256) ? v320.bandArtifactSha256 : null,
      denseAggregateAccepted: false,
      browserQualificationRun: false,
      artifactSha256: isSha(v320?.artifactSha256) ? v320.artifactSha256 : null,
    },
    v321: {
      status: v321?.status === "runtime-wired-browser-pending" ? v321.status : "unavailable",
      fixedBandColoredDiskRayCount: boundedInteger(v321?.fixedBandColoredDiskRayCount, 0, 4, 0),
      fixedBandCount: boundedInteger(v321?.fixedBandCount, 0, 3, 0),
      payloadUnchanged: v321?.payloadUnchanged === true,
      bandViewUnchanged: v321?.bandViewUnchanged === true,
      rasterBufferDisjoint: v321?.rasterBufferDisjoint === true,
      cinematicBufferShared: typeof v321?.cinematicBufferShared === "boolean" ? v321.cinematicBufferShared : null,
      rasterArtifactSha256: isSha(v321?.rasterArtifactSha256) ? v321.rasterArtifactSha256 : null,
      rasterFileSha256: isSha(v321?.rasterFileSha256) ? v321.rasterFileSha256 : null,
      bandArtifactSha256: isSha(v321?.bandArtifactSha256) ? v321.bandArtifactSha256 : null,
      bandViewDigestSha256: isSha(v321?.bandViewDigestSha256) ? v321.bandViewDigestSha256 : null,
      browserGate: v321?.browserGate === "authored-not-run" ? v321.browserGate : "unavailable",
      denseAggregateAccepted: false,
      artifactSha256: isSha(v321?.artifactSha256) ? v321.artifactSha256 : null,
    },
    v322: {
      status: v322?.status === "hud-runtime-wired-browser-pending" ? v322.status : "unavailable",
      profileTokenSources: Array.isArray(v322?.profileTokenSources) ? v322.profileTokenSources.filter((entry): entry is "v5" | "v6" | "legacy" => entry === "v5" || entry === "v6" || entry === "legacy").slice(0, 3) : [],
      displayTransform: v322?.displayTransform === "linear-no-grade" ? v322.displayTransform : "unavailable",
      diskRayCount: boundedInteger(v322?.diskRayCount, 0, 4, 0),
      bandCount: boundedInteger(v322?.bandCount, 0, 3, 0),
      saturationCount: boundedInteger(v322?.saturationCount, 0, 12, 0),
      payloadUnchanged: v322?.payloadUnchanged === true,
      bandViewUnchanged: v322?.bandViewUnchanged === true,
      cinematicBufferShared: typeof v322?.cinematicBufferShared === "boolean" ? v322.cinematicBufferShared : null,
      browserQualificationRun: false,
      artifactSha256: isSha(v322?.artifactSha256) ? v322.artifactSha256 : null,
    },
    v323: {
      status: v323?.status === "provenance-export-wired-browser-pending" ? v323.status : "unavailable",
      profileTokenSources: Array.isArray(v323?.profileTokenSources) ? v323.profileTokenSources.filter((entry): entry is "v5" | "v6" => entry === "v5" || entry === "v6").slice(0, 2) : [],
      jsonExport: v323?.jsonExport === true,
      csvExport: v323?.csvExport === true,
      noRayBuffer: v323?.noRayBuffer === true,
      noScreenshot: v323?.noScreenshot === true,
      objectUrlTracked: v323?.objectUrlTracked === true,
      browserQualificationRun: false,
      artifactSha256: isSha(v323?.artifactSha256) ? v323.artifactSha256 : null,
    },
  };
}

export function parseRelativityEvidenceResponseV285(value: unknown): RelativityEvidenceResponseV285 {
  if (!value || typeof value !== "object") throw new Error("Relativity evidence response is invalid");
  const response = value as Partial<RelativityEvidenceResponseV285>;
  if (response.version !== "v285r1-relativity-evidence-response" || typeof response.available !== "boolean") throw new Error("Relativity evidence response version is invalid");
  if (!response.available || !response.snapshot) return { version: response.version, available: false, reason: response.reason ?? "evidence-unavailable", snapshot: null };
  const raw = response.snapshot as AtlasRelativityEvidenceSnapshotV285;
  if (raw.version !== "v285r1-relativity-evidence-snapshot" || !raw.phases) throw new Error("Relativity evidence snapshot is invalid");
  const artifacts = Array.isArray(raw.artifacts) ? raw.artifacts.filter((item) => item && (item.kind === "FITS" || item.kind === "PNG") && typeof item.label === "string" && typeof item.url === "string" && item.url.startsWith("/api/atlas/relativity-evidence/artifacts/") && isSha(item.sha256)).slice(0, 8) : [];
  return {
    version: response.version,
    available: true,
    reason: "ready",
    snapshot: {
      version: raw.version,
      status: raw.status === "corrupt" ? "corrupt" : "ready",
      phases: {
        v282: { status: phaseStatus(raw.phases.v282?.status), mismatchCount: boundedInteger(raw.phases.v282?.mismatchCount, 0, 12, 0), artifactSha256: isSha(raw.phases.v282?.artifactSha256) ? raw.phases.v282.artifactSha256 : null },
        v283: { status: phaseStatus(raw.phases.v283?.status), executionCount: boundedInteger(raw.phases.v283?.executionCount, 0, 128, 0), criticalBracketCount: boundedInteger(raw.phases.v283?.criticalBracketCount, 0, 40, 0), capturedRayCount: boundedInteger(raw.phases.v283?.capturedRayCount, 0, 128, 0), degenerateMetricCount: boundedInteger(raw.phases.v283?.degenerateMetricCount, 0, 8, 0), truthReason: typeof raw.phases.v283?.truthReason === "string" ? raw.phases.v283.truthReason.slice(0, 160) : null, artifactSha256: isSha(raw.phases.v283?.artifactSha256) ? raw.phases.v283.artifactSha256 : null },
        v284: { status: phaseStatus(raw.phases.v284?.status), completedShardCount: boundedInteger(raw.phases.v284?.completedShardCount, 0, 49, 0), plannedShardCount: boundedInteger(raw.phases.v284?.plannedShardCount, 1, 49, 49), nextShardIndex: raw.phases.v284?.nextShardIndex == null ? null : boundedInteger(raw.phases.v284.nextShardIndex, 0, 48, 0), authority: raw.phases.v284?.authority === "legacy-withdrawn-v283" || raw.phases.v284?.authority === "corrected-v288" ? raw.phases.v284.authority : "unavailable", artifactSha256: isSha(raw.phases.v284?.artifactSha256) ? raw.phases.v284.artifactSha256 : null },
        v285: { status: phaseStatus(raw.phases.v285?.status), consumedTokenGroups: Array.isArray(raw.phases.v285?.consumedTokenGroups) ? raw.phases.v285.consumedTokenGroups.filter((item): item is string => typeof item === "string").slice(0, 16) : [], artifactSha256: isSha(raw.phases.v285?.artifactSha256) ? raw.phases.v285.artifactSha256 : null },
      },
      current: parseCurrentEvidenceV294(raw.current),
      artifacts,
      defaultKernel: "legacy-eih-1pn",
      surveyCompleteness: "unavailable",
      boundary: "sanitized-read-only-local-shadow-evidence",
    },
  };
}

export function createRelativityWorkbenchEvidenceModelV285(snapshot: AtlasRelativityEvidenceSnapshotV285 | null = null, loadStatus: RelativityEvidenceLoadStatusV285 = snapshot ? "ready" : "unavailable"): RelativityWorkbenchEvidenceModelV285 {
  const source = snapshot ?? UNAVAILABLE_SNAPSHOT;
  const { v282, v283, v284, v285 } = source.phases;
  return {
    version: "v285r1-relativity-workbench-evidence-model",
    loadStatus,
    rows: [
      { id: "v282", status: v282.status, label: "Weak-field reference identity", metric: `${v282.mismatchCount} target mismatches`, artifactSha256: v282.artifactSha256 },
      { id: "v283", status: v283.status, label: "Kerr authority truth audit", metric: `${v283.executionCount}/128 executions / ${v283.capturedRayCount} captures / ${v283.degenerateMetricCount} degenerate metrics`, artifactSha256: v283.artifactSha256 },
      { id: "v284", status: v284.status, label: "Dense Kerr campaign", metric: `${v284.completedShardCount}/${v284.plannedShardCount} shards / ${v284.authority}`, artifactSha256: v284.artifactSha256 },
      { id: "v285", status: v285.status, label: "Science Cinematic V4 runtime", metric: `${v285.consumedTokenGroups.length}/8 token groups`, artifactSha256: v285.artifactSha256 },
    ],
    currentRows: [
      { id: "v291", status: source.current.v291.status, label: "Coordinate and event diagnostic", metric: `capture-02 ${source.current.v291.capture02Agreement ? "agrees" : "blocked"} / shell ${source.current.v291.maxMassShellResidualRaw?.toExponential(2) ?? "unavailable"}`, artifactSha256: source.current.v291.artifactSha256 },
      { id: "v292", status: source.current.v292.status, label: "Historical geometry and redshift gate", metric: `${source.current.v292.executionCount}/128 / agreement ${source.current.v292.classificationAgreement?.toFixed(4) ?? "unavailable"}`, artifactSha256: source.current.v292.artifactSha256 },
      { id: "v293", status: source.current.v293.status, label: "Historical Walker-Penrose polarization", metric: `self-test ${source.current.v293.implementationSelfTestPassed ? "passed" : "unavailable"} / applicable ${source.current.v293.applicableExecutionCount}`, artifactSha256: source.current.v293.artifactSha256 },
      { id: "v294", status: source.current.v294.status, label: "Layered workbench runtime", metric: "browser qualification not run", artifactSha256: source.current.v294.scientificPayloadSha256 },
      { id: "v296", status: source.current.v296.status, label: "Constraint-preserving geometry and redshift", metric: `${source.current.v296.executionCount}/128 / ${source.current.v296.criticalBracketCount}/40 brackets`, artifactSha256: source.current.v296.artifactSha256 },
      { id: "v297", status: source.current.v297.status, label: "Formal Walker-Penrose polarization", metric: `${source.current.v297.applicableExecutionCount}/16 / release delta-EVPA ${source.current.v297.maxReleaseEvpaDifferenceDeg?.toExponential(2) ?? "unavailable"} deg`, artifactSha256: source.current.v297.artifactSha256 },
      { id: "v298", status: source.current.v298.status, label: "Historical dense campaign plan", metric: `${source.current.v298.completedShardCount}/${source.current.v298.plannedShardCount} shards / run-next disabled`, artifactSha256: source.current.v298.artifactSha256 },
      { id: "v298r1", status: source.current.v298r1.status, label: "Executable dense Kerr campaign", metric: `${source.current.v298r1.completedShardCount}/${source.current.v298r1.plannedShardCount} shards / ${source.current.v298r1.auditedShardCount} audited / ${source.current.v298r1.errorBudgetStatus} / truth ${source.current.v298r1.truthAuditStatus} / next ${source.current.v298r1.nextShardIndex ?? "none"} / RSS ${source.current.v298r1.peakRssBytes == null ? source.current.v298r1.peakRssTelemetry : `${(source.current.v298r1.peakRssBytes / 2 ** 30).toFixed(2)} GiB measured`}`, artifactSha256: source.current.v298r1.artifactSha256 },
      { id: "v299", status: source.current.v299.status, label: "Science/Cinematic V5/V6 runtime", metric: `${source.current.v299.visualProfileCandidates.join(" + ") || "no visual candidate"} / ${source.current.v299.scienceAuthority} / ${source.current.v299.scienceDisplay} / ${source.current.v299.gpuAuthority} / ${source.current.v299.gpuBackend} / ${source.current.v299.resourceLifecycle} / ${source.current.v299.visualAssetRuntime}`, artifactSha256: source.current.v299.artifactSha256 },
      { id: "v312", status: source.current.v312.status, label: "Corrected two-tolerance Kerr authority", metric: `${source.current.v312.executionCount}/128 / ladder ${source.current.v312.strictSolverLadderPairCount}/${source.current.v312.expectedSolverLadderPairCount} / distinct ${source.current.v312.distinctConvergenceObservableCount}/${source.current.v312.convergenceObservableCount} / polarization ${source.current.v312.polarizationStatus} / dense not-created`, artifactSha256: source.current.v312.artifactSha256 },
      { id: "v313", status: source.current.v313.status, label: "v312-locked WP / KS polarization", metric: `${source.current.v313.applicableExecutionCount}/16 / release ΔEVPA ${source.current.v313.maxReleaseEvpaDifferenceDeg?.toExponential(2) ?? "unavailable"}° / internal ${source.current.v313.maxInternalEvpaDifferenceDeg?.toExponential(2) ?? "unavailable"}° / corrected dense not-created`, artifactSha256: source.current.v313.artifactSha256 },
      { id: "v314", status: source.current.v314.status, label: "Corrected dense campaign namespace", metric: `${source.current.v314.completedShardCount}/${source.current.v314.plannedShardCount} shards / ${source.current.v314.plannedRayCount} rays / run-next disabled / aggregate unavailable`, artifactSha256: source.current.v314.artifactSha256 },
      { id: "v315", status: source.current.v315.status, label: "Corrected Science runtime authority", metric: `${source.current.v315.scienceAuthority} / dense ${source.current.v315.denseStatus} / aggregate rejected / browser not run`, artifactSha256: source.current.v315.artifactSha256 },
      { id: "v316", status: source.current.v316.status, label: "Science Cinematic field-level runtime", metric: `${source.current.v316.declaredFieldCount}/${source.current.v316.requiredFieldCount} fields / ${source.current.v316.runtimeGroupSignature} / manual local-shadow A/B / browser not run`, artifactSha256: source.current.v316.artifactSha256 },
      { id: "v317", status: source.current.v317.status, label: "Science buffer integrity and lifecycle", metric: `${source.current.v317.scientificTypedArrayCount}/67 arrays / ${source.current.v317.digestAlgorithm} / raster disjoint ${source.current.v317.rasterBufferDisjointRequired ? "required" : "unavailable"} / WebGPU differential ${source.current.v317.webGpuDifferential} / lifecycle ${source.current.v317.lifecycleBaselineReturnTelemetry}`, artifactSha256: source.current.v317.artifactSha256 },
      { id: "v318", status: source.current.v318.status, label: "CPU/GPU canonical differential", metric: `${source.current.v318.sampleCount}/16 rays + ${source.current.v318.criticalBracketCount}/40 brackets / CPU authority ${source.current.v318.cpuAuthorityPreserved ? "preserved" : "unavailable"} / WebGPU ${source.current.v318.webGpuDifferential} / browser gate ${source.current.v318.browserGate}`, artifactSha256: source.current.v318.artifactSha256 },
      { id: "v319", status: source.current.v319.status, label: "Page–Thorne sparse spectrum", metric: `${source.current.v319.applicableDiskRayCount}/4 disk rays / Liouville ${source.current.v319.liouvilleInvariantRelativeResidual?.toExponential(2) ?? "unavailable"} / quadrature ${source.current.v319.diskQuadratureRelative?.toExponential(2) ?? "unavailable"} / formula ${source.current.v319.formulaSpectralRelative?.toExponential(2) ?? "unavailable"} / dense rejected / browser not run`, artifactSha256: source.current.v319.artifactSha256 },
      { id: "v320", status: source.current.v320.status, label: "Fixed-band scientific false color", metric: `${source.current.v320.applicableDiskRayCount}/4 disk rays / ${source.current.v320.bandCount}/3 bands / quadrature ${source.current.v320.bandQuadratureRelativeDifference?.toExponential(2) ?? "unavailable"} / coverage ${source.current.v320.coveredBolometricFraction == null ? "unavailable" : `${(source.current.v320.coveredBolometricFraction * 100).toFixed(4)}%`} / saturated ${source.current.v320.saturatedChannelCount}/12 / fixed reference / dense rejected`, artifactSha256: source.current.v320.artifactSha256 },
      { id: "v321", status: source.current.v321.status, label: "Runtime fixed-band Science raster", metric: `${source.current.v321.fixedBandColoredDiskRayCount}/4 colored disk rays / ${source.current.v321.fixedBandCount}/3 bands / payload ${source.current.v321.payloadUnchanged ? "immutable" : "unavailable"} / band view ${source.current.v321.bandViewUnchanged ? "immutable" : "unavailable"} / raster ${source.current.v321.rasterBufferDisjoint ? "disjoint" : "unavailable"} / cinematic shared ${source.current.v321.cinematicBufferShared == null ? "unavailable" : String(source.current.v321.cinematicBufferShared)} / browser ${source.current.v321.browserGate}`, artifactSha256: source.current.v321.artifactSha256 },
      { id: "v322", status: source.current.v322.status, label: "Science spectral telemetry HUD", metric: `${source.current.v322.profileTokenSources.join("+") || "no profile"} / ${source.current.v322.diskRayCount}/4 disk rays / ${source.current.v322.bandCount}/3 bands / ${source.current.v322.displayTransform} / payload ${source.current.v322.payloadUnchanged ? "stable" : "pending"} / browser not run`, artifactSha256: source.current.v322.artifactSha256 },
      { id: "v323", status: source.current.v323.status, label: "Read-only Science provenance export", metric: `${source.current.v323.profileTokenSources.join("+") || "no profile"} / JSON ${source.current.v323.jsonExport ? "ready" : "unavailable"} / CSV ${source.current.v323.csvExport ? "ready" : "unavailable"} / ray buffer ${source.current.v323.noRayBuffer ? "excluded" : "unknown"} / object URL ${source.current.v323.objectUrlTracked ? "tracked" : "unknown"} / browser not run`, artifactSha256: source.current.v323.artifactSha256 },
    ],
    campaignProgress: {
      completed: source.current.v314.completedShardCount,
      planned: source.current.v314.plannedShardCount,
      nextShardIndex: source.current.v314.nextShardIndex,
      status: source.current.v314.status === "unavailable" ? "unavailable" : "incomplete",
    },
    exports: ["JSON", "CSV", "FITS", "PNG"],
    artifacts: source.artifacts,
    missionCapsuleBoundary: "scenario-and-artifact-sha-only",
    defaultKernel: "legacy-eih-1pn",
    surveyCompleteness: "unavailable",
  };
}

export function serializeRelativityEvidenceJsonV285(snapshot: AtlasRelativityEvidenceSnapshotV285): string {
  return `${JSON.stringify(snapshot, null, 2)}\n`;
}

export function serializeRelativityEvidenceCsvV285(snapshot: AtlasRelativityEvidenceSnapshotV285): string {
  const model = createRelativityWorkbenchEvidenceModelV285(snapshot);
  const rows = ["phase,status,label,metric,artifact_sha256", ...[...model.rows, ...model.currentRows].map((row) => [row.id, row.status, row.label, row.metric, row.artifactSha256 ?? ""].map((entry) => `"${String(entry).replaceAll('"', '""')}"`).join(","))];
  return `${rows.join("\n")}\n`;
}
