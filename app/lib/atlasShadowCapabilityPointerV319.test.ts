import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { isAtlasShadowCapabilityPointerV319 } from "./atlasShadowCapabilityPointerV319";

describe("v319 local-shadow capability pointer", () => {
  it("qualifies only the sparse spectrum while preserving dense/GPU/formal boundaries", () => {
    const pointer = JSON.parse(readFileSync(resolve(process.cwd(), "dist/release/orbit-atlas-current-local-shadow-candidate-v319.json"), "utf8"));
    expect(isAtlasShadowCapabilityPointerV319(pointer)).toBe(true);
    expect(pointer).toMatchObject({
      formalProductPointer: "v263",
      localShadowDefaultApplied: false,
      capabilities: {
        v318GpuDifferentialHardware: "pending-webgpu-shadow-disabled",
        v319ThinDiskSpectrum: "qualified-four-authority-disk-rays-si-liouville",
        v319SpectrumArtifact: "canonical-source-locked",
        v314CorrectedDense: "incomplete-0-of-49",
        denseAggregate: "unavailable",
      },
    });
  });
});
