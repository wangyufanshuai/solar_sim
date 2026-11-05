import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseKerrMeasuredResponseAdmissionOracleV438 } from "../lib/kerrMeasuredResponseAdmissionV438";
describe("v438 admission panel boundary", () => { it("shows blocked science admission without hiding missing gates", () => { const oracle = parseKerrMeasuredResponseAdmissionOracleV438(JSON.parse(readFileSync("dist/science/kerr-measured-response-admission-v438/measured-response-admission-oracle.json", "utf8"))); expect(oracle.requiredGates).toHaveLength(6); expect(oracle.qualification.scienceAdmissionGranted).toBe(false); expect(oracle.contract.scienceRenderer.blockedStateExplicit).toBe(true); expect(oracle.contract.cinematicRenderer.responseWritebackForbidden).toBe(true); }); });
