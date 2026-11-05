import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parseKerrSciencePhotonBandViewV328 } from "./kerrSciencePhotonBandsV328";
import {
  getKerrSciencePhotonProvenanceV331,
  parseKerrSciencePhotonProvenanceV331,
  serializeKerrSciencePhotonProvenanceCsvV331,
  serializeKerrSciencePhotonProvenanceJsonV331,
} from "./kerrSciencePhotonProvenanceV331";

const photonArtifact = JSON.parse(readFileSync(resolve(process.cwd(), "dist/science/kerr-science-photon-bands-v328/photon-radiance.json"), "utf8"));

describe("v331 photon-observable provenance", () => {
  it("exports one sanitized deterministic 12-row product through a weak single-flight", async () => {
    const view = parseKerrSciencePhotonBandViewV328(photonArtifact.view);
    const first = getKerrSciencePhotonProvenanceV331(view);
    const second = getKerrSciencePhotonProvenanceV331(view);
    expect(second).toBe(first);
    const provenance = parseKerrSciencePhotonProvenanceV331(await first);
    expect(provenance.counts).toEqual({ rayCount: 4, bandMeasurementCount: 12 });
    expect(provenance.rows).toHaveLength(12);
    expect(provenance.units.photonRadiance).toBe("photons s^-1 m^-2 sr^-1");
    expect(provenance.interpretation).toBe("detector-independent-radiance-not-photon-count-rate");
    expect(provenance.source.denseAggregateSha256).toBeNull();
    const json = serializeKerrSciencePhotonProvenanceJsonV331(provenance);
    const csv = serializeKerrSciencePhotonProvenanceCsvV331(provenance);
    expect(JSON.parse(json).rows).toHaveLength(12);
    expect(csv.trim().split("\n")).toHaveLength(13);
    expect(json).not.toMatch(/\"(?:rayBuffer|screenshot|absolutePath|host|pid|collectingArea|exposureTime|throughput)\"\s*:/);
    expect(csv.split("\n", 1)[0]).not.toMatch(/rayBuffer|screenshot|absolutePath|host|pid|collectingArea|exposureTime|throughput/);
  });
});
