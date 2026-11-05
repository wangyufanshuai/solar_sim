import { describe, expect, it } from "vitest";
import {
  BROWSER_EVIDENCE_RECOVERY_SCHEMA_V640,
  collectBrowserEvidenceRecoveryCandidatesV640,
  createBrowserEvidenceRecoveryReportV640,
  encodeBrowserEvidenceRecoveryReportV640,
  inspectBrowserEvidenceRecoveryCandidateV640,
  planBrowserEvidenceRecoveryV640,
  recoverBrowserEvidenceSessionV640,
  recoveryPlanBoundaryV640,
  recoverySummaryV640,
  verifyBrowserEvidenceRecoveryReportV640,
} from "./mainlineABrowserEvidenceRecoveryV640";
import {
  buildBrowserEvidenceRecoveryIndexV640,
  diagnoseBrowserEvidenceRecoveryV640,
  diffBrowserEvidenceSessionsV640,
  encodeBrowserEvidenceRecoveryIndexV640,
  recoveryCandidateTableV640,
  recoveryConflictKeysV640,
  recoveryDiffSummaryV640,
  recoveryIndexCsvV640,
  recoveryIndexDigestV640,
  recoveryPlanCandidateStatusCountsV640,
  recoveryPlanHasOnlyExpectedBuildV640,
  recoveryReportClaimsV640,
  recoveryReportStableFingerprintV640,
  recoverySessionRawDigestsV640,
  recoveryIndexRowsForStatusV640,
  recoveryReportTargetCoverageV640,
  verifyBrowserEvidenceRecoveryIndexV640,
} from "./mainlineABrowserEvidenceRecoveryDiagnosticsV640";
import {
  createBrowserEvidenceSessionV639,
  encodeBrowserEvidenceSessionV639,
  type BrowserEvidenceBuildV639,
} from "./mainlineABrowserEvidenceSessionV639";

const build: BrowserEvidenceBuildV639 = {
  buildId: "mainline-a-ac4d35393e9637c0",
  branch: "codex/solar-sim-mainline-a",
  head: "1".repeat(40),
};
const viewport = { width: 1280, height: 720, devicePixelRatio: 1, device: "desktop" as const };
const at = "2026-09-28T14:00:00.000Z";

function session(sessionId = "r65-session-abcdef12") {
  return createBrowserEvidenceSessionV639({ sessionId, build, viewport, at });
}

function input(source: string, value: ReturnType<typeof session> | null = session()): { source: string; raw: string | null } {
  return { source, raw: value === null ? null : encodeBrowserEvidenceSessionV639(value) };
}

