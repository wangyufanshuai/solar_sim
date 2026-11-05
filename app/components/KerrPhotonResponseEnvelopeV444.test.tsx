import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseKerrPhotonResponseEnvelopeV444 } from "../lib/kerrPhotonResponseEnvelopeV444";
describe("v444 response panel", () => { it("keeps computational payload separate from detector/image authority", () => { const artifact = parseKerrPhotonResponseEnvelopeV444(JSON.parse(readFileSync("dist/science/kerr-photon-response-envelope-v444/photon-response-envelope.json", "utf8"))); expect(artifact.qualification.detectorElectronExpectationAvailable).toBe(false); expect(artifact.qualification.observedCountsAvailable).toBe(false); expect(artifact.qualification.scienceImageAvailable).toBe(false); expect(artifact.boundary.cinematicScienceWritebackForbidden).toBe(true); }); });
