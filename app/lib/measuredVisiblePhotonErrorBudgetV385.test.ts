import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  createMeasuredVisiblePhotonErrorBudgetV385,
  parseMeasuredVisiblePhotonErrorBudgetArtifactV385,
} from "./measuredVisiblePhotonErrorBudgetV385";

describe("v385 visible photon error budget", () => {
  it("linearly combines quantified numerical differences without RSS", () => {
    const observable = JSON.parse(
      readFileSync(
        "dist/science/measured-visible-photon-observable-v384/observable.json",
        "utf8",
      ),
    );
    const throughput = JSON.parse(
      readFileSync(
        "dist/science/measured-visible-throughput-v383/manifest.json",
        "utf8",
      ),
    );
    const result = createMeasuredVisiblePhotonErrorBudgetV385(
      observable,
      throughput,
    );
    expect(result.rows).toHaveLength(4);
    expect(
      result.rows.every(
        (row) =>
          row.unavailableSystematics.length === 2 &&
          row.totalScientificUncertaintyRelative === "unavailable" &&
          row.totalScientificInterval === null,
      ),
    ).toBe(true);
  });

  it("parses only a computationally qualified but scientifically incomplete budget", () => {
    const artifact = parseMeasuredVisiblePhotonErrorBudgetArtifactV385(
      JSON.parse(
        readFileSync(
          "dist/science/measured-visible-photon-error-budget-v385/error-budget.json",
          "utf8",
        ),
      ),
    );
    expect(artifact.combination.rssApplied).toBe(false);
    expect(artifact.combination.unknownSystematicsTreatedAsZero).toBe(false);
    expect(artifact.qualification.computationalBudgetQualified).toBe(true);
    expect(artifact.qualification.absoluteScientificBudgetQualified).toBe(false);
  });
});