describe("Mainline A browser evidence recovery v640", () => {
  it("inspects a build-matched session as valid and preserves raw bytes", () => {
    const candidate = inspectBrowserEvidenceRecoveryCandidateV640(input("tab-a.json"), build);
    expect(candidate.status).toBe("valid");
    expect(candidate.bytes).toBe(new TextEncoder().encode(input("tab-a.json").raw!).byteLength);
    expect(candidate.sha256).toMatch(/^[a-f0-9]{64}$/u);
    expect(candidate.session?.sessionId).toBe("r65-session-abcdef12");
  });

  it("classifies missing, empty, malformed, oversized and wrong-build inputs", () => {
    expect(inspectBrowserEvidenceRecoveryCandidateV640(input("missing.json", null), build).status).toBe("missing");
    expect(inspectBrowserEvidenceRecoveryCandidateV640({ source: "empty.json", raw: "" }, build).status).toBe("empty");
    expect(inspectBrowserEvidenceRecoveryCandidateV640({ source: "bad.json", raw: "{}" }, build).status).toBe("invalid");
    const oversized = "x".repeat(16 * 1024 * 1024 + 1);
    expect(inspectBrowserEvidenceRecoveryCandidateV640({ source: "large.json", raw: oversized }, build).status).toBe("oversize");
    const otherBuild = { ...build, head: "2".repeat(40) };
    const wrong = createBrowserEvidenceSessionV639({ build: otherBuild, viewport, at });
    expect(inspectBrowserEvidenceRecoveryCandidateV640(input("other.json", wrong), build).status).toBe("wrong-build");
  });

  it("rejects duplicate source names and limits candidate collection", () => {
    const candidates = collectBrowserEvidenceRecoveryCandidatesV640([input("a.json"), input("b.json")], build);
    expect(candidates.map((candidate) => candidate.status)).toEqual(["valid", "valid"]);
    expect(collectBrowserEvidenceRecoveryCandidatesV640([input("same.json"), input("same.json")], build)[1].status).toBe("conflict");
    expect(() => collectBrowserEvidenceRecoveryCandidatesV640(Array.from({ length: 33 }, (_, index) => input(`${index}.json`)), build)).toThrow("recovery:candidate-limit");
  });

  it("plans restore, merge and blocked actions without promoting evidence", () => {
    const restore = planBrowserEvidenceRecoveryV640([input("tab-a.json")], build, at);
    expect(restore.action).toBe("restore");
    expect(restore.recommendedSource).toBe("tab-a.json");
    const merge = planBrowserEvidenceRecoveryV640([input("tab-a.json"), input("tab-a-copy.json")], build, at);
    expect(merge.action).toBe("merge");
    expect(merge.usable).toHaveLength(2);
    const blocked = planBrowserEvidenceRecoveryV640([input("other.json", createBrowserEvidenceSessionV639({ build: { ...build, head: "2".repeat(40) }, viewport, at }))], build, at);
    expect(blocked.action).toBe("blocked");
    expect(blocked.boundary).toEqual(recoveryPlanBoundaryV640());
    expect(blocked.boundary.scientificPayloadWriteback).toBe(false);
  });

  it("recovers a compatible session and preserves the canonical boundary", () => {
    const plan = planBrowserEvidenceRecoveryV640([input("tab-a.json")], build, at);
    const recovered = recoverBrowserEvidenceSessionV640(plan);
    expect(recovered.conflicts).toHaveLength(0);
    expect(recovered.session?.sessionId).toBe("r65-session-abcdef12");
    expect(recovered.session?.boundary).toMatchObject({ candidateOnly: true, hold: true, notAdmitted: true, scientificPayloadWriteback: false });
    const report = createBrowserEvidenceRecoveryReportV640(plan, recovered, at);
    expect(report.schema).toBe(BROWSER_EVIDENCE_RECOVERY_SCHEMA_V640);
    expect(report.merged.status).toBe("created");
    expect(verifyBrowserEvidenceRecoveryReportV640(report)).toEqual({ valid: true, issues: [] });
    expect(recoverySummaryV640(report)).toContain("restore");
    expect(JSON.parse(encodeBrowserEvidenceRecoveryReportV640(report)).boundary.rightsApproval).toBe(false);
  });

  it("detects session, manifest, record and event differences", () => {
    const first = session();
    const second = { ...first, updatedAt: "2026-09-28T14:00:01.000Z", events: [...first.events, { at: "2026-09-28T14:00:01.000Z", type: "panel-opened" as const, runId: null, targetKey: null, detail: null }] };
    const diff = diffBrowserEvidenceSessionsV640(first, second);
    expect(diff.equal).toBe(false);
    expect(diff.events.added).toHaveLength(1);
    expect(recoveryDiffSummaryV640(diff)).toContain("different · records 0/0");
    expect(recoveryDiffSummaryV640(diff)).toContain("events 1/2");
    const buildDiff = diffBrowserEvidenceSessionsV640(first, { ...first, build: { ...build, head: "2".repeat(40) } });
    expect(buildDiff.issues).toContain("diagnostics:build");
  });

  it("builds and verifies a bounded offline recovery index", () => {
    const plan = planBrowserEvidenceRecoveryV640([input("tab-a.json"), input("missing.json", null)], build, at);
    const index = buildBrowserEvidenceRecoveryIndexV640(plan, at);
    expect(verifyBrowserEvidenceRecoveryIndexV640(index)).toEqual({ valid: true, issues: [] });
    expect(encodeBrowserEvidenceRecoveryIndexV640(index)).toContain("offline-recovery-index");
    expect(recoveryIndexCsvV640(index)).toContain("source,status,bytes");
    expect(recoveryIndexDigestV640(index)).toMatch(/^[a-f0-9]{64}$/u);
    expect(recoveryPlanCandidateStatusCountsV640(plan)).toEqual({ missing: 1, valid: 1 });
    expect(recoveryPlanHasOnlyExpectedBuildV640(plan)).toBe(true);
    expect(recoveryCandidateTableV640(plan.candidates)).toHaveLength(2);
    expect(recoveryIndexRowsForStatusV640(index, "valid")).toHaveLength(1);
    expect(recoveryConflictKeysV640(plan.conflicts)).toEqual([]);
  });

  it("fails closed on malformed or forged offline index rows", () => {
    const plan = planBrowserEvidenceRecoveryV640([input("tab-a.json"), input("missing.json", null)], build, at);
    const index = buildBrowserEvidenceRecoveryIndexV640(plan, at);
    expect(verifyBrowserEvidenceRecoveryIndexV640(null).issues).toContain("index:boundary");
    const forged = structuredClone(index) as Record<string, unknown>;
    forged.boundary = { ...index.boundary, scientificPayloadWriteback: true };
    forged.rows = [index.rows[0], { ...index.rows[1], source: index.rows[0].source }];
    const result = verifyBrowserEvidenceRecoveryIndexV640(forged);
    expect(result.valid).toBe(false);
    expect(result.issues).toContain("index:boundary");
    expect(result.issues).toContain("index:source:1");
  });

  it("diagnoses incomplete local coverage without claiming performance or rights", () => {
    const plan = planBrowserEvidenceRecoveryV640([input("tab-a.json")], build, at);
    const report = createBrowserEvidenceRecoveryReportV640(plan, recoverBrowserEvidenceSessionV640(plan), at);
    const diagnostics = diagnoseBrowserEvidenceRecoveryV640(plan, report);
    expect(diagnostics.status).toBe("pass");
    expect(diagnostics.mergeable).toBe(true);
    expect(recoveryReportTargetCoverageV640(report)).toMatchObject({ observed: 0, expected: 36, missing: 36, blockedLatest: 0 });
    expect(recoveryReportStableFingerprintV640(report)).toMatch(/^[a-f0-9]{64}$/u);
    expect(recoverySessionRawDigestsV640(report.merged.session)).toEqual([]);
    expect(recoveryReportClaimsV640(report)).toEqual({ browserAuthenticity: false, productionPerformance: false, scientificValidity: false, rightsApproval: false, payloadWriteback: false });
  });

  it("fails verification when a report boundary is tampered", () => {
    const plan = planBrowserEvidenceRecoveryV640([input("tab-a.json")], build, at);
    const report = createBrowserEvidenceRecoveryReportV640(plan, recoverBrowserEvidenceSessionV640(plan), at);
    const tampered = structuredClone(report) as Record<string, unknown>;
    tampered.boundary = { candidateOnly: true, hold: false, notAdmitted: true, scientificPayloadWriteback: false, rightsApproval: false, sourceAuthenticityProven: false };
    expect(verifyBrowserEvidenceRecoveryReportV640(tampered).valid).toBe(false);
  });
});
