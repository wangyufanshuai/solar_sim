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
  parseExpectedElectronScienceImageInspectV376,
  type ExpectedElectronScienceImageInspectV376,
} from "../lib/expectedElectronScienceImageInspectV376";

export default function ExpectedElectronScienceImageSurfaceV376() {
  const profile = useAtlasRuntimeStore((snapshot) => snapshot.visualProfile);
  if (profile !== ATLAS_VISUAL_PROFILE_CANDIDATE_V370) return null;
  return <Panel />;
}

function Panel() {
  const profile = resolveAtlasVisualProfileV299(ATLAS_VISUAL_PROFILE_CANDIDATE_V370);
  const tokens = profile.runtimeTokens.hud.observatoryHudV10;
  if (!tokens) throw new Error("v376-v10-token-boundary");
  useAtlasVisualRuntimeConsumerV300({
    profile: profile.id,
    group: "hud",
    consumer: "ExpectedElectronScienceImageSurfaceV376",
    tokenSignature: createAtlasVisualTokenSignatureV300(profile.runtimeTokens.hud),
  });
  const [artifact, setArtifact] =
    useState<ExpectedElectronScienceImageInspectV376 | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/atlas/relativity-evidence/v376/expected-electron-image", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const value = (await response.json()) as { available?: boolean; artifact?: unknown };
        if (response.ok && value.available === false) return null;
        if (!response.ok || value.available !== true || !value.artifact) {
          throw new Error("v376-image-unavailable");
        }
        return parseExpectedElectronScienceImageInspectV376(value.artifact);
      })
      .then((value) => {
        if (!controller.signal.aborted && value) setArtifact(value);
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  return (
    <section
      className="mt-2 rounded-[10px] border border-violet-100/15 bg-[radial-gradient(circle_at_88%_0%,rgba(139,92,246,.1),transparent_38%),linear-gradient(145deg,rgba(24,11,43,.92),rgba(6,7,13,.98))] p-3 font-mono text-[8px] text-white/55"
      data-atlas-expected-electron-image-v376
      data-atlas-v376-v10-token-consumer="true"
      data-atlas-v376-image-available="false"
      data-atlas-v376-zero-image-fallback="false"
      data-atlas-v376-observed-counts="unavailable"
      data-atlas-v376-cinematic-consumer="false"
      data-atlas-v376-science-buffer-mutation="false"
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <div className="text-[7px] uppercase tracking-[.2em] text-violet-100/50">
            Expected-electron image v376
          </div>
          <div className="text-[13px] text-violet-50/90">4×3 线性 Float64 图层 · 无零值伪图</div>
        </div>
        <div className="text-right text-[7px] text-violet-100/60">
          {artifact?.status ?? "loading"}
          <br />0 / 12 cells
        </div>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
        <Metric label="envelope" value="UNAVAILABLE" alert />
        <Metric label="science layers" value="0 / 8" alert />
        <Metric label="zero fallback" value="DISABLED" />
        <Metric label="observed counts" value="UNAVAILABLE" alert />
      </div>
      <div className="mt-2 rounded border border-white/[.08] px-2 py-1.5 text-[7px] leading-3 text-white/38">
        只有 v375 双 Authority envelope 可生成 source、dark、background、read-noise、total、ADU、variance 与 sigma 图层。缺失时不创建任何像素数组，也不允许 Cinematic 替代。
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
      <div className={`mt-1 text-[10px] ${alert ? "text-amber-100/85" : "text-violet-50/80"}`}>
        {value}
      </div>
    </div>
  );
}
