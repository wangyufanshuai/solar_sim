import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { isAtlasShadowCapabilityPointerV324 } from "./atlasShadowCapabilityPointerV324";

describe("v324 local-shadow capability pointer", () => {
  it("records Science A/B equivalence without promotion", () => {
    const pointer = JSON.parse(readFileSync(resolve(process.cwd(), "dist/release/orbit-atlas-current-local-shadow-candidate-v324.json"), "utf8"));
    expect(isAtlasShadowCapabilityPointerV324(pointer)).toBe(true);
    expect(pointer).toMatchObject({
      formalProductPointer: "v263",
      localShadowDefaultApplied: false,
      capabilities: {
        v324ScienceProfileAB: "science-equivalent-cinematic-distinct",
        v324ScienceDigest: "stable-v321-authority-digests",
        v324BrowserGate: "authored-not-run",
        v314CorrectedDense: "incomplete-0-of-49",
      },
    });
  });
});
