import { describe, expect, it } from "vitest";
import {
  FREEZE_TARGET_COUNTS_V622,
  freezeGateIssueCountsV622,
  freezeGateStatusLabelV622,
  freezeReportDeterministicEqualV622,
  freezeReportJsonV622,
  freezePreflightReadyForVisualSignoffV622,
  freezeGateSnapshotV622,
  lifecycleLeakCountV622,
  lifecycleReleasedV622,
  normalizeFreezeIdV622,
  rosterCountValidV622,
  rosterDuplicateIdsV622,
  rosterMissingSlotsV622,
  runFreezePreflightV622,
  type FreezePreflightInputV622,
} from "./mainlineAFreezePreflightV622";

const ids = (prefix: string) => Array.from({ length: 12 }, (_, index) => `${prefix}-${index + 1}`);
function validInput(overrides: Partial<FreezePreflightInputV622> = {}): FreezePreflightInputV622 {
  const rosters = ["nebula", "constellation", "stellar"].map((kind) => ({ kind, ids: ids(kind) })) as FreezePreflightInputV622["rosters"];
  const routes = rosters.flatMap((roster) => roster.ids.map((id) => ({ id: `route-${id}`, kind: roster.kind, targetId: id, href: `/atlas/${roster.kind}/${id}` })));
  const lifecycle = rosters.flatMap((roster) => roster.ids.map((id) => ({ id, allocated: 1, released: 1, activeResources: 0, canvasCount: 0 })));
  return { rosters, routes, lifecycle, candidateOnly: true, scientificPayloadWriteback: false, ...overrides };
}

