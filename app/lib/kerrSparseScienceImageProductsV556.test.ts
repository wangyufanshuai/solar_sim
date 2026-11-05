import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { canonicalKerrSparseScienceImageProductsV556, parseKerrSparseScienceImageProductsV556 } from "./kerrSparseScienceImageProductsV556";

const artifact = parseKerrSparseScienceImageProductsV556(JSON.parse(readFileSync("dist/science/kerr-sparse-science-image-products-v556/manifest.json", "utf8")));
const sha = (value: unknown) => createHash("sha256").update(canonicalKerrSparseScienceImageProductsV556(value)).digest("hex");
describe("v556 sparse science image products", () => {
  it("locks exact RGBA readback across PNG and FITS", () => { expect(sha(artifact)).toBe(artifact.artifactSha256); expect(artifact.products).toHaveLength(2); expect(new Set(artifact.products.map((product) => product.pixelReadbackSha256))).toEqual(new Set([artifact.source.rasterSha256])); expect(artifact.validation).toMatchObject({ independentSubprocessAttemptCount: 2, qualifiedSubprocessCount: 2, abCanonicalIdentical: true, rawPngFitsPixelBytesIdentical: true, fitsChecksumQualified: true }); expect(artifact.mutationAudit).toMatchObject({ mutationCount: 8, rejectedMutationCount: 8 }); });
  it("keeps dense, measured, production, and browser boundaries closed", () => { expect(artifact.qualification).toMatchObject({ sparsePngFitsQualified: true, denseScienceImageQualified: false, observedScienceImageQualified: false, measuredAuthorityGranted: false, productionPromotionQualified: false }); expect(artifact.boundary).toMatchObject({ denseCampaignStatus: "incomplete-0-of-49", measuredFrameAvailable: false, measuredValuesInvented: false, browserQualification: "not-run", formalProductPointer: "v263", formalDefaultKernel: "legacy-eih-1pn" }); });
});
