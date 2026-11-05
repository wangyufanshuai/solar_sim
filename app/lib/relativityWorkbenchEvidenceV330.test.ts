import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { loadAtlasRelativityEvidenceSnapshotV330 } from "./relativityEvidenceServerV330";
import { createRelativityWorkbenchEvidenceModelV330, parseRelativityEvidenceResponseV330 } from "./relativityWorkbenchEvidenceV330";

function fileSha(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

describe("v330 versioned workbench evidence adapter", () => {
  it("surfaces v325-v329 as separate bounded rows while preserving frozen sources", async () => {
    const snapshot = await loadAtlasRelativityEvidenceSnapshotV330();
    const model = createRelativityWorkbenchEvidenceModelV330(snapshot);
    expect(snapshot.status).toBe("ready");
    expect(snapshot.current.v325).toMatchObject({ status: "componentwise-uncertainty-qualified-browser-pending", applicableDiskRayCount: 4, bandMeasurementCount: 12, combinationPolicy: "linear-sum-without-independence-claim-no-rss" });
    expect(snapshot.current.v326).toMatchObject({ status: "sanitized-provenance-qualified-browser-pending", jsonExport: true, csvExport: true, bandMeasurementCount: 12, noRawRayBuffer: true, noHostPathPid: true });
    expect(snapshot.current.v327).toMatchObject({ status: "science-cinematic-ab-qualified-browser-pending", swatchCount: 4, profileTokenSources: ["v5", "v6"], scienceValuesUnchanged: true, buffersDisjoint: true, cinematicOutputsDistinct: true });
    expect(snapshot.current.v328).toMatchObject({ status: "photon-observables-qualified-browser-pending", applicableDiskRayCount: 4, bandMeasurementCount: 12, photonRadianceUnit: "photons s^-1 m^-2 sr^-1", detectorIndependent: true });
    expect(snapshot.current.v329).toMatchObject({ status: "single-flight-lifecycle-qualified-browser-pending", consumerCountFixture: 3, acquisitionCountFixture: 1, derivationCountFixture: 1, derivedModelCount: 4, directConsumerFetches: 0, idempotentRelease: true, resourceBaselineReturnTested: true });
    expect(model.currentRows.filter((row) => ["v325", "v326", "v327", "v328", "v329"].includes(row.id))).toHaveLength(5);
    expect(model.currentRows.find((row) => row.id === "v325")?.metric).toContain("no RSS");
    expect(model.currentRows.find((row) => row.id === "v329")?.metric).toContain("3 consumers → 1 acquisition → 1 derivation");
    expect(model.campaignProgress).toMatchObject({ completed: 0, planned: 49, nextShardIndex: 0 });
    expect(parseRelativityEvidenceResponseV330({ version: "v330-relativity-evidence-response", available: true, reason: "ready", snapshot }).snapshot?.current.v328.bandMeasurementCount).toBe(12);
    expect(fileSha("app/lib/relativityWorkbenchEvidenceV285.ts")).toBe("93efae6feead47e33513d0391e72dd87d51ce491f7143201cb418e96f3cd6a80");
    expect(fileSha("app/lib/relativityWorkbenchEvidenceV285.test.ts")).toBe("aeb02858f2adfc1261cef8352d8ea4003d77f55174d286931e77a3c68f74ca41");
    expect(fileSha("app/lib/relativityEvidenceServerV285R1.ts")).toBe("96ee9b7f252d4033a75b78086a62a22da549f40945ebca0dd2df7854aa4e0197");
    expect(fileSha("app/lib/relativityEvidenceServerV285R1.test.ts")).toBe("ae18f82c14c1d7847ab4b029b41a05cae2f59b7944fa67afdfcfb23919f71bb4");
  });
});
