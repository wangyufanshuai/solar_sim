import { C_LIGHT, DAY_SECONDS } from "./physicalConstants";
import type { PhysicsPrecisionTier } from "./physicsPrecision";

/** Legacy N-body execution only. No policy in this file admits full NR or payload writeback. */
export type ScientificPhysicsPolicyInput = Readonly<{
  mode: "scientific-shadow";
  model: "eih-1pn" | "newton-nbody";
  stepSeconds: number;
  maxDpAttempts?: number;
  maxAccelEvals?: number;
}>;
export type PhysicsExecutionPolicyInput = Readonly<{ mode: "interactive" }> | ScientificPhysicsPolicyInput;
export type PhysicsExecutionPolicy = Readonly<{ mode: "interactive" }> | Readonly<Required<ScientificPhysicsPolicyInput>>;
export type ScientificPhysicsFailure = Readonly<{
  reason: string;
  attemptedSubsteps: number;
  attemptedSeconds: number;
}>;
export type PhysicsFrameStep = Readonly<{
  dtSimS: number;
  invC2: number;
  tier: PhysicsPrecisionTier;
  simDeltaDays: number;
  galacticMode: boolean;
}>;

/** Validate on BOTH sides of the worker boundary; structured clone removes Object.freeze. */
export function normalizePhysicsExecutionPolicy(input: unknown = { mode: "interactive" }): PhysicsExecutionPolicy {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Invalid physics execution policy");
  const p = input as Record<string, unknown>;
  if (p.mode === "interactive" && Object.keys(p).length === 1) return Object.freeze({ mode: "interactive" });
  const keys = ["mode", "model", "stepSeconds", "maxDpAttempts", "maxAccelEvals"];
  if (p.mode !== "scientific-shadow" || Object.keys(p).some((key) => !keys.includes(key))) {
    throw new Error("Unknown physics execution policy or field");
  }
  if (p.model !== "eih-1pn" && p.model !== "newton-nbody") throw new Error("Unsupported scientific legacy model; NR remains separate");
  if (typeof p.stepSeconds !== "number" || !Number.isFinite(p.stepSeconds) || p.stepSeconds <= 0) {
    throw new Error("Scientific stepSeconds must be finite and positive");
  }
  const maxDpAttempts = p.maxDpAttempts === undefined ? 50_000 : p.maxDpAttempts;
  const maxAccelEvals = p.maxAccelEvals === undefined ? 45_000 : p.maxAccelEvals;
  if (typeof maxDpAttempts !== "number" || !Number.isInteger(maxDpAttempts) || maxDpAttempts < 1 || maxDpAttempts > 50_000
      || typeof maxAccelEvals !== "number" || !Number.isInteger(maxAccelEvals) || maxAccelEvals < 7 || maxAccelEvals > 45_000) {
    throw new Error("Scientific DP limits must be bounded positive integers (at least seven acceleration evaluations)");
  }
  return Object.freeze({ mode: "scientific-shadow", model: p.model, stepSeconds: p.stepSeconds, maxDpAttempts, maxAccelEvals });
}

/** Deliberately accepts no camera, LOD, frame time or rendering-quality inputs. */
export function scientificFrameStep(policy: PhysicsExecutionPolicy): PhysicsFrameStep | null {
  if (policy.mode === "interactive") return null;
  return {
    dtSimS: policy.stepSeconds,
    invC2: policy.model === "eih-1pn" ? 1 / (C_LIGHT * C_LIGHT) : 0,
    tier: policy.model === "eih-1pn" ? "full" : "newton",
    simDeltaDays: policy.stepSeconds / DAY_SECONDS,
    galacticMode: false,
  };
}

export function assertScientificFrameStep(policy: PhysicsExecutionPolicy, step: PhysicsFrameStep): void {
  const fixed = scientificFrameStep(policy);
  if (fixed && (Object.keys(fixed) as (keyof PhysicsFrameStep)[]).some((key) => step[key] !== fixed[key])) {
    throw new Error("Scientific physics model, precision and physical timestep are locked");
  }
}
