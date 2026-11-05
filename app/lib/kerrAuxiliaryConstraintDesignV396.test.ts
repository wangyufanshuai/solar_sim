import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  createKerrAuxiliaryConstraintAdversarialFixturesV396,
  createKerrAuxiliaryConstraintBundleV396,
  parseKerrAuxiliaryConstraintArtifactV396,
  validateKerrAuxiliaryConstraintBundleV396,
  V396_ORACLE_RELATIVE_LIMIT,
} from "./kerrAuxiliaryConstraintDesignV396";

const read = (path: string) => JSON.parse(readFileSync(path, "utf8"));
const transfer = () =>
  read("dist/science/kerr-temperature-systematics-transfer-v390/transfer-operator.json");
const observability = () =>
  read("dist/science/kerr-global-observability-v395/observability.json");

describe("v396 auxiliary constraint design", () => {
  it("lifts exactly three structural strategies across all 12 blocks", () => {
    const bundle = createKerrAuxiliaryConstraintBundleV396(
      transfer(),
      observability(),
    );
    expect(bundle.evaluations).toHaveLength(60);
    expect(bundle.summary).toMatchObject({
      rankLiftingEvaluationCount: 36,
      negativeControlEvaluationCount: 24,
      fullyLiftingStrategyCount: 3,
      negativeControlStrategyCount: 2,
      minimumConstraintsForFullRank: 12,
      fullRank: 36,
    });
    for (const strategy of bundle.strategies) {
      const rows = bundle.evaluations.filter(
        (row) => row.strategyId === strategy.id,
      );
      expect(rows).toHaveLength(12);
      expect(rows.filter((row) => row.rankIncrement === 1)).toHaveLength(
        strategy.role === "rank-lifting-candidate" ? 12 : 0,
      );
    }
    expect(bundle.partialCoverageRankCurve).toEqual(
      Array.from({ length: 13 }, (_, count) => ({
        auxiliaryConstraintCount: count,
        augmentedRank: 24 + count,
        remainingNullity: 12 - count,
      })),
    );
  });

  it("rejects every pre-registered structural and promotion attack", () => {
    const sourceTransfer = transfer();
    const sourceObservability = observability();
    const fixtures = createKerrAuxiliaryConstraintAdversarialFixturesV396(
      sourceTransfer,
      sourceObservability,
    );
    expect(fixtures).toHaveLength(7);
    for (const fixture of fixtures) {
      const result = validateKerrAuxiliaryConstraintBundleV396(
        fixture.value,
        sourceTransfer,
        sourceObservability,
      );
      expect(result.status, fixture.id).toBe("rejected");
      expect(result.rejectionReasons, fixture.id).toContain(
        fixture.expectedReason,
      );
    }
  });

  it("parses only the generated structural-only artifact", () => {
    const artifact = read(
      "dist/science/kerr-auxiliary-constraint-design-v396/constraint-design.json",
    );
    expect(parseKerrAuxiliaryConstraintArtifactV396(artifact)).toBe(artifact);
    expect(artifact.residuals.maximumPythonOracleRelativeDifference).toBeLessThan(
      V396_ORACLE_RELATIVE_LIMIT,
    );
    expect(artifact.productionAdmission).toMatchObject({
      instrumentResponseAvailable: false,
      physicalNoiseCovarianceAvailable: false,
      auxiliaryMeasurementDataAvailable: false,
      physicalConstraintSelectionExecuted: false,
      structuralCandidatePromotedToRecommendation: false,
      fisherInformationClaimed: false,
      posteriorClaimed: false,
    });
  });
});