describe("Mainline A freeze preflight V622", () => {
  it("requires exactly twelve unique entries in each roster", () => {
    expect(FREEZE_TARGET_COUNTS_V622).toEqual({ nebula: 12, constellation: 12, stellar: 12 });
    expect(rosterCountValidV622({ kind: "nebula", ids: ids("nebula") })).toBe(true);
    expect(rosterDuplicateIdsV622({ kind: "nebula", ids: ["M42", "m42", ...ids("x").slice(2)] })).toEqual(["m42"]);
    expect(rosterMissingSlotsV622({ kind: "stellar", ids: ["Sirius"] })).toBe(11);
    expect(normalizeFreezeIdV622("  NGC 2024 ")).toBe("ngc-2024");
  });

  it("validates a complete fixture contract without claiming a runtime observation", () => {
    const first = runFreezePreflightV622(validInput());
    const second = runFreezePreflightV622(validInput());
    expect(first.contractValid).toBe(true);
    expect(first.passed).toBe(false);
    expect(first.runtimeObserved).toBe(false);
    expect(first.evidenceClass).toBe("static");
    expect(first.coverage).toEqual({ nebula: 100, constellation: 100, stellar: 100 });
    expect(first.issues.map((issue) => issue.code)).toEqual(["runtime-observation-missing"]);
    expect(first.fingerprint).toBe(second.fingerprint);
    expect(freezeReportDeterministicEqualV622(first, second)).toBe(true);
    expect(freezeGateStatusLabelV622(first)).toContain("blocked");
    expect(freezePreflightReadyForVisualSignoffV622(first)).toBe(false);
    expect(freezeGateSnapshotV622(first)).toMatchObject({ passed: false, contractValid: true, evidenceClass: "static", runtimeObserved: false, hold: true });
    expect(freezeReportJsonV622(first)).toContain("mainline-a-freeze-preflight-v622");
  });

  it("detects missing and duplicate roster slots", () => {
    const input = validInput({ rosters: [{ kind: "nebula", ids: ["m42", "m42"] }, { kind: "constellation", ids: ids("constellation") }, { kind: "stellar", ids: ids("stellar") }] });
    const report = runFreezePreflightV622(input);
    expect(report.passed).toBe(false);
    expect(freezeGateIssueCountsV622(report)["roster-duplicate"]).toBe(1);
    expect(freezeGateIssueCountsV622(report)["roster-count"]).toBe(1);
    expect(freezeGateIssueCountsV622(report)["roster-missing"]).toBe(1);
  });

  it("detects route target omissions, kind confusion, and path traversal", () => {
    const input = validInput({ routes: [{ id: "bad", kind: "nebula", targetId: "ghost", href: "/atlas/stellar/ghost/../x" }] });
    const report = runFreezePreflightV622(input);
    expect(report.issues.map((issue) => issue.code)).toEqual(expect.arrayContaining(["route-target-missing", "route-href-outside"]));
  });

  it("detects lifecycle leaks, negative counters and excess canvases", () => {
    const input = validInput({ lifecycle: [{ id: "m42", allocated: 2, released: 1, activeResources: 1, canvasCount: 2 }, { id: "bad", allocated: -1, released: 0, activeResources: 0, canvasCount: 0 }] });
    const report = runFreezePreflightV622(input);
    expect(lifecycleReleasedV622(input.lifecycle[0])).toBe(false);
    expect(lifecycleLeakCountV622(input.lifecycle)).toBe(2);
    expect(report.issues.map((issue) => issue.code)).toEqual(expect.arrayContaining(["lifecycle-leak", "lifecycle-negative", "canvas-count"]));
  });

  it("keeps candidate boundary closed", () => {
    const report = runFreezePreflightV622(validInput({ candidateOnly: false }));
    expect(report.passed).toBe(false);
    expect(report.issues.map((issue) => issue.code)).toContain("boundary-open");
    expect(report.boundary.scientificPayloadWriteback).toBe(false);
  });

  it("blocks complete rosters with no route or lifecycle records", () => {
    const report = runFreezePreflightV622(validInput({ routes: [], lifecycle: [] }));
    expect(report.passed).toBe(false);
    expect(report.contractValid).toBe(false);
    expect(report.coverage).toEqual({ nebula: 100, constellation: 100, stellar: 100 });
    expect(report.issues.filter((issue) => issue.code === "route-evidence-missing")).toHaveLength(36);
    expect(report.issues.filter((issue) => issue.code === "lifecycle-evidence-missing")).toHaveLength(36);
    const counts = freezeGateIssueCountsV622(report);
    expect(counts["route-evidence-missing"]).toBe(36);
    expect(counts["lifecycle-evidence-missing"]).toBe(36);
    expect(counts["runtime-observation-missing"]).toBe(1);
    expect(counts["route-duplicate"]).toBe(0);
    expect(counts["lifecycle-duplicate"]).toBe(0);
    expect(Object.values(counts).every(Number.isInteger)).toBe(true);
  });

  it("identifies the exact omitted route and lifecycle object", () => {
    const input = validInput();
    const report = runFreezePreflightV622({ ...input, routes: input.routes.slice(1), lifecycle: input.lifecycle.slice(1) });
    expect(report.issues).toContainEqual({ code: "route-evidence-missing", kind: "nebula", id: "nebula-1" });
    expect(report.issues).toContainEqual({ code: "lifecycle-evidence-missing", id: "nebula-1" });
    expect(report.contractValid).toBe(false);
  });

  it("rejects repeated targets even when route ids differ", () => {
    const input = validInput();
    const report = runFreezePreflightV622({ ...input, routes: [...input.routes, { ...input.routes[0], id: "duplicate-route" }] });
    expect(report.issues).toContainEqual({ code: "route-duplicate", kind: "nebula", id: "duplicate-route", detail: "nebula|nebula-1" });
    expect(report.contractValid).toBe(false);
  });

  it("rejects reused route ids for different roster targets", () => {
    const input = validInput();
    const routes = input.routes.map((route, index) => index === 1 ? { ...route, id: input.routes[0].id } : route);
    const report = runFreezePreflightV622({ ...input, routes });
    expect(report.issues.some((issue) => issue.code === "route-duplicate")).toBe(true);
    expect(report.contractValid).toBe(false);
  });

  it("rejects duplicate lifecycle records instead of using their count as coverage", () => {
    const input = validInput();
    const lifecycle = [{ ...input.lifecycle[1], id: "  NEBULA_2  " }, ...input.lifecycle.slice(1)];
    const report = runFreezePreflightV622({ ...input, lifecycle });
    expect(report.issues).toContainEqual({ code: "lifecycle-duplicate", id: "nebula-2" });
    expect(report.issues).toContainEqual({ code: "lifecycle-evidence-missing", id: "nebula-1" });
    expect(report.contractValid).toBe(false);
  });

  it("rejects unrelated lifecycle ids even with all-zero counters", () => {
    const input = validInput();
    const report = runFreezePreflightV622({ ...input, lifecycle: [...input.lifecycle, { id: "ghost", allocated: 0, released: 0, activeResources: 0, canvasCount: 0 }] });
    expect(report.issues).toContainEqual({ code: "lifecycle-target-missing", id: "ghost" });
    expect(report.contractValid).toBe(false);
  });

  it("rejects a second roster for the same kind rather than hiding it in a Map", () => {
    const input = validInput();
    const report = runFreezePreflightV622({ ...input, rosters: [...input.rosters, input.rosters[0]] });
    expect(report.issues).toContainEqual({ code: "roster-kind-duplicate", kind: "nebula" });
    expect(report.contractValid).toBe(false);
  });
});
