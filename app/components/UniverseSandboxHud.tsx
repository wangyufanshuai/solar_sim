"use client";

import { ChevronDown, ChevronLeft, Menu } from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
} from "react";
import { SOLAR_SYSTEM_BODIES } from "../data/planetsJ2000";
import { MAINLINE_A_CURRENT_CONSTELLATION_CODES } from "../data/mainlineAMetadataV607";
import {
  celestialEntriesForKinds,
  celestialEntryToDirection,
  celestialDisplayNameZh,
  celestialKindLabelZh,
  celestialSearchTextZh,
} from "../lib/celestialCatalog";
import { ATLAS_INSTRUMENT_UI_VERSION } from "../lib/atlasInstrumentUi";
import { mainlineAConstellationCatalogRowsV638 } from "../lib/mainlineAConstellationSelectionV638";
import type { CelestialCatalogEntry } from "../lib/simulationDiagnosticsTypes";
import type { SimulationViewSettings } from "../lib/simulationViewSettings";
import type { BottomControlBarSection } from "./BottomControlBar";

type Props = {
  activeSection: BottomControlBarSection;
  searchFocusNonce: number;
  selectedBodyIndex: number | null;
  selectedCatalogId?: string;
  onBodyFocus: (bodyIndex: number) => void;
  onBodyInspect: (bodyIndex: number) => void;
  onNearbyStarFocus?: (direction: [number, number, number], catalogId?: string) => void;
  onConstellationFocus?: (direction: [number, number, number], catalogId?: string) => void;
  viewSettings: SimulationViewSettings;
  onViewSettingsChange: (next: SimulationViewSettings) => void;
  visualEnhance: boolean;
  onVisualEnhanceChange: (next: boolean) => void;
  leftPanelCollapsed: boolean;
  onLeftPanelCollapsedChange: (collapsed: boolean) => void;
  lagrangeSpawnNonceRef: MutableRefObject<number>;
  onAtlasMissionHubOpen?: () => void;
  onAtlasObservatoryDeckOpen?: () => void;
  onAtlasWorkflowsOpen?: () => void;
  onAtlasScientificReportOpen?: () => void;
  onAtlasValidationConsoleOpen?: () => void;
  onEvidenceLedgerOpen?: () => void;
  onExportSystemState?: () => void;
  onImportSystemState?: () => void;
};

const IS = 1.0;
const STAR_CATALOG_ENTRIES = celestialEntriesForKinds(["nearby-star", "bright-star"]);
const CONSTELLATION_CATALOG_ENTRIES = celestialEntriesForKinds(["constellation"]);
const DEEP_SKY_CATALOG_ENTRIES = celestialEntriesForKinds([
  "nebula",
  "star-cluster",
  "galaxy",
  "pulsar",
]);

const KIND_LABELS: Record<CelestialCatalogEntry["kind"], string> = {
  "nearby-star": "近邻",
  "bright-star": "亮星",
  nebula: "星云",
  "star-cluster": "星团",
  galaxy: "星系",
  pulsar: "脉冲星",
  constellation: "星座",
};

function catalogEntryMatches(entry: CelestialCatalogEntry, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [
    entry.id,
    entry.primaryName,
    entry.catalogName,
    entry.subtitle,
    entry.searchText,
    celestialSearchTextZh(entry),
  ]
    .join(" ")
    .toLowerCase()
    .includes(q);
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 border-b border-white/5 py-2 text-[12px] text-[rgba(215,215,215,0.82)]">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-3.5 w-3.5 rounded border-white/20 bg-transparent text-white focus:ring-0"
      />
    </label>
  );
}

