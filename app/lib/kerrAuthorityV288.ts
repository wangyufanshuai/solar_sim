export type KerrRayClassV288 = "capture" | "escape" | "disk-hit" | "invalid";

export type KerrCorrectedAuthorityResultV288 = {
  rayId: string;
  formulation: "carter-mino-dop853-v288" | "cartesian-kerr-schild-hamiltonian-dop853-v288";
  tolerance: number;
  branch: "A" | "B";
  classification: KerrRayClassV288;
  massShellResidual: number;
  carterResidual: number | null;
  redshift: number | null;
  intensityInvariantResidual: number | null;
  evpaDeg: number | null;
  evpaAuthority: "walker-penrose" | "unavailable";
  invalid: boolean;
  timeout: boolean;
};

export type KerrCriticalBracketV288 = {
  index: number;
  spin: number;
  leftImpactM: number;
  rightImpactM: number;
  leftClass: "capture" | "escape";
  rightClass: "capture" | "escape";
  bracketWidthPx: number;
};

export type KerrDenseCampaignStateV288R1 = {
  version: "v288r1-corrected-kerr-dense-campaign-state-v1";
  status: "blocked-short-gate" | "pending" | "running" | "failed-no-automatic-retry" | "complete";
  plannedRayCount: 3097;
  plannedShardCount: 49;
  completedShardIndices: readonly number[];
  completedShardCount: number;
  nextShardIndex: number | null;
  authorityEvidenceSha256: string;
  automaticRetryApplied: false;
};
