import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { isAtlasShadowCapabilityPointerV297 } from "./atlasShadowCapabilityPointerV297";

describe("v297 local-shadow pointer", () => {
  it("keeps formal v263 and local-shadow default unchanged", () => {
    const pointer = JSON.parse(readFileSync(resolve(process.cwd(), "dist/release/orbit-atlas-current-local-shadow-candidate-v297.json"), "utf8"));
    expect(isAtlasShadowCapabilityPointerV297(pointer)).toBe(true);
    expect(pointer.capabilities.v297).toBe("full-kerr-short-authority-qualified");
    expect(pointer.capabilities.campaign).toBe("incomplete-0-of-49");
  });
});
