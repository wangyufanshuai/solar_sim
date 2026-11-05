import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  canonicalKerrObservableUncertaintyPayloadV473,
  createKerrObservableUncertaintySummaryV473,
  parseKerrObservableUncertaintyArtifactV473,
} from "./kerrObservableUncertaintyV473";

const input = JSON.parse(
  readFileSync("dist/science/kerr-observable-uncertainty-v473/uncertainty-ledger.json", "utf8"),
);

describe("v473 observable uncertainty ledger", () => {
  it("parses the canonical 13-entry 16-component ledger", () => {
    const artifact = parseKerrObservableUncertaintyArtifactV473(input);
    const sha = createHash("sha256")
      .update(canonicalKerrObservableUncertaintyPayloadV473(artifact))
      .digest("hex");

    expect(sha).toBe(artifact.artifactSha256);
    expect(artifact.entries).toHaveLength(13);
    expect(artifact.entries.flatMap((entry) => entry.components)).toHaveLength(16);
    expect(Object.isFrozen(artifact)).toBe(true);
  });

  it("uses linear sums, correlated maxima and separated physical channels", () => {
    const artifact = parseKerrObservableUncertaintyArtifactV473(input);
    const byId = new Map(artifact.entries.map((entry) => [entry.observableId, entry]));
    const screen = byId.get("screen-alpha-beta");
    const evpa = byId.get("evpa");
    const radiance = byId.get("observed-radiance");

    expect(screen?.combinationPolicy).toBe("linear-sum-no-independence-proof");
    expect(screen?.combinedValue).toBe(
      screen?.components.reduce((sum, component) => sum + component.value, 0),
    );
    expect(evpa?.combinationPolicy).toBe("maximum-correlated-tolerances");
    expect(evpa?.combinedValue).toBe(
      Math.max(...(evpa?.components.map((component) => component.value) ?? [])),
    );
    expect(radiance).toMatchObject({
      combinationPolicy: "separate-physical-channels",
      combinedValue: null,
      combinedUnits: null,
    });
  });

  it("keeps production ledger open and RSS absent", () => {
    const artifact = parseKerrObservableUncertaintyArtifactV473(input);

    expect(artifact.summary).toMatchObject({
      rssEntryCount: 0,
      productionBudgetClosedCount: 0,
      quantifiedEntryCount: 9,
      unavailableEntryCount: 4,
    });
    expect(artifact.productionLedger.status).toBe("open");
    expect(artifact.entries.every((entry) => !entry.independenceProven)).toBe(true);
    expect(artifact.entries.every((entry) => !entry.productionBudgetClosed)).toBe(true);
    expect(artifact.boundary.sciencePixelRows).toBe(0);
  });

  it("keeps the API summary bounded", () => {
    const summary = createKerrObservableUncertaintySummaryV473(input);
    expect(new TextEncoder().encode(JSON.stringify(summary)).byteLength).toBeLessThanOrEqual(
      128 * 1024,
    );
  });
});
