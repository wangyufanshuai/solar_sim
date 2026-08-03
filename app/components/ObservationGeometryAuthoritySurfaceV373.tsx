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
  parseObservationGeometryAuthorityInspectV373,
  type ObservationGeometryAuthorityInspectV373,
} from "../lib/observationGeometryAuthorityInspectV373";

export default function ObservationGeometryAuthoritySurfaceV373() {
  const profile = useAtlasRuntimeStore((snapshot) => snapshot.visualProfile);
  if (profile !== ATLAS_VISUAL_PROFILE_CANDIDATE_V370) return null;
  return <Panel />;
}

function Panel() {
  const profile = resolveAtlasVisualProfileV299(ATLAS_VISUAL_PROFILE_CANDIDATE_V370);
  const tokens = profile.runtimeTokens.hud.observatoryHudV10;
  if (!tokens) throw new Error("v373-v10-token-boundary");
  useAtlasVisualRuntimeConsumerV300({
    profile: profile.id,
    group: "hud",
    consumer: "ObservationGeometryAuthoritySurfaceV373",
    tokenSignature: createAtlasVisualTokenSignatureV300(profile.runtimeTokens.hud),
  });

  const [artifact, setArtifact] = useState<ObservationGeometryAuthorityInspectV373 | null>(
    null,
  );
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/atlas/relativity-evidence/v373/geometry-authority", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const value = (await response.json()) as { available?: boolean; artifact?: unknown };
        if (response.ok && value.available === false) return null;
        if (!response.ok || value.available !== true || !value.artifact) {
          throw new Error("v373-authority-unavailable");
        }
        return parseObservationGeometryAuthorityInspectV373(value.artifact);
      })
      .then((value) => {
        if (!controller.signal.aborted && value) setArtifact(value);
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  return (
    <section
      className="mt-2 rounded-[10px] border border-amber-100/15 bg-[radial-gradient(circle_at_10%_0%,rgba(251,191,36,.1),transparent_38%),linear-gradient(145deg,rgba(37,22,6,.92),rgba(6,7,13,.98))] p-3 font-mono text-[8px] text-white/55"
      data-atlas-observation-geometry-authority-v373
      data-atlas-v373-v10-token-consumer="true"
      data-atlas-v373-admission-executed="false"
      data-atlas-v373-authority-pointer-published="false"
      data-atlas-v373-runtime-geometry-published="false"
      data-atlas-v373-authority-granted="false"
      data-atlas-v373-science-buffer-mutation="false"
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <div className="text-[7px] uppercase tracking-[.2em] text-amber-100/50">
            Geometry authority admission v373
          </div>
          <div className="text-[13px] text-amber-50/90">身份与 SHA 全链锁定 · 准入不等于运行时发布</div>
        </div>
        <div className="text-right text-[7px] text-amber-100/60">
          {artifact?.status ?? "loading"}
          <br />
          {artifact?.presentInputCount ?? 0} / 7 inputs
        </div>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
        <Metric label="compiler" value="CANDIDATE ONLY" />
        <Metric label="validator" value="INDEPENDENT" />
        <Metric label="runtime publish" value="SEPARATE" />
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
                    ? "border-amber-100/10 text-amber-100/55"
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
        准入控制器同时锁定编译产物、独立验证、原始文件、候选 canonical SHA 与仪器身份。通过后只签发 local-shadow authority pointer；runtime geometry 仍由后续独立发布步骤负责。
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
      <div className={`mt-1 text-[10px] ${alert ? "text-amber-100/85" : "text-amber-50/78"}`}>
        {value}
      </div>
    </div>
  );
}
