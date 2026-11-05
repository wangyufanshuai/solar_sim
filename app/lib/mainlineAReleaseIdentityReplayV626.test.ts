import { describe, expect, it } from "vitest";
import { createMainlineAIdentityBoundaryV626, createMainlineAIdentityBridgeReceiptV626, createMainlineAIdentityGatesV626, compareMainlineAIdentityV626, normalizeMainlineAPackageIdentityV626, normalizeMainlineASourceIdentityV626 } from "./mainlineAReleaseIdentityBridgeV626";
import { changedMainlineAIdentityGatesV626, identityReplayHasBoundaryV626, identityReplayIsClosedV626, identityReplaySummaryV626, replayMainlineAIdentityCsvV626, replayMainlineAIdentityGatesV626, replayMainlineAIdentityJsonV626, replayMainlineAIdentityRowsV626 } from "./mainlineAReleaseIdentityReplayV626";

function makeReceipt() {
  const rootPackage = normalizeMainlineAPackageIdentityV626({ packageName: "solar-sim-viz", releaseIdentity: "solar-sim-mainline-a", runtimeName: "solar-sim-viz", releaseIdentityDeclared: true }, "root-package");
  const nextPackage = normalizeMainlineAPackageIdentityV626({ packageName: "solar-next-web", releaseIdentity: "solar-sim-mainline-a", runtimeName: "solar-next-web", releaseIdentityDeclared: true }, "next-web-package");
  const rootSource = normalizeMainlineASourceIdentityV626({ inputSha256: "root", sourceStable: true, readOnly: true });
  const nextSource = normalizeMainlineASourceIdentityV626({ inputSha256: "next", sourceStable: true, readOnly: true });
  const build = { nextBuildId: "build", runtimeBuildId: "runtime", branch: "codex/solar-sim-mainline-a", head: "156ec77", profile: "vercel-lite", sourceStable: true, receiptPath: "docs/build.json", receiptSha256: "abc", evidenceClass: "build-receipt" as const };
  const comparison = compareMainlineAIdentityV626({ rootPackage, nextWebPackage: nextPackage, rootSource, nextWebSource: nextSource, build });
  const gates = createMainlineAIdentityGatesV626({ comparison, rootSource, nextWebSource: nextSource, build, manifestParity: "pending" });
  return createMainlineAIdentityBridgeReceiptV626({ generatedAt: "2026-09-20T00:00:00.000Z", workspace: "E:/next-web", rootMirror: "E:/web", rootPackage, nextWebPackage: nextPackage, rootSource, nextWebSource: nextSource, build, comparison, gates, evidenceIndex: { "root-package": [], "next-web-package": [], "source-digest": [], "build-receipt": [], manifest: [], rollback: [] } });
}

describe("Mainline A identity replay", () => {
  it("replays every gate into a deterministic event ledger", () => {
    const receipt = makeReceipt();
    const replay = replayMainlineAIdentityGatesV626(receipt);
    expect(replay.schema).toBe("mainline-a-release-identity-replay-v626");
    expect(replay.gateCount).toBe(receipt.gates.length);
    expect(replay.events).toHaveLength(receipt.gates.length);
    expect(replay.events[0].from).toBe("not-run");
    expect(identityReplayHasBoundaryV626(replay)).toBe(true);
  });

  it("keeps row, CSV, and stable JSON projections reproducible", () => {
    const receipt = makeReceipt();
    const replay = replayMainlineAIdentityGatesV626(receipt);
    expect(replayMainlineAIdentityRowsV626(receipt)).toHaveLength(receipt.gates.length);
    expect(replayMainlineAIdentityCsvV626(receipt)).toContain("id,label,state");
    expect(replayMainlineAIdentityJsonV626(receipt)).toBe(replayMainlineAIdentityJsonV626(receipt));
    expect(identityReplaySummaryV626(replay).boundaryClosed).toBe(true);
  });

  it("does not call a blocked replay closed", () => {
    const replay = replayMainlineAIdentityGatesV626(makeReceipt());
    expect(replay.status).toBe("blocked");
    expect(replay.requiredOpen).toBeGreaterThan(0);
    expect(identityReplayIsClosedV626(replay)).toBe(false);
  });

  it("detects a gate transition without changing protected boundary semantics", () => {
    const first = replayMainlineAIdentityGatesV626(makeReceipt());
    const second = { ...first, current: { ...first.current, "manifest-parity": "passed" as const }, requiredOpen: Math.max(0, first.requiredOpen - 1) };
    expect(changedMainlineAIdentityGatesV626(first, second)).toContain("manifest-parity");
    expect(second.candidateOnly).toBe(createMainlineAIdentityBoundaryV626().candidateOnly);
    expect(second.scientificPayloadWriteback).toBe(false);
  });
});
