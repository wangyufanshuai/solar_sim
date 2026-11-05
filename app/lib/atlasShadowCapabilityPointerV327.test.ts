import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { isAtlasShadowCapabilityPointerV327 } from "./atlasShadowCapabilityPointerV327";

describe("v327 local-shadow capability pointer", () => {
  it("records deterministic Science/Cinematic A/B without promotion", () => {
    const pointer = JSON.parse(readFileSync(resolve(process.cwd(), "dist/release/orbit-atlas-current-local-shadow-candidate-v327.json"), "utf8"));
    expect(isAtlasShadowCapabilityPointerV327(pointer)).toBe(true);
    expect(pointer).toMatchObject({
      formalProductPointer: "v263",
      localShadowDefaultApplied: false,
      capabilities: {
        v327ScienceCinematicAB: "four-ray-science-v5-v6-deterministic-swatches",
        v327ProductionMapping: "v305-cinematic-rgba-token-consumer",
        v327ScienceIsolation: "values-unchanged-buffers-disjoint",
        v314CorrectedDense: "incomplete-0-of-49",
      },
    });
  });
});
