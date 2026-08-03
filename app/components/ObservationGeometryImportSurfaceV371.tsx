"use client";

import { useEffect, useState } from "react";
import { useAtlasRuntimeStore } from "../lib/atlasRuntimeStore";
import {
  ATLAS_VISUAL_PROFILE_CANDIDATE_V370,
  resolveAtlasVisualProfileV299,
} from "../lib/atlasVisualProfileV299";
import {
  createAtlasVisualTokenSignatureV300,
  useAtlasVisualRuntimeConsumerV300,
} from "../lib/atlasVisualRuntimeConsumptionV300";
import {
  parseObservationGeometryImportInspectV371,
  type ObservationGeometryImportInspectV371,
} from "../lib/observationGeometryImportV371";

export default function ObservationGeometryImportSurfaceV371() {
  const profile = useAtlasRuntimeStore((snapshot) => snapshot.visualProfile);
  if (profile !== ATLAS_VISUAL_PROFILE_CANDIDATE_V370) return null;
  return <Panel />;
}

function Panel() {
  const profile = resolveAtlasVisualProfileV299(ATLAS_VISUAL_PROFILE_CANDIDATE_V370);
  const tokens = profile.runtimeTokens.hud.observatoryHudV10;
  if (!tokens) throw new Error("v371-v10-token-boundary");

  useAtlasVisualRuntimeConsumerV300({
    profile: profile.id,
    group: "hud",
    consumer: "ObservationGeometryImportSurfaceV371",
    tokenSignature: createAtlasVisualTokenSignatureV300(profile.runtimeTokens.hud),
  });

  const [artifact, setArtifact] = useState<ObservationGeometryImportInspectV371 | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/atlas/relativity-evidence/v371/geometry-import", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const value = (await response.json()) as { available?: boolean; artifact?: unknown };
        if (response.ok && value.available === false) return null;
        if (!response.ok || value.available !== true || !value.artifact) {
          throw new Error("v371-import-unavailable");
        }
        return parseObservationGeometryImportInspectV371(value.artifact);
      })
      .then((value) => {
        if (!controller.signal.aborted && value) setArtifact(value);
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  return (
    <section
      className="mt-2 rounded-[10px] border border-indigo-100/15 bg-[radial-gradient(circle_at_12%_0%,rgba(129,140,248,.12),transparent_38%),linear-gradient(145deg,rgba(11,15,45,.92),rgba(6,7,13,.98))] p-3 font-mono text-[8px] text-white/55"
      data-atlas-observation-geometry-import-v371
      data-atlas-v371-v10-token-consumer="true"
      data-atlas-v371-compile-executed="false"
      data-atlas-v371-candidate-published="false"
      data-atlas-v371-runtime-geometry-published="false"
      data-atlas-v371-authority-granted="false"
      data-atlas-v371-science-buffer-mutation="false"
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <div className="text-[7px] uppercase tracking-[.2em] text-indigo-100/50">
            Measured geometry import v371
          </div>
          <div className="text-[13px] text-indigo-50/90">严格 CSV 编译链 · 仅生成候选</div>
        </div>
        <div className="text-right text-[7px] text-indigo-100/60">
          {artifact?.status ?? "loading"}
          <br />
          {artifact?.presentFileCount ?? 0} / 4 files
        </div>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
        <Metric label="input rows" value={String(artifact?.measuredDataRowCount ?? 0)} />
        <Metric label="compile" value="NOT RUN" />
        <Metric label="runtime geometry" value="UNAVAILABLE" />
        <Metric label="authority" value="UNAVAILABLE" />
      </div>
      {artifact ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {artifact.expectedFiles.map((file) => {
            const missing = artifact.missingFiles.includes(file);
            return (
              <span
                key={file}
                className={`rounded border px-2 py-1 ${
                  missing
                    ? "border-indigo-100/10 text-indigo-100/55"
                    : "border-emerald-100/10 text-emerald-100/55"
                }`}
              >
                {file} · {missing ? "missing" : "present"}
              </span>
            );
          })}
        </div>
      ) : null}
      <div className="mt-2 rounded border border-white/[.08] px-2 py-1.5 text-[7px] leading-3 text-white/38">
        编译器只生成 geometry candidate，不能写入 v369 runtime geometry，也不能授予 authority。真实候选仍需独立验证与新的显式准入。
      </div>
    </section>
  );
}

function Metric({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="rounded border border-white/[.08] bg-black/20 px-2 py-2">
      <div className="text-[7px] uppercase text-white/30">{label}</div>
      <div className="mt-1 text-[10px] text-indigo-50/80">{value}</div>
    </div>
  );
}
