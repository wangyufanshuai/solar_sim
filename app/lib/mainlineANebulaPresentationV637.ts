import type {
  NebulaAtlasEntry,
  NebulaAtlasFilter,
  NebulaAtlasKind,
  NebulaAtlasOrder,
} from "./mainlineANebulaAtlasV609";

export type NebulaCatalogField = "galLonDeg" | "galLatDeg" | "distancePc" | "sizeArcmin";
export type NebulaMeasurementState = "known" | "missing" | "invalid";
export type NebulaAtlasScope = "all" | "current" | "candidate";
export type NebulaAtlasCompleteness = "all" | "complete" | "incomplete";

export const NEBULA_CATALOG_FIELDS: readonly NebulaCatalogField[] = [
  "distancePc", "sizeArcmin", "galLonDeg", "galLatDeg",
];

const FIELD_LABELS: Record<NebulaCatalogField, string> = {
  distancePc: "目录距离",
  sizeArcmin: "目录角径",
  galLonDeg: "银经 l",
  galLatDeg: "银纬 b",
};

const FIELD_UNITS: Record<NebulaCatalogField, string> = {
  distancePc: "pc", sizeArcmin: "′", galLonDeg: "°", galLatDeg: "°",
};

export const NEBULA_KIND_LABELS: Record<NebulaAtlasKind, string> = {
  emission: "发射星云",
  reflection: "反射星云",
  dark: "暗星云",
  planetary: "行星状星云",
  "supernova-remnant": "超新星遗迹",
  unknown: "类型待核",
};

export function normalizeNebulaKind(value: unknown): NebulaAtlasKind {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(NEBULA_KIND_LABELS, value)
    ? value as NebulaAtlasKind : "unknown";
}

export function nebulaMeasurementState(value: unknown, field: NebulaCatalogField): NebulaMeasurementState {
  if (value === null || value === undefined) return "missing";
  if (typeof value !== "number" || !Number.isFinite(value)) return "invalid";
  if (field === "galLonDeg") return value >= 0 && value < 360 ? "known" : "invalid";
  if (field === "galLatDeg") return value >= -90 && value <= 90 ? "known" : "invalid";
  if (field === "sizeArcmin") return value > 0 && value <= 21600 ? "known" : "invalid";
  return value > 0 ? "known" : "invalid";
}

export function normalizeNebulaMeasurement(value: unknown, field: NebulaCatalogField): number | null {
  if (nebulaMeasurementState(value, field) !== "known") return null;
  return Object.is(value, -0) ? 0 : value as number;
}

export function formatNebulaMeasurement(value: unknown, field: NebulaCatalogField): string {
  const state = nebulaMeasurementState(value, field);
  if (state === "missing") return "未提供";
  if (state === "invalid") return "待核实";
  const numeric = Object.is(value, -0) ? 0 : value as number;
  // Retain small positive values instead of rounding them to a misleading zero.
  const formatted = Math.abs(numeric) > 0 && Math.abs(numeric) < 0.001
    ? numeric.toExponential(2)
    : numeric.toLocaleString("zh-CN", { maximumFractionDigits: 3 });
  return `${formatted}${field === "distancePc" ? " " : ""}${FIELD_UNITS[field]}`;
}

export function nebulaCatalogMeasurements(entry: Pick<NebulaAtlasEntry, NebulaCatalogField>) {
  return NEBULA_CATALOG_FIELDS.map((field) => ({
    field,
    label: FIELD_LABELS[field],
    state: nebulaMeasurementState(entry[field], field),
    value: normalizeNebulaMeasurement(entry[field], field),
    formatted: formatNebulaMeasurement(entry[field], field),
  }));
}

export function nebulaKnownMeasurementCount(entry: Pick<NebulaAtlasEntry, NebulaCatalogField>): number {
  return NEBULA_CATALOG_FIELDS.filter((field) => nebulaMeasurementState(entry[field], field) === "known").length;
}