export default function UniverseSandboxHud({
  activeSection,
  searchFocusNonce,
  selectedBodyIndex,
  selectedCatalogId = "",
  onBodyFocus,
  onBodyInspect,
  onNearbyStarFocus,
  onConstellationFocus,
  viewSettings,
  onViewSettingsChange,
  visualEnhance,
  onVisualEnhanceChange,
  leftPanelCollapsed,
  onLeftPanelCollapsedChange,
  lagrangeSpawnNonceRef,
  onAtlasMissionHubOpen,
  onAtlasObservatoryDeckOpen,
  onAtlasWorkflowsOpen,
  onAtlasScientificReportOpen,
  onAtlasValidationConsoleOpen,
  onEvidenceLedgerOpen,
  onExportSystemState,
  onImportSystemState,
}: Props) {
  const [query, setQuery] = useState("");
  const [solarOpen, setSolarOpen] = useState(true);
  const [nearbyOpen, setNearbyOpen] = useState(false);
  const [constellationsOpen, setConstellationsOpen] = useState(false);
  const [constellationScope, setConstellationScope] = useState<"all" | "canonical">("all");
  const [deepSkyOpen, setDeepSkyOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const browserToggleRef = useRef<HTMLButtonElement>(null);
  const pendingSearchFocusRef = useRef(false);
  const consumedSearchFocusNonceRef = useRef(0);

  useEffect(() => {
    if (searchFocusNonce <= 0 || searchFocusNonce === consumedSearchFocusNonceRef.current) return;
    consumedSearchFocusNonceRef.current = searchFocusNonce;
    pendingSearchFocusRef.current = true;
    onLeftPanelCollapsedChange(false);
  }, [onLeftPanelCollapsedChange, searchFocusNonce]);

  useEffect(() => {
    if (leftPanelCollapsed || !pendingSearchFocusRef.current) return;
    const frame = requestAnimationFrame(() => {
      if (!searchRef.current || !pendingSearchFocusRef.current) return;
      searchRef.current.focus({ preventScroll: true });
      searchRef.current.select();
      pendingSearchFocusRef.current = false;
    });
    return () => cancelAnimationFrame(frame);
  }, [leftPanelCollapsed, searchFocusNonce]);

  // Searching is also a navigation action: expose matching catalog entries
  // immediately instead of leaving them hidden behind collapsed sections.
  useEffect(() => {
    if (!query.trim()) return;
    setSolarOpen(true);
    setNearbyOpen(true);
    setConstellationsOpen(true);
    setDeepSkyOpen(true);
  }, [query]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SOLAR_SYSTEM_BODIES.map((_, i) => i);
    return SOLAR_SYSTEM_BODIES.map((b, i) => ({ b, i }))
      .filter(
        ({ b }) =>
          b.name.toLowerCase().includes(q) || b.id.toLowerCase().includes(q),
      )
      .map(({ i }) => i);
  }, [query]);

  const patch = (p: Partial<SimulationViewSettings>) =>
    onViewSettingsChange({ ...viewSettings, ...p });
  const constellationRows = useMemo(() => mainlineAConstellationCatalogRowsV638(
    CONSTELLATION_CATALOG_ENTRIES, MAINLINE_A_CURRENT_CONSTELLATION_CODES, constellationScope,
  ).filter((entry) => catalogEntryMatches(entry, query)), [constellationScope, query]);

  function closeBrowser() {
    pendingSearchFocusRef.current = false;
    onLeftPanelCollapsedChange(true);
    browserToggleRef.current?.focus({ preventScroll: true });
  }

  function showConstellations(scope: "all" | "canonical") {
    setConstellationScope(scope);
    setQuery("");
    setSolarOpen(false);
    setNearbyOpen(false);
    setDeepSkyOpen(false);
    setConstellationsOpen(true);
  }

  function selectConstellation(entry: CelestialCatalogEntry) {
    const direction = celestialEntryToDirection(entry);
    if (!direction || !onConstellationFocus) return;
    if (!viewSettings.showConstellationLines) patch({ showConstellationLines: true });
    onConstellationFocus(direction, entry.id);
    if (window.matchMedia("(max-width: 639px)").matches) closeBrowser();
  }

  function selectSkyEntry(entry: CelestialCatalogEntry) {
    const direction = celestialEntryToDirection(entry);
    if (!direction || !onNearbyStarFocus) return;
    onNearbyStarFocus(direction, entry.id);
    if (window.matchMedia("(max-width: 639px)").matches) closeBrowser();
  }

  return (
    <>
      <button
        ref={browserToggleRef}
        type="button"
        onClick={() => {
          if (!leftPanelCollapsed) closeBrowser();
          else {
            pendingSearchFocusRef.current = true;
            onLeftPanelCollapsedChange(false);
          }
        }}
        className={`pointer-events-auto fixed left-3 flex h-11 w-11 items-center justify-center rounded-full bg-black/55 text-white/75 backdrop-blur-md transition-colors hover:bg-black/75 hover:text-white focus-visible:outline-2 focus-visible:outline-cyan-200 ${leftPanelCollapsed ? "z-[98]" : "z-[132] sm:z-[98]"}`}
        style={{ top: "var(--mainline-a-header-bottom, 0.75rem)" }}
        aria-expanded={!leftPanelCollapsed}
        aria-controls="universe-object-browser"
        aria-label={leftPanelCollapsed ? "打开对象浏览器" : "收起对象浏览器"}
        data-mainline-a-object-browser-toggle="true"
      >
        <Menu className="h-4 w-4" strokeWidth={IS} />
      </button>

      {!leftPanelCollapsed ? (
      <aside
        id="universe-object-browser"
        aria-label="对象浏览器"
        data-atlas-camera-safe-occluder="object-browser"
        style={{ top: "var(--mainline-a-header-bottom, 0px)", height: "calc(100dvh - var(--mainline-a-header-bottom, 0px))" }}
        onKeyDown={(event) => {
          if (event.key !== "Escape" || event.defaultPrevented || event.nativeEvent.isComposing) return;
          event.preventDefault();
          event.stopPropagation();
          closeBrowser();
        }}
        className={`fixed left-0 z-[130] flex min-h-0 w-[min(100vw,286px)] flex-col bg-[rgba(18,18,20,0.90)] pb-[calc(var(--ui-dock-height)+8px+env(safe-area-inset-bottom))] shadow-[0_20px_70px_rgba(0,0,0,0.4)] backdrop-blur-2xl transition-transform duration-200 sm:z-[95] ${
          leftPanelCollapsed ? "-translate-x-full" : "translate-x-0"
        }`}
      >
        <div className="flex min-h-14 shrink-0 items-center justify-between pl-16 pr-3">
          <div className="text-[11px] tracking-[0.24em] text-white/45">对象</div>
          <button
            type="button"
            onClick={closeBrowser}
            className="flex h-11 w-11 items-center justify-center rounded-full text-slate-400 transition-colors hover:text-white/75"
            aria-label="收起对象浏览器"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={IS} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="px-4 pb-3">
          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索天体、星云、星座"
            className="w-full rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-[12px] text-white/84 outline-none placeholder:text-white/28 focus:border-white/18"
            aria-label="搜索对象"
            data-atlas-object-search="true"
          />
          <div className="mt-2 flex gap-2" aria-label="星座范围">
            <button type="button" onClick={() => showConstellations("canonical")}
              aria-pressed={constellationsOpen && constellationScope === "canonical"}
              data-mainline-a-constellation-shortcut="canonical"
              className="min-h-11 flex-1 rounded border border-cyan-100/20 px-2 text-[11px] text-cyan-50 aria-pressed:bg-cyan-100/10">
              重点星座 · 12
            </button>
            <button type="button" onClick={() => showConstellations("all")}
              aria-pressed={constellationsOpen && constellationScope === "all"}
              data-mainline-a-constellation-shortcut="all"
              className="min-h-11 flex-1 rounded border border-white/15 px-2 text-[11px] text-white/70 aria-pressed:bg-white/10">
              全部星座
            </button>
          </div>
        </div>

        <nav className="px-3 text-white/70">
          <SectionHeader
            label="太阳系"
            count={filtered.length}
            open={solarOpen}
            onClick={() => setSolarOpen((v) => !v)}
          />
          {solarOpen ? (
            <ul className="mb-3 mt-1">
              {filtered.map((bodyIndex) => {
                const def = SOLAR_SYSTEM_BODIES[bodyIndex]!;
                const active = selectedBodyIndex === bodyIndex;
                return (
                  <li key={def.id}>
                    <button
                      type="button"
                      onClick={() => onBodyFocus(bodyIndex)}
                      onDoubleClick={(e) => {
                        e.preventDefault();
                        onBodyInspect(bodyIndex);
                      }}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[12px] transition-colors ${
                        active
                          ? "bg-white/[0.08] text-white"
                          : "text-white/62 hover:bg-white/[0.05] hover:text-white/86"
                      }`}
                      data-atlas-navigator-item-id={`solar-body:${def.id}`}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: def.orbitColor }}
                      />
                      <span className="truncate">{def.name}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}

          <SectionHeader
            label="近邻恒星"
            count={STAR_CATALOG_ENTRIES.length}
            open={nearbyOpen}
            onClick={() => setNearbyOpen((v) => !v)}
          />
          {nearbyOpen ? (
            <ul className="mb-4 mt-1">
              {STAR_CATALOG_ENTRIES.map((entry) => {
                if (!catalogEntryMatches(entry, query)) return null;
                const direction = celestialEntryToDirection(entry);
                const active = selectedCatalogId === entry.id;
                return (
                  <li key={entry.id}>
                    <button
                      type="button"
                      onClick={() => selectSkyEntry(entry)}
                      disabled={!direction || !onNearbyStarFocus}
                      className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[12px] transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                        active
                          ? "bg-cyan-100/[0.08] text-white shadow-[inset_2px_0_0_rgba(165,243,252,0.45)]"
                          : "text-white/62 hover:bg-white/[0.05] hover:text-white/86"
                      }`}
                      data-celestial-catalog-entry-id={entry.id}
                      aria-pressed={active}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: entry.color }}
                      />
                      <CatalogEntryText entry={entry} />
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}

          <SectionHeader
            label="星座"
            count={constellationRows.length}
            open={constellationsOpen}
            onClick={() => setConstellationsOpen((v) => !v)}
          />
          {constellationsOpen ? (
            <ul className="mb-4 mt-1" data-mainline-a-constellation-index="true" data-mainline-a-constellation-scope={constellationScope}>
              {constellationRows.length === 0 ? <li role="status" className="px-3 py-3 text-xs text-slate-400">没有匹配的星座。可清空搜索或选择全部星座。</li> : null}
              {constellationRows.map((entry) => {
                const direction = celestialEntryToDirection(entry);
                const active = selectedCatalogId === entry.id;
                return (
                  <li key={entry.id}>
                    <button
                      type="button"
                      onClick={() => selectConstellation(entry)}
                      disabled={!direction || !onConstellationFocus}
                      className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-1.5 text-left text-[12px] transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                        active
                          ? "bg-cyan-100/[0.08] text-white shadow-[inset_2px_0_0_rgba(165,243,252,0.45)]"
                          : "text-white/62 hover:bg-white/[0.05] hover:text-white/86"
                      }`}
                      data-celestial-catalog-entry-id={entry.id}
                      data-mainline-a-current={MAINLINE_A_CURRENT_CONSTELLATION_CODES.includes(entry.id.replace("constellation:", "") as typeof MAINLINE_A_CURRENT_CONSTELLATION_CODES[number]) ? "true" : undefined}
                      aria-pressed={active}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: entry.color }}
                      />
                      <CatalogEntryText entry={entry} compact />
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}

          <SectionHeader
            label="深空"
            count={DEEP_SKY_CATALOG_ENTRIES.length}
            open={deepSkyOpen}
            onClick={() => setDeepSkyOpen((v) => !v)}
          />
          {deepSkyOpen ? (
            <ul className="mb-4 mt-1">
              {DEEP_SKY_CATALOG_ENTRIES.map((entry) => {
                if (!catalogEntryMatches(entry, query)) return null;
                const direction = celestialEntryToDirection(entry);
                const active = selectedCatalogId === entry.id;
                return (
                  <li key={entry.id}>
                    <button
                      type="button"
                      onClick={() => selectSkyEntry(entry)}
                      disabled={!direction || !onNearbyStarFocus}
                      className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-1.5 text-left text-[12px] transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                        active
                          ? "bg-cyan-100/[0.08] text-white shadow-[inset_2px_0_0_rgba(165,243,252,0.45)]"
                          : "text-white/62 hover:bg-white/[0.05] hover:text-white/86"
                      }`}
                      data-celestial-catalog-entry-id={entry.id}
                      aria-pressed={active}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: entry.color }}
                      />
                      <CatalogEntryText entry={entry} />
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </nav>
        </div>
      </aside>
      ) : null}

      {(activeSection === "view" || activeSection === "tools") && (
        <div className="pointer-events-none fixed bottom-[calc(var(--ui-dock-height)+10px+env(safe-area-inset-bottom))] left-1/2 z-[96] w-[min(92vw,360px)] -translate-x-1/2">
          <div
            className="pointer-events-auto rounded-2xl border border-cyan-100/12 bg-[rgba(12,15,18,0.90)] px-4 py-3 shadow-[0_24px_60px_rgba(0,0,0,0.38)] backdrop-blur-2xl"
            data-atlas-instrument-ui-version={ATLAS_INSTRUMENT_UI_VERSION}
          >
            {activeSection === "view" ? (
              <div>
                <div className="mb-2 text-[11px] tracking-[0.22em] text-slate-400">
                  显示
                </div>
                <ToggleRow
                  label="天体标签"
                  checked={viewSettings.showBodyLabels}
                  onChange={(v) => patch({ showBodyLabels: v })}
                />
                <ToggleRow
                  label="实时轨迹"
                  checked={viewSettings.showOrbitTrails}
                  onChange={(v) => patch({ showOrbitTrails: v })}
                />
                <ToggleRow
                  label="参考轨道"
                  checked={viewSettings.showReferenceOrbits}
                  onChange={(v) => patch({ showReferenceOrbits: v })}
                />
                <ToggleRow
                  label="星座连线"
                  checked={viewSettings.showConstellationLines}
                  onChange={(v) => patch({ showConstellationLines: v })}
                />
                <ToggleRow
                  label="星座边界"
                  checked={viewSettings.showConstellationBoundaries !== false}
                  onChange={(v) => patch({ showConstellationBoundaries: v })}
                />
                <ToggleRow
                  label="深空天体"
                  checked={viewSettings.showDeepSkyObjects}
                  onChange={(v) => patch({ showDeepSkyObjects: v })}
                />
                <ToggleRow
                  label="目录标签"
                  checked={viewSettings.showCatalogLabels}
                  onChange={(v) => patch({ showCatalogLabels: v })}
                />
                <ToggleRow
                  label="拉格朗日点"
                  checked={viewSettings.showLagrangePoints}
                  onChange={(v) => patch({ showLagrangePoints: v })}
                />
                <ToggleRow
                  label="相对论光学"
                  checked={viewSettings.showRelativisticOptics}
                  onChange={(v) => patch({ showRelativisticOptics: v })}
                />
                <ToggleRow
                  label="Kerr 相对论实验室"
                  checked={viewSettings.showKerrBlackHole}
                  onChange={(v) => patch({ showKerrBlackHole: v })}
                />
                <ToggleRow
                  label="视觉增强"
                  checked={visualEnhance}
                  onChange={onVisualEnhanceChange}
                />
              </div>
            ) : (
              <div>
                <div className="mb-2 text-[11px] tracking-[0.22em] text-slate-400">
                  工具
                </div>
                <ToolButton
                  label="生成拉格朗日测试粒子"
                  onClick={() => {
                    lagrangeSpawnNonceRef.current += 1;
                  }}
                  disabled={!viewSettings.showLagrangePoints}
                />
                {onAtlasMissionHubOpen ? (
                  <ToolButton label="任务中心" onClick={onAtlasMissionHubOpen} />
                ) : null}
                {onAtlasObservatoryDeckOpen ? (
                  <ToolButton label="观测台" onClick={onAtlasObservatoryDeckOpen} />
                ) : null}
                {onAtlasWorkflowsOpen ? (
                  <ToolButton label="图谱流程" onClick={onAtlasWorkflowsOpen} />
                ) : null}
                {onAtlasScientificReportOpen ? (
                  <ToolButton label="报告工作室" onClick={onAtlasScientificReportOpen} />
                ) : null}
                {onAtlasValidationConsoleOpen ? (
                  <ToolButton label="验证控制台" onClick={onAtlasValidationConsoleOpen} />
                ) : null}
                {onEvidenceLedgerOpen ? (
                  <ToolButton label="证据账本" onClick={onEvidenceLedgerOpen} />
                ) : null}
                {onExportSystemState ? (
                  <ToolButton label="导出系统状态" onClick={onExportSystemState} />
                ) : null}
                {onImportSystemState ? (
                  <ToolButton label="导入系统状态" onClick={onImportSystemState} />
                ) : null}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function CatalogEntryText({
  entry,
  compact = false,
}: {
  entry: CelestialCatalogEntry;
  compact?: boolean;
}) {
  return (
    <span className="flex min-w-0 flex-1 items-center gap-2">
      <span className="min-w-0 flex-1">
        <span className="block truncate">{celestialDisplayNameZh(entry)}</span>
        {!compact ? (
          <span className="block truncate text-[10px] text-white/30">
            {entry.catalogName} - {entry.primaryName} - {entry.metadata}
          </span>
        ) : null}
      </span>
      <span className="shrink-0 rounded border border-white/8 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.08em] text-white/28">
        {entry.kind === "nearby-star" || entry.kind === "bright-star"
          ? KIND_LABELS[entry.kind]
          : celestialKindLabelZh(entry.kind)}
      </span>
    </span>
  );
}

function SectionHeader({
  label,
  count,
  open,
  onClick,
}: {
  label: string;
  count: number;
  open: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={open}
      className="flex min-h-11 w-full items-center gap-2 px-3 py-2 text-left text-[11px] tracking-[0.18em] text-slate-400"
    >
      <ChevronDown
        className={`h-3.5 w-3.5 transition-transform ${open ? "" : "-rotate-90"}`}
        strokeWidth={IS}
      />
      <span>{label}</span>
      <span className="ml-auto text-[10px] tracking-normal text-white/24">{count}</span>
    </button>
  );
}

function ToolButton({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="mt-1 flex min-h-8 w-full items-center justify-between rounded-md border border-white/8 bg-white/[0.018] px-2 py-2 text-left text-[12px] text-white/68 transition-colors hover:border-cyan-100/16 hover:bg-cyan-100/[0.035] hover:text-white disabled:pointer-events-none disabled:opacity-25"
    >
      <span>{label}</span>
    </button>
  );
}
