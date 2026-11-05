import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { isAtlasShadowCapabilityPointerV316 } from "./atlasShadowCapabilityPointerV316";

describe("v316 local-shadow capability pointer", () => {
  it("qualifies field-level visual wiring without changing defaults or dense status", () => {
    const pointer = JSON.parse(readFileSync(resolve(process.cwd(), "dist/release/orbit-atlas-current-local-shadow-candidate-v316.json"), "utf8"));
    expect(isAtlasShadowCapabilityPointerV316(pointer)).toBe(true);
    expect(pointer).toMatchObject({
      formalProductPointer: "v263",
      localShadowDefaultApplied: false,
      capabilities: {
        v316VisualTokenFields: "static-qualified-46-of-46-runtime-signature-wired",
        v5V6Profiles: "manual-local-shadow-only-not-default",
        v314CorrectedDense: "incomplete-0-of-49",
        denseAggregate: "unavailable",
        browserQualification: "not-run",
      },
    });
  });
});

