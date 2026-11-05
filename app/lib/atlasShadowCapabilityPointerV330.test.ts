import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { isAtlasShadowCapabilityPointerV330 } from "./atlasShadowCapabilityPointerV330";

describe("v330 local-shadow capability pointer", () => {
  it("records five separate workbench capabilities without product promotion", () => {
    const pointer = JSON.parse(readFileSync(resolve(process.cwd(), "dist/release/orbit-atlas-current-local-shadow-candidate-v330.json"), "utf8"));
    expect(isAtlasShadowCapabilityPointerV330(pointer)).toBe(true);
    expect(pointer).toMatchObject({
      formalProductPointer: "v263",
      localShadowDefaultApplied: false,
      capabilities: {
        v330WorkbenchAdapter: "five-versioned-capability-rows",
        v330EvidenceApi: "parallel-bounded-single-flight-no-store-lite-unavailable-128kib",
        v314CorrectedDense: "incomplete-0-of-49",
        denseAggregate: "unavailable",
      },
    });
  });
});
