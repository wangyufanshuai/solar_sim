import { describe, expect, it } from "vitest";
import canonical from "../data/mainlineACanonicalCoverageV622.generated.json";
import sky from "../data/mainlineAWebSkyAtlasV656.generated.json";
import nebula from "../data/mainlineANebulaR73CatalogV660.generated.json";
import alternatives from "../data/mainlineANebulaR74AlternativesV661.generated.json";
import { assembleMainlineAWebAcceptanceV662 } from
  "./mainlineAWebAcceptanceV662";
import { assembleVisualReviewIndexV666 } from
  "./mainlineAR79VisualReviewV666";
import { createVisualSessionV667, recordVisualCycleV667,
  visualSessionProgressV667, type VisualCycleV667 } from
  "./mainlineAR80VisualSessionV667";

const matrix = assembleMainlineAWebAcceptanceV662(
  canonical, sky, nebula, alternatives);
const index = assembleVisualReviewIndexV666(matrix, nebula);

function cycleFor(key: string): VisualCycleV667 {
  const plan = index.plans.find((item) => item.key === key);
  if (!plan || !plan.route || !plan.expectedSha256) {
    throw new Error("missing-test-plan:" + key);
  }
  return { key, route: plan.route,
    sha256: plan.expectedSha256,
    bytes: plan.expectedBytes ?? 1024,
    width: plan.expectedWidth ?? 256,
    height: plan.expectedHeight ?? 128,
    acquiredAt: "2026-10-13T10:00:00.000Z",
    releasedAt: "2026-10-13T10:00:01.000Z" };
}

describe("R80 local visual session", () => {
  it("starts with exactly 31 requestable images and nine independent holds", () => {
    const session = createVisualSessionV667(index);
    const progress = visualSessionProgressV667(session, index);
    expect(session.status).toBe("ready");
    expect(Object.keys(session.entries)).toHaveLength(31);
    expect(progress).toMatchObject({ total: 31, inspected: 0,
      remaining: 31, sourceHolds: 5, identityHolds: 4,
      humanVisualSignoff: false, copyrightApproval: false });
    expect(progress.aImages.total).toBe(12);
    expect(progress.betaDerived.total).toBe(12);
    expect(progress.betaOfficialRaw.total).toBe(7);
    expect(progress.nextKey).toBe(index.plans.find((item) =>
      item.requestAllowed)?.key);
  });

  it("counts a verified and released image only once for coverage", () => {
    let session = createVisualSessionV667(index);
    const key = "a:nebula:m42";
    const first = recordVisualCycleV667(session, index, cycleFor(key));
    expect(first.accepted).toBe(true);
    session = first.state;
    expect(session.entries[key].completedCycles).toBe(1);
    expect(visualSessionProgressV667(session, index)).toMatchObject({
      inspected: 1, remaining: 30,
      aImages: { total: 12, inspected: 1 } });
    const second = recordVisualCycleV667(session, index, cycleFor(key));
    expect(second.accepted).toBe(true);
    expect(second.state.entries[key].completedCycles).toBe(2);
    expect(visualSessionProgressV667(second.state, index).inspected).toBe(1);
  });

  it("rejects held image and held stellar component cycles", () => {
    const session = createVisualSessionV667(index);
    for (const key of ["beta:nebula:ring-nebula",
      "beta:star:acrux"]) {
      const fake = { ...cycleFor("a:nebula:m42"), key };
      const result = recordVisualCycleV667(session, index, fake);
      expect(result).toMatchObject({ accepted: false,
        reason: "unknown-key", state: session });
    }
  });

  it("rejects forged route, digest, byte size and dimensions", () => {
    const session = createVisualSessionV667(index);
    const beta = cycleFor("beta:nebula:heart-nebula");
    expect(recordVisualCycleV667(session, index,
      { ...beta, route: "/api/forged" })).toMatchObject({
      accepted: false, reason: "route-or-digest" });
    expect(recordVisualCycleV667(session, index,
      { ...beta, sha256: "0".repeat(64) })).toMatchObject({
      accepted: false, reason: "route-or-digest" });
    expect(recordVisualCycleV667(session, index,
      { ...beta, bytes: beta.bytes + 1 })).toMatchObject({
      accepted: false, reason: "bytes-or-dimensions" });
    expect(recordVisualCycleV667(session, index,
      { ...beta, width: beta.width + 1 })).toMatchObject({
      accepted: false, reason: "bytes-or-dimensions" });
  });

  it("requires a plausible acquired-to-released clock order", () => {
    const session = createVisualSessionV667(index);
    const cycle = cycleFor("a:nebula:m42");
    expect(recordVisualCycleV667(session, index,
      { ...cycle, releasedAt: "2026-10-13T09:59:59.000Z" }))
      .toMatchObject({ accepted: false, reason: "clock-order" });
    expect(recordVisualCycleV667(session, index,
      { ...cycle, releasedAt: "yesterday" }))
      .toMatchObject({ accepted: false, reason: "clock-order" });
  });

  it("fails closed on catalog drift and invented human approval", () => {
    const session = createVisualSessionV667(index);
    const cycle = cycleFor("a:nebula:m42");
    expect(recordVisualCycleV667({ ...session,
      humanVisualSignoff: true as false }, index, cycle))
      .toMatchObject({ accepted: false, reason: "session-invalid" });
    expect(recordVisualCycleV667({ ...session,
      planSignature: "different" }, index, cycle))
      .toMatchObject({ accepted: false, reason: "catalog-drift" });
    const invalid = { ...index, status: "invalid-all-held" as const,
      issues: ["pin-drift"] };
    expect(createVisualSessionV667(invalid).status).toBe("held");
    expect(recordVisualCycleV667(session, invalid, cycle))
      .toMatchObject({ accepted: false, reason: "index-invalid" });
  });
});
