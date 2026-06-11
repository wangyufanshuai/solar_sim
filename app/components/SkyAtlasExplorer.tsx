"use client";

import {
  ArrowDown,
  ArrowUp,
  Camera,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Images,
  Map as MapIcon,
  Maximize2,
  Minimize2,
  Pause,
  Pin,
  Play,
  Plus,
  Search,
  SkipBack,
  SkipForward,
  Star,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  buildSkyAtlasCatalog,
  clusterSkyAtlasObjects,
  compareSkyAtlasObjects,
  createSkyAtlasCustomRoute,
  defaultSkyAtlasRoute,
  nearestSkyAtlasObject,
  projectSkyAtlasObject,
  rankSkyAtlasObjects,
  recommendedSkyAtlasObjects,
  searchSkyAtlasObjects,
  skyAtlasRouteToJson,
  skyAtlasRouteToMarkdown,
  skyAtlasTargetNarrative,
  type SkyAtlasCoverMetadata,
  type SkyAtlasMode,
  type SkyAtlasObject,
  type SkyAtlasObjectType,
  type SkyAtlasPlaybackState,
  type SkyAtlasProjection,
  type SkyAtlasRoute,
} from "../lib/skyAtlas";
import type { SkyAtlasPlaybackAction } from "../lib/skyAtlasPlayback";
import {
  createSkyAtlasAlbumRecord,
  loadSkyAtlasAlbum,
  removeSkyAtlasAlbumRecord,
  saveSkyAtlasAlbumRecord,
  type SkyAtlasAlbumRecord,
} from "../lib/skyAtlasAlbum";
import {
  EMPTY_SKY_ATLAS_STORAGE,
  loadSkyAtlasStorage,
  saveSkyAtlasStorage,
  toggleFavorite,
  upsertCustomRoute,
  withRecent,
} from "../lib/skyAtlasStorage";

const IS = 1.05;
const MAP_SIZE = { width: 420, height: 188 };
const TYPE_FILTERS: Array<{ type: SkyAtlasObjectType; label: string }> = [
  { type: "star", label: "Stars" },
  { type: "gaia-star", label: "Gaia" },
  { type: "constellation", label: "Constell." },
  { type: "nebula", label: "Nebulae" },
  { type: "cluster", label: "Clusters" },
  { type: "pulsar", label: "Pulsars" },
  { type: "deep-sky-image", label: "Images" },
];

function fmtDistance(pc?: number) {
  if (pc == null || !Number.isFinite(pc)) return "distance n/a";
  if (pc >= 1000) return `${(pc / 1000).toFixed(1)} kpc`;
  return `${pc.toFixed(pc < 10 ? 2 : 0)} pc`;
}

function fmtCoord(object: SkyAtlasObject) {
  return `RA ${object.raHours.toFixed(2)}h / Dec ${object.decDeg.toFixed(1)} deg`;
}

function typeRadius(object: SkyAtlasObject) {
  if (object.type === "deep-sky-image" || object.type === "nebula") return 3.2;
  if (object.type === "cluster" || object.type === "pulsar") return 2.8;
  if (object.type === "constellation") return 2.2;
  const mag = object.magnitude ?? 4;
  return Math.max(1.4, Math.min(3, 3.6 - mag * 0.32));
}

function downloadText(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function TypeBadge({ object }: { object: SkyAtlasObject }) {
  return (
    <span className="rounded-[3px] border border-white/10 bg-white/[0.04] px-1.5 py-0.5 font-mono text-[7px] uppercase tracking-[0.1em] text-white/45">
      {object.type}
    </span>
  );
}

function ObjectButton({
  object,
  active,
  favorite,
  reason,
  onSelect,
}: {
  object: SkyAtlasObject;
  active: boolean;
  favorite: boolean;
  reason?: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      data-solar-atlas-object={object.id}
      onClick={onSelect}
      className={`grid grid-cols-[auto_1fr_auto] items-center gap-2 rounded-[5px] border px-2 py-1.5 text-left transition-colors ${
        active ? "border-cyan-200/24 bg-cyan-200/[0.08]" : "border-white/[0.07] bg-white/[0.025] hover:bg-white/[0.055]"
      }`}
    >
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: object.color }} />
      <span className="min-w-0">
        <span className="block truncate text-[10px] text-white/74">{object.name}</span>
        <span className="block truncate font-mono text-[7px] uppercase text-white/34">
          {reason ?? `${fmtDistance(object.distancePc)} / ${object.renderTier ?? object.source}`}
        </span>
      </span>
      <span className="flex items-center gap-1">
        {favorite ? <Star className="h-3 w-3 fill-cyan-100 text-cyan-100" strokeWidth={IS} /> : null}
        <TypeBadge object={object} />
      </span>
    </button>
  );
}

