import { createHash } from "node:crypto";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { inspectKerrDetectorGeometryStagingAtPathV443 } from "./kerrDetectorGeometryStagingV443";

const roots: string[] = [];
const sha = (value: string): string => createHash("sha256").update(value).digest("hex");
function writeValidBundle(): string {
  const root = mkdtempSync(join(tmpdir(), "atlas-v443-")); roots.push(root);
  const identity = JSON.stringify({ version: "v443-detector-identity-v1", instrumentId: "HST-WFC3", detectorId: "UVIS1", campaignId: "fixture-only", detectorFrame: "detector-native", pixelConvention: "FITS-one-based-continuous-pixel-centers", unit: "arcsec-per-pixel", sourceSha256: "a".repeat(64) });
  const plate = "repeatId,axis,pixelScaleArcsecPerPixel,uncertaintyArcsecPerPixel\n1,x,0.0396,0.0001\n2,x,0.0397,0.0001\n3,x,0.0395,0.0001\n1,y,0.0397,0.0001\n2,y,0.0396,0.0001\n3,y,0.0398,0.0001\n";
  const distortion = JSON.stringify({ version: "v443-distortion-calibration-v1", model: "sip-2d", frame: "detector-native", calibrationRows: 24, maxResidualPx: 0.12, coefficientSha256: "b".repeat(64) });
  const psf = JSON.stringify({ version: "v443-psf-calibration-v1", model: "empirical-2d", band: "F350LP", fwhmArcsec: 0.08, samplingPixels: 2.4, normalization: "unit-integral", sourceSha256: "c".repeat(64) });
  const pixel = JSON.stringify({ version: "v443-pixel-response-calibration-v1", gainElectronPerAdc: 1.5, readNoiseElectron: 3.1, darkCurrentElectronPerSecond: 0.002, responseRange: [0, 65535], sourceSha256: "d".repeat(64) });
  writeFileSync(join(root, "identity.json"), identity); writeFileSync(join(root, "plate-scale.csv"), plate); writeFileSync(join(root, "distortion.json"), distortion); writeFileSync(join(root, "psf.json"), psf); writeFileSync(join(root, "pixel-response.json"), pixel);
  const fileSha256 = { identity: sha(identity), "plate-scale": sha(plate), distortion: sha(distortion), psf: sha(psf), "pixel-response": sha(pixel) };
  const provenance = JSON.stringify({ version: "v443-detector-provenance-v1", stagingOnly: true, runtimePackagingAllowed: false, sources: [{ url: "https://example.invalid/fixture", termsUrl: "https://example.invalid/terms", license: "fixture-only", sha256: "e".repeat(64) }], fileSha256 });
  writeFileSync(join(root, "provenance.json"), provenance);
  return root;
}
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });
describe("v443 detector geometry staging", () => {
  it("reports a missing bundle without consuming an attempt", () => { const scan = inspectKerrDetectorGeometryStagingAtPathV443(join(tmpdir(), "atlas-v443-no-such-directory")); expect(scan.status).toBe("blocked-staging-directory-missing"); expect(scan.missingFileIds).toHaveLength(6); expect(scan.measuredAuthorityGranted).toBe(false); expect(scan.networkAttempted).toBe(false); });
  it("validates all six files and repeatability without granting authority", () => { const scan = inspectKerrDetectorGeometryStagingAtPathV443(writeValidBundle()); expect(scan.status).toBe("ready-for-independent-validation"); expect(scan.readyFileCount).toBe(6); expect(scan.hashLinkagePassed).toBe(true); expect(scan.readyForIndependentValidation).toBe(true); expect(scan.measuredAuthorityGranted).toBe(false); expect(scan.runtimeProjectionAllowed).toBe(false); });
  it("rejects plate-scale repeatability drift", () => { const root = writeValidBundle(); writeFileSync(join(root, "plate-scale.csv"), "repeatId,axis,pixelScaleArcsecPerPixel,uncertaintyArcsecPerPixel\n1,x,0.01,0.0001\n2,x,0.02,0.0001\n3,x,0.03,0.0001\n1,y,0.0397,0.0001\n2,y,0.0396,0.0001\n3,y,0.0398,0.0001\n"); const scan = inspectKerrDetectorGeometryStagingAtPathV443(root); expect(scan.status).toBe("blocked-inputs-invalid"); expect(scan.invalidFileIds).toContain("plate-scale"); });
});
