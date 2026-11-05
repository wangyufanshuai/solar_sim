import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parseAtlasShadowCapabilityPointerV356 } from "./atlasShadowCapabilityPointerV356";

describe("v356 pointer", () => {
  it("keeps exports sanitized and measured envelope unavailable", () => {
    const pointer = parseAtlasShadowCapabilityPointerV356(JSON.parse(readFileSync(resolve(process.cwd(), "dist/release/orbit-atlas-current-local-shadow-candidate-v356.json"), "utf8")));
    expect(pointer).toMatchObject({ formalProductPointer: "v263", localShadowDefaultApplied: false, capabilities: { v356Envelope: "qualified-reconstructable-synthetic-2d-3d-envelope", v356Exports: "qualified-sanitized-json-csv-path-pid-time-excluded", v356MeasuredEnvelopeAuthority: "unavailable-input-covariance-is-synthetic-not-measured", v314CorrectedDense: "incomplete-0-of-49" } });
  });
});
