import type {
  MainlineAIdentityBridgeReceiptV626,
  MainlineAIdentityEvidenceClassV626,
  MainlineAIdentityGateStateV626,
  MainlineAIdentityGateV626,
} from "./mainlineAReleaseIdentityBridgeV626";
import {
  createMainlineAIdentityCsvV626,
  digestMainlineAIdentityValueV626,
  stableMainlineAIdentityJsonV626,
  summarizeMainlineAIdentityGatesV626,
} from "./mainlineAReleaseIdentityBridgeV626";

export const MAINLINE_A_RELEASE_IDENTITY_REPLAY_SCHEMA_V626 = "mainline-a-release-identity-replay-v626" as const;

export type MainlineAIdentityReplayEventV626 = Readonly<{
  sequence: number;
  gateId: string;
  from: MainlineAIdentityGateStateV626;
  to: MainlineAIdentityGateStateV626;
  evidenceClass: MainlineAIdentityEvidenceClassV626;
  blockers: readonly string[];
  revision: string;
}>;

export type MainlineAIdentityReplayV626 = Readonly<{
  schema: typeof MAINLINE_A_RELEASE_IDENTITY_REPLAY_SCHEMA_V626;
  receiptDigest: string;
  gateCount: number;
  events: readonly MainlineAIdentityReplayEventV626[];
  current: Readonly<Record<string, MainlineAIdentityGateStateV626>>;
  status: MainlineAIdentityGateStateV626;
  requiredOpen: number;
  candidateOnly: true;
  hold: true;
  notAdmitted: true;
  scientificPayloadWriteback: false;
}>;

const states = new Set<MainlineAIdentityGateStateV626>(["passed", "pending", "blocked", "not-run"]);

function state(value: unknown): MainlineAIdentityGateStateV626 {
  return typeof value === "string" && states.has(value as MainlineAIdentityGateStateV626)
    ? value as MainlineAIdentityGateStateV626
    : "not-run";
}

function text(value: unknown, fallback = "unknown"): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function unique(values: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(values.map((value) => text(value, "")).filter(Boolean))].sort());
}

function revision(gate: MainlineAIdentityGateV626): string {
  return digestMainlineAIdentityValueV626({ id: gate.id, state: gate.state, blockers: gate.blockers, notes: gate.notes });
}

function eventFor(gate: MainlineAIdentityGateV626, sequence: number, previous: MainlineAIdentityGateStateV626): MainlineAIdentityReplayEventV626 {
  return Object.freeze({ sequence, gateId: gate.id, from: previous, to: gate.state, evidenceClass: gate.evidenceClass, blockers: unique(gate.blockers), revision: revision(gate) });
}

function gateMap(gates: readonly MainlineAIdentityGateV626[]): Record<string, MainlineAIdentityGateStateV626> {
  return Object.fromEntries(gates.map((gate) => [gate.id, gate.state]));
}

export function replayMainlineAIdentityGatesV626(receipt: MainlineAIdentityBridgeReceiptV626): MainlineAIdentityReplayV626 {
  const events: MainlineAIdentityReplayEventV626[] = [];
  const current: Record<string, MainlineAIdentityGateStateV626> = {};
  receipt.gates.forEach((gate, index) => {
    const previous = current[gate.id] ?? "not-run";
    current[gate.id] = state(gate.state);
    events.push(eventFor(gate, index + 1, previous));
  });
  const summary = summarizeMainlineAIdentityGatesV626(receipt.gates);
  return Object.freeze({
    schema: MAINLINE_A_RELEASE_IDENTITY_REPLAY_SCHEMA_V626,
    receiptDigest: digestMainlineAIdentityValueV626(receipt),
    gateCount: receipt.gates.length,
    events: Object.freeze(events),
    current: Object.freeze(gateMap(receipt.gates)),
    status: state(receipt.status),
    requiredOpen: summary.requiredOpen,
    candidateOnly: true,
    hold: true,
    notAdmitted: true,
    scientificPayloadWriteback: false,
  });
}

export function replayMainlineAIdentityRowsV626(receipt: MainlineAIdentityBridgeReceiptV626): readonly Readonly<{ gateId: string; state: MainlineAIdentityGateStateV626; required: boolean; evidenceClass: MainlineAIdentityEvidenceClassV626; blockers: readonly string[] }>[] {
  return Object.freeze(receipt.gates.map((gate) => Object.freeze({ gateId: gate.id, state: gate.state, required: gate.required, evidenceClass: gate.evidenceClass, blockers: unique(gate.blockers) })));
}

export function replayMainlineAIdentityCsvV626(receipt: MainlineAIdentityBridgeReceiptV626): string {
  return createMainlineAIdentityCsvV626(receipt.gates);
}

export function replayMainlineAIdentityJsonV626(receipt: MainlineAIdentityBridgeReceiptV626): string {
  return stableMainlineAIdentityJsonV626(replayMainlineAIdentityGatesV626(receipt));
}

export function changedMainlineAIdentityGatesV626(previous: MainlineAIdentityReplayV626, current: MainlineAIdentityReplayV626): readonly string[] {
  const changed = Object.keys({ ...previous.current, ...current.current }).filter((gateId) => previous.current[gateId] !== current.current[gateId]);
  return Object.freeze(changed.sort());
}

export function identityReplayHasBoundaryV626(replay: MainlineAIdentityReplayV626): boolean {
  return replay.candidateOnly && replay.hold && replay.notAdmitted && replay.scientificPayloadWriteback === false;
}

export function identityReplayIsClosedV626(replay: MainlineAIdentityReplayV626): boolean {
  return replay.status === "passed" && replay.requiredOpen === 0 && identityReplayHasBoundaryV626(replay);
}

export function identityReplaySummaryV626(replay: MainlineAIdentityReplayV626): Readonly<{ schema: string; status: MainlineAIdentityGateStateV626; gateCount: number; eventCount: number; requiredOpen: number; digest: string; boundaryClosed: boolean }> {
  return Object.freeze({ schema: replay.schema, status: replay.status, gateCount: replay.gateCount, eventCount: replay.events.length, requiredOpen: replay.requiredOpen, digest: replay.receiptDigest, boundaryClosed: identityReplayHasBoundaryV626(replay) });
}
