import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { isAtlasShadowCapabilityPointerV333 } from "./atlasShadowCapabilityPointerV333";

describe("v333 local-shadow capability pointer", () => {
  it("records the precision Science console without product promotion", () => {
    const pointer = JSON.parse(readFileSync(resolve(process.cwd(), "dist/release/orbit-atlas-current-local-shadow-candidate-v333.json"), "utf8"));
    expect(isAtlasShadowCapabilityPointerV333(pointer)).toBe(true);
    expect(pointer).toMatchObject({
      formalProductPointer: "v263",
      localShadowDefaultApplied: false,
      capabilities: {
        v333VisualDirection: "deep-space-precision-instrument",
        v333Utf8Audit: "semantic-codepoints-qualified-no-mojibake",
        v314CorrectedDense: "incomplete-0-of-49",
      },
    });
  });
});
