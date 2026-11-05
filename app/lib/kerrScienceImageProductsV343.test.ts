import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parseKerrScienceImageProductManifestV343 } from "./kerrScienceImageProductsV343";
describe("v343 FITS/PNG science products", () => {
  it("publishes deterministic sparse products with authority and dense boundaries", () => {
    const manifest = parseKerrScienceImageProductManifestV343(JSON.parse(readFileSync(resolve(process.cwd(), "dist/science/kerr-observation-images-v343/manifest.json"), "utf8")));
    expect(manifest.products.map((product) => product.id)).toEqual(["fits", "png"]);
    expect(manifest.fields).toContain("parallel-transport-evpa");
    expect(manifest.display).toEqual({ science: "fixed-linear-reference-per-band", adaptiveNormalization: false, cinematicInput: false });
    expect(manifest.denseCampaignStatus).toBe("incomplete-0-of-49");
    expect(manifest.denseAggregateSha256).toBeNull();
    expect(manifest.sanitizedProvenance).toBe(true);
  });
});
