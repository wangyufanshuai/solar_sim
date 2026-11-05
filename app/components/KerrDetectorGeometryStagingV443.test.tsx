import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseKerrDetectorGeometryStagingInspectV443 } from "../lib/kerrDetectorGeometryStagingV443";
describe("v443 staging panel", () => { it("shows intake readiness without promoting measured authority", () => { const inspect = parseKerrDetectorGeometryStagingInspectV443(JSON.parse(readFileSync("dist/science/kerr-detector-geometry-staging-v443/staging-inspect.json", "utf8"))); expect(inspect.readyFileCount).toBe(0); expect(inspect.missingFileIds).toHaveLength(6); expect(inspect.readyForIndependentValidation).toBe(false); expect(inspect.measuredAuthorityGranted).toBe(false); expect(inspect.runtimeProjectionAllowed).toBe(false); }); });
