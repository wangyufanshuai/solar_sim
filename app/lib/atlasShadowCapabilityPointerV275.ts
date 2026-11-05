export const ATLAS_SHADOW_CAPABILITY_POINTER_VERSION_V275 = "orbit-atlas-current-local-shadow-candidate-v275" as const;

export type AtlasShadowCapabilityStateV275 =
  | "qualified"
  | "implemented-awaiting-browser-qualification"
  | "blocked"
  | "incomplete";

export type AtlasShadowCapabilityPointerV275 = {
  version: typeof ATLAS_SHADOW_CAPABILITY_POINTER_VERSION_V275;
  generatedAt: string;
  formalProductPointer: string;
  formalProductPointerAdvanced: false;
  promotionApplied: false;
  localShadowVisualDefaultApplied: boolean;
  capabilities: Readonly<Record<"v271" | "v272" | "v273" | "v274" | "v275", {
    state: AtlasShadowCapabilityStateV275;
    reason: string;
  }>>;
  publicDeploymentBlocked: true;
};

const STATES = new Set<AtlasShadowCapabilityStateV275>([
  "qualified",
  "implemented-awaiting-browser-qualification",
  "blocked",
  "incomplete",
]);

export function parseAtlasShadowCapabilityPointerV275(value: unknown): AtlasShadowCapabilityPointerV275 {
  if (!value || typeof value !== "object") throw new Error("v275 shadow capability pointer is invalid");
  const pointer = value as Partial<AtlasShadowCapabilityPointerV275>;
  if (pointer.version !== ATLAS_SHADOW_CAPABILITY_POINTER_VERSION_V275
    || pointer.formalProductPointerAdvanced !== false
    || pointer.promotionApplied !== false
    || pointer.publicDeploymentBlocked !== true) {
    throw new Error("v275 shadow pointer changed a formal/public boundary");
  }
  for (const phase of ["v271", "v272", "v273", "v274", "v275"] as const) {
    const capability = pointer.capabilities?.[phase];
    if (!capability || !STATES.has(capability.state) || !capability.reason.trim()) {
      throw new Error(`v275 shadow pointer omitted ${phase} capability state`);
    }
  }
  if (pointer.localShadowVisualDefaultApplied
    && ["v273", "v274", "v275"].some((phase) => pointer.capabilities?.[phase as "v273" | "v274" | "v275"].state !== "qualified")) {
    throw new Error("v274 local-shadow default was applied before v273-v275 qualification");
  }
  return value as AtlasShadowCapabilityPointerV275;
}
