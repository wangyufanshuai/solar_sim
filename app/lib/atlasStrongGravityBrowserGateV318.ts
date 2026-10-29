import {
  evaluateAtlasStrongGravityBrowserGateV310,
  type AtlasStrongGravityBrowserSnapshotV310,
} from "./atlasStrongGravityBrowserGateV310";

export const ATLAS_STRONG_GRAVITY_BROWSER_GATE_VERSION_V318 = "v318-strong-gravity-buffer-lifecycle-browser-gate" as const;

export type AtlasStrongGravityBrowserSnapshotV318 = AtlasStrongGravityBrowserSnapshotV310 & Readonly<{
  sciencePayloadDigestSha256: string;
  scienceRasterDigestSha256: string;
  sciencePayloadUnchanged: boolean | null;
  scienceBuffersDisjoint: boolean | null;
  scienceDenseBoundary: string;
  lifecycleBaselineDigest: string;
  lifecycleReturnDigest: string;
  lifecycleReturnedToBaseline: boolean | null;
}>;

export type AtlasStrongGravityBrowserGateResultV318 = Readonly<{
  version: typeof ATLAS_STRONG_GRAVITY_BROWSER_GATE_VERSION_V318;
  passed: boolean;
  failures: readonly string[];
  boundary: "local-shadow-browser-buffer-lifecycle-qualification-only-no-product-promotion";
}>;

const SHA256 = /^[a-f0-9]{64}$/;
const DIGEST = /^[a-f0-9]{8,64}$/;

export function evaluateAtlasStrongGravityBrowserGateV318(args: Readonly<{
  baseline: AtlasStrongGravityBrowserSnapshotV318;
  science: AtlasStrongGravityBrowserSnapshotV318;
  afterExit: AtlasStrongGravityBrowserSnapshotV318;
  mobile: boolean;
}>): AtlasStrongGravityBrowserGateResultV318 {
  const base = evaluateAtlasStrongGravityBrowserGateV310(args);
  const failures = [...base.failures];
  if (!SHA256.test(args.science.sciencePayloadDigestSha256)
    || !SHA256.test(args.science.scienceRasterDigestSha256)
    || args.science.sciencePayloadUnchanged !== true
    || args.science.scienceBuffersDisjoint !== true
    || args.science.scienceDenseBoundary !== "sparse-authority-dense-incomplete") {
    failures.push("science-buffer-integrity");
  }
  if (args.afterExit.sciencePayloadDigestSha256 !== args.science.sciencePayloadDigestSha256
    || args.afterExit.scienceRasterDigestSha256 !== args.science.scienceRasterDigestSha256
    || args.afterExit.sciencePayloadUnchanged !== true
    || args.afterExit.scienceBuffersDisjoint !== true
    || args.afterExit.scienceDenseBoundary !== args.science.scienceDenseBoundary) {
    failures.push("science-buffer-telemetry-lost");
  }
  if (!DIGEST.test(args.afterExit.lifecycleBaselineDigest)
    || !DIGEST.test(args.afterExit.lifecycleReturnDigest)
    || args.afterExit.lifecycleBaselineDigest !== args.afterExit.lifecycleReturnDigest
    || args.afterExit.lifecycleReturnedToBaseline !== true) {
    failures.push("lifecycle-baseline-return");
  }
  const uniqueFailures = Object.freeze([...new Set(failures)]);
  return Object.freeze({
    version: ATLAS_STRONG_GRAVITY_BROWSER_GATE_VERSION_V318,
    passed: uniqueFailures.length === 0,
    failures: uniqueFailures,
    boundary: "local-shadow-browser-buffer-lifecycle-qualification-only-no-product-promotion",
  });
}
