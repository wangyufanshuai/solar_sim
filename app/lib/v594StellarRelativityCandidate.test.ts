import { readFileSync } from "node:fs";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  buildV594StellarRelativityCandidate,
  canonicalShaV594,
} from "../../scripts/build-v594-stellar-relativity-candidate.mjs";
import { V594_CLOSURE_SOURCE_PATHS } from "../../scripts/v594-source-paths.mjs";

const root = process.cwd();
const paths = {
  source: "docs/release/v594/source-manifest-v594.json",
  manifest: "public/data/stellar-relativity-v594/manifest.json",
  currentState: "public/data/stellar-relativity-v594/current-state.json",
  pointer: "docs/release/v594/capability-pointer-v594.json",
};
const read = (base: string, path: string) => JSON.parse(readFileSync(resolve(base, path), "utf8"));
const bytes = (base: string, path: string) => readFileSync(resolve(base, path));
const verifySeal = (document: Record<string, unknown>, field: string) => {
  const unsigned = { ...document };
  delete unsigned[field];
  expect(document[field]).toBe(canonicalShaV594(unsigned));
};

describe("v594 additive stellar/relativity identity", () => {
  it("rebuilds byte-identical formal-evidence-ready source identities with fail-closed authority", async () => {
    const tempParent = resolve(root, "tmp");
    await mkdir(tempParent, { recursive: true });
    const outputRoot = await mkdtemp(resolve(tempParent, "v594-candidate-test-"));
    try {
      const first = await buildV594StellarRelativityCandidate({ root, outputRoot });
      const firstBytes = Object.fromEntries(
        Object.entries(paths).map(([key, path]) => [key, bytes(outputRoot, path)]),
      );
      const second = await buildV594StellarRelativityCandidate({ root, outputRoot });
      for (const [key, path] of Object.entries(paths)) {
        expect(bytes(outputRoot, path).equals(firstBytes[key])).toBe(true);
      }
      expect(second).toEqual(first);

      const source = read(outputRoot, paths.source);
      const manifest = read(outputRoot, paths.manifest);
      const state = read(outputRoot, paths.currentState);
      const pointer = read(outputRoot, paths.pointer);
    verifySeal(source, "receiptSha256");
    verifySeal(manifest, "manifestSha256");
    verifySeal(state, "receiptSha256");
    verifySeal(pointer, "pointerSha256");

    expect(source.identityStage).toBe("ready-for-formal-evidence-source-identity");
    expect(source.status).toBe("complete-current-implementation-and-closure-tools");
    expect(source.formalProductPointer).toBe("v263");
    expect(source.parentV593).toEqual(expect.objectContaining({
      sourceManifestSha256: "b551589b4356192dffa331794137f1111402941810f65f586e5d72f34e2d96e5",
      manifestSha256: "31c708473846a62951f6aaa4d6cba8c6c6d895ee70035b038baef203a4c67a8d",
      formalProductPointer: "v263",
    }));
    expect(source.closureSourcePaths.map((entry: { path: string }) => entry.path)).toEqual(
      V594_CLOSURE_SOURCE_PATHS,
    );
    expect(source.closureSourcePaths.every((entry: { state: string }) => entry.state === "present")).toBe(true);
    expect(source.pendingClosurePaths).toEqual([]);
    expect(manifest.identityStage).toBe("ready-for-formal-evidence-candidate-identity");
    expect(manifest.status).toBe("ready-for-v594-formal-evidence-not-promoted");
    expect(manifest.governance).toEqual(expect.objectContaining({
      additiveOnly: true,
      parentV593Immutable: true,
      sourceManifestSha256: source.receiptSha256,
    }));
    expect(manifest.stellar.admission).toEqual(expect.objectContaining({
      rosterCount: 24,
      presentationAdmittedCount: 24,
      identityBoundCount: 20,
      renderAnchorOnlyCount: 4,
      provenanceAdmittedCount: 0,
    }));
    expect(manifest.relativity).toEqual(expect.objectContaining({
      trajectoryStatus: "qualified-shadow-only-three-kernel-full-trajectory-reference",
      promotionDecision: false,
    }));
    expect(manifest.relativity.kerr).toEqual(expect.objectContaining({
      canonicalSerialization: "orbit-canonical-json-v2-bound-references-number-e16",
      artifactSha256: "1f35420354d597f7756377df040216f6483530fba4fd7ebd67bbab446456c33e",
      oracleRayCount: 64,
      oracleQualified: true,
    }));
    for (const field of [
      "scientificAuthorityGranted",
      "scientificPayloadMutationAllowed",
      "measuredAuthorityGranted",
      "gpuAuthorityGranted",
      "radiativeTransferGranted",
      "grmhdGranted",
      "geometryReferenceGranted",
      "polarizationTransportReferenceGranted",
      "productionReleaseAuthorized",
      "productionPromotionAllowed",
    ]) expect(manifest.authority[field]).toBe(false);

    expect(pointer.deploymentId).toMatch(/^v594-[0-9a-f]{12}-[0-9a-f]{12}$/);
    expect(pointer.sourceManifestSha256).toBe(source.receiptSha256);
    expect(pointer.manifestSha256).toBe(manifest.manifestSha256);
    expect(pointer.currentStateReceiptSha256).toBe(state.receiptSha256);
    expect(pointer.productionPromotionAllowed).toBe(false);
    expect(manifest.closure.formalEvidenceBound).toBe(false);
    expect(manifest.closure.toolingComplete).toBe(true);
    expect(state.identityStage).toBe("ready-for-formal-evidence-current-state-identity");
    expect(state.gates.formalClosureEvidenceBound).toBe(false);
      expect(pointer.identityStage).toBe("ready-for-formal-evidence-capability-pointer-identity");
    } finally {
      await rm(outputRoot, { recursive: true, force: true });
    }
  });
});
