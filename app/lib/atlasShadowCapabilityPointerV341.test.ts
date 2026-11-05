import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parseAtlasShadowCapabilityPointerV341 } from "./atlasShadowCapabilityPointerV341";

describe("v341 capability pointer", () => {
  it("keeps the sparse observation product separate from dense and product promotion", () => {
    const value = JSON.parse(readFileSync(resolve(process.cwd(), "dist/release/orbit-atlas-current-local-shadow-candidate-v341.json"), "utf8"));
    const pointer = parseAtlasShadowCapabilityPointerV341(value);
    expect(pointer.formalProductPointer).toBe("v263");
    expect(pointer.localShadowDefaultApplied).toBe(false);
    expect(pointer.capabilities.v314CorrectedDense).toBe("incomplete-0-of-49");
    expect(pointer.capabilities.denseAggregate).toBe("unavailable");
    expect(pointer.capabilities.browserQualification).toBe("not-run");
  });
});
