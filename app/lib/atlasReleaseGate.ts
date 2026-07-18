import type {
  AtlasReleaseGateSummary,
  AtlasReleaseGateVersion,
  AtlasValidationDomain,
  AtlasValidationDomainId,
  AtlasValidationDomainStatus,
} from "./simulationDiagnosticsTypes";

export const ATLAS_RELEASE_GATE_VERSION: AtlasReleaseGateVersion =
  "v36-release-candidate-gate";

export type CreateAtlasReleaseGateSummaryArgs = {
  validationDomains: readonly AtlasValidationDomain[];
};

export function createAtlasReleaseGateSummary({
  validationDomains,
}: CreateAtlasReleaseGateSummaryArgs): AtlasReleaseGateSummary {
  const sourceDomains = validationDomains.filter((domain) => domain.id !== "release-gate");
  const readyDomainCount = sourceDomains.filter((domain) => domain.status === "ready").length;
  const pendingDomainCount = sourceDomains.filter((domain) => domain.status === "pending").length;
  const failedDomainCount = sourceDomains.filter((domain) => domain.status === "failed").length;
  const informationalDomainCount = sourceDomains.filter(
    (domain) => domain.status === "informational",
  ).length;
  const checkedDomainCount = sourceDomains.length;
  const status = releaseGateStatus({
    readyDomainCount,
    pendingDomainCount,
    failedDomainCount,
    informationalDomainCount,
  });
  const blockerCount = failedDomainCount;
  const warningCount = pendingDomainCount;

  return {
    version: ATLAS_RELEASE_GATE_VERSION,
    status,
    blockerCount,
    warningCount,
    readyDomainCount,
    pendingDomainCount,
    failedDomainCount,
    informationalDomainCount,
    checkedDomainCount,
    sourceDomainIds: sourceDomains.map((domain) => domain.id),
    primaryMetric: `${status}; blockers ${blockerCount}; warnings ${warningCount}; domains ${checkedDomainCount}`,
    trustedBoundary:
      "Local release-candidate readiness rollup over existing Validation Console domains only. It does not run tests, certify scientific correctness, refresh online validation, or mutate physics state.",
  };
}

export function createAtlasReleaseGateDomain(
  summary: AtlasReleaseGateSummary,
): AtlasValidationDomain {
  return {
    id: "release-gate",
    title: "Release Candidate Gate",
    status: summary.status,
    source: summary.version,
    model:
      "Read-only v36 hardening rollup over local Evidence, Validation Console, Report Studio, Performance Budget and workflow readiness domains",
    primaryMetric: summary.primaryMetric,
    boundary: summary.trustedBoundary,
    actionLabel: "Review gate",
    relatedNavigatorItemId: "panel:validation-console",
    relatedPanelId: "validation-console",
    relatedEvidenceClaimId: "release-candidate-gate",
  };
}

function releaseGateStatus({
  readyDomainCount,
  pendingDomainCount,
  failedDomainCount,
  informationalDomainCount,
}: {
  readyDomainCount: number;
  pendingDomainCount: number;
  failedDomainCount: number;
  informationalDomainCount: number;
}): AtlasValidationDomainStatus {
  if (failedDomainCount > 0) return "failed";
  if (pendingDomainCount > 0) return "pending";
  if (readyDomainCount > 0) return "ready";
  if (informationalDomainCount > 0) return "informational";
  return "informational";
}
