import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { isAtlasShadowCapabilityPointerV322 } from "./atlasShadowCapabilityPointerV322";

describe("v322 local-shadow capability pointer", () => {
  it("records telemetry-only Science HUD wiring without promotion", () => {
    const pointer = JSON.parse(readFileSync(resolve(process.cwd(), "dist/release/orbit-atlas-current-local-shadow-candidate-v322.json"), "utf8"));
    expect(isAtlasShadowCapabilityPointerV322(pointer)).toBe(true);
    expect(pointer).toMatchObject({
      formalProductPointer: "v263",
      localShadowDefaultApplied: false,
      capabilities: {
        v322ScienceHud: "telemetry-only-fixed-band-hud-wired",
        v322ProfileConsumers: "v5-and-v6-manual-local-shadow-ab",
        v322BrowserGate: "authored-not-run",
        v314CorrectedDense: "incomplete-0-of-49",
      },
    });
  });
});
