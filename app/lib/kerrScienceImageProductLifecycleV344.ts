import type { AtlasResourceBaselineDiffV300 } from "./atlasResourceLifecycle";
export const KERR_SCIENCE_IMAGE_PRODUCT_LIFECYCLE_VERSION_V344 = "v344-kerr-science-image-product-lifecycle-replay-v1" as const;
export type KerrScienceImageProductLifecycleV344 = Readonly<{
  version: typeof KERR_SCIENCE_IMAGE_PRODUCT_LIFECYCLE_VERSION_V344;
  status: "qualified-intent-single-flight-integrity-idempotent-baseline";
  source: Readonly<{ manifestSha256: string; fitsSha256: string; pngSha256: string }>;
  beforeIntent: Readonly<{ productFetchCount: 0; cacheEntries: 0; referenceCount: 0 }>;
  concurrentPng: Readonly<{ consumerCount: 2; productFetchCount: 1; cacheEntries: 1; referenceCount: 2; during: AtlasResourceBaselineDiffV300 }>;
  reverseRelease: Readonly<{ duplicateReleaseApplied: true; after: AtlasResourceBaselineDiffV300; baselineReturned: true }>;
  fitsDownload: Readonly<{ productFetchCount: 2; objectUrlPublished: true; after: AtlasResourceBaselineDiffV300; baselineReturned: true }>;
  corruptBytes: Readonly<{ rejected: true; objectUrlPublished: false; after: AtlasResourceBaselineDiffV300; baselineReturned: true }>;
  intentBeforeProductRequest: true;
  singleFlight: true;
  exactShaVerified: true;
  objectUrlPerConsumer: true;
  idempotentRelease: true;
  mobilePreview: "fit-width-no-crop-no-prefetch";
  denseCampaignStatus: "incomplete-0-of-49";
  browserQualification: "not-run";
  boundary: "node-browser-api-replay-real-client-no-project-server-no-playwright-no-product-promotion";
}>;
export function parseKerrScienceImageProductLifecycleV344(value: unknown): KerrScienceImageProductLifecycleV344 {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value as Partial<KerrScienceImageProductLifecycleV344> : null;
  if (!source || source.version !== KERR_SCIENCE_IMAGE_PRODUCT_LIFECYCLE_VERSION_V344 || source.status !== "qualified-intent-single-flight-integrity-idempotent-baseline"
    || !/^[a-f0-9]{64}$/.test(source.source?.manifestSha256 ?? "") || !/^[a-f0-9]{64}$/.test(source.source?.fitsSha256 ?? "") || !/^[a-f0-9]{64}$/.test(source.source?.pngSha256 ?? "")
    || source.beforeIntent?.productFetchCount !== 0 || source.beforeIntent.cacheEntries !== 0 || source.beforeIntent.referenceCount !== 0
    || source.concurrentPng?.consumerCount !== 2 || source.concurrentPng.productFetchCount !== 1 || source.concurrentPng.cacheEntries !== 1 || source.concurrentPng.referenceCount !== 2 || source.concurrentPng.during.objectUrls !== 2 || source.concurrentPng.during.typedArrayCaches !== 1
    || source.reverseRelease?.duplicateReleaseApplied !== true || source.reverseRelease.baselineReturned !== true || source.reverseRelease.after.status !== "baseline"
    || source.fitsDownload?.productFetchCount !== 2 || source.fitsDownload.objectUrlPublished !== true || source.fitsDownload.baselineReturned !== true || source.fitsDownload.after.status !== "baseline"
    || source.corruptBytes?.rejected !== true || source.corruptBytes.objectUrlPublished !== false || source.corruptBytes.baselineReturned !== true || source.corruptBytes.after.status !== "baseline"
    || source.intentBeforeProductRequest !== true || source.singleFlight !== true || source.exactShaVerified !== true || source.objectUrlPerConsumer !== true || source.idempotentRelease !== true
    || source.mobilePreview !== "fit-width-no-crop-no-prefetch" || source.denseCampaignStatus !== "incomplete-0-of-49" || source.browserQualification !== "not-run"
    || source.boundary !== "node-browser-api-replay-real-client-no-project-server-no-playwright-no-product-promotion") throw new Error("v344-image-product-lifecycle-identity");
  return value as KerrScienceImageProductLifecycleV344;
}
