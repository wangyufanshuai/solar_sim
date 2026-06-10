"use client";

import { Camera, ChevronLeft, ChevronRight, Download, Play, Search, Star } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  buildSkyAtlasCatalog,
  defaultSkyAtlasRoute,
  recommendedSkyAtlasObjects,
  searchSkyAtlasObjects,
  type SkyAtlasObject,
  type SkyAtlasObjectType,
  type SkyAtlasRoute,
} from "../lib/skyAtlas";
import {
  EMPTY_SKY_ATLAS_STORAGE,
  loadSkyAtlasStorage,
  saveSkyAtlasStorage,
  toggleFavorite,
  withRecent,
} from "../lib/skyAtlasStorage";

const IS = 1.05;
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
  onSelect,
}: {
  object: SkyAtlasObject;
  active: boolean;
  favorite: boolean;
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
          {fmtDistance(object.distancePc)} / {object.renderTier ?? object.source}
        </span>
      </span>
      <span className="flex items-center gap-1">
        {favorite ? <Star className="h-3 w-3 fill-cyan-100 text-cyan-100" strokeWidth={IS} /> : null}
        <TypeBadge object={object} />
      </span>
    </button>
  );
}

export default function SkyAtlasExplorer({
  onTargetSelect,
  onRoutePlay,
  onExportCover,
}: {
  onTargetSelect: (object: SkyAtlasObject) => void;
  onRoutePlay: (route: SkyAtlasRoute, startIndex: number) => void;
  onExportCover: () => void;
}) {
  const catalog = useMemo(() => buildSkyAtlasCatalog(), []);
  const route = useMemo(() => defaultSkyAtlasRoute(catalog), [catalog]);
  const discover = useMemo(() => recommendedSkyAtlasObjects(catalog), [catalog]);
  const [storage, setStorage] = useState(EMPTY_SKY_ATLAS_STORAGE);
  const [query, setQuery] = useState("");
  const [activeTypes, setActiveTypes] = useState<SkyAtlasObjectType[]>([]);
  const [selectedId, setSelectedId] = useState(discover[0]?.id ?? catalog[0]?.id ?? null);
  const [routeIndex, setRouteIndex] = useState(0);

  useEffect(() => setStorage(loadSkyAtlasStorage()), []);

  const selected = useMemo(
    () => catalog.find((object) => object.id === selectedId) ?? discover[0] ?? catalog[0] ?? null,
    [catalog, discover, selectedId],
  );
  const searchResults = useMemo(
    () => searchSkyAtlasObjects(catalog, query, { types: activeTypes }).slice(0, 60),
    [activeTypes, catalog, query],
  );
  const routeStop = route.stops[routeIndex] ?? route.stops[0] ?? null;
  const routeObject = routeStop ? catalog.find((object) => object.id === routeStop.objectId) ?? null : null;

  const persist = (next: typeof storage) => {
    setStorage(next);
    saveSkyAtlasStorage(next);
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
  const setRouteObject = (nextIndex: number) => {
    const wrapped = (nextIndex + route.stops.length) % Math.max(1, route.stops.length);
    setRouteIndex(wrapped);
    const stop = route.stops[wrapped];
    const object = stop ? catalog.find((item) => item.id === stop.objectId) : null;
    if (object) select(object);
  };

  return (
    <section
      data-solar-panel="sky-atlas"
      className="pointer-events-auto absolute inset-x-2 bottom-24 z-[132] flex max-h-[62dvh] flex-col overflow-hidden rounded-[var(--ui-radius)] border-[0.5px] border-[var(--ui-glass-border)] bg-[rgba(5,8,14,0.9)] shadow-[0_18px_60px_rgba(0,0,0,0.42)] backdrop-blur-ui sm:inset-x-auto sm:bottom-28 sm:left-4 sm:max-h-[calc(100dvh-8.5rem)] sm:w-[28rem]"
    >
      <header className="shrink-0 border-b border-white/[0.07] p-3 pb-2">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-white/86">
              Sky Atlas Explorer
            </h2>
            <p className="font-mono text-[7px] uppercase tracking-[0.14em] text-white/35">
              Curated deep-sky flight mode / {catalog.length} objects
            </p>
          </div>
          <button
            type="button"
            data-solar-action="atlas-cover"
            onClick={onExportCover}
            className="flex items-center gap-1 rounded-[3px] border border-cyan-200/16 bg-cyan-200/[0.05] px-2 py-1 font-mono text-[7px] uppercase text-cyan-100/76"
          >
            <Download className="h-3 w-3" strokeWidth={IS} />
            Cover
          </button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-3 pt-2">
        <div className="grid gap-2">
          <div className="rounded-[5px] border border-white/[0.07] bg-black/20 p-2" data-solar-atlas-target-card>
            {selected ? (
              <div className="grid gap-2">
                {selected.previewUrl ? (
                  <div
                    className="h-28 rounded-[5px] border border-white/[0.08] bg-cover bg-center"
                    style={{ backgroundImage: `url(${selected.previewUrl})` }}
                  />
                ) : null}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-semibold text-white/84">{selected.name}</div>
                    <div className="mt-0.5 font-mono text-[8px] uppercase text-white/36">
                      {selected.subtitle ?? selected.catalogId ?? selected.source}
                    </div>
                  </div>
                  <button
                    type="button"
                    data-solar-action="atlas-favorite"
                    onClick={favoriteSelected}
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-[3px] border border-white/[0.08] bg-white/[0.035] text-cyan-100/78"
                  >
                    <Star className={`h-3.5 w-3.5 ${storage.favorites.includes(selected.id) ? "fill-cyan-100" : ""}`} strokeWidth={IS} />
                  </button>
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
                <div className="text-[8px] leading-3 text-white/38">
                  Credit: {selected.credit ?? selected.source}. Coordinates and distances are for curated visual navigation.
                </div>
              </div>
            ) : null}
          </div>

          <div className="rounded-[5px] border border-white/[0.07] bg-black/20 p-2">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="font-mono text-[8px] uppercase text-white/62">Deep Sky Flight Route</span>
              <button
                type="button"
                data-solar-action="atlas-route-play"
                onClick={() => onRoutePlay(route, routeIndex)}
                className="flex items-center gap-1 rounded-[3px] border border-cyan-200/16 bg-cyan-200/[0.05] px-2 py-1 font-mono text-[7px] uppercase text-cyan-100/76"
              >
                <Play className="h-3 w-3" strokeWidth={IS} />
                Play
              </button>
            </div>
            <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
              <button
                type="button"
                data-solar-action="atlas-route-prev"
                onClick={() => setRouteObject(routeIndex - 1)}
                className="grid h-7 w-7 place-items-center rounded-[3px] border border-white/[0.08] text-white/55"
              >
                <ChevronLeft className="h-3.5 w-3.5" strokeWidth={IS} />
              </button>
              <button
                type="button"
                data-solar-action="atlas-route-target"
                onClick={() => routeObject && select(routeObject)}
                className="min-w-0 rounded-[4px] border border-white/[0.07] bg-white/[0.025] px-2 py-1.5 text-left"
              >
                <span className="block truncate text-[10px] text-white/74">
                  {(routeIndex + 1).toString().padStart(2, "0")} / {routeObject?.name ?? "No route target"}
                </span>
                <span className="block truncate font-mono text-[7px] uppercase text-white/34">
                  {routeStop?.note ?? "fallback"}
                </span>
              </button>
              <button
                type="button"
                data-solar-action="atlas-route-next"
                onClick={() => setRouteObject(routeIndex + 1)}
                className="grid h-7 w-7 place-items-center rounded-[3px] border border-white/[0.08] text-white/55"
              >
                <ChevronRight className="h-3.5 w-3.5" strokeWidth={IS} />
              </button>
            </div>
            <div className="mt-2 flex gap-1">
              {route.stops.map((stop, index) => (
                <button
                  key={stop.id}
                  type="button"
                  aria-label={`Route stop ${index + 1}`}
                  onClick={() => setRouteObject(index)}
                  className={`h-1.5 flex-1 rounded-full ${index === routeIndex ? "bg-cyan-200/80" : "bg-white/12"}`}
                />
              ))}
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
                    onClick={() =>
                      setActiveTypes((current) =>
                        active ? current.filter((type) => type !== filter.type) : [...current, filter.type],
                      )
                    }
                    className={`rounded-[3px] px-1.5 py-1 font-mono text-[7px] uppercase ${
                      active ? "bg-cyan-200/[0.12] text-cyan-100" : "bg-white/[0.04] text-white/40"
                    }`}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>
            <div className="grid max-h-60 gap-1 overflow-y-auto" data-solar-atlas-search-results>
              {(query || activeTypes.length ? searchResults : discover).slice(0, 18).map((object) => (
                <ObjectButton
                  key={object.id}
                  object={object}
                  active={selected?.id === object.id}
                  favorite={storage.favorites.includes(object.id)}
                  onSelect={() => select(object)}
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

          <div className="rounded-[3px] border border-amber-200/12 bg-amber-200/[0.035] px-2 py-1 font-mono text-[7px] uppercase leading-3 text-amber-100/72">
            Curated visual atlas only. Not a complete planetarium or certified astrometric database.
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
