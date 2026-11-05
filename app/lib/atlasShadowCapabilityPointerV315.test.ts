import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { isAtlasShadowCapabilityPointerV315 } from "./atlasShadowCapabilityPointerV315";

describe("v315 local-shadow capability pointer", () => {
  it("records the corrected sparse runtime without promoting dense or product state", () => {
    const pointer = JSON.parse(readFileSync(resolve(process.cwd(), "dist/release/orbit-atlas-current-local-shadow-candidate-v315.json"), "utf8"));
    expect(isAtlasShadowCapabilityPointerV315(pointer)).toBe(true);
    expect(pointer).toMatchObject({
      formalProductPointer: "v263",
      localShadowDefaultApplied: false,
      capabilities: {
        fullKerrShortAuthority: "qualified-v312-v313-envelope",
        v314CorrectedDense: "incomplete-0-of-49",
        v315ScienceRuntime: "implemented-v312-v313-sparse-authority",
        denseBoundary: "incomplete-no-aggregate",
        browserQualification: "not-run",
      },
    });
  });
});

