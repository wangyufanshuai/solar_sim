import { describe, expect, it } from "vitest";
import {
  assertMainlineAIdentityBoundaryV626,
  classifyMainlineAIdentityDifferenceV626,
  compareMainlineAIdentityV626,
  createMainlineAIdentityBoundaryV626,
  createMainlineAIdentityGatesV626,
  createMainlineAIdentityRollbackV626,
  createMainlineAIdentityCsvV626,
  createMainlineAIdentityBridgeReceiptV626,
  digestMainlineAIdentityValueV626,
  isMainlineAIdentityBridgeClosedV626,
  normalizeMainlineAPackageIdentityV626,
  normalizeMainlineASourceIdentityV626,
  stableMainlineAIdentityJsonV626,
} from "./mainlineAReleaseIdentityBridgeV626";

const rootPackage = normalizeMainlineAPackageIdentityV626({ packageName: "solar-sim-viz", releaseIdentity: "solar-sim-mainline-a", runtimeName: "solar-sim-viz", releaseIdentityDeclared: true, packageType: "module", packageVersion: "1.0.0", path: "E:/root/web" }, "root-package");
const nextPackage = normalizeMainlineAPackageIdentityV626({ packageName: "solar-next-web", releaseIdentity: "solar-sim-mainline-a", runtimeName: "solar-next-web", releaseIdentityDeclared: true, packageType: "private", packageVersion: "1.0.0", path: "E:/next-web" }, "next-web-package");
const rootSource = normalizeMainlineASourceIdentityV626({ inputSha256: "root", sourceStable: true, readOnly: true, hasGitDirectory: false, manifestPresent: false });
const nextSource = normalizeMainlineASourceIdentityV626({ inputSha256: "next", sourceStable: true, readOnly: true, hasGitDirectory: false, manifestPresent: true });
const build = { nextBuildId: "build-1", runtimeBuildId: "runtime-1", branch: "codex/solar-sim-mainline-a", head: "156ec77", profile: "vercel-lite", sourceStable: true, receiptPath: "docs/build.json", receiptSha256: "abc", evidenceClass: "build-receipt" as const };

describe("Mainline A release identity bridge", () => {
  it("maps different runtime names to one declared release identity", () => {
    const comparison = compareMainlineAIdentityV626({ rootPackage, nextWebPackage: nextPackage, rootSource, nextWebSource: nextSource, build });
    expect(comparison.mapping.releaseIdentityMatch).toBe(true);
    expect(comparison.mapping.runtimeNameDifferenceIntentional).toBe(true);
    expect(comparison.issues.some((issue) => issue.code === "runtime-package-name-diff" && issue.severity === "info")).toBe(true);
    expect(classifyMainlineAIdentityDifferenceV626(comparison.mapping)).toBe("source-diverged");
  });

  it("blocks mismatched declared identities", () => {
    const comparison = compareMainlineAIdentityV626({ rootPackage, nextWebPackage: normalizeMainlineAPackageIdentityV626({ ...nextPackage, releaseIdentity: "other-product" }), rootSource, nextWebSource: nextSource, build });
    expect(comparison.status).toBe("blocked");
    expect(comparison.issues.map((issue) => issue.code)).toContain("release-identity-mismatch");
  });

  it("keeps protected boundary immutable", () => {
    const boundary = createMainlineAIdentityBoundaryV626();
    expect(boundary.candidateOnly).toBe(true);
    expect(boundary.scientificPayloadWriteback).toBe(false);
    expect(boundary.physicsKernelMutation).toBe(false);
    expect(() => assertMainlineAIdentityBoundaryV626({ boundary })).not.toThrow();
    const invalidBoundary = { ...boundary, scientificPayloadWriteback: true } as unknown as typeof boundary;
    expect(() => assertMainlineAIdentityBoundaryV626({ boundary: invalidBoundary })).toThrow();
  });

  it("classifies required gates and open manifest parity", () => {
    const comparison = compareMainlineAIdentityV626({ rootPackage, nextWebPackage: nextPackage, rootSource, nextWebSource: nextSource, build });
    const gates = createMainlineAIdentityGatesV626({ comparison, rootSource, nextWebSource: nextSource, build, manifestParity: "pending" });
    expect(gates.find((gate) => gate.id === "release-identity")?.state).toBe("passed");
    expect(gates.find((gate) => gate.id === "manifest-parity")?.state).toBe("pending");
    expect(gates.find((gate) => gate.id === "source-parity")?.state).toBe("pending");
  });

  it("emits deterministic JSON, digest, CSV, and rollback metadata", () => {
    const comparison = compareMainlineAIdentityV626({ rootPackage, nextWebPackage: nextPackage, rootSource, nextWebSource: nextSource, build });
    const gates = createMainlineAIdentityGatesV626({ comparison, rootSource, nextWebSource: nextSource, build, manifestParity: "pending" });
    const receipt = createMainlineAIdentityBridgeReceiptV626({ generatedAt: "2026-09-20T00:00:00.000Z", workspace: "E:/next-web", rootMirror: "E:/root/web", rootPackage, nextWebPackage: nextPackage, rootSource, nextWebSource: nextSource, build, comparison, gates, evidenceIndex: { "root-package": [], "next-web-package": [], "source-digest": [], "build-receipt": [], manifest: [], rollback: [] } });
    expect(stableMainlineAIdentityJsonV626(receipt)).toBe(stableMainlineAIdentityJsonV626(JSON.parse(JSON.stringify(receipt))));
    expect(digestMainlineAIdentityValueV626(receipt)).toMatch(/^[0-9a-f]{8}$/);
    expect(createMainlineAIdentityCsvV626(gates)).toContain("release-identity");
    expect(createMainlineAIdentityRollbackV626({ currentHead: "156ec77" }).reversible).toBe(true);
    expect(isMainlineAIdentityBridgeClosedV626(receipt)).toBe(false);
  });
});
