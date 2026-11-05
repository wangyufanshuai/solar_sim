import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { isAtlasShadowCapabilityPointerV329 } from "./atlasShadowCapabilityPointerV329";

describe("v329 local-shadow capability pointer", () => {
  it("records the single-flight observatory store without product promotion", () => {
    const pointer = JSON.parse(readFileSync(resolve(process.cwd(), "dist/release/orbit-atlas-current-local-shadow-candidate-v329.json"), "utf8"));
    expect(isAtlasShadowCapabilityPointerV329(pointer)).toBe(true);
    expect(pointer).toMatchObject({
      formalProductPointer: "v263",
      localShadowDefaultApplied: false,
      capabilities: {
        v329SingleFlight: "three-consumers-one-v321-acquisition-one-derivation",
        v329ExternalStore: "bounded-models-use-sync-external-store",
        v329BaselineReturn: "last-consumer-releases-cache-and-derived-models",
        v314CorrectedDense: "incomplete-0-of-49",
      },
    });
  });
});
