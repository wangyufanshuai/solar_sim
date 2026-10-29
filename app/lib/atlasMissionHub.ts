import type {
  AtlasMissionHubContext,
  AtlasMissionHubItem,
  AtlasMissionHubItemKind,
  AtlasMissionCapsuleRestoreSummary,
  AtlasMissionHubStoredItem,
  AtlasMissionHubStoredState,
  AtlasMissionHubSummary,
  AtlasMissionHubVersion,
  AtlasNavigatorItem,
  AtlasNavigatorSummary,
  AtlasWorkflow,
  AtlasWorkflowId,
  AtlasWorkflowStep,
  AtlasWorkflowSummary,
} from "./simulationDiagnosticsTypes";

export const ATLAS_MISSION_HUB_VERSION: AtlasMissionHubVersion =
  "v26-atlas-mission-hub";

export const ATLAS_MISSION_HUB_STORAGE_KEY = "orbit-atlas:v26:mission-hub";

const MAX_RECENT_ITEMS = 12;
const MAX_PINNED_ITEMS = 24;

export type CreateAtlasMissionHubSummaryArgs = {
  navigatorSummary: AtlasNavigatorSummary;
  workflowSummary: AtlasWorkflowSummary;
  storedState?: AtlasMissionHubStoredState | null;
  capsuleRestoreSummary?: AtlasMissionCapsuleRestoreSummary | null;
  selectedBodyId?: string | null;
  selectedCatalogObjectId?: string | null;
  selectedEvidenceClaimId?: string | null;
  selectedWorkflowId?: string | null;
  activeWorkflowStepId?: string | null;
};

export function createAtlasMissionHubSummary({
  navigatorSummary,
  workflowSummary,
  storedState,
  capsuleRestoreSummary,
  selectedBodyId,
  selectedCatalogObjectId,
  selectedEvidenceClaimId,
  selectedWorkflowId,
  activeWorkflowStepId,
}: CreateAtlasMissionHubSummaryArgs): AtlasMissionHubSummary {
  const state = normalizeAtlasMissionHubStoredState(storedState);
  const navigatorById = new Map(navigatorSummary.items.map((item) => [item.id, item]));
  const workflowById = new Map(workflowSummary.workflows.map((workflow) => [workflow.id, workflow]));
  const pinnedIds = new Set(state.pinnedItems.map((item) => item.id));
  const current = createCurrentContext({
    navigatorById,
    workflowById,
    selectedBodyId,
    selectedCatalogObjectId,
    selectedEvidenceClaimId,
    selectedWorkflowId,
    activeWorkflowStepId,
  });

  const recentItems = state.recentActions
    .map((item) => resolveStoredItem(item, navigatorById, workflowById, pinnedIds))
    .filter((item): item is AtlasMissionHubItem => Boolean(item));
  const pinnedItems = state.pinnedItems
    .map((item) => resolveStoredItem(item, navigatorById, workflowById, pinnedIds))
    .filter((item): item is AtlasMissionHubItem => Boolean(item));
  const recommendedItems = createRecommendedItems({
    current,
    navigatorById,
    workflowById,
    pinnedIds,
    recentIds: new Set(recentItems.map((item) => item.id)),
  });

  return {
    version: ATLAS_MISSION_HUB_VERSION,
    current,
    recentCount: recentItems.length,
    pinnedCount: pinnedItems.length,
    recentItems,
    pinnedItems,
    recommendedItems,
    capsuleRestoreSummary: capsuleRestoreSummary ?? undefined,
  };
}

export function parseAtlasMissionHubStoredState(
  raw: string | null | undefined,
): AtlasMissionHubStoredState {
  if (!raw) return emptyStoredState();
  try {
    return normalizeAtlasMissionHubStoredState(JSON.parse(raw));
  } catch {
    return emptyStoredState();
  }
}

export function serializeAtlasMissionHubStoredState(
  state: AtlasMissionHubStoredState,
): string {
  return JSON.stringify(normalizeAtlasMissionHubStoredState(state));
}

export function normalizeAtlasMissionHubStoredState(
  value: unknown,
): AtlasMissionHubStoredState {
  if (!value || typeof value !== "object") return emptyStoredState();
  const record = value as {
    recentActions?: unknown;
    pinnedItems?: unknown;
  };

  return {
    recentActions: normalizeStoredItems(record.recentActions, MAX_RECENT_ITEMS),
    pinnedItems: normalizeStoredItems(record.pinnedItems, MAX_PINNED_ITEMS),
  };
}

