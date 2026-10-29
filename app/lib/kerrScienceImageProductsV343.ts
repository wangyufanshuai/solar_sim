export const KERR_SCIENCE_IMAGE_PRODUCTS_VERSION_V343 = "v343-kerr-science-image-product-manifest-v1" as const;
export type KerrScienceImageProductEntryV343 = Readonly<{
  id: "fits" | "png";
  path: string;
  mimeType: "application/fits" | "image/png";
  sha256: string;
  bytes: number;
  shape?: readonly [3, 4];
  hduCount?: 13;
  integrity?: "external-sha256-exact-bytes";
  width?: 1200;
  height?: 720;
  displayTransform?: "fixed-linear-reference-per-band";
}>;
export type KerrScienceImageProductManifestV343 = Readonly<{
  version: typeof KERR_SCIENCE_IMAGE_PRODUCTS_VERSION_V343;
  generatedAt: string;
  status: "qualified-sparse-science-fits-png-products";
  source: Readonly<{ rasterPath: string; rasterFileSha256: string; rasterArtifactSha256: string; productPath: string; productFileSha256: string; productArtifactSha256: string; requirementsPath: "scripts/requirements-science-images-v343.txt"; requirementsSha256: string; fullShortAuthoritySha256: string; geometryEvidenceSha256: string; polarizationEvidenceSha256: string }>;
  products: readonly KerrScienceImageProductEntryV343[];
  fields: readonly string[];
  bands: readonly ["visible", "euv", "soft-x-ray"];
  rays: readonly [12, 13, 14, 15];
  shape: readonly [3, 4];
  units: Readonly<{ radiance: "W m^-2 sr^-1"; angle: "deg"; redshift: "1"; spin: "1" }>;
  display: Readonly<{ science: "fixed-linear-reference-per-band"; adaptiveNormalization: false; cinematicInput: false }>;
  environment: Readonly<{ python: string; numpy: string; astropy: string; pillow: string }>;
  denseCampaignStatus: "incomplete-0-of-49";
  denseAggregateSha256: null;
  browserQualification: "not-run";
  sanitizedProvenance: true;
  boundary: "offline-fits-png-from-v342-sparse-raster-not-dense-image-not-browser-fits-runtime";
  manifestSha256: string;
}>;
const SHA = /^[a-f0-9]{64}$/;
export function parseKerrScienceImageProductManifestV343(value: unknown): KerrScienceImageProductManifestV343 {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value as Partial<KerrScienceImageProductManifestV343> : null;
  const fits = source?.products?.find((entry) => entry.id === "fits");
  const png = source?.products?.find((entry) => entry.id === "png");
  if (!source || source.version !== KERR_SCIENCE_IMAGE_PRODUCTS_VERSION_V343 || source.status !== "qualified-sparse-science-fits-png-products"
    || !SHA.test(source.source?.rasterFileSha256 ?? "") || !SHA.test(source.source?.rasterArtifactSha256 ?? "") || !SHA.test(source.source?.productFileSha256 ?? "") || !SHA.test(source.source?.productArtifactSha256 ?? "") || source.source?.requirementsPath !== "scripts/requirements-science-images-v343.txt" || !SHA.test(source.source?.requirementsSha256 ?? "") || !SHA.test(source.source?.fullShortAuthoritySha256 ?? "") || !SHA.test(source.source?.geometryEvidenceSha256 ?? "") || !SHA.test(source.source?.polarizationEvidenceSha256 ?? "")
    || !Array.isArray(source.products) || source.products.length !== 2 || !fits || !png
    || fits.path !== "dist/science/kerr-observation-images-v343/science-raster-v343.fits" || fits.mimeType !== "application/fits" || !SHA.test(fits.sha256) || !Number.isSafeInteger(fits.bytes) || fits.bytes <= 0 || fits.hduCount !== 13 || fits.integrity !== "external-sha256-exact-bytes" || fits.shape?.join(",") !== "3,4"
    || png.path !== "dist/science/kerr-observation-images-v343/science-raster-v343.png" || png.mimeType !== "image/png" || !SHA.test(png.sha256) || !Number.isSafeInteger(png.bytes) || png.bytes <= 0 || png.width !== 1200 || png.height !== 720 || png.displayTransform !== "fixed-linear-reference-per-band"
    || source.fields?.length !== 11 || source.bands?.join(",") !== "visible,euv,soft-x-ray" || source.rays?.join(",") !== "12,13,14,15" || source.shape?.join(",") !== "3,4"
    || source.display?.science !== "fixed-linear-reference-per-band" || source.display.adaptiveNormalization !== false || source.display.cinematicInput !== false
    || source.denseCampaignStatus !== "incomplete-0-of-49" || source.denseAggregateSha256 !== null || source.browserQualification !== "not-run" || source.sanitizedProvenance !== true
    || source.boundary !== "offline-fits-png-from-v342-sparse-raster-not-dense-image-not-browser-fits-runtime" || !SHA.test(source.manifestSha256 ?? "")) throw new Error("v343-image-product-manifest-identity");
  return value as KerrScienceImageProductManifestV343;
}
