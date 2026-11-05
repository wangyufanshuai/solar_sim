import { describe, expect, it } from "vitest";
import {
  ATLAS_SCIENTIFIC_MODEL_UPGRADE_CONTRACT_VERSION,
  createAtlasScientificModelUpgradeContractSummary,
} from "./atlasScientificModelUpgradeContract";

describe("v113 scientific model upgrade contract", () => {
  it("defines fixture, budget, comparison and rollback requirements without core mutation", () => {
    const summary = createAtlasScientificModelUpgradeContractSummary();
    expect(summary.version).toBe(ATLAS_SCIENTIFIC_MODEL_UPGRADE_CONTRACT_VERSION);
    expect(summary.profile).toBe("v113-fixture-budget-comparison-rollback-plan");
    expect(summary.scientificUpgradePolicy).toBe("contract-only-no-core-mutation");
    expect(summary.fixturePolicy).toBe("new-fixtures-before-core-change");
    expect(summary.errorBudgetPolicy).toBe("explicit-budget-matrix-before-core-change");
    expect(summary.comparisonMatrixPolicy).toBe("baseline-shadow-candidate-reference-required");
    expect(summary.rollbackPolicy).toBe("single-switch-core-upgrade-revert-condition");
    expect(summary.livePhysicsMutation).toBe("not-applied");
    expect(summary.workerPhysicsMutation).toBe("not-applied");
    expect(summary.rk4DefaultMutation).toBe("not-applied");
    expect(summary.eihOnePnMutation).toBe("not-applied");
    expect(summary.kerrKernelMutation).toBe("not-applied");
    expect(summary.fixtureDataMutation).toBe("not-applied");
  });

  it("can expose a ready contract state without changing its protected boundary", () => {
    const summary = createAtlasScientificModelUpgradeContractSummary({ ready: true });
    expect(summary.status).toBe("ready-scientific-model-upgrade-contract-locked");
    expect(summary.trustedBoundary).toContain("contract-only");
  });
});
