import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import panel, { DEFAULT_BATCH, nextAction, recordGates } from "./MainlineANebulaRightsClosurePanelV627";
import {
  rightsClosureBoundaryValidV627,
  summarizeNebulaRightsClosureV627,
} from "../lib/mainlineANebulaRightsClosureV627";

describe("R63-R64 V627 nebula rights closure panel", () => {
  it("is a client panel with contract and evidence hooks", () => {
    const source = readFileSync("app/components/MainlineANebulaRightsClosurePanelV627.tsx", "utf8");
    expect(source).toContain('data-mainline-a-nebula-rights-closure="v627"');
    expect(source).toContain("buildNebulaRightsClosureV627");
    expect(source).toContain("mainlineANebulaBatchV624.generated.json");
    expect(source).toContain("source/payload/rights/signoff/runtime/writeback gates");
    expect(source).toContain("candidate-only · hold · not-admitted");
    expect(source).toContain("scientificPayloadWriteback=false");
    expect(panel).toBeTypeOf("function");
  });

  it("adapts every V624 batch row and V623 ledger row into a candidate closure record", () => {
    const summary = summarizeNebulaRightsClosureV627(DEFAULT_BATCH);
    expect(DEFAULT_BATCH.schema).toBe("mainline-a-nebula-rights-closure-v627");
    expect(DEFAULT_BATCH.source.schema).toBe("mainline-a-nebula-batch-v624");
    expect(DEFAULT_BATCH.source.path).toBe("app/data/mainlineANebulaBatchV624.generated.json");
    expect(DEFAULT_BATCH.records).toHaveLength(12);
    expect(summary.total).toBe(12);
    expect(summary.candidateOnly).toBe(12);
    expect(summary.scientificPayloadWriteback).toBe(false);
  });

  it("keeps source, payload, rights and signoff gates pending", () => {
    const summary = summarizeNebulaRightsClosureV627(DEFAULT_BATCH);
    expect(summary.sourceVerified).toBe(0);
    expect(summary.payloadVerified).toBe(0);
    expect(summary.rightsVerified).toBe(0);
    expect(summary.rightsPending).toBe(12);
    expect(summary.signoffPending).toBe(12);
    expect(DEFAULT_BATCH.records.every((record) => record.status === "source-pending")).toBe(true);
  });

  it("exposes all seven gates and closes runtime/writeback", () => {
    const first = DEFAULT_BATCH.records[0];
    expect(first).toBeDefined();
    const gates = recordGates(first!);
    expect(gates.map((gate) => gate.id)).toEqual(["source", "artifact", "payload", "rights", "signoff", "runtime", "writeback"]);
    expect(gates.find((gate) => gate.id === "runtime")?.state).toBe("closed");
    expect(gates.find((gate) => gate.id === "writeback")?.state).toBe("closed");
    expect(gates.find((gate) => gate.id === "source")?.state).toBe("pending");
  });

  it("reports the contract next action and preserves boundary closure", () => {
    const first = DEFAULT_BATCH.records[0];
    expect(first).toBeDefined();
    expect(nextAction(first!)).toContain("来源");
    expect(rightsClosureBoundaryValidV627(DEFAULT_BATCH)).toBe(true);
    expect(DEFAULT_BATCH.boundary).toMatchObject({ candidateOnly: true, hold: true, notAdmitted: true, scientificPayloadWriteback: false, runtimeWrites: false, measurementWrites: false });
    expect(DEFAULT_BATCH.records.every((record) => record.runtimeAdmission === "candidate-only" && record.measurementAdmission === "not-admitted" && record.scientificPayloadWriteback === false)).toBe(true);
  });

  it("keeps blocker reasons visible for each record", () => {
    for (const record of DEFAULT_BATCH.records) {
      expect(record.blockers.length).toBeGreaterThan(0);
      expect(record.blockers).toContain("rights-review-pending");
      expect(record.blockers).toContain("rights-signoff-pending");
      expect(record.fingerprint).toMatch(/^[a-f0-9]{64}$/);
    }
  });
});
