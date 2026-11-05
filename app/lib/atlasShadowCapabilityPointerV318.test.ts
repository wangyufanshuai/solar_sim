import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { isAtlasShadowCapabilityPointerV318 } from "./atlasShadowCapabilityPointerV318";

describe("v318 local-shadow capability pointer", () => {
  it("keeps GPU disabled and CPU authority/formal boundaries explicit", () => {
    const pointer = JSON.parse(readFileSync(resolve(process.cwd(), "dist/release/orbit-atlas-current-local-shadow-candidate-v318.json"), "utf8"));
    expect(isAtlasShadowCapabilityPointerV318(pointer)).toBe(true);
    expect(pointer).toMatchObject({
      formalProductPointer: "v263",
      localShadowDefaultApplied: false,
      capabilities: {
        v318GpuDifferentialReference: "qualified-16-rays-40-brackets-current-authority",
        v318GpuDifferentialHardware: "pending-webgpu-shadow-disabled",
        cpuScienceAuthority: "v312-geometry+v313-polarization",
        v314CorrectedDense: "incomplete-0-of-49",
        denseAggregate: "unavailable",
      },
    });
  });
});
