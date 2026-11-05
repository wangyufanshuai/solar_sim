import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { resolveKerrPhotonMetrologyObservatoryIntentV540 } from "./kerrPhotonMetrologyObservatoryIntentV540";
import { canonicalKerrResponseAwareOfflineReplayV540, compareKerrResponseAwareOfflineReplayHudEncodingsV540, createKerrResponseAwareOfflineReplayHudEncodingV540, createKerrResponseAwareOfflineReplaySummaryV540, parseKerrResponseAwareOfflineReplayArtifactV540 } from "./kerrResponseAwareOfflineReplayV540";

const artifact = parseKerrResponseAwareOfflineReplayArtifactV540(JSON.parse(readFileSync("dist/science/kerr-response-aware-offline-replay-v540/atlas.json", "utf8")));
const digest = (value: unknown) => createHash("sha256").update(canonicalKerrResponseAwareOfflineReplayV540(value)).digest("hex");
describe("v540 clean-room offline replay", () => {
  it("is canonical with a deterministic receipt", () => { expect(digest(artifact)).toBe(artifact.artifactSha256); expect(digest(artifact.receipt)).toBe(artifact.receipt.receiptSha256); expect(artifact.receiptExport.canonicalSha256).toBe(artifact.receipt.receiptSha256); expect(artifact.receiptExport.abByteIdentical).toBe(true); });
  it("proves safe cleanup and zero-network replay without image claims", () => { expect(artifact.receipt.sandbox).toMatchObject({ independentTemporaryDirectoryUsed: true, temporaryDirectoryRemoved: true, absolutePathStored: false, pathTraversalRejected: true, symlinkRejected: true, duplicateMemberRejected: true, networkGuardInstalled: true, networkAttemptCount: 0 }); expect(artifact.counts).toMatchObject({ replayAttemptCount: 2, qualifiedReplayCount: 2, networkAttemptCount: 0, temporaryDirectoryLeakCount: 0, pixelSampleCount: 0, fitsImageHduCount: 0, physicalUncertaintyValueCount: 0 }); });
  it("keeps Science and Cinematic on the identical replay receipt", () => { const summary = createKerrResponseAwareOfflineReplaySummaryV540(artifact); expect(compareKerrResponseAwareOfflineReplayHudEncodingsV540(createKerrResponseAwareOfflineReplayHudEncodingV540(summary, "science"), createKerrResponseAwareOfflineReplayHudEncodingV540(summary, "cinematic"))).toMatchObject({ replayReceiptStable: true, replayAttemptCount: 2, networkAttemptCount: 0, temporaryDirectoryLeakCount: 0, imageHduCount: 0, scientificFieldMutation: false }); });
  it("authorizes the 42-detail catalog only after explicit local-shadow intent", () => { expect(resolveKerrPhotonMetrologyObservatoryIntentV540("local-shadow", true)).toMatchObject({ observatoryImportAuthorized: true, detailComponentCatalogSize: 42, concurrentDetailSurfaceBudget: 1 }); expect(resolveKerrPhotonMetrologyObservatoryIntentV540("standalone-full", true)).toMatchObject({ observatoryImportAuthorized: false, concurrentDetailSurfaceBudget: 0 }); expect(resolveKerrPhotonMetrologyObservatoryIntentV540("vercel-lite", true)).toMatchObject({ reason: "lite-boundary" }); });
});
