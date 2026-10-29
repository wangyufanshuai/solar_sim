export type RelativityReferenceTargetIdentityV287 = {
  requestedBarycenterId: 1;
  requestedCommand: "1";
  reportedHorizonsId: 199;
  reportedName: "Mercury Barycenter";
  targetKind: "planetary-system-barycenter";
  identityResolution: "command-1-resolved-by-horizons-to-mercury-barycenter-199";
  bodyCenterFamily: "separate-not-merged";
  frame: "ICRF/J2000";
  origin: "solar-system-barycenter";
  timeScale: "TDB";
};

export type RelativityReferenceFetchAttemptV287 = {
  version: "v287-relativity-reference-fetch-checkpoint-v1";
  attemptId: 2;
  status: "identity-cache-partial-1-of-9" | "failed-no-automatic-retry" | "fetching";
  requestedTarget: "mercury";
  requestedCommand: "1";
  requestLimit: 1;
  requestAttempted: boolean;
  automaticRetryApplied: false;
  completedTargets?: readonly ["mercury"];
  remainingTargetCount?: 8;
  checkpointSha256: string;
};

export function validateRelativityReferenceTargetIdentityV287(value: RelativityReferenceTargetIdentityV287): boolean {
  return value.requestedBarycenterId === 1
    && value.requestedCommand === "1"
    && value.reportedHorizonsId === 199
    && value.reportedName === "Mercury Barycenter"
    && value.targetKind === "planetary-system-barycenter"
    && value.bodyCenterFamily === "separate-not-merged"
    && value.origin === "solar-system-barycenter"
    && value.timeScale === "TDB";
}
