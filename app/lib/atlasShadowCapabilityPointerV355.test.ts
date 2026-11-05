import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parseAtlasShadowCapabilityPointerV355 } from "./atlasShadowCapabilityPointerV355";

describe("v355 pointer", () => {
  it("keeps eigenmodes local-shadow-only and measured authority unavailable", () => {
    const pointer = parseAtlasShadowCapabilityPointerV355(
      JSON.parse(
        readFileSync(
          resolve(process.cwd(), "dist/release/orbit-atlas-current-local-shadow-candidate-v355.json"),
          "utf8",
        ),
      ),
    );
    expect(pointer).toMatchObject({
      formalProductPointer: "v263",
      localShadowDefaultApplied: false,
      capabilities: {
        v355Eigenmodes: "qualified-deterministic-synthetic-principal-axes",
        v355MeasuredEigenmodeAuthority: "unavailable-input-covariance-is-synthetic-not-measured",
        v314CorrectedDense: "incomplete-0-of-49",
      },
    });
  });
});
