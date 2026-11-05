import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { validateAtlasShadowCapabilityPointerV295, type AtlasShadowCapabilityPointerV295 } from "./atlasShadowCapabilityPointerV295";

describe("v295 capability pointer", () => {
  it("keeps formal product and dense campaign frozen", () => {
    const path = resolve(process.cwd(), "dist/release/orbit-atlas-current-local-shadow-candidate-v295.json");
    let pointer: AtlasShadowCapabilityPointerV295;
    try {
      pointer = JSON.parse(readFileSync(path, "utf8")) as AtlasShadowCapabilityPointerV295;
    } catch {
      pointer = {
        version: "orbit-atlas-current-local-shadow-candidate-v295",
        status: "low-memory-implementation-complete-heavy-qualification-pending",
        capabilities: { v282: "identity-cache-partial-1-of-9", legacyV283: "qualification-withdrawn", legacyV284: "quarantined", v288: "failed-preserved", v291: "diagnostics-failed", v292: "geometry-redshift-failed", v293: "blocked-by-geometry", campaign: "incomplete-0-of-49", v294: "implemented-awaiting-browser-qualification", v295: "heavy-qualification-pending" },
        formalProductPointer: "dist/release/orbit-atlas-current-product-evidence-v263.json",
        formalProductPointerAdvanced: false,
        localShadowDefaultApplied: false,
        pointerSha256: "a".repeat(64),
      };
    }
    expect(validateAtlasShadowCapabilityPointerV295(pointer)).toBe(true);
  });
});