export function normalizeNebulaSearch(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase("en")
    .replace(/\b(ngc|ic|m|sh2|w)\s*-?\s*(\d+)\b/g, "$1$2")
    .replace(/[_‐‑–—-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function nebulaCatalogAliases(value: string): readonly string[] {
  return [...new Set(value.split(/[\/;|]/).map((alias) => normalizeNebulaSearch(alias)).filter(Boolean))];
}

export function sameNebulaCatalog(left: string, right: string): boolean {
  const aliases = new Set(nebulaCatalogAliases(left));
  return nebulaCatalogAliases(right).some((alias) => aliases.has(alias));
}

export function nebulaEntryMatchesQuery(entry: NebulaAtlasEntry, query: string): boolean {
  const tokens = normalizeNebulaSearch(query).split(" ").filter(Boolean);
  const haystack = normalizeNebulaSearch([
    entry.id, entry.displayName, entry.catalogName, entry.subtitleCn,
    entry.sourceTarget ?? "", entry.kind, NEBULA_KIND_LABELS[entry.kind],
  ].join(" "));
  return tokens.every((token) => haystack.includes(token));
}

export function nebulaEntryMatchesFilter(entry: NebulaAtlasEntry, filter: NebulaAtlasFilter): boolean {
  if (filter === "all") return true;
  if (filter === "license-recorded") return entry.tier === "current" && Boolean(entry.sourceLicense);
  if (filter === "rights-cleared") return entry.rights === "cleared" && entry.releaseAdmission === "approved" && entry.humanRightsSignoff === "signed";
  if (filter === "rights-review") return entry.humanRightsSignoff === "pending" && entry.rights !== "missing";
  if (filter === "rights-missing") return entry.rights === "missing";
  return entry.kind === filter;
}

export function compareNebulaMeasurements(
  left: NebulaAtlasEntry,
  right: NebulaAtlasEntry,
  field: "distancePc" | "sizeArcmin",
  descending = false,
): number {
  const leftValue = normalizeNebulaMeasurement(left[field], field);
  const rightValue = normalizeNebulaMeasurement(right[field], field);
  if (leftValue === null && rightValue !== null) return 1;
  if (leftValue !== null && rightValue === null) return -1;
  if (leftValue !== null && rightValue !== null && leftValue !== rightValue) {
    return descending ? rightValue - leftValue : leftValue - rightValue;
  }
  return left.id.localeCompare(right.id, "en");
}

export function orderNebulaEntries(entries: readonly NebulaAtlasEntry[], order: NebulaAtlasOrder): NebulaAtlasEntry[] {
  const sorted = [...entries];
  if (order === "distance") sorted.sort((a, b) => compareNebulaMeasurements(a, b, "distancePc"));
  if (order === "angular-size") sorted.sort((a, b) => compareNebulaMeasurements(a, b, "sizeArcmin", true));
  if (order === "name") sorted.sort((a, b) => a.catalogName.localeCompare(b.catalogName, "en", { numeric: true }) || a.id.localeCompare(b.id, "en"));
  return sorted;
}

export interface NebulaAtlasViewState {
  query: string;
  filter: NebulaAtlasFilter;
  order: NebulaAtlasOrder;
  scope: NebulaAtlasScope;
  completeness: NebulaAtlasCompleteness;
  selectedId: string | null;
}

export type NebulaAtlasAction =
  | { type: "query"; value: string }
  | { type: "filter"; value: NebulaAtlasFilter }
  | { type: "order"; value: NebulaAtlasOrder }
  | { type: "scope"; value: NebulaAtlasScope }
  | { type: "completeness"; value: NebulaAtlasCompleteness }
  | { type: "select"; id: string }
  | { type: "step"; direction: -1 | 1 }
  | { type: "reset" };

export function createNebulaAtlasState(entries: readonly NebulaAtlasEntry[]): NebulaAtlasViewState {
  return {
    query: "", filter: "all", order: "catalog", scope: "all", completeness: "all",
    selectedId: entries.find((entry) => entry.tier === "current")?.id ?? entries[0]?.id ?? null,
  };
}

function matchesScopeAndCompleteness(entry: NebulaAtlasEntry, state: NebulaAtlasViewState): boolean {
  if (state.scope !== "all" && entry.tier !== state.scope) return false;
  const complete = nebulaKnownMeasurementCount(entry) === NEBULA_CATALOG_FIELDS.length;
  if (state.completeness === "complete" && !complete) return false;
  if (state.completeness === "incomplete" && complete) return false;
  return true;
}

export function nebulaAtlasView(entries: readonly NebulaAtlasEntry[], state: NebulaAtlasViewState) {
  const scoped = entries.filter((entry) => matchesScopeAndCompleteness(entry, state) && nebulaEntryMatchesQuery(entry, state.query));
  const visible = orderNebulaEntries(scoped.filter((entry) => nebulaEntryMatchesFilter(entry, state.filter)), state.order);
  const selectedIndex = visible.findIndex((entry) => entry.id === state.selectedId);
  const selected = selectedIndex < 0 ? null : visible[selectedIndex];
  const unknownSortValues = state.order === "distance" || state.order === "angular-size"
    ? visible.filter((entry) => normalizeNebulaMeasurement(entry[state.order === "distance" ? "distancePc" : "sizeArcmin"], state.order === "distance" ? "distancePc" : "sizeArcmin") === null).length
    : 0;
  return {
    visible,
    selected,
    selectedIndex,
    scoped,
    unknownSortValues,
    canGoPrevious: selectedIndex > 0,
    canGoNext: selectedIndex >= 0 && selectedIndex < visible.length - 1,
    filtered: state.query.trim() !== "" || state.filter !== "all" || state.scope !== "all" || state.completeness !== "all",
    currentCount: visible.filter((entry) => entry.tier === "current").length,
    candidateCount: visible.filter((entry) => entry.tier === "candidate").length,
    incompleteCount: visible.filter((entry) => nebulaKnownMeasurementCount(entry) < NEBULA_CATALOG_FIELDS.length).length,
  };
}

export function reduceNebulaAtlasState(
  state: NebulaAtlasViewState,
  action: NebulaAtlasAction,
  entries: readonly NebulaAtlasEntry[],
): NebulaAtlasViewState {
  const before = nebulaAtlasView(entries, state);
  if (action.type === "select") {
    return before.visible.some((entry) => entry.id === action.id) ? { ...state, selectedId: action.id } : state;
  }
  if (action.type === "step") {
    if (before.selectedIndex < 0) return state;
    const target = before.visible[before.selectedIndex + action.direction];
    return target ? { ...state, selectedId: target.id } : state;
  }
  const next: NebulaAtlasViewState = action.type === "reset"
    ? { ...createNebulaAtlasState(entries), selectedId: state.selectedId }
    : { ...state, [action.type]: action.value };
  const view = nebulaAtlasView(entries, next);
  return { ...next, selectedId: view.selected?.id ?? view.visible[0]?.id ?? null };
}

export function nebulaAtlasResultsAnnouncement(entries: readonly NebulaAtlasEntry[], state: NebulaAtlasViewState): string {
  const view = nebulaAtlasView(entries, state);
  const count = `显示 ${view.visible.length} / ${entries.length} 条，其中当前 ${view.currentCount} 条、候选 ${view.candidateCount} 条。`;
  if (!view.visible.length) return `${count}没有匹配记录，可清除筛选。`;
  const selected = view.selected ? `已选 ${view.selected.subtitleCn}，${view.selected.catalogName}。` : "尚未选择记录。";
  const missing = view.unknownSortValues > 0 ? `${view.unknownSortValues} 条排序值未提供或无效，已置于末尾。` : "";
  return `${count}${selected}${missing}`;
}

export function nebulaHttpsLink(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) return null;
    return url.href;
  } catch {
    return null;
  }
}

export function nebulaLocalPreviewPath(entry: Pick<NebulaAtlasEntry, "tier" | "runtimeAdmission" | "sourceImagePath">): string | null {
  if (entry.tier !== "current" || entry.runtimeAdmission !== "current") return null;
  const path = entry.sourceImagePath;
  return path && /^\/textures\/mainline-a\/[a-z0-9][a-z0-9_-]*\.(?:jpe?g|png|webp|avif)$/i.test(path) ? path : null;
}

export function nebulaSourceDimensions(width: unknown, height: unknown): { width: number; height: number } | null {
  if (typeof width !== "number" || typeof height !== "number") return null;
  if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width <= 0 || height <= 0) return null;
  return { width, height };
}

