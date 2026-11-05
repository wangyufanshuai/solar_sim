import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { isAtlasShadowCapabilityPointerV325 } from "./atlasShadowCapabilityPointerV325";

describe("v325 local-shadow capability pointer", () => {
  it("records componentwise audit envelopes without dense or product promotion", () => {
    const pointer = JSON.parse(readFileSync(resolve(process.cwd(), "dist/release/orbit-atlas-current-local-shadow-candidate-v325.json"), "utf8"));
    expect(isAtlasShadowCapabilityPointerV325(pointer)).toBe(true);
    expect(pointer).toMatchObject({
      formalProductPointer: "v263",
      localShadowDefaultApplied: false,
      capabilities: {
        v325ScienceUncertainty: "four-rays-twelve-bands-linear-sum-no-rss",
        v325Interpretation: "deterministic-audit-envelope-not-statistical-confidence-interval",
        v325RuntimeBoundary: "science-intent-only-cinematic-hidden",
        v314CorrectedDense: "incomplete-0-of-49",
        denseAggregate: "unavailable",
      },
    });
  });
});