function AtlasMap({
  catalog,
  route,
  selected,
  projection,
  favoriteIds,
  immersive,
  onProjectionChange,
  onSelect,
}: {
  catalog: SkyAtlasObject[];
  route: SkyAtlasRoute;
  selected: SkyAtlasObject | null;
  projection: SkyAtlasProjection;
  favoriteIds: string[];
  immersive: boolean;
  onProjectionChange: (next: SkyAtlasProjection) => void;
  onSelect: (object: SkyAtlasObject) => void;
}) {
  const routeObjectIds = useMemo(() => route.stops.map((stop) => stop.objectId), [route]);
  const clusters = useMemo(
    () => clusterSkyAtlasObjects(catalog, projection, MAP_SIZE, {
      cellSize: immersive ? 18 : 25,
      selectedObjectId: selected?.id,
      favoriteIds,
      routeObjectIds,
      maxClusters: immersive ? 190 : 135,
    }),
    [catalog, favoriteIds, immersive, projection, routeObjectIds, selected?.id],
  );
  const routePoints = route.stops
    .map((stop) => catalog.find((object) => object.id === stop.objectId))
    .filter(Boolean)
    .map((object) => projectSkyAtlasObject(object!, projection, MAP_SIZE));
  const selectedPoint = selected ? projectSkyAtlasObject(selected, projection, MAP_SIZE) : null;

  return (
    <div className="rounded-[5px] border border-white/[0.07] bg-black/25 p-2" data-solar-atlas-map data-solar-atlas-clustered>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-mono text-[8px] uppercase text-white/62">
          <MapIcon className="h-3.5 w-3.5 text-cyan-100/62" strokeWidth={IS} />
          Atlas map
        </div>
        <div className="flex rounded-[3px] border border-white/[0.08] bg-white/[0.03] p-0.5">
          {(["equatorial", "galactic"] as SkyAtlasProjection[]).map((id) => (
            <button
              key={id}
              type="button"
              data-solar-action={`atlas-projection-${id}`}
              onClick={() => onProjectionChange(id)}
              className={`rounded-[2px] px-2 py-1 font-mono text-[7px] uppercase ${
                projection === id ? "bg-cyan-200/[0.14] text-cyan-100" : "text-white/38"
              }`}
            >
              {id}
            </button>
          ))}
        </div>
      </div>
      <svg
        viewBox={`0 0 ${MAP_SIZE.width} ${MAP_SIZE.height}`}
        className={`${immersive ? "h-[min(54dvh,560px)]" : "h-[188px]"} w-full rounded-[4px] border border-white/[0.06] bg-[#02050a]`}
        role="img"
        onClick={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          const x = ((event.clientX - rect.left) / rect.width) * MAP_SIZE.width;
          const y = ((event.clientY - rect.top) / rect.height) * MAP_SIZE.height;
          const hit = nearestSkyAtlasObject(catalog, { x, y }, projection, MAP_SIZE, 18);
          if (hit) onSelect(hit);
        }}
      >
        <defs>
          <linearGradient id="atlasGrid" x1="0" x2="1">
            <stop offset="0" stopColor="#67e8f9" stopOpacity="0.04" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <rect width={MAP_SIZE.width} height={MAP_SIZE.height} fill="url(#atlasGrid)" />
        {[0.25, 0.5, 0.75].map((x) => (
          <line key={`x-${x}`} x1={MAP_SIZE.width * x} x2={MAP_SIZE.width * x} y1="0" y2={MAP_SIZE.height} stroke="#ffffff" strokeOpacity="0.07" strokeWidth="0.5" />
        ))}
        {[0.25, 0.5, 0.75].map((y) => (
          <line key={`y-${y}`} x1="0" x2={MAP_SIZE.width} y1={MAP_SIZE.height * y} y2={MAP_SIZE.height * y} stroke="#ffffff" strokeOpacity="0.07" strokeWidth="0.5" />
        ))}
        {[42, 84, 126].map((r) => (
          <circle key={r} cx={MAP_SIZE.width / 2} cy={MAP_SIZE.height / 2} r={r} fill="none" stroke="#67e8f9" strokeOpacity="0.05" strokeWidth="0.8" />
        ))}
        {routePoints.length > 1 ? (
          <polyline
            points={routePoints.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ")}
            fill="none"
            stroke="#67e8f9"
            strokeOpacity="0.42"
            strokeWidth="1.2"
          />
        ) : null}
        {clusters.map((cluster) => (
          <g key={cluster.id} data-solar-atlas-cluster={cluster.members.length}>
            <circle
              cx={cluster.x}
              cy={cluster.y}
              r={typeRadius(cluster.representative) + Math.min(2.4, Math.log2(cluster.members.length))}
              fill={cluster.representative.color}
              fillOpacity={cluster.representative.type === "constellation" ? 0.34 : 0.78}
              stroke={selected?.id === cluster.representative.id ? "#cffafe" : "transparent"}
              strokeWidth={selected?.id === cluster.representative.id ? 1.6 : 0}
            />
            {cluster.members.length > 1 ? (
              <text x={cluster.x + 5} y={cluster.y - 4} fill="#cffafe" fillOpacity="0.62" fontSize="6">
                {cluster.members.length}
              </text>
            ) : null}
          </g>
        ))}
        {routePoints.map((point, index) => (
          <circle key={`${point.object.id}-${index}`} cx={point.x} cy={point.y} r="5" fill="none" stroke="#fef3c7" strokeOpacity="0.72" strokeWidth="1" />
        ))}
        {selectedPoint ? (
          <g>
            <circle cx={selectedPoint.x} cy={selectedPoint.y} r="9" fill="none" stroke="#cffafe" strokeOpacity="0.88" strokeWidth="1.1" />
            <line x1={selectedPoint.x - 14} x2={selectedPoint.x - 6} y1={selectedPoint.y} y2={selectedPoint.y} stroke="#cffafe" strokeOpacity="0.75" />
            <line x1={selectedPoint.x + 6} x2={selectedPoint.x + 14} y1={selectedPoint.y} y2={selectedPoint.y} stroke="#cffafe" strokeOpacity="0.75" />
          </g>
        ) : null}
      </svg>
      <div className="mt-1 flex justify-between font-mono text-[7px] uppercase text-white/32">
        <span>declutter grid / {clusters.length} clusters</span>
        <span>priority: selected · route · favorite · magnitude</span>
      </div>
    </div>
  );
}

