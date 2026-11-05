import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseKerrInstrumentObservationOracleV437 } from "../lib/kerrInstrumentObservationV437";
describe("v437 workbench boundary", () => { it("exposes unavailable response without hiding negative evidence", () => { const oracle = parseKerrInstrumentObservationOracleV437(JSON.parse(readFileSync("dist/science/kerr-instrument-observation-v437/instrument-observation-oracle.json", "utf8"))); expect(oracle.rows).toHaveLength(24); expect(oracle.contract.responsePolicy.extrapolationAllowed).toBe(false); expect(oracle.contract.scienceRenderer.blockedResponseShownAsUnavailable).toBe(true); expect(oracle.contract.cinematicRenderer.responseWritebackForbidden).toBe(true); }); });
