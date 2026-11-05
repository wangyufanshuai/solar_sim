import { describe, expect, it } from "vitest";
import {
  assertMainlineAReleaseBoundaryV626,
  compareMainlineAReleaseInputsV626,
  createMainlineAReleaseGatesV626,
  createMainlineAReleaseManifestSnapshotV626,
  createMainlineAReleasePackageV626,
  createMainlineARightsClosureV626,
  createMainlineARuntimeClosureV626,
  createMainlineASourceClosureV626,
  digestMainlineAReleaseValueV626,
  releaseGateSummaryV626,
} from "./mainlineAReleaseAlignmentV626";

const build = {
  buildId: "next-build",
  runtimeBuildId: "mainline-a-runtime",
  branch: "codex/solar-sim-mainline-a",
  head: "156ec7790a99be2f89f5d8f44831cb118c9437e1",
  profile: "vercel-lite",
  sourceStable: true,
  receiptPath: "docs/release/v607/build.json",
} as const;

function mirror(packageName: string) {
  return {
    path: packageName === "solar-sim-viz" ? "E:/root/web" : "E:/next-web",
    packageName,
    packageType: "module",
    packageScripts: {},
    entrypoints: [],
    sourceFiles: [],
    publicFiles: [],
    hasGitDirectory: false,
    readable: true,
    errors: [],
  } as const;
}

describe("mainline A R66 release alignment", () => {
  it("keeps root and next-web package identity differences explicit", () => {
    const comparison = compareMainlineAReleaseInputsV626({
      root: mirror("solar-sim-viz"),
      nextWeb: {
        ...mirror("solar-next-web"),
        branch: build.branch,
        head: build.head,
        build,
        runtimeFiles: [],
        manifests: [],
      },
    });
    expect(comparison.packageIdentityMatch).toBe(false);
    expect(comparison.status).toBe("pending");
    expect(comparison.issues.some((issue) => issue.code === "package-identity")).toBe(true);
  });

  it("normalizes the protected manifest writeback flag to false", () => {
    const manifest = createMainlineAReleaseManifestSnapshotV626({
      canonicalStars: 12,
      canonicalNebulae: 12,
      canonicalConstellations: 12,
      betaHeroStars: 24,
      betaNebulaSources: 24,
      candidateOnly: true,
      hold: true,
      notAdmitted: true,
      scientificPayloadWriteback: false,
    });
    expect(manifest.scientificPayloadWriteback).toBe(false);
    expect(manifest.schemas).toEqual([]);
  });

  it("blocks source and rights closure while retaining captured counts", () => {
    const source = createMainlineASourceClosureV626({
      stellarRawResponses: 4,
      stellarStructuredCandidates: 4,
      stellarComponentConfirmed: 0,
      nebulaCaptured: 6,
      nebulaRightsPending: 6,
      externalSourceEvidence: true,
      sourceReferencesPresent: true,
      blockers: ["stellar-component-identity-pending", "nebula-rights-review-pending"],
      status: "blocked",
    });
    const rights = createMainlineARightsClosureV626({
      canonicalRightsPending: 12,
      nebulaRightsPending: 6,
      signedItems: 24,
      rightsEvidencePresent: true,
      declaredLicensesPresent: true,
      blockers: ["canonical-rights-signoff-pending"],
      status: "blocked",
    });
    expect(source.stellarRawResponses).toBe(4);
    expect(source.nebulaCaptured).toBe(6);
    expect(source.status).toBe("blocked");
    expect(rights.status).toBe("blocked");
  });

  it("separates browser evidence from performance qualification", () => {
    const runtime = createMainlineARuntimeClosureV626({
      canonicalCoveragePresent: true,
      runtimeCleared: 0,
      desktopBrowser: "passed",
      mobileViewport: "passed",
      physicalMobile: "blocked",
      longRun: "blocked",
      lifecycleEvidence: "passed",
      status: "blocked",
      blockers: ["physical-mobile-not-run", "long-run-not-run"],
    });
    expect(runtime.desktopBrowser).toBe("passed");
    expect(runtime.status).toBe("blocked");
    expect(runtime.blockers).toContain("long-run-not-run");
  });

  it("creates a blocked package without crossing its boundary", () => {
    const comparison = compareMainlineAReleaseInputsV626({
      root: mirror("solar-sim-viz"),
      nextWeb: { ...mirror("solar-next-web"), build, branch: build.branch, head: build.head, runtimeFiles: [], manifests: [] },
      manifestIdentityMatch: false,
    });
    const source = createMainlineASourceClosureV626({ blockers: ["pending"], status: "blocked" });
    const rights = createMainlineARightsClosureV626({ blockers: ["pending"], status: "blocked" });
    const runtime = createMainlineARuntimeClosureV626({ blockers: ["long-run"], status: "blocked" });
    const gates = createMainlineAReleaseGatesV626({ comparison, source, rights, runtime, staticChecks: "passed", httpChecks: "passed", visualChecks: "passed" });
    const packageValue = createMainlineAReleasePackageV626({
      packageId: "mainline-a-r66-test",
      generatedAt: "2026-09-20T00:00:00.000Z",
      workspace: "E:/next-web",
      rootMirror: "E:/root/web",
      branch: build.branch,
      head: build.head,
      build,
      manifest: { canonicalStars: 12, canonicalNebulae: 12, canonicalConstellations: 12, betaHeroStars: 24, betaNebulaSources: 24, runtimeCleared: 0, signoffPending: 12, rightsPending: 12, candidateOnly: true, hold: true, notAdmitted: true, scientificPayloadWriteback: false, schemas: [] },
      comparison,
      sourceClosure: source,
      rightsClosure: rights,
      runtimeClosure: runtime,
      gates,
      evidenceIndex: { static: [], http: [], visual: [], browser: [], performance: [], "external-source": [], "release-package": [] },
    });
    assertMainlineAReleaseBoundaryV626(packageValue);
    expect(packageValue.status).toBe("blocked");
    expect(releaseGateSummaryV626(packageValue.gates).requiredOpen).toBeGreaterThan(0);
    expect(digestMainlineAReleaseValueV626(packageValue)).toMatch(/^[0-9a-f]{8}$/);
  });
});