export function formatNebulaSourceBytes(value: number | null): string {
  if (value === null) return "未提供";
  if (!Number.isSafeInteger(value) || value <= 0) return "待核实";
  return `${value.toLocaleString("zh-CN")} bytes`;
}

export interface NebulaPreviewState {
  path: string | null;
  status: "unavailable" | "loading" | "loaded" | "failed";
  attempt: number;
}

export type NebulaPreviewAction =
  | { type: "loaded"; path: string; attempt: number; width: number; height: number }
  | { type: "failed"; path: string; attempt: number }
  | { type: "retry" };

export function createNebulaPreviewState(path: string | null): NebulaPreviewState {
  return { path, status: path ? "loading" : "unavailable", attempt: 0 };
}

export function reduceNebulaPreviewState(state: NebulaPreviewState, action: NebulaPreviewAction): NebulaPreviewState {
  if (!state.path) return state;
  if (action.type === "retry") {
    return state.status === "failed" ? { ...state, status: "loading", attempt: state.attempt + 1 } : state;
  }
  if (state.status !== "loading" || action.path !== state.path || action.attempt !== state.attempt) return state;
  const loaded = action.type === "loaded" && nebulaSourceDimensions(action.width, action.height) !== null;
  return { ...state, status: loaded ? "loaded" : "failed" };
}
