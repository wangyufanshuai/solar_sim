import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseKerrSourceCoordinateOracleV440 } from "../lib/kerrSourceCoordinateAuditV440";
describe("v440 coordinate panel", () => { it("keeps coordinate overlay separate from detector image", () => { const oracle = parseKerrSourceCoordinateOracleV440(JSON.parse(readFileSync("dist/science/kerr-source-coordinate-audit-v440/source-coordinate-oracle.json", "utf8"))); expect(oracle.contract.coordinateConvention.semantics).toBe("continuous-source-coordinate-not-pixel-sample"); expect(oracle.contract.scienceRenderer.detectorPixelsRequiredForImage).toBe(true); expect(oracle.contract.cinematicRenderer.mayClaimDetectorImage).toBe(false); }); });