export default function SkyAtlasExplorer({
  onTargetSelect,
  playback,
  onPlaybackAction,
  onExportCover,
  mode,
  onModeChange,
}: {
  onTargetSelect: (object: SkyAtlasObject) => void;
  playback: SkyAtlasPlaybackState;
  onPlaybackAction: (action: SkyAtlasPlaybackAction) => void;
  onExportCover: (metadata?: SkyAtlasCoverMetadata) => void;
  mode: SkyAtlasMode;
  onModeChange: (mode: SkyAtlasMode) => void;
}) {
  const catalog = useMemo(() => buildSkyAtlasCatalog(), []);
  const fixedRoute = useMemo(() => defaultSkyAtlasRoute(catalog), [catalog]);
  const discover = useMemo(() => recommendedSkyAtlasObjects(catalog), [catalog]);
  const [storage, setStorage] = useState(EMPTY_SKY_ATLAS_STORAGE);
  const [query, setQuery] = useState("");
  const [activeTypes, setActiveTypes] = useState<SkyAtlasObjectType[]>([]);
  const [selectedId, setSelectedId] = useState(discover[0]?.id ?? catalog[0]?.id ?? null);
  const [routeIndex, setRouteIndex] = useState(0);
  const [projection, setProjection] = useState<SkyAtlasProjection>("galactic");
  const [customStopIds, setCustomStopIds] = useState<string[]>([]);
  const [comparisonIds, setComparisonIds] = useState<string[]>([]);
  const [album, setAlbum] = useState<SkyAtlasAlbumRecord[]>([]);

  useEffect(() => {
    const loaded = loadSkyAtlasStorage();
    setStorage(loaded);
    setCustomStopIds(loaded.customRoutes?.[0]?.stops.map((stop) => stop.objectId) ?? []);
    setComparisonIds(loaded.comparisonIds ?? []);
    void loadSkyAtlasAlbum().then(setAlbum);
  }, []);

  const selected = useMemo(
    () => catalog.find((object) => object.id === selectedId) ?? discover[0] ?? catalog[0] ?? null,
    [catalog, discover, selectedId],
  );
  const searchResults = useMemo(
    () => rankSkyAtlasObjects(
      catalog,
      query,
      { types: activeTypes },
      {
        favoriteIds: storage.favorites,
        routeObjectIds: (customStopIds.length ? customStopIds : fixedRoute.stops.map((stop) => stop.objectId)),
      },
    ).slice(0, 60),
    [activeTypes, catalog, customStopIds, fixedRoute.stops, query, storage.favorites],
  );
  const customRoute = useMemo(
    () => createSkyAtlasCustomRoute(customStopIds, "Custom Atlas Route"),
    [customStopIds],
  );
  const activeRoute = customRoute.stops.length ? customRoute : fixedRoute;
  const routeStop = activeRoute.stops[routeIndex] ?? activeRoute.stops[0] ?? null;
  const routeObject = routeStop ? catalog.find((object) => object.id === routeStop.objectId) ?? null : null;
  const narrative = selected ? skyAtlasTargetNarrative(selected) : null;
  const comparison = useMemo(() => {
    const [leftId, rightId] = comparisonIds;
    const left = catalog.find((object) => object.id === leftId);
    const right = catalog.find((object) => object.id === rightId);
    return left && right ? compareSkyAtlasObjects(left, right) : null;
  }, [catalog, comparisonIds]);
  const neighbors = useMemo(
    () =>
      selected
        ? searchSkyAtlasObjects(catalog, "", {
            types: [selected.type],
            maxDistancePc: selected.distancePc ? selected.distancePc * 1.7 + 10 : undefined,
          })
            .filter((object) => object.id !== selected.id)
            .slice(0, 3)
        : [],
    [catalog, selected],
  );

  const persist = (next: typeof storage) => {
    setStorage(next);
    saveSkyAtlasStorage(next);
  };
  const saveCustomStops = (nextStops: string[]) => {
    setCustomStopIds(nextStops);
    if (nextStops.length) persist(upsertCustomRoute(storage, createSkyAtlasCustomRoute(nextStops, "Custom Atlas Route")));
    else persist({ ...storage, customRoutes: [] });
  };
  const select = (object: SkyAtlasObject) => {
    setSelectedId(object.id);
    persist(withRecent(storage, object.id));
    onTargetSelect(object);
  };
  const favoriteSelected = () => {
    if (!selected) return;
    persist(toggleFavorite(storage, selected.id));
  };
  const pinSelected = () => {
    if (!selected) return;
    const next = comparisonIds.includes(selected.id)
      ? comparisonIds.filter((id) => id !== selected.id)
      : [...comparisonIds.slice(-1), selected.id].slice(0, 2);
    setComparisonIds(next);
    persist({ ...storage, comparisonIds: next });
  };
  const setRouteObject = (nextIndex: number) => {
    const wrapped = (nextIndex + activeRoute.stops.length) % Math.max(1, activeRoute.stops.length);
    setRouteIndex(wrapped);
    const stop = activeRoute.stops[wrapped];
    const object = stop ? catalog.find((item) => item.id === stop.objectId) : null;
    if (object) select(object);
  };
  const exportRouteJson = () => downloadText("solar-sim-atlas-route.json", JSON.stringify(skyAtlasRouteToJson(activeRoute, catalog), null, 2), "application/json");
  const exportRouteMarkdown = () => downloadText("solar-sim-atlas-route.md", skyAtlasRouteToMarkdown(activeRoute, catalog), "text/markdown");
  const captureCover = async () => {
    const metadata: SkyAtlasCoverMetadata = {
      targetId: selected?.id ?? null,
      targetName: selected?.name ?? null,
      routeId: activeRoute.id,
      routeStopIndex: routeIndex,
      projection,
      postProfile: mode === "immersive" ? "atlas-flight" : "atlas-map",
      timestamp: new Date().toISOString(),
    };
    const canvas = document.querySelector(".absolute.inset-0 canvas");
    const record = await createSkyAtlasAlbumRecord(
      metadata,
      canvas instanceof HTMLCanvasElement ? canvas : null,
    );
    await saveSkyAtlasAlbumRecord(record);
    setAlbum(await loadSkyAtlasAlbum());
    onExportCover(metadata);
  };

  useEffect(() => {
    if (playback.route?.id !== activeRoute.id) return;
    setRouteIndex(playback.stopIndex);
    const stop = activeRoute.stops[playback.stopIndex];
    const object = stop ? catalog.find((item) => item.id === stop.objectId) : null;
    if (object) setSelectedId(object.id);
  }, [activeRoute, catalog, playback.route?.id, playback.stopIndex]);

  return (
    <section
      data-solar-panel="sky-atlas"
      data-solar-atlas-mode={mode}
      className={mode === "immersive"
        ? "pointer-events-auto absolute inset-0 z-[142] flex flex-col overflow-hidden bg-[rgba(2,5,10,0.74)] backdrop-blur-[2px]"
        : "pointer-events-auto absolute inset-x-2 bottom-24 z-[132] flex max-h-[62dvh] flex-col overflow-hidden rounded-[var(--ui-radius)] border-[0.5px] border-[var(--ui-glass-border)] bg-[rgba(5,8,14,0.9)] shadow-[0_18px_60px_rgba(0,0,0,0.42)] backdrop-blur-ui sm:inset-x-auto sm:bottom-28 sm:left-4 sm:max-h-[calc(100dvh-8.5rem)] sm:w-[31rem]"}
    >
      <header className={`${mode === "immersive" ? "bg-black/34 px-4 py-3" : "p-3 pb-2"} shrink-0 border-b border-white/[0.07]`}>
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-white/86">
              Sky Atlas Explorer
            </h2>
            <p className="font-mono text-[7px] uppercase tracking-[0.14em] text-white/35">
              Curated map, route builder, and deep-sky flight / {catalog.length} objects
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              data-solar-action="atlas-mode-toggle"
              onClick={() => onModeChange(mode === "immersive" ? "panel" : "immersive")}
              className="grid h-7 w-7 place-items-center rounded-[3px] border border-white/[0.1] bg-white/[0.04] text-white/62"
              aria-label={mode === "immersive" ? "Exit immersive Atlas" : "Enter immersive Atlas"}
            >
              {mode === "immersive" ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            </button>
            <button
              type="button"
              data-solar-action="atlas-cover"
              onClick={() => void captureCover()}
              className="flex items-center gap-1 rounded-[3px] border border-cyan-200/16 bg-cyan-200/[0.05] px-2 py-1 font-mono text-[7px] uppercase text-cyan-100/76"
            >
              <Download className="h-3 w-3" strokeWidth={IS} />
              Cover
            </button>
          </div>
        </div>
      </header>

      <div className={`${mode === "immersive" ? "p-3 sm:p-4" : "p-3 pt-2"} min-h-0 flex-1 overflow-y-auto`}>
        <div className={mode === "immersive" ? "grid gap-3 sm:grid-cols-[minmax(0,1fr)_22rem]" : "grid gap-2"}>
          <div className={mode === "immersive" ? "min-w-0" : "contents"}>
          <AtlasMap
            catalog={catalog}
            route={activeRoute}
            selected={selected}
            projection={projection}
            favoriteIds={storage.favorites}
            immersive={mode === "immersive"}
            onProjectionChange={setProjection}
            onSelect={select}
          />
          </div>

          <div className={mode === "immersive" ? "grid content-start gap-2 overflow-y-auto sm:max-h-[calc(100dvh-6rem)]" : "contents"}>
          <div className="rounded-[5px] border border-white/[0.07] bg-black/35 p-2" data-solar-atlas-target-card>
            {selected ? (
              <div className="grid gap-2">
                {selected.previewUrl ? (
                  <div
                    className="h-24 rounded-[5px] border border-white/[0.08] bg-cover bg-center"
                    style={{ backgroundImage: `url(${selected.previewUrl})` }}
                  />
                ) : null}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-semibold text-white/84">{selected.name}</div>
                    <div className="mt-0.5 font-mono text-[8px] uppercase text-white/36">
                      {narrative?.headline ?? selected.subtitle ?? selected.catalogId ?? selected.source}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      data-solar-action="atlas-compare-pin"
                      onClick={pinSelected}
                      className="grid h-7 w-7 shrink-0 place-items-center rounded-[3px] border border-white/[0.08] bg-white/[0.035] text-amber-100/72"
                      aria-label="Pin target for comparison"
                    >
                      <Pin className={`h-3.5 w-3.5 ${comparisonIds.includes(selected.id) ? "fill-amber-100/50" : ""}`} strokeWidth={IS} />
                    </button>
                    <button
                      type="button"
                      data-solar-action="atlas-favorite"
                      onClick={favoriteSelected}
                      className="grid h-7 w-7 shrink-0 place-items-center rounded-[3px] border border-white/[0.08] bg-white/[0.035] text-cyan-100/78"
                    >
                      <Star className={`h-3.5 w-3.5 ${storage.favorites.includes(selected.id) ? "fill-cyan-100" : ""}`} strokeWidth={IS} />
                    </button>
                  </div>
                </div>
                <div className="text-[9px] leading-4 text-white/56">
                  <span className="font-mono uppercase text-white/34">Why visit: </span>
                  {narrative?.whyVisit}
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <div className="rounded-[4px] border border-white/[0.06] bg-white/[0.03] px-2 py-1 font-mono text-[8px] text-white/52">
                    {fmtDistance(selected.distancePc)}
                  </div>
                  <div className="rounded-[4px] border border-white/[0.06] bg-white/[0.03] px-2 py-1 font-mono text-[8px] text-white/52">
                    mag {selected.magnitude?.toFixed(2) ?? "n/a"}
                  </div>
                  <div className="col-span-2 rounded-[4px] border border-white/[0.06] bg-white/[0.03] px-2 py-1 font-mono text-[8px] text-white/52">
                    {fmtCoord(selected)}
                  </div>
                </div>
                <details className="rounded-[4px] border border-white/[0.06] bg-white/[0.025] px-2 py-1 text-[8px] leading-3 text-white/42">
                  <summary className="cursor-pointer font-mono uppercase text-white/48">Source / neighbors</summary>
                  <p className="mt-1">Credit: {narrative?.sourceLine ?? selected.credit ?? selected.source}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {neighbors.map((object) => (
                      <button key={object.id} type="button" onClick={() => select(object)} className="rounded-[3px] bg-white/[0.05] px-1.5 py-0.5 text-white/50">
                        {object.name}
                      </button>
                    ))}
                  </div>
                </details>
              </div>
            ) : null}
          </div>

          <div className="rounded-[5px] border border-white/[0.07] bg-black/20 p-2" data-solar-atlas-route-builder>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="font-mono text-[8px] uppercase text-white/62">
                {customStopIds.length ? "Custom route builder" : "Deep Sky Flight Route"}
              </span>
              <div className="flex gap-1">
                <button type="button" data-solar-action="atlas-route-export-json" onClick={exportRouteJson} className="rounded-[3px] border border-white/[0.08] px-1.5 py-1 text-white/50">
                  <FileText className="h-3 w-3" strokeWidth={IS} />
                </button>
                <button type="button" data-solar-action="atlas-route-export-md" onClick={exportRouteMarkdown} className="rounded-[3px] border border-white/[0.08] px-1.5 py-1 font-mono text-[7px] uppercase text-white/50">
                  MD
                </button>
                <button
                  type="button"
                  data-solar-action="atlas-route-play"
                  onClick={() => onPlaybackAction(
                    playback.route?.id === activeRoute.id && playback.status === "playing"
                      ? { type: "pause" }
                      : playback.route?.id === activeRoute.id && playback.status === "paused"
                        ? { type: "resume" }
                        : { type: "play", route: activeRoute, startIndex: routeIndex },
                  )}
                  className="flex items-center gap-1 rounded-[3px] border border-cyan-200/16 bg-cyan-200/[0.05] px-2 py-1 font-mono text-[7px] uppercase text-cyan-100/76"
                >
                  {playback.route?.id === activeRoute.id && playback.status === "playing"
                    ? <Pause className="h-3 w-3" strokeWidth={IS} />
                    : <Play className="h-3 w-3" strokeWidth={IS} />}
                  {playback.route?.id === activeRoute.id && playback.status === "playing" ? "Pause" : "Play"}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
              <button type="button" data-solar-action="atlas-route-prev" onClick={() => setRouteObject(routeIndex - 1)} className="grid h-7 w-7 place-items-center rounded-[3px] border border-white/[0.08] text-white/55">
                <ChevronLeft className="h-3.5 w-3.5" strokeWidth={IS} />
              </button>
              <button type="button" data-solar-action="atlas-route-target" onClick={() => routeObject && select(routeObject)} className="min-w-0 rounded-[4px] border border-white/[0.07] bg-white/[0.025] px-2 py-1.5 text-left">
                <span className="block truncate text-[10px] text-white/74">
                  {(routeIndex + 1).toString().padStart(2, "0")} / {routeObject?.name ?? "No route target"}
                </span>
                <span className="block truncate font-mono text-[7px] uppercase text-white/34">{routeStop?.note ?? "fallback"}</span>
              </button>
              <button type="button" data-solar-action="atlas-route-next" onClick={() => setRouteObject(routeIndex + 1)} className="grid h-7 w-7 place-items-center rounded-[3px] border border-white/[0.08] text-white/55">
                <ChevronRight className="h-3.5 w-3.5" strokeWidth={IS} />
              </button>
            </div>
            <div className="mt-2 flex gap-1">
              {activeRoute.stops.map((stop, index) => (
                <button key={stop.id} type="button" aria-label={`Route stop ${index + 1}`} onClick={() => setRouteObject(index)} className={`h-1.5 flex-1 rounded-full ${index === routeIndex ? "bg-cyan-200/80" : "bg-white/12"}`} />
              ))}
            </div>
            <div className="mt-2 rounded-[4px] border border-white/[0.06] bg-white/[0.025] p-1.5" data-solar-atlas-playback>
              <div className="mb-1 flex items-center gap-1">
                <button type="button" data-solar-action="atlas-playback-prev" onClick={() => onPlaybackAction({ type: "previous" })} className="grid h-6 w-6 place-items-center rounded-[3px] text-white/48">
                  <SkipBack className="h-3 w-3" />
                </button>
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full bg-cyan-200/70" style={{ width: `${Math.round(playback.progress * 100)}%` }} />
                </div>
                <button type="button" data-solar-action="atlas-playback-next" onClick={() => onPlaybackAction({ type: "next" })} className="grid h-6 w-6 place-items-center rounded-[3px] text-white/48">
                  <SkipForward className="h-3 w-3" />
                </button>
              </div>
              <div className="flex items-center justify-between gap-2 font-mono text-[7px] uppercase text-white/36">
                <span>{playback.status} · stop {playback.stopIndex + 1}</span>
                <div className="flex gap-0.5">
                  {([0.5, 1, 2] as const).map((speed) => (
                    <button
                      key={speed}
                      type="button"
                      data-solar-action={`atlas-playback-speed-${speed}`}
                      onClick={() => onPlaybackAction({ type: "speed", speed })}
                      className={`rounded-[2px] px-1.5 py-0.5 ${playback.speed === speed ? "bg-cyan-200/12 text-cyan-100" : "text-white/34"}`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-2 grid gap-1">
              <div className="flex gap-1">
                <button
                  type="button"
                  data-solar-action="atlas-route-add"
                  onClick={() => selected && !customStopIds.includes(selected.id) && saveCustomStops([...customStopIds, selected.id])}
                  className="flex flex-1 items-center justify-center gap-1 rounded-[3px] border border-white/[0.08] px-2 py-1 font-mono text-[7px] uppercase text-white/50"
                >
                  <Plus className="h-3 w-3" strokeWidth={IS} />
                  Add target
                </button>
                <button type="button" data-solar-action="atlas-route-clear" onClick={() => saveCustomStops([])} className="rounded-[3px] border border-white/[0.08] px-2 py-1 font-mono text-[7px] uppercase text-white/42">
                  Clear
                </button>
              </div>
              {customStopIds.slice(0, 8).map((objectId, index) => {
                const object = catalog.find((item) => item.id === objectId);
                if (!object) return null;
                return (
                  <div key={`${objectId}-${index}`} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-1 rounded-[4px] border border-white/[0.05] bg-white/[0.025] px-2 py-1">
                    <button type="button" onClick={() => select(object)} className="truncate text-left text-[9px] text-white/58">
                      {index + 1}. {object.name}
                    </button>
                    <button type="button" data-solar-action="atlas-route-up" onClick={() => {
                      const next = [...customStopIds];
                      const [item] = next.splice(index, 1);
                      next.splice(Math.max(0, index - 1), 0, item!);
                      saveCustomStops(next);
                    }} className="text-white/36">
                      <ArrowUp className="h-3 w-3" strokeWidth={IS} />
                    </button>
                    <button type="button" data-solar-action="atlas-route-down" onClick={() => {
                      const next = [...customStopIds];
                      const [item] = next.splice(index, 1);
                      next.splice(Math.min(next.length, index + 1), 0, item!);
                      saveCustomStops(next);
                    }} className="text-white/36">
                      <ArrowDown className="h-3 w-3" strokeWidth={IS} />
                    </button>
                    <button type="button" data-solar-action="atlas-route-remove" onClick={() => saveCustomStops(customStopIds.filter((_, i) => i !== index))} className="text-white/36">
                      <Trash2 className="h-3 w-3" strokeWidth={IS} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-[5px] border border-white/[0.07] bg-black/20 p-2">
            <div className="mb-1.5 flex items-center gap-2">
              <Search className="h-3.5 w-3.5 text-white/36" strokeWidth={IS} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                data-solar-action="atlas-search-input"
                placeholder="Search Orion, Pleiades, Crab, Alpha Centauri..."
                className="min-w-0 flex-1 bg-transparent font-mono text-[9px] text-white/76 outline-none placeholder:text-white/28"
              />
            </div>
            <div className="mb-2 flex flex-wrap gap-1">
              {TYPE_FILTERS.map((filter) => {
                const active = activeTypes.includes(filter.type);
                return (
                  <button
                    key={filter.type}
                    type="button"
                    onClick={() => setActiveTypes((current) => active ? current.filter((type) => type !== filter.type) : [...current, filter.type])}
                    className={`rounded-[3px] px-1.5 py-1 font-mono text-[7px] uppercase ${active ? "bg-cyan-200/[0.12] text-cyan-100" : "bg-white/[0.04] text-white/40"}`}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>
            <div className="grid max-h-52 gap-1 overflow-y-auto" data-solar-atlas-search-results>
              {(query || activeTypes.length
                ? searchResults
                : discover.map((object) => ({ object, score: 0, reasons: ["curated route"] }))
              ).slice(0, 18).map((result) => (
                <ObjectButton
                  key={result.object.id}
                  object={result.object}
                  active={selected?.id === result.object.id}
                  favorite={storage.favorites.includes(result.object.id)}
                  reason={`${result.reasons.join(" · ")}${result.score ? ` / ${Math.round(result.score)}` : ""}`}
                  onSelect={() => select(result.object)}
                />
              ))}
            </div>
          </div>

          {storage.recent.length || storage.favorites.length ? (
            <div className="rounded-[5px] border border-white/[0.07] bg-black/20 p-2">
              <div className="mb-1 font-mono text-[8px] uppercase text-white/62">Favorites / Recent</div>
              <div className="grid gap-1">
                {[...storage.favorites, ...storage.recent]
                  .filter((id, index, arr) => arr.indexOf(id) === index)
                  .slice(0, 8)
                  .map((id) => catalog.find((object) => object.id === id))
                  .filter(Boolean)
                  .map((object) => (
                    <ObjectButton
                      key={object!.id}
                      object={object!}
                      active={selected?.id === object!.id}
                      favorite={storage.favorites.includes(object!.id)}
                      onSelect={() => select(object!)}
                    />
                  ))}
              </div>
            </div>
          ) : null}

          <div className="rounded-[5px] border border-white/[0.07] bg-black/30 p-2" data-solar-atlas-comparison>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="font-mono text-[8px] uppercase text-white/62">Object comparison</span>
              <span className="font-mono text-[7px] uppercase text-white/30">{comparisonIds.length}/2 pinned</span>
            </div>
            {comparison ? (
              <div className="grid gap-1">
                <div className="grid grid-cols-[5rem_1fr_1fr] gap-1 text-[8px] text-white/56">
                  <span />
                  <button type="button" onClick={() => select(comparison.left)} className="truncate text-left text-cyan-100/72">{comparison.left.name}</button>
                  <button type="button" onClick={() => select(comparison.right)} className="truncate text-left text-amber-100/72">{comparison.right.name}</button>
                </div>
                {comparison.fields.map((field) => (
                  <div key={field.id} className="grid grid-cols-[5rem_1fr_1fr] gap-1 border-t border-white/[0.05] py-1 font-mono text-[7px] leading-3">
                    <span className="uppercase text-white/30">{field.label}</span>
                    <span className="text-white/50">{field.left}</span>
                    <span className="text-white/50">{field.right}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[8px] leading-4 text-white/34">Pin two targets from the learning card. Missing catalog fields remain explicitly unavailable.</div>
            )}
          </div>

          <div className="rounded-[5px] border border-white/[0.07] bg-black/30 p-2" data-solar-atlas-album>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1 font-mono text-[8px] uppercase text-white/62">
                <Images className="h-3 w-3" />
                Atlas album
              </span>
              <span className="font-mono text-[7px] uppercase text-white/30">{album.length}/12 local</span>
            </div>
            {album.length ? (
              <div className="grid grid-cols-2 gap-1.5">
                {album.slice(0, 6).map((record) => (
                  <div key={record.id} className="overflow-hidden rounded-[4px] border border-white/[0.06] bg-white/[0.025]">
                    {record.thumbnailWebp ? (
                      // IndexedDB data URLs are local generated artifacts, not remotely optimizable assets.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={record.thumbnailWebp} alt="" className="aspect-video w-full object-cover" />
                    ) : (
                      <div className="grid aspect-video place-items-center font-mono text-[7px] uppercase text-white/24">metadata only</div>
                    )}
                    <div className="flex items-center gap-1 px-1.5 py-1">
                      <span className="min-w-0 flex-1 truncate text-[8px] text-white/54">{record.metadata.targetName ?? record.metadata.routeId ?? "Atlas cover"}</span>
                      {record.thumbnailWebp ? (
                        <a href={record.thumbnailWebp} download={`${record.id}.webp`} className="text-cyan-100/55" aria-label="Download album thumbnail">
                          <Download className="h-3 w-3" />
                        </a>
                      ) : null}
                      <button
                        type="button"
                        data-solar-action="atlas-album-remove"
                        onClick={() => void removeSkyAtlasAlbumRecord(record.id).then(async () => setAlbum(await loadSkyAtlasAlbum()))}
                        className="text-white/30"
                        aria-label="Remove album record"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[8px] leading-4 text-white/34">Export a cover to save a compressed WebP thumbnail and provenance metadata locally.</div>
            )}
          </div>

          <div className="rounded-[3px] border border-amber-200/12 bg-amber-200/[0.035] px-2 py-1 font-mono text-[7px] uppercase leading-3 text-amber-100/72">
            Curated visual atlas only. Not a complete planetarium or certified astrometric database.
          </div>
          </div>
        </div>
      </div>
      <div className="shrink-0 border-t border-white/[0.07] p-2">
        <button
          type="button"
          data-solar-action="atlas-fly-target"
          onClick={() => selected && select(selected)}
          disabled={!selected}
          className="flex w-full items-center justify-center gap-2 rounded-[4px] border border-cyan-200/20 bg-cyan-200/[0.07] px-3 py-2 font-mono text-[8px] uppercase tracking-[0.12em] text-cyan-100 disabled:opacity-35"
        >
          <Camera className="h-3.5 w-3.5" strokeWidth={IS} />
          Fly to target
        </button>
      </div>
    </section>
  );
}
