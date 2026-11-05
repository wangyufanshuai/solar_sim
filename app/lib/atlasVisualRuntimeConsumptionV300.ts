"use client";

import { useEffect } from "react";
import { resolveAtlasVisualProfileV299, type AtlasVisualProfileV299 } from "./atlasVisualProfileV299";
import { createAtlasVisualTokenFieldAuditV316 } from "./atlasVisualTokenFieldAuditV316";

export const ATLAS_VISUAL_RUNTIME_CONSUMPTION_V300_VERSION = "v300-visual-runtime-consumption-audit" as const;

export const ATLAS_VISUAL_RUNTIME_GROUPS_V300 = Object.freeze([
  "sky", "solar", "catalog", "postFx", "strongGravity", "launch", "exoplanet", "hud",
] as const);

export type AtlasVisualRuntimeGroupV300 = typeof ATLAS_VISUAL_RUNTIME_GROUPS_V300[number];

export type AtlasVisualRuntimeConsumerV300 = Readonly<{
  profile: AtlasVisualProfileV299;
  group: AtlasVisualRuntimeGroupV300;
  consumer: string;
  tokenSignature: string;
}>;

export type AtlasVisualRuntimeConsumptionSnapshotV300 = Readonly<{
  version: typeof ATLAS_VISUAL_RUNTIME_CONSUMPTION_V300_VERSION;
  signaturePolicy: "resolved-profile-exact-v300";
  activeConsumerCount: number;
  activeGroups: readonly AtlasVisualRuntimeGroupV300[];
  observedByProfile: Readonly<Record<string, readonly AtlasVisualRuntimeGroupV300[]>>;
  completeProfiles: readonly string[];
  fieldCoverageVersion: "v316-visual-token-field-audit-v1";
  fieldCoverageStatus: "field-complete-static-consumer-contract" | "field-incomplete";
  requiredTokenFieldCount: number;
  declaredTokenFieldCount: number;
}>;

const activeConsumers = new Map<symbol, AtlasVisualRuntimeConsumerV300>();
const observedByProfile = new Map<string, Map<AtlasVisualRuntimeGroupV300, Set<string>>>();
const FIELD_AUDIT_V316 = createAtlasVisualTokenFieldAuditV316();

