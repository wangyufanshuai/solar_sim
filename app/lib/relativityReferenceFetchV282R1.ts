export const RELATIVITY_REFERENCE_EPOCHS_V282R1 = [...Array.from({ length: 31 }, (_, day) => 2451545 + day), 2451910, 2455197.5] as const;
export const RELATIVITY_BARYCENTER_TARGETS_V282R1 = [
  ["mercury", "1", 1], ["venus", "2", 2], ["earth", "3", 3],
  ["mars", "4", 4], ["jupiter", "5", 5], ["saturn", "6", 6],
  ["uranus", "7", 7], ["neptune", "8", 8], ["pluto", "9", 9],
] as const;

export type RelativityReferenceTargetFetchResultV282R1 = {
  targetId: typeof RELATIVITY_BARYCENTER_TARGETS_V282R1[number][0];
  naifTargetId: number;
  horizonsCommand: string;
  targetKind: "planetary-system-barycenter";
  epochCount: 33;
  requestCount: 1;
  rawSha256: string;
  normalizedSha256: string;
  automaticRetryApplied: false;
};

export type RelativityReferenceFetchCheckpointV282R1 = {
  version: "v282r1-relativity-reference-fetch-checkpoint-v1";
  status: "pending" | "fetching" | "failed-no-automatic-retry" | "identity-cache-ready-awaiting-campaign";
  completedTargets: readonly string[];
  attemptedTargets: readonly string[];
  nextTarget: string | null;
  failedTarget: string | null;
  requestsPerTargetLimit: 1;
  automaticRetryApplied: false;
};

export function isBarycenterTargetIdentityV282R1(args: { targetId: string; command: string; naifTargetId: number; targetKind: string }): boolean {
  return RELATIVITY_BARYCENTER_TARGETS_V282R1.some(([targetId, command, naifTargetId]) => args.targetId === targetId && args.command === command && args.naifTargetId === naifTargetId && args.targetKind === "planetary-system-barycenter");
}
