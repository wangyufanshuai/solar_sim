import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { sha256BytesHexV566, sha256Utf8HexV566 } from "./sha256BrowserV566";

describe("v566 browser-safe SHA-256", () => {
  it("matches published SHA-256 UTF-8 vectors", () => {
    expect(sha256Utf8HexV566("")).toBe("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
    expect(sha256Utf8HexV566("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });

  it.each(["", "abc", "Orbit Atlas / Kerr / 偏振", "x".repeat(1025)])("matches Node SHA-256 for UTF-8 input", (value) => {
    expect(sha256Utf8HexV566(value)).toBe(createHash("sha256").update(value).digest("hex"));
  });

  it("hashes arbitrary bytes without a Node runtime dependency", () => {
    const bytes = Uint8Array.from([0, 1, 2, 127, 128, 254, 255]);
    expect(sha256BytesHexV566(bytes)).toBe(createHash("sha256").update(bytes).digest("hex"));
  });

  it("keeps the client-reachable canonical hash chain free of Node crypto", () => {
    const clientReachableSources = [
      "app/lib/detectorCalibrationCompilerV365.ts",
      "app/lib/kerrSparsePolarimetricProductV418.ts",
      "app/lib/kerrScreenCoordinateProvenanceV419.ts",
      "app/lib/kerrObserverPlaneWcsV420.ts",
      "app/lib/kerrAxialPolarizationVectorCatalogV421.ts",
      "app/lib/kerrPolarizationOrientationBasisV422.ts",
      "app/lib/kerrPredictedStokesAdmissionV423.ts",
      "app/lib/kerrPredictedPolarimeterV424.ts",
      "app/lib/kerrInstrumentSpectralAdmissionV425.ts",
      "app/lib/kerrHighEnergyInstrumentResponseV426.ts",
      "app/lib/kerrHighEnergyResponseAcquisitionPackV427.ts",
      "app/lib/kerrHighEnergyResponseIntakeV428.ts",
      "app/lib/kerrHighEnergyResponseUncertaintyV429.ts",
      "app/lib/kerrHighEnergyCountLikelihoodV430.ts",
      "app/lib/kerrHighEnergyLikelihoodStressV431.ts",
      "app/lib/kerrHighEnergyLikelihoodAuthorityV432.ts",
      "app/lib/kerrHighEnergyJointNuisanceV433.ts",
      "app/lib/kerrHighEnergyMeasuredAdmissionV434.ts",
      "app/lib/kerrHighEnergyMeasuredImportClientV435.ts",
    ];
    for (const path of clientReachableSources) {
      expect(readFileSync(path, "utf8"), path).not.toMatch(/(?:from|require\()\s*["']node:crypto/);
    }
  });
});
