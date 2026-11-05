import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { loadAtlasRelativityEvidenceSnapshotV324 } from "./relativityEvidenceServerV324";
import { createRelativityWorkbenchEvidenceModelV324 } from "./relativityWorkbenchEvidenceV324";

function fileSha(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

describe("v324 versioned workbench evidence adapter", () => {
  it("adds the Science A/B row without mutating v285/v323 evidence sources", async () => {
    const snapshot = await loadAtlasRelativityEvidenceSnapshotV324();
    const model = createRelativityWorkbenchEvidenceModelV324(snapshot);
    expect(snapshot.current.v324).toMatchObject({
      status: "science-profile-equivalent-browser-pending",
      profileTokenSources: ["v5", "v6"],
      scienceTokenEquivalent: true,
      scienceTokenMismatchCount: 0,
      cinematicTokensDistinct: true,
      scienceDigestStable: true,
      browserQualificationRun: false,
    });
    expect(model.currentRows.find((row) => row.id === "v324")?.metric).toContain("science equivalent");
    expect(model.currentRows.find((row) => row.id === "v324")?.metric).toContain("cinematic distinct");
    expect(model.campaignProgress).toMatchObject({ completed: 0, planned: 49, nextShardIndex: 0 });
    expect(fileSha("app/lib/relativityWorkbenchEvidenceV285.ts")).toBe("93efae6feead47e33513d0391e72dd87d51ce491f7143201cb418e96f3cd6a80");
    expect(fileSha("app/lib/relativityEvidenceServerV285R1.ts")).toBe("96ee9b7f252d4033a75b78086a62a22da549f40945ebca0dd2df7854aa4e0197");
  });
});
