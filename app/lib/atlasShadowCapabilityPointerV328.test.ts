import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { isAtlasShadowCapabilityPointerV328 } from "./atlasShadowCapabilityPointerV328";

describe("v328 local-shadow capability pointer", () => {
  it("records detector-independent photon observables without promotion", () => {
    const pointer = JSON.parse(readFileSync(resolve(process.cwd(), "dist/release/orbit-atlas-current-local-shadow-candidate-v328.json"), "utf8"));
    expect(isAtlasShadowCapabilityPointerV328(pointer)).toBe(true);
    expect(pointer).toMatchObject({
      formalProductPointer: "v263",
      localShadowDefaultApplied: false,
      capabilities: {
        v328PhotonObservables: "four-rays-twelve-fixed-band-photon-radiances",
        v328Quadrature: "fixed-simpson-512-with-256-componentwise-audit",
        v328DetectorBoundary: "per-unit-area-solid-angle-not-detector-count-rate",
        v314CorrectedDense: "incomplete-0-of-49",
      },
    });
  });
});
