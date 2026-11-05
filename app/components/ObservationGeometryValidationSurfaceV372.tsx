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
  OBSERVATION_GEOMETRY_VALIDATION_GATES_V372,
} from "../lib/observationGeometryValidationConstantsV372";
import {
  parseObservationGeometryValidationInspectV372,
  type ObservationGeometryValidationInspectV372,
} from "../lib/observationGeometryValidationInspectV372";

export default function ObservationGeometryValidationSurfaceV372() {
  const profile = useAtlasRuntimeStore((snapshot) => snapshot.visualProfile);
  if (profile !== ATLAS_VISUAL_PROFILE_CANDIDATE_V370) return null;
  return <Panel />;
}

function Panel() {
  const profile = resolveAtlasVisualProfileV299(ATLAS_VISUAL_PROFILE_CANDIDATE_V370);
  const tokens = profile.runtimeTokens.hud.observatoryHudV10;
  if (!tokens) throw new Error("v372-v10-token-boundary");
  useAtlasVisualRuntimeConsumerV300({
    profile: profile.id,
    group: "hud",
    consumer: "ObservationGeometryValidationSurfaceV372",
    tokenSignature: createAtlasVisualTokenSignatureV300(profile.runtimeTokens.hud),
  });

  const [artifact, setArtifact] =
    useState<ObservationGeometryValidationInspectV372 | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/atlas/relativity-evidence/v372/geometry-validation", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const value = (await response.json()) as { available?: boolean; artifact?: unknown };
        if (response.ok && value.available === false) return null;
        if (!response.ok || value.available !== true || !value.artifact) {
          throw new Error("v372-validation-unavailable");
        }
        return parseObservationGeometryValidationInspectV372(value.artifact);
      })
      .then((value) => {
        if (!controller.signal.aborted && value) setArtifact(value);
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  return (
    <section
      className="mt-2 rounded-[10px] border border-cyan-100/15 bg-[radial-gradient(circle_at_90%_0%,rgba(34,211,238,.1),transparent_38%),linear-gradient(145deg,rgba(5,29,42,.92),rgba(6,7,13,.98))] p-3 font-mono text-[8px] text-white/55"
      data-atlas-observation-geometry-validation-v372
      data-atlas-v372-v10-token-consumer="true"
      data-atlas-v372-validation-executed="false"
      data-atlas-v372-measured-qualified="false"
      data-atlas-v372-runtime-geometry-published="false"
      data-atlas-v372-authority-granted="false"
      data-atlas-v372-science-buffer-mutation="false"
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <div className="text-[7px] uppercase tracking-[.2em] text-cyan-100/50">
            Independent geometry validation v372
          </div>
          <div className="text-[13px] text-cyan-50/90">原始测量重新计算 · 不信任编译器派生值</div>
        </div>
        <div className="text-right text-[7px] text-cyan-100/60">
          {artifact?.status ?? "loading"}
          <br />
          {artifact?.presentInputCount ?? 0} / 6 inputs
        </div>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
        <Metric
          label="repeat CV"
          value={`≤ ${OBSERVATION_GEOMETRY_VALIDATION_GATES_V372.maximumRepeatCoefficientOfVariation}`}
        />
        <Metric
          label="std residual"
          value={`≤ ${OBSERVATION_GEOMETRY_VALIDATION_GATES_V372.maximumStandardizedResidual}`}
        />
        <Metric
          label="reconstruct"
          value={`≤ ${OBSERVATION_GEOMETRY_VALIDATION_GATES_V372.maximumCandidateReconstructionRelativeDifference}`}
        />
        <Metric label="authority" value="UNAVAILABLE" alert />
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
                    ? "border-cyan-100/10 text-cyan-100/55"
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
        验证器直接读取原始测量，独立重算面积、像元立体角、重复性与残差。即使验证通过，也只产生 validation artifact；后续仍需独立 admission 才能发布 runtime geometry。
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
      <div className={`mt-1 text-[10px] ${alert ? "text-amber-100/80" : "text-cyan-50/80"}`}>
        {value}
      </div>
    </div>
  );
}