export function recordAtlasMissionHubRecent(
  state: AtlasMissionHubStoredState,
  item: Pick<AtlasMissionHubStoredItem, "id" | "kind">,
  timestamp = Date.now(),
): AtlasMissionHubStoredState {
  const normalized = normalizeAtlasMissionHubStoredState(state);
  const nextItem = normalizeStoredItem({ ...item, timestamp });
  if (!nextItem) return normalized;

  return {
    ...normalized,
    recentActions: [
      nextItem,
      ...normalized.recentActions.filter((candidate) => candidate.id !== nextItem.id),
    ].slice(0, MAX_RECENT_ITEMS),
  };
}

export function toggleAtlasMissionHubPinned(
  state: AtlasMissionHubStoredState,
  item: Pick<AtlasMissionHubStoredItem, "id" | "kind">,
  timestamp = Date.now(),
): AtlasMissionHubStoredState {
  const normalized = normalizeAtlasMissionHubStoredState(state);
  const existing = normalized.pinnedItems.some((candidate) => candidate.id === item.id);
  if (existing) {
    return {
      ...normalized,
      pinnedItems: normalized.pinnedItems.filter((candidate) => candidate.id !== item.id),
    };
  }
  const nextItem = normalizeStoredItem({ ...item, timestamp });
  if (!nextItem) return normalized;
  return {
    ...normalized,
    pinnedItems: [
      nextItem,
      ...normalized.pinnedItems.filter((candidate) => candidate.id !== nextItem.id),
    ].slice(0, MAX_PINNED_ITEMS),
  };
}

export function navigatorItemToMissionHubStoredItem(
  item: AtlasNavigatorItem,
  timestamp = Date.now(),
): AtlasMissionHubStoredItem {
  return {
    id: item.id,
    kind: missionKindForNavigatorItem(item),
    timestamp,
  };
}

export function workflowStepToMissionHubStoredItem(
  workflowId: AtlasWorkflowId,
  stepId: string,
  timestamp = Date.now(),
): AtlasMissionHubStoredItem {
  return {
    id: workflowStepItemId(workflowId, stepId),
    kind: "workflow-step",
    timestamp,
  };
}

function createCurrentContext({
  navigatorById,
  workflowById,
  selectedBodyId,
  selectedCatalogObjectId,
  selectedEvidenceClaimId,
  selectedWorkflowId,
  activeWorkflowStepId,
}: {
  navigatorById: ReadonlyMap<string, AtlasNavigatorItem>;
  workflowById: ReadonlyMap<string, AtlasWorkflow>;
  selectedBodyId?: string | null;
  selectedCatalogObjectId?: string | null;
  selectedEvidenceClaimId?: string | null;
  selectedWorkflowId?: string | null;
  activeWorkflowStepId?: string | null;
}): AtlasMissionHubContext {
  if (selectedWorkflowId && activeWorkflowStepId) {
    const stepItem = resolveWorkflowStepItem(
      selectedWorkflowId,
      activeWorkflowStepId,
      workflowById,
      new Set(),
      undefined,
    );
    if (stepItem) return itemToContext(stepItem);
  }

  if (selectedEvidenceClaimId) {
    const item = navigatorById.get(`evidence-claim:${selectedEvidenceClaimId}`);
    if (item) return itemToContext(navigatorItemToMissionHubItem(item, false));
  }

  if (selectedCatalogObjectId) {
    const item = navigatorById.get(`celestial-object:${selectedCatalogObjectId}`);
    if (item) return itemToContext(navigatorItemToMissionHubItem(item, false));
  }

  if (selectedBodyId) {
    const item = navigatorById.get(`solar-body:${selectedBodyId}`);
    if (item) return itemToContext(navigatorItemToMissionHubItem(item, false));
  }

  if (selectedWorkflowId) {
    const workflow = workflowById.get(selectedWorkflowId as AtlasWorkflowId);
    if (workflow) return itemToContext(workflowToMissionHubItem(workflow, false));
  }

  return {
    currentKind: "",
    currentId: "",
    title: "No active mission context",
    subtitle: "Open a workflow, evidence passport, object passport, or focused body.",
    source: "Atlas Mission Hub v26",
    model: "Local session context",
    primaryMetric: "Awaiting first mission action",
    boundary: "Session memory is local to this browser and does not alter simulation physics.",
  };
}

