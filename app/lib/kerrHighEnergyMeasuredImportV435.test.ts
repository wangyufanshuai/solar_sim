import { describe, expect, it } from "vitest";
import { createSignedValidatorFixtureV435, createKerrMeasuredImportViewV435, parseKerrMeasuredImportArtifactV435, parseKerrMeasuredImportOracleV435, validateKerrMeasuredImportManifestV435, canonicalShaV435, type KerrMeasuredImportContractV435, type KerrMeasuredImportManifestV435 } from "./kerrHighEnergyMeasuredImportV435";
import { readFileSync } from "node:fs";

const read = (path: string) => JSON.parse(readFileSync(path, "utf8"));
describe("v435 signed measured import firewall", () => {
  it("verifies the signed content-addressed fixture and rejects mutations", () => {
    const oracle = parseKerrMeasuredImportOracleV435(read("dist/science/kerr-high-energy-measured-import-v435/measured-import-oracle.json"));
    const contract = read("dist/science/kerr-high-energy-measured-import-v435/measured-import-contract.json") as KerrMeasuredImportContractV435;
    const view = createKerrMeasuredImportViewV435(oracle, contract);
    const fixture = createSignedValidatorFixtureV435();
    expect(validateKerrMeasuredImportManifestV435(fixture.manifest, fixture.files)).toMatchObject({ valid: true, signatureVerified: true, contentAddressed: true, fileHashesVerified: true, pathSafetyVerified: true, v434BindingsVerified: true, measuredEligible: false, scienceAdmissionGranted: false, imported: false });
    expect(view.fixture).toMatchObject({ signatureVerified: true, contentAddressed: true, fileHashesVerified: true, measuredEligible: false, mutationCount: 6, rejectedMutationCount: 6, maximumPythonTypeScriptDifference: 0 });
    expect(oracle.mutationResults.every((mutation) => mutation.rejected && mutation.errors.length > 0)).toBe(true);
  });
  it("rejects altered signatures, paths, file bytes, canonical payloads and v434 bindings", () => {
    const fixture = createSignedValidatorFixtureV435();
    const signature = { ...fixture.manifest, signatureBase64: fixture.manifest.signatureBase64.slice(0, -2) + "AA" };
    expect(validateKerrMeasuredImportManifestV435(signature, fixture.files).valid).toBe(false);
    const pathManifest = { ...fixture.manifest, files: fixture.manifest.files.map((entry, index) => index === 0 ? { ...entry, path: "../escape" } : entry) } as KerrMeasuredImportManifestV435;
    expect(validateKerrMeasuredImportManifestV435(pathManifest, fixture.files).errors).toContain("unsafe-path");
    const alteredFiles = { ...fixture.files, "response.json": new TextEncoder().encode("tampered") };
    expect(validateKerrMeasuredImportManifestV435(fixture.manifest, alteredFiles).errors).toContain("file-sha");
    const bindingManifest = { ...fixture.manifest, v434Bindings: { ...fixture.manifest.v434Bindings, jointNuisanceArtifactSha256: "0".repeat(64) } } as KerrMeasuredImportManifestV435;
    expect(validateKerrMeasuredImportManifestV435(bindingManifest, fixture.files).errors).toContain("v434-binding");
  });
  it("keeps API-facing summary free of signature material and raw file list", () => {
    const artifact = parseKerrMeasuredImportArtifactV435(read("dist/science/kerr-high-energy-measured-import-v435/measured-import.json"));
    expect(canonicalShaV435(artifact)).toBe(artifact.artifactSha256);
    expect(artifact.view.authorityBoundary).toMatchObject({ signatureAuthorityGranted: true, contentAddressingAuthorityGranted: true, pathFirewallAuthorityGranted: true, v434BindingAuthorityGranted: true, measuredPackPresent: false, measuredImportAttempted: false, scienceAdmissionGranted: false, scienceResponseApplicationCount: 0 });
    expect(artifact.view.scienceBoundary).toMatchObject({ status: "blocked-no-measured-authority-pack-imported", admitted: false, scienceResponseApplicationCount: 0 });
  });
});
