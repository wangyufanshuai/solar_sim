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
  parseObservationGeometryRuntimePublicationInspectV374,
  type ObservationGeometryRuntimePublicationInspectV374,
} from "../lib/observationGeometryRuntimePublicationInspectV374";

export default function ObservationGeometryRuntimePublicationSurfaceV374() {
  const profile = useAtlasRuntimeStore((snapshot) => snapshot.visualProfile);
  if (profile !== ATLAS_VISUAL_PROFILE_CANDIDATE_V370) return null;
  return <Panel />;
}

function Panel() {
  const profile = resolveAtlasVisualProfileV299(ATLAS_VISUAL_PROFILE_CANDIDATE_V370);
  const tokens = profile.runtimeTokens.hud.observatoryHudV10;
  if (!tokens) throw new Error("v374-v10-token-boundary");
  useAtlasVisualRuntimeConsumerV300({
    profile: profile.id,
    group: "hud",
    consumer: "ObservationGeometryRuntimePublicationSurfaceV374",
    tokenSignature: createAtlasVisualTokenSignatureV300(profile.runtimeTokens.hud),
  });

  const [artifact, setArtifact] =
    useState<ObservationGeometryRuntimePublicationInspectV374 | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/atlas/relativity-evidence/v374/geometry-publication", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const value = (await response.json()) as { available?: boolean; artifact?: unknown };
        if (response.ok && value.available === false) return null;
        if (!response.ok || value.available !== true || !value.artifact) {
          throw new Error("v374-publication-unavailable");
        }
        return parseObservationGeometryRuntimePublicationInspectV374(value.artifact);
      })
      .then((value) => {
        if (!controller.signal.aborted && value) setArtifact(value);
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  return (
    <section
      className="mt-2 rounded-[10px] border border-emerald-100/15 bg-[radial-gradient(circle_at_92%_0%,rgba(16,185,129,.1),transparent_38%),linear-gradient(145deg,rgba(4,32,25,.92),rgba(6,7,13,.98))] p-3 font-mono text-[8px] text-white/55"
      data-atlas-observation-geometry-publication-v374
      data-atlas-v374-v10-token-consumer="true"
      data-atlas-v374-publication-executed="false"
      data-atlas-v374-runtime-geometry-published="false"
      data-atlas-v374-measured-authority-available="false"
      data-atlas-v374-expectation-available="false"
      data-atlas-v374-science-buffer-mutation="false"
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <div className="text-[7px] uppercase tracking-[.2em] text-emerald-100/50">
            Runtime geometry publication v374
          </div>
          <div className="text-[13px] text-emerald-50/90">九输入重新验签 · 只读原子发布</div>
        </div>
        <div className="text-right text-[7px] text-emerald-100/60">
          {artifact?.status ?? "loading"}
          <br />
          {artifact?.presentInputCount ?? 0} / 9 inputs
        </div>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
        <Metric label="authority" value="REQUIRED" />
        <Metric label="SHA locks" value="9 INPUTS" />
        <Metric label="runtime geometry" value="UNAVAILABLE" alert />
        <Metric label="expectation" value="UNAVAILABLE" alert />
      </div>
      {artifact ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {artifact.expectedInputs.map((input) => {
            const missing = artifact.missingInputs.includes(input);
            return (
              <span
                key={input}
                className={`rounded border px-2 py-1 ${
                  missing
                    ? "border-emerald-100/10 text-emerald-100/55"
                    : "border-cyan-100/10 text-cyan-100/55"
                }`}
              >
                {input} · {missing ? "missing" : "present"}
              </span>
            );
          })}
        </div>
      ) : null}
      <div className="mt-2 rounded border border-white/[.08] px-2 py-1.5 text-[7px] leading-3 text-white/38">
        发布器重新校验 authority、admission、validation、compiler、candidate 与全部原始文件。只有完整链一致时才原子写入 v369 geometry；探测器 authority 仍是独立前置条件。
      </div>
    </section>
  );
}

function Metric({
  label,
  value,
  alert = false,
}: Readonly<{ label: string; value: string; alert?: boolean }>) {
  return (
    <div className="rounded border border-white/[.08] bg-black/20 px-2 py-2">
      <div className="text-[7px] uppercase text-white/30">{label}</div>
      <div className={`mt-1 text-[10px] ${alert ? "text-amber-100/85" : "text-emerald-50/80"}`}>
        {value}
      </div>
    </div>
  );
}
