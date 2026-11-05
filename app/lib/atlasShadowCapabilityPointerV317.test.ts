import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { isAtlasShadowCapabilityPointerV317 } from "./atlasShadowCapabilityPointerV317";

describe("v317 local-shadow capability pointer", () => {
  it("keeps formal/default boundaries while exposing buffer and lifecycle qualification", () => {
    const pointer = JSON.parse(readFileSync(resolve(process.cwd(), "dist/release/orbit-atlas-current-local-shadow-candidate-v317.json"), "utf8"));
    expect(isAtlasShadowCapabilityPointerV317(pointer)).toBe(true);
    expect(pointer).toMatchObject({
      formalProductPointer: "v263",
      formalProductPointerAdvanced: false,
      localShadowDefaultApplied: false,
      capabilities: {
        v317ScienceBufferIntegrity: "qualified-67-of-67-byte-digested-raster-disjoint",
        v317InteractiveAuthority: "current-v312-v313-full-short-shadow-only-differential-pending",
        v314CorrectedDense: "incomplete-0-of-49",
        denseAggregate: "unavailable",
        browserQualification: "not-run",
      },
    });
  });
});
