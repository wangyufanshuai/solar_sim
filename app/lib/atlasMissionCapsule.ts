import type {
  AtlasMissionCapsule,
  AtlasMissionCapsuleRestoreSummary,
  AtlasMissionCapsuleVersion,
  AtlasMissionCapsuleWarning,
  AtlasMissionHubItemKind,
  AtlasMissionHubStoredState,
  AtlasNavigatorSummary,
  AtlasWorkflowId,
  AtlasWorkflowSummary,
  KerrGeodesicRenderMode,
  KerrOrbitPresetId,
  KerrRelativityStudioMode,
} from "./simulationDiagnosticsTypes";

export const ATLAS_MISSION_CAPSULE_VERSION: AtlasMissionCapsuleVersion =
  "v27-mission-capsules";
export const ATLAS_MISSION_CAPSULE_HASH_KEY = "atlas-capsule";

export type CreateAtlasMissionCapsuleArgs = {
  presentationMode: string;
  scaleMode: string;
  renderBudget: string;
  viewSettings: Record<string, unknown>;
  selectedBodyId?: string | null;
  selectedCatalogObjectId?: string | null;
  selectedEvidenceClaimId?: string | null;
  selectedWorkflowId?: string | null;
  activeWorkflowStepId?: string | null;
  missionHubStoredState: AtlasMissionHubStoredState;
  kerrLab: {
    showKerrBlackHole: boolean;
    spinA: number;
    impactParameterM: number;
    orbitPresetId: KerrOrbitPresetId;
    renderMode: KerrGeodesicRenderMode;
    studioMode?: KerrRelativityStudioMode;
  };
  createdAt?: string;
};

export type ParseAtlasMissionCapsuleResult = {
  capsule: AtlasMissionCapsule | null;
  warnings: readonly AtlasMissionCapsuleWarning[];
};

export type RestoreAtlasMissionCapsuleArgs = {
  capsule: AtlasMissionCapsule | null;
  warnings?: readonly AtlasMissionCapsuleWarning[];
  source: AtlasMissionCapsuleRestoreSummary["source"];
  navigatorSummary: AtlasNavigatorSummary;
  workflowSummary: AtlasWorkflowSummary;
};

export function createAtlasMissionCapsule({
  presentationMode,
  scaleMode,
  renderBudget,
  viewSettings,
  selectedBodyId,
  selectedCatalogObjectId,
  selectedEvidenceClaimId,
  selectedWorkflowId,
  activeWorkflowStepId,
  missionHubStoredState,
  kerrLab,
  createdAt,
}: CreateAtlasMissionCapsuleArgs): AtlasMissionCapsule {
  return {
    version: ATLAS_MISSION_CAPSULE_VERSION,
    createdAt: createdAt ?? new Date().toISOString(),
    source: "mission-hub",
    presentation: {
      mode: presentationMode,
      scaleMode,
      renderBudget,
    },
    viewSettings: booleanRecord(viewSettings),
    selected: {
      bodyId: selectedBodyId || undefined,
      catalogObjectId: selectedCatalogObjectId || undefined,
      evidenceClaimId: selectedEvidenceClaimId || undefined,
      workflowId: isWorkflowId(selectedWorkflowId) ? selectedWorkflowId : undefined,
      workflowStepId: activeWorkflowStepId || undefined,
    },
    missionHub: {
      recentActions: normalizeStoredItems(missionHubStoredState.recentActions),
      pinnedItems: normalizeStoredItems(missionHubStoredState.pinnedItems),
    },
    kerrLab: {
      showKerrBlackHole: Boolean(kerrLab.showKerrBlackHole),
      spinA: finiteOr(kerrLab.spinA, 0),
      impactParameterM: finiteOr(kerrLab.impactParameterM, 0),
      orbitPresetId: kerrLab.orbitPresetId,
      renderMode: kerrLab.renderMode,
      studioMode: isKerrRelativityStudioMode(kerrLab.studioMode)
        ? kerrLab.studioMode
        : "overview",
    },
  };
}

export function serializeAtlasMissionCapsule(capsule: AtlasMissionCapsule): string {
  return encodeBase64Url(JSON.stringify(capsule));
}

export function missionCapsuleToHash(capsule: AtlasMissionCapsule): string {
  return `#${ATLAS_MISSION_CAPSULE_HASH_KEY}=${serializeAtlasMissionCapsule(capsule)}`;
}

