import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const canonicalize = (value: unknown): unknown => Array.isArray(value)
  ? value.map(canonicalize)
  : value && typeof value === "object"
    ? Object.fromEntries(Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, canonicalize(item)]))
    : value;
const canonicalSha = (value: unknown) => createHash("sha256").update(JSON.stringify(canonicalize(value)), "utf8").digest("hex");
const fileSha = (path: string) => createHash("sha256").update(readFileSync(path)).digest("hex");

describe("post-v593 relativity dossier", () => {
  it("binds the immutable depth-8 external reference identity and remains fail-closed", () => {
    const dossier = JSON.parse(readFileSync("public/data/post-v593-stellar-relativity/relativity-reference-v3.json", "utf8"));
    expect(dossier.dossierSha256).toBeTruthy();
    const unsigned = { ...dossier };
    delete unsigned.dossierSha256;
    expect(dossier.dossierSha256).toBe(canonicalSha(unsigned));
    expect(dossier.formalProductPointer).toBe("v263");
    expect(dossier.weakField.defaultKernel).toBe("legacy-eih-1pn");
    expect(dossier.weakField.v2Mode).toBe("shadow");
    expect(dossier.weakField.trajectorySealsQualified).toBe(true);
    expect(dossier.weakField.trajectoryQualified).toBe(true);
    expect(dossier.weakField.threeKernelObservedOrderQualified).toBe(true);
    expect(dossier.weakField.fullTrajectoryReverseTimeQualified).toBe(true);
    expect(dossier.weakField.v2ReverseSpinPolicyQualified).toBe(true);
    expect(dossier.weakField.effectIsolationQualified).toBe(true);
    expect(dossier.weakField.trajectorySourceIdentityBound).toBe(true);
    expect(dossier.source.candidateDir.replaceAll("\\", "/")).toMatch(
      /\/observation-v3-post-v593-convergence-d8-1f35420354d5$/,
    );
    expect(dossier.source).toMatchObject({
      artifactSha256: "1f35420354d597f7756377df040216f6483530fba4fd7ebd67bbab446456c33e",
      observationCoreSha256: "219d5d2cac648c00ad4e53e4288bff9eb84993b8671e9a118fd2740078de2e89",
      summarySha256: "62aaa2b572a1c8dae87ea2e475e6ac002c493b999f58ed556d843bfbb128fa9c",
      receiptSha256: "5aadf9c0ec7eee49e51056cc440437aba04f1cd849e880b79acc5018eaedb90d",
      engineManifestSha256: "2d95cbab90033f77f2fd2a8de3883237f8ca893d677e9a2d08e4557b42a48822",
      convergenceReportDocumentSha256: "680259bac757164932e3ac3cdf9cf346861fb62239e171b5c007b64055ce1ecd",
      reverificationResultSha256: "3597bec06a92e28dbbe83e45ac511131dbbe8536cf8cffe5e1ece68149530a2f",
      manifestFileCount: 19,
      externalIdentityBound: true,
    });
    expect(dossier.source.convergenceFileSha256).toBe(
      "613eded4597cedcdaef9d938a1f80b4c0e89f10d08278fb4c80f0307e917b051",
    );
    expect(dossier.source.convergenceFileSha256).toBe(
      dossier.source.convergenceReceiptFileSha256,
    );
    expect(dossier.source.convergenceFileSha256).toBe(
      dossier.source.convergenceManifestFileSha256,
    );
    expect(dossier.source.observationFile).toEqual({
      bytes: 78_992_744,
      sha256: "5f03a8eb2a87f951b8ca5f2797f7b1757202cf9341c377ad517c4d088a41c9e4",
    });
    expect(dossier.source.reverificationReceiptFile).toEqual({
      bytes: 1_276,
      sha256: "080992abd561964a572bf1bb96a51b487061d565f6ddfe7ef532b45c6199e7ce",
    });
    expect(dossier.independentReference).toMatchObject({
      externalGeometryReferenceQualified: true,
      externalPolarizationTransportReferenceQualified: true,
      externalReferenceDoesNotGrantWebProductAuthority: true,
    });
    expect(dossier.authority.geometryReferenceGranted).toBe(false);
    expect(dossier.authority.polarizationTransportReferenceGranted).toBe(false);
    expect(dossier.authority.radiativeTransferGranted).toBe(false);
    expect(dossier.authority.measuredAuthorityGranted).toBe(false);
    expect(dossier.authority.gpuAuthorityGranted).toBe(false);
    expect(dossier.authority.grmhdGranted).toBe(false);
    expect(dossier.authority.scientificPayloadMutationAllowed).toBe(false);
    expect(dossier.authority.productionReleaseAuthorized).toBe(false);
    expect(dossier.kerr.oracleQualified).toBe(true);
    expect(dossier.kerr.requestedRayCount).toBe(64);
    expect(dossier.kerr.executedRayCount).toBe(64);
    expect(dossier.kerr.convergenceIdentityBound).toBe(true);
    expect(dossier.kerr.convergenceUnresolvedCellCount).toBe(0);
    expect(dossier.kerr.convergenceQualified).toBe(true);
    expect(dossier.kerr.convergenceStatus).toBe("qualified");
    expect(dossier.kerr.convergenceThreshold).toBe(0.001);
    expect(dossier.kerr.convergenceFromDepth).toBe(7);
    expect(dossier.kerr.convergenceToDepth).toBe(8);
    expect(dossier.kerr.convergenceMaximumRelativeChange).toBe(
      0.0005501734242315513,
    );
    expect(dossier.kerr.convergenceMaximumRelativeChange).toBeLessThanOrEqual(
      dossier.kerr.convergenceThreshold,
    );
    expect(dossier.kerr).toMatchObject({
      classificationAgreement: true,
      stratificationQualified: true,
      parallelTransportQualified: true,
      externalIdentityBound: true,
      reverificationRayCount: 17_876,
      reverificationEventCount: 57_273,
      hdf5RoundTripQualified: true,
      fitsRoundTripQualified: true,
      deterministicReplayQualified: true,
      externalGeometryReferenceQualified: true,
      externalPolarizationTransportReferenceQualified: true,
    });
    expect(dossier.unresolved).not.toContain("independent-kerr-schild-64-ray-oracle-not-qualified");
    expect(dossier.unresolved).not.toContain("weak-field-full-trajectory-reference-not-qualified");
    expect(dossier.unresolved).not.toContain("independent-kerr-adaptive-convergence-not-qualified");
    expect(dossier.unresolved).not.toContain("independent-kerr-adaptive-convergence-file-not-bound");
    expect(dossier.unresolved).toEqual([
      "full-3d-kerr-reference-is-not-the-browser-teaching-track",
      "weak-field-v2-ephemeris-promotion-gates-not-run-by-this-dossier",
    ]);
    expect(dossier.status).toBe(
      "qualified-independent-kerr-schild-64-ray-reference-and-adaptive-convergence",
    );
  });

  it("re-hashes every declared trajectory source without promoting V2", () => {
    const evidence = JSON.parse(readFileSync("public/data/post-v593-stellar-relativity/relativity-trajectory-reference-v3.json", "utf8"));
    const receipt = JSON.parse(readFileSync("docs/release/post-v593/relativity-trajectory-reference-receipt-v3.json", "utf8"));
    const evidenceUnsigned = { ...evidence };
    const receiptUnsigned = { ...receipt };
    delete evidenceUnsigned.evidenceSha256;
    delete receiptUnsigned.receiptSha256;
    expect(evidence.evidenceSha256).toBe(canonicalSha(evidenceUnsigned));
    expect(receipt.receiptSha256).toBe(canonicalSha(receiptUnsigned));
    expect(receipt.evidenceSha256).toBe(evidence.evidenceSha256);
    expect(receipt.resultSha256).toBe(evidence.runner.resultSha256);
    expect(evidence.version).toBe("post-v593-relativity-trajectory-evidence-v3");
    expect(receipt.version).toBe("post-v593-relativity-trajectory-reference-receipt-v3");
    expect(evidence.status).toBe(
      "qualified-shadow-only-three-kernel-full-trajectory-reference",
    );
    expect(receipt.status).toBe(evidence.status);
    expect(evidence.formalProductPointer).toBe("v263");
    expect(receipt.formalProductPointer).toBe("v263");
    expect(evidence.source.files.map((entry: { path: string }) => entry.path)).toEqual([
      "app/lib/relativityTrajectoryReferenceV3.ts",
      "app/lib/physicsEngine.ts",
      "app/lib/relativityForceModelV2.ts",
      "app/lib/physicalConstants.ts",
      "app/lib/sha256BrowserV566.ts",
      "scripts/build-post-v593-relativity-trajectory-evidence.ts",
    ]);
    for (const entry of evidence.source.files) {
      expect(entry.sha256).toBe(fileSha(entry.path));
      if ("bytes" in entry) {
        expect(entry.bytes).toBe(readFileSync(entry.path).byteLength);
      }
    }
    expect(evidence.source.sourceBundleSha256).toBe(
      canonicalSha(evidence.source.files),
    );
    expect(receipt.sourceBundleSha256).toBe(evidence.source.sourceBundleSha256);
    expect(evidence.gates).toMatchObject({
      deterministicReplay: true,
      callerArraysUnchanged: true,
      threeKernelObservedOrderQualified: true,
      fullTrajectoryReverseTimeQualified: true,
      v2ReverseSpinPolicyQualified: true,
      perBodyQualified: true,
      aggregateQualified: true,
      effectIsolationQualified: true,
      boundaryQualified: true,
      allQualified: true,
    });
    expect(evidence.result.convergence.rows).toHaveLength(3);
    expect(evidence.result.reverseTimeRoundTrip.fullTimeIntegration).toBe(true);
    expect(evidence.authority.defaultKernel).toBe("legacy-eih-1pn");
    expect(evidence.authority.v2Mode).toBe("shadow");
    expect(evidence.authority.promotionDecision).toBe(false);
    expect(evidence.authority.measuredAuthorityGranted).toBe(false);
    expect(evidence.authority.gpuAuthorityGranted).toBe(false);
    expect(evidence.authority.scientificPayloadMutationAllowed).toBe(false);
    expect(evidence.authority.productionReleaseAuthorized).toBe(false);
    expect(receipt.authority).toEqual(evidence.authority);
    expect(receipt.productionReleaseAuthorized).toBe(false);
  });

  it("seals the derived receipt without granting authority", () => {
    const dossier = JSON.parse(readFileSync("public/data/post-v593-stellar-relativity/relativity-reference-v3.json", "utf8"));
    const receipt = JSON.parse(readFileSync("docs/release/post-v593/relativity-reference-receipt-v3.json", "utf8"));
    const unsigned = { ...receipt };
    delete unsigned.receiptSha256;
    expect(receipt.receiptSha256).toBe(canonicalSha(unsigned));
    expect(receipt.dossierSha256).toBe(dossier.dossierSha256);
    expect(receipt.status).toBe(dossier.status);
    expect(receipt.formalProductPointer).toBe("v263");
    expect(receipt.source.externalIdentityBound).toBe(true);
    expect(receipt.authority).toEqual(dossier.authority);
    expect(receipt.productionReleaseAuthorized).toBe(false);
  });
});
