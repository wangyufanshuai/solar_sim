import {
  evaluateAtlasStrongGravityBrowserGateV310,
  type AtlasStrongGravityBrowserSnapshotV310,
} from "./atlasStrongGravityBrowserGateV310";
import { KERR_THIN_DISK_BAND_ARTIFACT_SHA256_V320 } from "./kerrThinDiskBandImagingV320";

export const ATLAS_STRONG_GRAVITY_BROWSER_GATE_VERSION_V321 = "v321-strong-gravity-fixed-band-browser-gate" as const;

export type AtlasStrongGravityBrowserSnapshotV321 = AtlasStrongGravityBrowserSnapshotV310 & Readonly<{
  sciencePayloadDigestSha256: string;
  scienceRasterDigestSha256: string;
  sciencePayloadUnchanged: boolean | null;
  scienceBuffersDisjoint: boolean | null;
  scienceDenseBoundary: string;
  scienceBandArtifactSha256: string;
  scienceBandViewDigestSha256: string;
  scienceBandViewUnchanged: boolean | null;
  scienceBandCount: number;
  scienceBandSaturationCount: number;
  scienceBandNormalization: string;
  scienceCinematicBufferShared: boolean | null;
  lifecycleBaselineDigest: string;
  lifecycleReturnDigest: string;
  lifecycleReturnedToBaseline: boolean | null;
}>;

export type AtlasStrongGravityBrowserGateResultV321 = Readonly<{
  version: typeof ATLAS_STRONG_GRAVITY_BROWSER_GATE_VERSION_V321;
  passed: boolean;
  failures: readonly string[];
  boundary: "local-shadow-fixed-band-browser-qualification-only-no-product-promotion";
}>;

const SHA256 = /^[a-f0-9]{64}$/;
const DIGEST = /^[a-f0-9]{8,64}$/;
const RASTER_IDENTITY_V321 = Object.freeze({
  version: "v321-kerr-fixed-band-sparse-science-raster-v1",
  boundary: "sparse-authority-fixed-band-visualization-not-dense-transfer-map",
});

export function evaluateAtlasStrongGravityBrowserGateV321(args: Readonly<{
  baseline: AtlasStrongGravityBrowserSnapshotV321;
  science: AtlasStrongGravityBrowserSnapshotV321;
  afterExit: AtlasStrongGravityBrowserSnapshotV321;
  mobile: boolean;
}>): AtlasStrongGravityBrowserGateResultV321 {
  const base = evaluateAtlasStrongGravityBrowserGateV310(args, RASTER_IDENTITY_V321);
  const failures = [...base.failures];
  if (!SHA256.test(args.science.sciencePayloadDigestSha256)
    || !SHA256.test(args.science.scienceRasterDigestSha256)
    || args.science.sciencePayloadUnchanged !== true
    || args.science.scienceBuffersDisjoint !== true
    || args.science.scienceDenseBoundary !== "sparse-authority-dense-incomplete") failures.push("science-buffer-integrity");
  if (args.science.scienceBandArtifactSha256 !== KERR_THIN_DISK_BAND_ARTIFACT_SHA256_V320
    || !SHA256.test(args.science.scienceBandViewDigestSha256)
    || args.science.scienceBandViewUnchanged !== true
    || args.science.scienceBandCount !== 3
    || !Number.isSafeInteger(args.science.scienceBandSaturationCount)
    || args.science.scienceBandSaturationCount < 0 || args.science.scienceBandSaturationCount > 12
    || args.science.scienceBandNormalization !== "fixed-physical-reference-no-data-adaptive-rescale"
    || args.science.scienceCinematicBufferShared !== false) failures.push("science-fixed-band-integrity");
  if (args.afterExit.sciencePayloadDigestSha256 !== args.science.sciencePayloadDigestSha256
    || args.afterExit.scienceRasterDigestSha256 !== args.science.scienceRasterDigestSha256
    || args.afterExit.sciencePayloadUnchanged !== true
    || args.afterExit.scienceBuffersDisjoint !== true
    || args.afterExit.scienceDenseBoundary !== args.science.scienceDenseBoundary) failures.push("science-buffer-telemetry-lost");
  if (args.afterExit.scienceBandArtifactSha256 !== args.science.scienceBandArtifactSha256
    || args.afterExit.scienceBandViewDigestSha256 !== args.science.scienceBandViewDigestSha256
    || args.afterExit.scienceBandViewUnchanged !== true
    || args.afterExit.scienceBandCount !== args.science.scienceBandCount
    || args.afterExit.scienceBandSaturationCount !== args.science.scienceBandSaturationCount
    || args.afterExit.scienceBandNormalization !== args.science.scienceBandNormalization
    || args.afterExit.scienceCinematicBufferShared !== false) failures.push("science-fixed-band-telemetry-lost");
  if (!DIGEST.test(args.afterExit.lifecycleBaselineDigest)
    || !DIGEST.test(args.afterExit.lifecycleReturnDigest)
    || args.afterExit.lifecycleBaselineDigest !== args.afterExit.lifecycleReturnDigest
    || args.afterExit.lifecycleReturnedToBaseline !== true) failures.push("lifecycle-baseline-return");
  const uniqueFailures = Object.freeze([...new Set(failures)]);
  return Object.freeze({
    version: ATLAS_STRONG_GRAVITY_BROWSER_GATE_VERSION_V321,
    passed: uniqueFailures.length === 0,
    failures: uniqueFailures,
    boundary: "local-shadow-fixed-band-browser-qualification-only-no-product-promotion",
  });
}
