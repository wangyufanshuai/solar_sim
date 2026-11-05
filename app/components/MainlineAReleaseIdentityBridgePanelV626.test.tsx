import { describe, expect, it } from "vitest";
import {
  createMainlineAIdentityBoundaryV626,
  createMainlineAIdentityBridgeReceiptV626,
  createMainlineAIdentityGatesV626,
  compareMainlineAIdentityV626,
  normalizeMainlineAPackageIdentityV626,
  normalizeMainlineASourceIdentityV626,
} from "../lib/mainlineAReleaseIdentityBridgeV626";

const rootPackage = normalizeMainlineAPackageIdentityV626({ packageName: "solar-sim-viz", releaseIdentity: "solar-sim-mainline-a", runtimeName: "solar-sim-viz", releaseIdentityDeclared: true }, "root-package");
const nextPackage = normalizeMainlineAPackageIdentityV626({ packageName: "solar-next-web", releaseIdentity: "solar-sim-mainline-a", runtimeName: "solar-next-web", releaseIdentityDeclared: true }, "next-web-package");
const rootSource = normalizeMainlineASourceIdentityV626({ inputSha256: "root", sourceStable: true, readOnly: true });
const nextSource = normalizeMainlineASourceIdentityV626({ inputSha256: "next", sourceStable: true, readOnly: true });
const build = { nextBuildId: "build", runtimeBuildId: "runtime", branch: "codex/solar-sim-mainline-a", head: "156ec77", profile: "vercel-lite", sourceStable: true, receiptPath: "docs/build.json", receiptSha256: "abc", evidenceClass: "build-receipt" as const };

function receipt() {
  const comparison = compareMainlineAIdentityV626({ rootPackage, nextWebPackage: nextPackage, rootSource, nextWebSource: nextSource, build });
  const gates = createMainlineAIdentityGatesV626({ comparison, rootSource, nextWebSource: nextSource, build, manifestParity: "pending" });
  return createMainlineAIdentityBridgeReceiptV626({ generatedAt: "2026-09-20T00:00:00.000Z", workspace: "E:/next-web", rootMirror: "E:/web", rootPackage, nextWebPackage: nextPackage, rootSource, nextWebSource: nextSource, build, comparison, gates, evidenceIndex: { "root-package": [], "next-web-package": [], "source-digest": [], "build-receipt": [], manifest: [], rollback: [] } });
}

describe("MainlineAReleaseIdentityBridgePanelV626 contract", () => {
  it("provides explicit mapped identity and separate runtime names", () => {
    const value = receipt();
    expect(value.nextWebPackage.releaseIdentity).toBe("solar-sim-mainline-a");
    expect(value.rootPackage.runtimeName).toBe("solar-sim-viz");
    expect(value.nextWebPackage.runtimeName).toBe("solar-next-web");
    expect(value.mapping.runtimeNameDifferenceIntentional).toBe(true);
  });

  it("keeps the panel input blocked while manifest evidence is pending", () => {
    const value = receipt();
    expect(value.status).toBe("blocked");
    expect(value.blockers).toContain("root-manifest-not-present");
    expect(value.gates.find((gate) => gate.id === "manifest-parity")?.state).toBe("pending");
  });

  it("exposes a closed candidate boundary to the panel", () => {
    const value = receipt();
    expect(value.boundary).toEqual(createMainlineAIdentityBoundaryV626());
    expect(value.boundary.candidateOnly).toBe(true);
    expect(value.boundary.hold).toBe(true);
    expect(value.boundary.notAdmitted).toBe(true);
    expect(value.boundary.scientificPayloadWriteback).toBe(false);
  });

  it("keeps required and optional gate states distinguishable", () => {
    const value = receipt();
    const required = value.gates.filter((gate) => gate.required);
    const optional = value.gates.filter((gate) => !gate.required);
    expect(required.length).toBeGreaterThan(0);
    expect(optional.some((gate) => gate.id === "runtime-package-names")).toBe(true);
    expect(required.some((gate) => gate.state === "pending" || gate.state === "blocked")).toBe(true);
  });
});
