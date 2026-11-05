import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { isAtlasShadowCapabilityPointerV331 } from "./atlasShadowCapabilityPointerV331";

describe("v331 local-shadow capability pointer", () => {
  it("records sanitized photon provenance without dense or product promotion", () => {
    const pointer = JSON.parse(readFileSync(resolve(process.cwd(), "dist/release/orbit-atlas-current-local-shadow-candidate-v331.json"), "utf8"));
    expect(isAtlasShadowCapabilityPointerV331(pointer)).toBe(true);
    expect(pointer).toMatchObject({
      formalProductPointer: "v263",
      localShadowDefaultApplied: false,
      capabilities: {
        v331PhotonProvenance: "json-csv-sanitized-twelve-detector-independent-rows",
        v331PhotonExportLifecycle: "on-demand-weak-single-flight-object-url-tracked-idempotent",
        v314CorrectedDense: "incomplete-0-of-49",
        denseAggregate: "unavailable",
      },
    });
  });
});
