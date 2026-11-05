import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { isAtlasShadowCapabilityPointerV321 } from "./atlasShadowCapabilityPointerV321";

describe("v321 local-shadow capability pointer", () => {
  it("records runtime fixed-band Science wiring without browser or product promotion", () => {
    const pointer = JSON.parse(readFileSync(resolve(process.cwd(), "dist/release/orbit-atlas-current-local-shadow-candidate-v321.json"), "utf8"));
    expect(isAtlasShadowCapabilityPointerV321(pointer)).toBe(true);
    expect(pointer).toMatchObject({
      formalProductPointer: "v263",
      localShadowDefaultApplied: false,
      capabilities: {
        v321ScienceRaster: "runtime-wired-v320-fixed-band-four-rays",
        v321BufferIntegrity: "payload-band-view-raster-byte-disjoint",
        v321BrowserGate: "authored-not-run",
        v314CorrectedDense: "incomplete-0-of-49",
        browserQualification: "not-run",
      },
    });
  });
});