export function parseAtlasMissionCapsule(raw: string | null | undefined): ParseAtlasMissionCapsuleResult {
  if (!raw) {
    return {
      capsule: null,
      warnings: [warning("invalid-shape", "Mission capsule payload is empty.")],
    };
  }
  const payload = raw.trim().replace(/^#/, "").replace(/^atlas-capsule=/, "");
  const warnings: AtlasMissionCapsuleWarning[] = [];
  let decoded = payload;

  if (!payload.startsWith("{")) {
    try {
      decoded = decodeBase64Url(payload);
    } catch {
      return {
        capsule: null,
        warnings: [warning("invalid-base64", "Mission capsule payload is not valid base64url.")],
      };
    }
  }

  let json: unknown;
  try {
    json = JSON.parse(decoded);
  } catch {
    return {
      capsule: null,
      warnings: [warning("invalid-json", "Mission capsule payload is not valid JSON.")],
    };
  }

  const capsule = normalizeCapsule(json, warnings);
  return { capsule, warnings };
}

export function restoreAtlasMissionCapsule({
  capsule,
  warnings = [],
  source,
  navigatorSummary,
  workflowSummary,
}: RestoreAtlasMissionCapsuleArgs): AtlasMissionCapsuleRestoreSummary {
  if (!capsule) {
    return {
      version: ATLAS_MISSION_CAPSULE_VERSION,
      source,
      active: false,
      createdAt: "",
      restoredCount: 0,
      warningCount: warnings.length,
      warnings,
    };
  }

  const allWarnings = [...warnings, ...validateCapsuleIds(capsule, navigatorSummary, workflowSummary)];
  const restoredCount = [
    capsule.presentation.mode,
    capsule.presentation.scaleMode,
    capsule.presentation.renderBudget,
    Object.keys(capsule.viewSettings).length > 0,
    capsule.selected.bodyId,
    capsule.selected.catalogObjectId,
    capsule.selected.evidenceClaimId,
    capsule.selected.workflowId,
    capsule.selected.workflowStepId,
    capsule.missionHub.pinnedItems.length,
    capsule.missionHub.recentActions.length,
    capsule.kerrLab.showKerrBlackHole,
    capsule.kerrLab.studioMode,
  ].filter(Boolean).length;

  return {
    version: ATLAS_MISSION_CAPSULE_VERSION,
    source,
    active: true,
    createdAt: capsule.createdAt,
    restoredCount,
    warningCount: allWarnings.length,
    warnings: allWarnings,
  };
}

export function capsuleFromLocationHash(hash: string): ParseAtlasMissionCapsuleResult {
  const trimmed = hash.trim().replace(/^#/, "");
  const prefix = `${ATLAS_MISSION_CAPSULE_HASH_KEY}=`;
  if (!trimmed.startsWith(prefix)) {
    return {
      capsule: null,
      warnings: [],
    };
  }
  return parseAtlasMissionCapsule(trimmed.slice(prefix.length));
}

function normalizeCapsule(value: unknown, warnings: AtlasMissionCapsuleWarning[]): AtlasMissionCapsule | null {
  if (!value || typeof value !== "object") {
    warnings.push(warning("invalid-shape", "Mission capsule root must be an object."));
    return null;
  }
  const record = value as Record<string, unknown>;
  if (record.version !== ATLAS_MISSION_CAPSULE_VERSION) {
    warnings.push(
      warning(
        "unsupported-version",
        `Unsupported mission capsule version: ${String(record.version ?? "missing")}.`,
        "version",
      ),
    );
    return null;
  }

  const presentation = objectRecord(record.presentation);
  const selected = objectRecord(record.selected);
  const missionHub = objectRecord(record.missionHub);
  const kerrLab = objectRecord(record.kerrLab);
  const workflowId = stringOrUndefined(selected.workflowId);

  return {
    version: ATLAS_MISSION_CAPSULE_VERSION,
    createdAt: stringOrUndefined(record.createdAt) ?? "",
    source: "mission-hub",
    presentation: {
      mode: stringOrUndefined(presentation.mode) ?? "sandbox",
      scaleMode: stringOrUndefined(presentation.scaleMode) ?? "compressed",
      renderBudget: stringOrUndefined(presentation.renderBudget) ?? "balanced",
    },
    viewSettings: booleanRecord(objectRecord(record.viewSettings)),
    selected: {
      bodyId: stringOrUndefined(selected.bodyId),
      catalogObjectId: stringOrUndefined(selected.catalogObjectId),
      evidenceClaimId: stringOrUndefined(selected.evidenceClaimId),
      workflowId: isWorkflowId(workflowId) ? workflowId : undefined,
      workflowStepId: stringOrUndefined(selected.workflowStepId),
    },
    missionHub: {
      recentActions: normalizeStoredItems(missionHub.recentActions),
      pinnedItems: normalizeStoredItems(missionHub.pinnedItems),
    },
    kerrLab: {
      showKerrBlackHole: Boolean(kerrLab.showKerrBlackHole),
      spinA: finiteOr(kerrLab.spinA, 0),
      impactParameterM: finiteOr(kerrLab.impactParameterM, 0),
      orbitPresetId: isKerrPresetId(kerrLab.orbitPresetId) ? kerrLab.orbitPresetId : "photon-ring-demo",
      renderMode: isKerrRenderMode(kerrLab.renderMode) ? kerrLab.renderMode : "geodesic-tracks",
      studioMode: isKerrRelativityStudioMode(kerrLab.studioMode)
        ? kerrLab.studioMode
        : "overview",
    },
  };
}

function validateCapsuleIds(
  capsule: AtlasMissionCapsule,
  navigatorSummary: AtlasNavigatorSummary,
  workflowSummary: AtlasWorkflowSummary,
): AtlasMissionCapsuleWarning[] {
  const warnings: AtlasMissionCapsuleWarning[] = [];
  const navigatorIds = new Set(navigatorSummary.items.map((item) => item.id));
  const workflowById = new Map(workflowSummary.workflows.map((workflow) => [workflow.id, workflow]));

  if (capsule.selected.bodyId && !navigatorIds.has(`solar-body:${capsule.selected.bodyId}`)) {
    warnings.push(warning("stale-id", `Unknown body id ${capsule.selected.bodyId}.`, "selected.bodyId"));
  }
  if (
    capsule.selected.catalogObjectId &&
    !navigatorIds.has(`celestial-object:${capsule.selected.catalogObjectId}`)
  ) {
    warnings.push(
      warning("stale-id", `Unknown catalog id ${capsule.selected.catalogObjectId}.`, "selected.catalogObjectId"),
    );
  }
  if (
    capsule.selected.evidenceClaimId &&
    !navigatorIds.has(`evidence-claim:${capsule.selected.evidenceClaimId}`)
  ) {
    warnings.push(
      warning("stale-id", `Unknown evidence claim ${capsule.selected.evidenceClaimId}.`, "selected.evidenceClaimId"),
    );
  }
  if (capsule.selected.workflowId && !workflowById.has(capsule.selected.workflowId)) {
    warnings.push(
      warning("stale-id", `Unknown workflow ${capsule.selected.workflowId}.`, "selected.workflowId"),
    );
  }
  const workflow = capsule.selected.workflowId ? workflowById.get(capsule.selected.workflowId) : null;
  if (
    workflow &&
    capsule.selected.workflowStepId &&
    !workflow.steps.some((step) => step.id === capsule.selected.workflowStepId)
  ) {
    warnings.push(
      warning("stale-id", `Unknown workflow step ${capsule.selected.workflowStepId}.`, "selected.workflowStepId"),
    );
  }

  for (const item of [...capsule.missionHub.recentActions, ...capsule.missionHub.pinnedItems]) {
    if (item.kind === "workflow-step") continue;
    if (item.kind === "workflow") {
      const workflowId = item.id.replace(/^workflow:/, "");
      if (!workflowById.has(workflowId as AtlasWorkflowId)) {
        warnings.push(warning("stale-id", `Stored workflow ${item.id} is unavailable.`, item.id));
      }
      continue;
    }
    if (!navigatorIds.has(item.id)) {
      warnings.push(warning("stale-id", `Stored Navigator item ${item.id} is unavailable.`, item.id));
    }
  }

  return warnings;
}

function booleanRecord(value: Record<string, unknown>): Record<string, boolean> {
  return Object.fromEntries(
    Object.entries(value)
      .filter(([, entry]) => typeof entry === "boolean")
      .sort(([a], [b]) => a.localeCompare(b)),
  ) as Record<string, boolean>;
}

function normalizeStoredItems(value: unknown): AtlasMissionHubStoredState["recentActions"] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const record = objectRecord(item);
    const id = stringOrUndefined(record.id);
    const kind = stringOrUndefined(record.kind);
    if (!id || !isMissionHubItemKind(kind)) return [];
    const timestamp = finiteOr(record.timestamp, 0);
    return [{ id, kind, timestamp }];
  });
}

function objectRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function stringOrUndefined(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function finiteOr(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function isWorkflowId(value: unknown): value is AtlasWorkflowId {
  return (
    value === "solar-validation" ||
    value === "relativity-lab" ||
    value === "relativity-guided-tour" ||
    value === "deep-sky-provenance" ||
    value === "cosmology-validation" ||
    value === "gaia-galactic-context"
  );
}

function isKerrPresetId(value: unknown): value is KerrOrbitPresetId {
  return (
    value === "photon-ring-demo" ||
    value === "isco-comparison" ||
    value === "capture-cone" ||
    value === "wide-deflection" ||
    value === "frame-drag-split"
  );
}

function isKerrRenderMode(value: unknown): value is KerrGeodesicRenderMode {
  return value === "geodesic-tracks" || value === "teaching-particles" || value === "both";
}

function isKerrRelativityStudioMode(value: unknown): value is KerrRelativityStudioMode {
  return (
    value === "overview" ||
    value === "probe" ||
    value === "isco" ||
    value === "error" ||
    value === "boundary"
  );
}

function isMissionHubItemKind(value: unknown): value is AtlasMissionHubItemKind {
  return (
    value === "solar-body" ||
    value === "celestial-object" ||
    value === "evidence-claim" ||
    value === "workflow" ||
    value === "workflow-step" ||
    value === "panel-action"
  );
}

function warning(
  code: AtlasMissionCapsuleWarning["code"],
  message: string,
  field?: string,
): AtlasMissionCapsuleWarning {
  return { code, message, field };
}

function encodeBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }
  if (typeof globalThis.btoa !== "function") {
    throw new Error("Mission capsule base64 encoding is unavailable");
  }
  const encoded = globalThis.btoa(binary);
  return encoded.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeBase64Url(value: string): string {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  if (typeof globalThis.atob !== "function") {
    throw new Error("Mission capsule base64 decoding is unavailable");
  }
  const binary = globalThis.atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
