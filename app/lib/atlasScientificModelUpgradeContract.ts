import type {
  AtlasScientificModelUpgradeContractProfile,
  AtlasScientificModelUpgradeContractStatus,
  AtlasScientificModelUpgradeContractSummary,
  AtlasScientificModelUpgradeContractVersion,
} from "./simulationDiagnosticsTypes";

export const ATLAS_SCIENTIFIC_MODEL_UPGRADE_CONTRACT_VERSION: AtlasScientificModelUpgradeContractVersion =
  "v113-scientific-model-upgrade-contract";
export const ATLAS_SCIENTIFIC_MODEL_UPGRADE_CONTRACT_PROFILE: AtlasScientificModelUpgradeContractProfile =
  "v113-fixture-budget-comparison-rollback-plan";
export const ATLAS_SCIENTIFIC_MODEL_UPGRADE_CONTRACT_BOUNDARY =
  "v113 is a contract-only scientific upgrade plan. It defines the fixtures, error budgets, comparison matrix and rollback conditions required before any future core physics upgrade, and does not modify scientific gates, fixtures, live or worker physics, RK4/DP, EIH 1PN, Kerr or runtime sky/budget caps.";

export function createAtlasScientificModelUpgradeContractSummary(args: {
  ready?: boolean;
} = {}): AtlasScientificModelUpgradeContractSummary {
  const status: AtlasScientificModelUpgradeContractStatus = args.ready
    ? "ready-scientific-model-upgrade-contract-locked"
    : "pending-runtime-run";
  return {
    version: ATLAS_SCIENTIFIC_MODEL_UPGRADE_CONTRACT_VERSION,
    profile: ATLAS_SCIENTIFIC_MODEL_UPGRADE_CONTRACT_PROFILE,
    status,
    launchGameplayOpenRocketBridgeVersion:
      "v112-launch-gameplay-openrocket-bridge-lock",
    scientificUpgradePolicy: "contract-only-no-core-mutation",
    fixturePolicy: "new-fixtures-before-core-change",
    errorBudgetPolicy: "explicit-budget-matrix-before-core-change",
    comparisonMatrixPolicy: "baseline-shadow-candidate-reference-required",
    rollbackPolicy: "single-switch-core-upgrade-revert-condition",
    focusedCommand: "npm run test:atlas",
    verifyCommand: "npm run verify:atlas",
    livePhysicsMutation: "not-applied",
    workerPhysicsMutation: "not-applied",
    rk4DefaultMutation: "not-applied",
    eihOnePnMutation: "not-applied",
    kerrKernelMutation: "not-applied",
    fixtureDataMutation: "not-applied",
    trustedBoundary: ATLAS_SCIENTIFIC_MODEL_UPGRADE_CONTRACT_BOUNDARY,
  };
}