function createRecommendedItems({
  current,
  navigatorById,
  workflowById,
  pinnedIds,
  recentIds,
}: {
  current: AtlasMissionHubContext;
  navigatorById: ReadonlyMap<string, AtlasNavigatorItem>;
  workflowById: ReadonlyMap<string, AtlasWorkflow>;
  pinnedIds: ReadonlySet<string>;
  recentIds: ReadonlySet<string>;
}): AtlasMissionHubItem[] {
  const ids =
    current.currentKind === "celestial-object"
      ? ["evidence-claim:celestial-catalog-atlas", "panel:scientific-report", "panel:atlas-workflows"]
      : current.currentKind === "evidence-claim"
        ? ["panel:evidence-ledger", "panel:scientific-report", "panel:atlas-workflows"]
        : current.currentKind === "workflow-step"
          ? ["panel:atlas-workflows", "panel:scientific-report", "panel:evidence-ledger"]
          : ["panel:scientific-report", "panel:atlas-workflows", "panel:evidence-ledger", "panel:kerr-relativity-lab"];

  const items = ids.flatMap((id) => {
    const navigatorItem = navigatorById.get(id);
    return navigatorItem ? [navigatorItemToMissionHubItem(navigatorItem, pinnedIds.has(id))] : [];
  });

  if (current.currentKind === "workflow-step") {
    const nextStep = findNextWorkflowStep(current.currentId, workflowById);
    if (nextStep) {
      items.unshift(
        workflowStepToMissionHubItem(nextStep.workflow, nextStep.step, pinnedIds.has(nextStep.id)),
      );
    }
  }

  return items.filter((item, index, all) => {
    if (recentIds.has(item.id) && item.kind !== "workflow-step") return index < 2;
    return all.findIndex((candidate) => candidate.id === item.id) === index;
  }).slice(0, 5);
}

function resolveStoredItem(
  stored: AtlasMissionHubStoredItem,
  navigatorById: ReadonlyMap<string, AtlasNavigatorItem>,
  workflowById: ReadonlyMap<string, AtlasWorkflow>,
  pinnedIds: ReadonlySet<string>,
): AtlasMissionHubItem | null {
  if (stored.kind === "workflow") {
    const workflowId = stored.id.replace(/^workflow:/, "") as AtlasWorkflowId;
    const workflow = workflowById.get(workflowId);
    return workflow
      ? workflowToMissionHubItem(workflow, pinnedIds.has(stored.id), stored.timestamp)
      : staleMissionHubItem(stored);
  }

  if (stored.kind === "workflow-step") {
    const parsed = parseWorkflowStepItemId(stored.id);
    if (!parsed) return staleMissionHubItem(stored);
    return (
      resolveWorkflowStepItem(
        parsed.workflowId,
        parsed.stepId,
        workflowById,
        pinnedIds,
        stored.timestamp,
      ) ?? staleMissionHubItem(stored)
    );
  }

  const navigatorItem = navigatorById.get(stored.id);
  return navigatorItem
    ? navigatorItemToMissionHubItem(navigatorItem, pinnedIds.has(stored.id), stored.timestamp)
    : staleMissionHubItem(stored);
}

function resolveWorkflowStepItem(
  workflowId: string,
  stepId: string,
  workflowById: ReadonlyMap<string, AtlasWorkflow>,
  pinnedIds: ReadonlySet<string>,
  timestamp?: number,
): AtlasMissionHubItem | null {
  const workflow = workflowById.get(workflowId as AtlasWorkflowId);
  const step = workflow?.steps.find((candidate) => candidate.id === stepId);
  if (!workflow || !step) return null;
  return workflowStepToMissionHubItem(
    workflow,
    step,
    pinnedIds.has(workflowStepItemId(workflow.id, step.id)),
    timestamp,
  );
}

function navigatorItemToMissionHubItem(
  item: AtlasNavigatorItem,
  pinned: boolean,
  timestamp?: number,
): AtlasMissionHubItem {
  return {
    id: item.id,
    kind: missionKindForNavigatorItem(item),
    title: item.title,
    subtitle: item.subtitle,
    source: item.source,
    model: item.kind === "panel-action" ? "Existing Atlas panel action" : item.action,
    primaryMetric: item.primaryMetric,
    boundary: boundaryForNavigatorItem(item),
    actionLabel: item.actionLabel,
    timestamp,
    pinned,
    stale: false,
    navigatorItemId: item.id,
    navigatorItem: item,
  };
}

function workflowToMissionHubItem(
  workflow: AtlasWorkflow,
  pinned: boolean,
  timestamp?: number,
): AtlasMissionHubItem {
  return {
    id: `workflow:${workflow.id}`,
    kind: "workflow",
    title: workflow.title,
    subtitle: workflow.subtitle,
    source: workflow.source,
    model: workflow.model,
    primaryMetric: `${workflow.readyStepCount}/${workflow.stepCount} steps ready`,
    boundary: workflow.boundary,
    actionLabel: "Open workflow",
    timestamp,
    pinned,
    stale: false,
    navigatorItemId: "panel:atlas-workflows",
    workflowId: workflow.id,
  };
}