function canonicalToken(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "number") return Number.isFinite(value) ? value.toString() : "non-finite";
  if (typeof value === "string" || typeof value === "boolean") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalToken).join(",")}]`;
  if (typeof value === "object") {
    const source = value as Record<string, unknown>;
    return `{${Object.keys(source).sort().map((key) => `${JSON.stringify(key)}:${canonicalToken(source[key])}`).join(",")}}`;
  }
  return JSON.stringify(typeof value);
}

export function createAtlasVisualTokenSignatureV300(value: unknown): string {
  const input = canonicalToken(value);
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

export function resolveAtlasExpectedVisualTokenSignatureV300(
  profile: AtlasVisualProfileV299,
  group: AtlasVisualRuntimeGroupV300,
): string {
  const resolved = resolveAtlasVisualProfileV299(profile);
  const tokens = group === "sky" ? resolved.groups.sky
    : group === "solar" ? resolved.groups.solar
      : group === "catalog" ? resolved.groups.catalog
        : group === "postFx" ? resolved.groups.postFx
          : group === "strongGravity" ? {
            base: resolved.runtimeTokens.strongGravity,
            cinematic: resolved.runtimeTokens.strongGravityV9 ?? resolved.runtimeTokens.strongGravityV8 ?? resolved.runtimeTokens.strongGravityV7 ?? resolved.runtimeTokens.strongGravityV6 ?? resolved.runtimeTokens.strongGravityV5 ?? null,
          }
            : group === "launch" ? resolved.runtimeTokens.launch
              : group === "exoplanet" ? resolved.runtimeTokens.exoplanet
                : resolved.runtimeTokens.hud;
  return createAtlasVisualTokenSignatureV300(tokens);
}

export function getAtlasVisualRuntimeConsumptionSnapshotV300(): AtlasVisualRuntimeConsumptionSnapshotV300 {
  const activeGroups = [...new Set([...activeConsumers.values()].map((entry) => entry.group))].sort() as AtlasVisualRuntimeGroupV300[];
  const observed = Object.fromEntries([...observedByProfile.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([profile, groups]) => [profile, [...groups.keys()].sort()])) as Record<string, AtlasVisualRuntimeGroupV300[]>;
  const completeProfiles = Object.entries(observed)
    .filter(([, groups]) => ATLAS_VISUAL_RUNTIME_GROUPS_V300.every((group) => groups.includes(group)))
    .map(([profile]) => profile);
  return Object.freeze({
    version: ATLAS_VISUAL_RUNTIME_CONSUMPTION_V300_VERSION,
    signaturePolicy: "resolved-profile-exact-v300",
    activeConsumerCount: activeConsumers.size,
    activeGroups: Object.freeze(activeGroups),
    observedByProfile: Object.freeze(observed),
    completeProfiles: Object.freeze(completeProfiles),
    fieldCoverageVersion: FIELD_AUDIT_V316.version,
    fieldCoverageStatus: FIELD_AUDIT_V316.status,
    requiredTokenFieldCount: FIELD_AUDIT_V316.requiredFieldCount,
    declaredTokenFieldCount: FIELD_AUDIT_V316.declaredFieldCount,
  });
}

function publishAtlasVisualRuntimeConsumptionV300(): void {
  if (typeof document === "undefined") return;
  const root = document.querySelector<HTMLElement>("[data-atlas-app-shell]");
  if (!root) return;
  const snapshot = getAtlasVisualRuntimeConsumptionSnapshotV300();
  root.dataset.atlasVisualRuntimeConsumptionVersionV300 = snapshot.version;
  root.dataset.atlasVisualRuntimeSignaturePolicyV300 = snapshot.signaturePolicy;
  root.dataset.atlasVisualRuntimeActiveConsumerCountV300 = String(snapshot.activeConsumerCount);
  root.dataset.atlasVisualRuntimeActiveGroupsV300 = snapshot.activeGroups.join(" ") || "none";
  root.dataset.atlasVisualRuntimeCompleteProfilesV300 = snapshot.completeProfiles.join(" ") || "none";
  root.dataset.atlasVisualRuntimeObservedV300 = Object.entries(snapshot.observedByProfile)
    .map(([profile, groups]) => `${profile}:${groups.join(",")}`)
    .join("|") || "none";
  root.dataset.atlasVisualFieldCoverageVersionV316 = snapshot.fieldCoverageVersion;
  root.dataset.atlasVisualFieldCoverageStatusV316 = snapshot.fieldCoverageStatus;
  root.dataset.atlasVisualRequiredFieldCountV316 = String(snapshot.requiredTokenFieldCount);
  root.dataset.atlasVisualDeclaredFieldCountV316 = String(snapshot.declaredTokenFieldCount);
}

export function registerAtlasVisualRuntimeConsumerV300(entry: AtlasVisualRuntimeConsumerV300): () => void {
  if (!ATLAS_VISUAL_RUNTIME_GROUPS_V300.includes(entry.group)
    || !/^[a-f0-9]{8}$/.test(entry.tokenSignature)
    || entry.tokenSignature !== resolveAtlasExpectedVisualTokenSignatureV300(entry.profile, entry.group)
    || entry.consumer.length < 1
    || entry.consumer.length > 96) throw new Error("invalid v300 visual runtime consumer");
  const token = Symbol(entry.consumer);
  activeConsumers.set(token, Object.freeze({ ...entry }));
  let profileGroups = observedByProfile.get(entry.profile);
  if (!profileGroups) {
    profileGroups = new Map();
    observedByProfile.set(entry.profile, profileGroups);
  }
  const signatures = profileGroups.get(entry.group) ?? new Set<string>();
  signatures.add(`${entry.consumer}:${entry.tokenSignature}`);
  profileGroups.set(entry.group, signatures);
  publishAtlasVisualRuntimeConsumptionV300();
  let released = false;
  return () => {
    if (released) return;
    released = true;
    activeConsumers.delete(token);
    publishAtlasVisualRuntimeConsumptionV300();
  };
}

export function useAtlasVisualRuntimeConsumerV300(entry: AtlasVisualRuntimeConsumerV300): void {
  const { profile, group, consumer, tokenSignature } = entry;
  useEffect(
    () => registerAtlasVisualRuntimeConsumerV300({ profile, group, consumer, tokenSignature }),
    [consumer, group, profile, tokenSignature],
  );
}

export function resetAtlasVisualRuntimeConsumptionForTestsV300(): void {
  activeConsumers.clear();
  observedByProfile.clear();
}
