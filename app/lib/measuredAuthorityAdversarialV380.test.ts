import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  MEASURED_AUTHORITY_ADVERSARIAL_CASE_IDS_V380,
  executeMeasuredAuthorityAdversarialCampaignV380,
  parseMeasuredAuthorityAdversarialCampaignV380,
} from "./measuredAuthorityAdversarialV380";

const canonicalize = (value: unknown): unknown => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.entries(value as Record<string, unknown>).filter(([key]) => !["generatedAt", "artifactSha256", "pointerSha256"].includes(key)).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]));

describe("v380 measured authority adversarial campaign", () => {
  it("replays all twelve attacks deterministically without authority promotion", () => {
    const photon = JSON.parse(readFileSync("dist/science/kerr-science-photon-bands-v328/photon-radiance.json", "utf8"));
    const first = executeMeasuredAuthorityAdversarialCampaignV380(photon.view);
    const second = executeMeasuredAuthorityAdversarialCampaignV380(photon.view);
    expect(first).toEqual(second);
    expect(first.map((entry) => entry.id)).toEqual(MEASURED_AUTHORITY_ADVERSARIAL_CASE_IDS_V380);
    expect(first.filter((entry) => entry.actualDisposition === "rejected")).toHaveLength(10);
    expect(first.filter((entry) => entry.actualDisposition === "unavailable")).toHaveLength(2);
    expect(first.every((entry) => entry.passed && !entry.authorityGranted && !entry.promotionApplied && !entry.observedCountsAvailable && !entry.syntheticFallbackUsed)).toBe(true);
  });

  it("publishes the content-addressed fixture-only campaign", () => {
    const artifact = parseMeasuredAuthorityAdversarialCampaignV380(JSON.parse(readFileSync(resolve(process.cwd(), "dist/science/measured-authority-adversarial-v380/campaign.json"), "utf8")));
    expect(artifact).toMatchObject({ caseCount: 12, passedCaseCount: 12, rejectedCaseCount: 10, unavailableCaseCount: 2, deterministicReplay: true, fixtureOnly: true, publishableAsMeasuredAuthority: false, attemptConsumed: false, networkAttempted: false, denseCampaignStatus: "incomplete-0-of-49", browserQualification: "not-run" });
    expect(createHash("sha256").update(JSON.stringify(canonicalize(artifact))).digest("hex")).toBe(artifact.artifactSha256);
  });
});
