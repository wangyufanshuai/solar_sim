import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { isAtlasShadowCapabilityPointerV320 } from "./atlasShadowCapabilityPointerV320";

describe("v320 local-shadow capability pointer", () => {
  it("records fixed-band qualification without dense, browser, or product promotion", () => {
    const pointer = JSON.parse(readFileSync(resolve(process.cwd(), "dist/release/orbit-atlas-current-local-shadow-candidate-v320.json"), "utf8"));
    expect(isAtlasShadowCapabilityPointerV320(pointer)).toBe(true);
    expect(pointer).toMatchObject({
      formalProductPointer: "v263",
      localShadowDefaultApplied: false,
      publicDeploymentBlocked: true,
      capabilities: {
        v320FixedBandImaging: "qualified-three-fixed-disjoint-bands-four-rays",
        v320FalseColor: "fixed-reference-linear-nonadaptive",
        v314CorrectedDense: "incomplete-0-of-49",
        denseAggregate: "unavailable",
        browserQualification: "not-run",
      },
    });
  });
});
