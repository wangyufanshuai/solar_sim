import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseKerrScientificImageAvailabilityOracleV439 } from "../lib/kerrScientificImageAvailabilityV439";
describe("v439 image boundary panel", () => { it("keeps FITS/PNG unavailable and cinematic writeback forbidden", () => { const oracle = parseKerrScientificImageAvailabilityOracleV439(JSON.parse(readFileSync("dist/science/kerr-scientific-image-availability-v439/scientific-image-availability-oracle.json", "utf8"))); expect(oracle.contract.imageProducts.fits).toBe("not-produced"); expect(oracle.contract.imageProducts.png).toBe("not-produced"); expect(oracle.contract.cinematicRenderer.mayProduceScienceImage).toBe(false); }); });
