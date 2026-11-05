import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { loadMeasuredAuthorityAdversarialCampaignV380, resetMeasuredAuthorityAdversarialServerV380CacheForTests } from "./measuredAuthorityAdversarialServerV380";

afterEach(() => resetMeasuredAuthorityAdversarialServerV380CacheForTests());
describe("v380 measured authority adversarial server", () => {
  it("loads the bounded fixture-only campaign", async () => {
    expect(await loadMeasuredAuthorityAdversarialCampaignV380()).toMatchObject({ caseCount: 12, passedCaseCount: 12, rejectedCaseCount: 10, unavailableCaseCount: 2, deterministicReplay: true, publishableAsMeasuredAuthority: false });
  });
  it("rejects a forged promotion result", async () => {
    const root = await mkdtemp(join(tmpdir(), "atlas-v380-")); const path = join(root, "dist/science/measured-authority-adversarial-v380/campaign.json"); await mkdir(dirname(path), { recursive: true });
    const artifact = JSON.parse(await readFile("dist/science/measured-authority-adversarial-v380/campaign.json", "utf8")); artifact.cases[0].promotionApplied = true; await writeFile(path, JSON.stringify(artifact));
    await expect(loadMeasuredAuthorityAdversarialCampaignV380(root)).rejects.toThrow();
  });
});
