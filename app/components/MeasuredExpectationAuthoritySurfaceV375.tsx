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
  parseMeasuredExpectationAuthorityInspectV375,
  type MeasuredExpectationAuthorityInspectV375,
} from "../lib/measuredExpectationAuthorityInspectV375";

export default function MeasuredExpectationAuthoritySurfaceV375() {
  const profile = useAtlasRuntimeStore((snapshot) => snapshot.visualProfile);
  if (profile !== ATLAS_VISUAL_PROFILE_CANDIDATE_V370) return null;
  return <Panel />;
}

function Panel() {
  const profile = resolveAtlasVisualProfileV299(ATLAS_VISUAL_PROFILE_CANDIDATE_V370);
  const tokens = profile.runtimeTokens.hud.observatoryHudV10;
  if (!tokens) throw new Error("v375-v10-token-boundary");
  useAtlasVisualRuntimeConsumerV300({
    profile: profile.id,
    group: "hud",
    consumer: "MeasuredExpectationAuthoritySurfaceV375",
    tokenSignature: createAtlasVisualTokenSignatureV300(profile.runtimeTokens.hud),
  });

  const [artifact, setArtifact] =
    useState<MeasuredExpectationAuthorityInspectV375 | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/atlas/relativity-evidence/v375/measured-expectation", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const value = (await response.json()) as { available?: boolean; artifact?: unknown };
        if (response.ok && value.available === false) return null;
        if (!response.ok || value.available !== true || !value.artifact) {
          throw new Error("v375-expectation-unavailable");
        }
        return parseMeasuredExpectationAuthorityInspectV375(value.artifact);
      })
      .then((value) => {
        if (!controller.signal.aborted && value) setArtifact(value);
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  return (
    <section
      className="mt-2 rounded-[10px] border border-sky-100/15 bg-[radial-gradient(circle_at_12%_0%,rgba(56,189,248,.1),transparent_38%),linear-gradient(145deg,rgba(5,25,42,.92),rgba(6,7,13,.98))] p-3 font-mono text-[8px] text-white/55"
      data-atlas-measured-expectation-authority-v375
      data-atlas-v375-v10-token-consumer="true"
      data-atlas-v375-build-executed="false"
      data-atlas-v375-detector-authority="false"
      data-atlas-v375-geometry-authority="false"
      data-atlas-v375-expectation-available="false"
      data-atlas-v375-observed-counts="unavailable"
      data-atlas-v375-science-buffer-mutation="false"
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <div className="text-[7px] uppercase tracking-[.2em] text-sky-100/50">
            Dual-authority expectation v375
          </div>
          <div className="text-[13px] text-sky-50/90">探测器 × 几何 Authority · 期望值不是观测计数</div>
        </div>
        <div className="text-right text-[7px] text-sky-100/60">
          {artifact?.status ?? "loading"}
          <br />
          {artifact?.presentInputCount ?? 0} / 8 inputs
        </div>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
        <Metric label="photon payload" value={artifact?.photonInputQualified ? "QUALIFIED" : "CHECK"} />
        <Metric label="detector authority" value="UNAVAILABLE" alert />
        <Metric label="geometry authority" value="UNAVAILABLE" alert />
        <Metric label="expectation rows" value="0 / 12" alert />
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
                    ? "border-sky-100/10 text-sky-100/55"
                    : "border-emerald-100/10 text-emerald-100/55"
                }`}
              >
                {input} · {missing ? "missing" : "present"}
              </span>
            );
          })}
        </div>
      ) : null}
      <div className="mt-2 rounded border border-white/[.08] px-2 py-1.5 text-[7px] leading-3 text-white/38">
        v328 photon payload 已就绪；只有探测器和观测几何两条 authority 链同时通过，才能生成 12 条电子期望。该结果始终不等于真实曝光、随机采样或观测计数。
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
      <div className={`mt-1 text-[10px] ${alert ? "text-amber-100/85" : "text-sky-50/80"}`}>
        {value}
      </div>
    </div>
  );
}
