"use client";

import { useMemo, useState } from "react";
import {
  MAINLINE_A_BETA_INTAKE_QUEUE,
  filterMainlineABetaAssetsV607,
  summarizeMainlineABetaIntakeV607,
  type MainlineABetaAssetKindV607,
  type MainlineABetaAssetRecordV607,
  type MainlineABetaIntakeStatusV607,
} from "../data/mainlineABetaAssetIntakeV607";

type IntakeFilter = "all" | MainlineABetaAssetKindV607 | MainlineABetaIntakeStatusV607;

const FILTERS: readonly { id: IntakeFilter; label: string }[] = [
  { id: "all", label: "all" },
  { id: "hero-star", label: "heroes" },
  { id: "nebula", label: "nebulae" },
  { id: "awaiting-source", label: "source" },
  { id: "rights-review", label: "rights" },
];

const STATUS_LABELS: Record<MainlineABetaIntakeStatusV607, string> = {
  "awaiting-source": "awaiting source",
  "source-captured": "source captured",
  "rights-review": "rights review",
  "rights-cleared": "rights cleared",
  "runtime-admitted": "runtime admitted",
};

const STATUS_COLORS: Record<MainlineABetaIntakeStatusV607, string> = {
  "awaiting-source": "text-amber-100/70",
  "source-captured": "text-sky-100/70",
  "rights-review": "text-orange-100/75",
  "rights-cleared": "text-emerald-100/75",
  "runtime-admitted": "text-cyan-100/85",
};

function isKindFilter(filter: IntakeFilter): filter is MainlineABetaAssetKindV607 {
  return filter === "hero-star" || filter === "nebula";
}

function isStatusFilter(filter: IntakeFilter): filter is MainlineABetaIntakeStatusV607 {
  return filter !== "all" && !isKindFilter(filter);
}

function filterRecords(filter: IntakeFilter, search: string): readonly MainlineABetaAssetRecordV607[] {
  return filterMainlineABetaAssetsV607(MAINLINE_A_BETA_INTAKE_QUEUE, {
    ...(isKindFilter(filter) ? { kind: filter } : {}),
    ...(isStatusFilter(filter) ? { status: filter } : {}),
    ...(search.trim() ? { search } : {}),
  });
}

function RecordRow({ record }: Readonly<{ record: MainlineABetaAssetRecordV607 }>) {
  const firstBlocker = record.blockingReasons[0] ?? "ready";
  return (
    <div
      className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-x-2 border-b border-white/[0.06] px-2 py-1.5 last:border-b-0"
      data-mainline-a-beta-intake-row={record.id}
      data-mainline-a-beta-kind={record.kind}
      data-mainline-a-beta-status={record.status}
      data-mainline-a-beta-admission={record.admission}
    >
      <div className="min-w-0">
        <div className="truncate text-[8px] text-white/75">{record.displayName}</div>
        <div className="truncate text-[6px] uppercase tracking-[.08em] text-white/35">
          {record.kind === "hero-star" ? "hero star" : "nebula"} · queue {String(record.queueOrder).padStart(2, "0")}
        </div>
        <div className="truncate text-[6px] uppercase tracking-[.08em] text-white/30" data-mainline-a-beta-blocker={record.id}>
          {firstBlocker}
        </div>
      </div>
      <span className={`self-start pt-0.5 text-right text-[6px] uppercase tracking-[.06em] ${STATUS_COLORS[record.status]}`}>
        {STATUS_LABELS[record.status]}
      </span>
    </div>
  );
}

export default function MainlineABetaIntakePanelV607() {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<IntakeFilter>("all");
  const [search, setSearch] = useState("");
  const summary = useMemo(() => summarizeMainlineABetaIntakeV607(), []);
  const records = useMemo(() => filterRecords(filter, search), [filter, search]);

  return (
    <section
      className="pointer-events-auto absolute bottom-3 right-3 z-[102] w-[min(360px,calc(100vw-24px))] font-mono sm:z-[115]"
      data-mainline-a-beta-intake-panel="true"
      data-mainline-a-beta-intake-total={summary.total}
      data-mainline-a-beta-intake-blocked={summary.blocked}
      data-mainline-a-beta-intake-admitted={summary.admitted}
    >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="min-h-9 border border-amber-100/20 bg-[#020609]/88 px-3 text-[8px] uppercase tracking-[.14em] text-amber-50/70 backdrop-blur-md hover:border-amber-100/40"
        aria-expanded={open}
        data-mainline-a-beta-intake-toggle="true"
      >
        Beta intake · {summary.admitted}/{summary.total} admitted
      </button>
      {open ? (
        <div className="mt-1 min-w-0 overflow-hidden border border-amber-100/18 bg-[#020609]/95 shadow-2xl backdrop-blur-xl" data-mainline-a-beta-intake-surface="true">
          <div className="border-b border-white/10 px-2.5 py-2">
            <div className="flex items-center justify-between gap-2">
              <div className="text-[8px] uppercase tracking-[.12em] text-amber-50/80">source admission queue</div>
              <div className="text-[6px] uppercase tracking-[.1em] text-white/40">fail-closed</div>
            </div>
            <div className="mt-1 text-[6px] leading-3 text-white/42">
              {summary.byKind["hero-star"]} pending hero sources · {summary.byKind.nebula} pending nebula sources · {summary.blocked} blocked records
            </div>
            <label className="mt-2 block">
              <span className="sr-only">Search Beta intake</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="search id or display name"
                className="w-full border border-white/10 bg-black/20 px-2 py-1.5 text-[7px] text-white/75 outline-none placeholder:text-white/25 focus:border-amber-100/35"
                data-mainline-a-beta-intake-search="true"
              />
            </label>
            <div className="mt-2 flex flex-wrap gap-1" role="tablist" aria-label="Beta intake filters">
              {FILTERS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setFilter(option.id)}
                  role="tab"
                  aria-selected={filter === option.id}
                  className={`border px-1.5 py-1 text-[6px] uppercase tracking-[.08em] ${filter === option.id ? "border-amber-100/45 bg-amber-100/10 text-amber-50/80" : "border-white/10 text-white/35 hover:border-white/25"}`}
                  data-mainline-a-beta-intake-filter={option.id}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <div className="max-h-[42dvh] overflow-y-auto" data-mainline-a-beta-intake-results={records.length}>
            {records.length > 0 ? records.map((record) => <RecordRow key={record.id} record={record} />) : (
              <div className="px-2 py-4 text-center text-[7px] uppercase tracking-[.1em] text-white/35" data-mainline-a-beta-intake-empty="true">
                no records match this filter
              </div>
            )}
          </div>
          <div className="border-t border-white/10 px-2.5 py-1.5 text-[6px] leading-3 text-white/32">
            Source snapshots, per-image rights and local manifests are required before runtime admission. Presentation models never write back measurements.
          </div>
        </div>
      ) : null}
    </section>
  );
}