function workflowStepToMissionHubItem(
  workflow: AtlasWorkflow,
  step: AtlasWorkflowStep,
  pinned: boolean,
  timestamp?: number,
): AtlasMissionHubItem {
  return {
    id: workflowStepItemId(workflow.id, step.id),
    kind: "workflow-step",
    title: step.title,
    subtitle: `${workflow.title} / ${step.expectedSurface}`,
    source: step.source,
    model: step.model,
    primaryMetric: step.target,
    boundary: step.blockedReason ?? step.boundary,
    actionLabel: step.status === "blocked" ? "Blocked" : step.actionLabel,
    timestamp,
    pinned,
    stale: false,
    navigatorItemId: step.navigatorItemId,
    navigatorItem: step.navigatorItem,
    workflowId: workflow.id,
    workflowStepId: step.id,
  };
}

function staleMissionHubItem(stored: AtlasMissionHubStoredItem): AtlasMissionHubItem {
  return {
    id: stored.id,
    kind: stored.kind,
    title: "Unavailable local item",
    subtitle: stored.id,
    source: "Atlas Mission Hub localStorage",
    model: "Stale local session reference",
    primaryMetric: "Item no longer exists in the local Navigator index",
    boundary: "This stored shortcut is readable but cannot execute until the target returns.",
    actionLabel: "Unavailable",
    timestamp: stored.timestamp,
    pinned: false,
    stale: true,
  };
}

function itemToContext(item: AtlasMissionHubItem): AtlasMissionHubContext {
  return {
    currentKind: item.kind,
    currentId: item.id,
    title: item.title,
    subtitle: item.subtitle,
    source: item.source,
    model: item.model,
    primaryMetric: item.primaryMetric,
    boundary: item.boundary,
  };
}

function findNextWorkflowStep(
  currentId: string,
  workflowById: ReadonlyMap<string, AtlasWorkflow>,
) {
  const parsed = parseWorkflowStepItemId(currentId);
  if (!parsed) return null;
  const workflow = workflowById.get(parsed.workflowId);
  if (!workflow) return null;
  const index = workflow.steps.findIndex((step) => step.id === parsed.stepId);
  const step = workflow.steps.slice(index + 1).find((candidate) => candidate.status !== "blocked");
  if (!step) return null;
  return { workflow, step, id: workflowStepItemId(workflow.id, step.id) };
}

function normalizeStoredItems(value: unknown, maxItems: number): readonly AtlasMissionHubStoredItem[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const items: AtlasMissionHubStoredItem[] = [];
  for (const candidate of value) {
    const item = normalizeStoredItem(candidate);
    if (!item || seen.has(item.id)) continue;
    seen.add(item.id);
    items.push(item);
  }
  return items
    .sort((a, b) => b.timestamp - a.timestamp || a.id.localeCompare(b.id))
    .slice(0, maxItems);
}

function normalizeStoredItem(value: unknown): AtlasMissionHubStoredItem | null {
  if (!value || typeof value !== "object") return null;
  const record = value as {
    id?: unknown;
    kind?: unknown;
    timestamp?: unknown;
  };
  if (typeof record.id !== "string" || !record.id.trim()) return null;
  if (!isMissionHubItemKind(record.kind)) return null;
  const timestamp = typeof record.timestamp === "number" && Number.isFinite(record.timestamp)
    ? record.timestamp
    : 0;
  return {
    id: record.id.trim(),
    kind: record.kind,
    timestamp,
  };
}

function missionKindForNavigatorItem(item: AtlasNavigatorItem): AtlasMissionHubItemKind {
  if (item.kind === "panel-action") return "panel-action";
  return item.kind;
}

function isMissionHubItemKind(value: unknown): value is AtlasMissionHubItemKind {
  return (
    value === "solar-body" ||
    value === "celestial-object" ||
    value === "gaia-star" ||
    value === "evidence-claim" ||
    value === "workflow" ||
    value === "workflow-step" ||
    value === "panel-action"
  );
}

function boundaryForNavigatorItem(item: AtlasNavigatorItem): string {
  if (item.kind === "celestial-object" || item.kind === "gaia-star") {
    return "Catalog navigation only; no physical body is inserted into the simulation.";
  }
  if (item.kind === "solar-body") {
    return "Focuses an existing solar-system body without changing EIH 1PN dynamics.";
  }
  if (item.kind === "evidence-claim") {
    return "Opens an existing Evidence Passport; it does not introduce new validation data.";
  }
  return "Opens an existing Atlas panel without changing simulation physics.";
}

function workflowStepItemId(workflowId: AtlasWorkflowId, stepId: string): string {
  return `workflow-step:${workflowId}:${stepId}`;
}

function parseWorkflowStepItemId(id: string): { workflowId: AtlasWorkflowId; stepId: string } | null {
  const match = /^workflow-step:([^:]+):(.+)$/.exec(id);
  if (!match) return null;
  return {
    workflowId: match[1] as AtlasWorkflowId,
    stepId: match[2],
  };
}

function emptyStoredState(): AtlasMissionHubStoredState {
  return {
    recentActions: [],
    pinnedItems: [],
  };
}
