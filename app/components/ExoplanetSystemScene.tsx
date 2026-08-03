"use client";

import { Html } from "@react-three/drei/web/Html";
import { Line } from "@react-three/drei/core/Line";
import { OrbitControls } from "@react-three/drei/core/OrbitControls";
import { useFrame, useThree } from "@react-three/fiber";
import { Orbit, Pause, Play, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import {
  deterministicDisplayPhase,
  EXOPLANET_CATALOG_V2_MANIFEST_URL,
  type ExoplanetOrbitDocument,
  type ExoplanetSystemDocument,
  type ExoplanetSystemManifestV2,
} from "../lib/exoplanetCatalog";
import { stellarMaterialProfile } from "../lib/stellarMaterialProfile";
import { createStellarPortraitProfileV7 } from "../lib/stellarPortraitProfileV7";
import { fetchAtlasAsset } from "../lib/atlasAssetResolver";
import { useAtlasRuntimeStore } from "../lib/atlasRuntimeStore";
import { resolveAtlasVisualProfileV299 } from "../lib/atlasVisualProfileV299";
import { createAtlasVisualTokenSignatureV300, useAtlasVisualRuntimeConsumerV300 } from "../lib/atlasVisualRuntimeConsumptionV300";
import StellarPortraitMaterial from "./StellarPortraitMaterial";

type OrbitView = "system" | "transit";
type LoadStatus = "loading" | "ready" | "error";

const SPEEDS = [0.25, 1, 10] as const;

export default function ExoplanetSystemScene({ systemId }: { systemId: string }) {
  const [system, setSystem] = useState<ExoplanetSystemDocument | null>(null);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [selectedPlanetId, setSelectedPlanetId] = useState("");
  const [view, setView] = useState<OrbitView>("system");
  const controls = useRef<OrbitControlsImpl | null>(null);
  const camera = useThree((state) => state.camera);
  const visualRendererProfile = useAtlasRuntimeStore(
    (snapshot) => resolveAtlasVisualProfileV299(snapshot.visualProfile),
  );
  useAtlasVisualRuntimeConsumerV300({
    profile: visualRendererProfile.id,
    group: "exoplanet",
    consumer: "ExoplanetSystemScene",
    tokenSignature: createAtlasVisualTokenSignatureV300(visualRendererProfile.runtimeTokens.exoplanet),
  });

  const restore = useCallback(() => {
    camera.position.set(0, 180, 320);
    camera.lookAt(0, 0, 0);
    controls.current?.target.set(0, 0, 0);
    controls.current?.update();
  }, [camera]);

  useEffect(() => {
    let live = true;
    setStatus("loading");
    setSystem(null);
    void (async () => {
      const manifestResponse = await fetchAtlasAsset(EXOPLANET_CATALOG_V2_MANIFEST_URL, {
        cache: "force-cache",
      });
      if (!manifestResponse.ok) throw new Error("Exoplanet manifest unavailable");
      const manifest = (await manifestResponse.json()) as ExoplanetSystemManifestV2;
      const shardId = manifest.index[systemId];
      const shard = manifest.shards.find((entry) => entry.id === shardId);
      if (!shard) throw new Error(`Unknown exoplanet system ${systemId}`);
      const shardResponse = await fetchAtlasAsset(shard.path, { cache: "force-cache" });
      if (!shardResponse.ok) throw new Error(`Exoplanet shard ${shardId} unavailable`);
      const rows = (await shardResponse.json()) as ExoplanetSystemDocument[];
      const next = rows.find((entry) => entry.id === systemId) ?? null;
      if (!next) throw new Error(`System ${systemId} missing from shard ${shardId}`);
      if (live) {
        setSystem(next);
        setSelectedPlanetId(next.planets[0]?.id ?? "");
        setStatus("ready");
      }
    })().catch(() => {
      if (live) setStatus("error");
    });
    return () => {
      live = false;
    };
  }, [systemId]);

  useEffect(() => {
    restore();
  }, [restore, systemId, view]);

  const selected =
    system?.planets.find((planet) => planet.id === selectedPlanetId) ??
    system?.planets[0] ??
    null;

  return (
    <>
      <color attach="background" args={["#010205"]} />
      <ambientLight intensity={0.12} />
      <pointLight intensity={8} distance={800} color="#fff2d0" />
      <OrbitControls
        ref={controls}
        makeDefault
        enableDamping
        dampingFactor={0.07}
        minDistance={12}
        maxDistance={900}
      />
      {system ? (
        <ExoplanetOrbitSystem
          system={system}
          paused={paused}
          speed={speed}
          selectedPlanetId={selectedPlanetId}
          view={view}
          visualRendererProfile={visualRendererProfile}
        />
      ) : null}
      <Html fullscreen style={{ pointerEvents: "none" }}>
        {status !== "ready" || !system ? (
          <div className="pointer-events-none absolute bottom-20 left-3 z-20 border border-cyan-100/15 bg-black/78 px-3 py-2 text-xs text-cyan-50/70 backdrop-blur-md">
            {status === "error" ? "无法读取本地系外行星分片" : "正在载入本地行星系统"}
          </div>
        ) : (
          <section
            className="pointer-events-auto absolute bottom-20 left-3 z-20 w-[min(380px,calc(100vw-24px))] rounded-md border border-cyan-100/20 bg-black/78 p-3 text-xs text-white/70 shadow-2xl backdrop-blur-md"
            data-exoplanet-system-v2={system.id}
            data-exoplanet-orbit-provenance={selected?.geometryProvenance ?? "none"}
            data-exoplanet-system-deep-link={`?system=${system.id}`}
          >
            <header className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-[10px] text-cyan-100/45">
                  NASA EXOPLANET ARCHIVE / {system.planets.length} 颗行星
                </div>
                <h2 className="mt-1 truncate text-sm font-semibold text-white">
                  {selected?.name ?? system.hostName}
                </h2>
              </div>
              <button
                type="button"
                title="恢复系统视图"
                aria-label="恢复系统视图"
                className="atlas-accessible-focus grid h-8 w-8 shrink-0 place-items-center rounded-md border border-white/15 text-white/65 hover:border-cyan-100/35 hover:text-cyan-50"
                onClick={restore}
              >
                <RotateCcw size={15} />
              </button>
            </header>

            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                title={paused ? "继续" : "暂停"}
                aria-label={paused ? "继续" : "暂停"}
                className="atlas-accessible-focus grid h-8 w-8 place-items-center rounded-md border border-white/15 hover:border-cyan-100/35"
                onClick={() => setPaused((value) => !value)}
              >
                {paused ? <Play size={14} /> : <Pause size={14} />}
              </button>
              <div className="flex h-8 overflow-hidden rounded-md border border-white/15">
                {SPEEDS.map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={`min-w-11 border-r border-white/10 px-2 text-[11px] last:border-r-0 ${
                      speed === value ? "bg-cyan-100/12 text-cyan-100" : "text-white/50"
                    }`}
                    onClick={() => setSpeed(value)}
                  >
                    {value}x
                  </button>
                ))}
              </div>
              <div className="ml-auto flex h-8 overflow-hidden rounded-md border border-white/15">
                {(["system", "transit"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    className={`flex items-center gap-1 px-2.5 text-[11px] ${
                      view === mode ? "bg-cyan-100/12 text-cyan-100" : "text-white/50"
                    }`}
                    onClick={() => setView(mode)}
                  >
                    <Orbit size={12} />
                    {mode === "system" ? "系统" : "凌日"}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-3 flex max-h-20 flex-wrap gap-1 overflow-auto pr-1">
              {system.planets.map((planet) => (
                <button
                  key={planet.id}
                  type="button"
                  onClick={() => setSelectedPlanetId(planet.id)}
                  className={`rounded border px-2 py-1 text-[10px] ${
                    planet.id === selectedPlanetId
                      ? "border-cyan-300/50 bg-cyan-100/8 text-cyan-100"
                      : "border-white/10 text-white/50 hover:border-white/25"
                  }`}
                >
                  {planet.name.replace(system.hostName, "").trim() || planet.name}
                </button>
              ))}
            </div>

            {selected ? <PlanetReadout planet={selected} /> : null}
          </section>
        )}
      </Html>
    </>
  );
}

function PlanetReadout({ planet }: { planet: ExoplanetOrbitDocument }) {
  return (
    <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 border-t border-white/10 pt-2 text-[10px] text-white/50">
      <span>半长轴 {formatValue(planet.semiMajorAxisAu, 4, "AU")}</span>
      <span>周期 {formatValue(planet.periodDays, 5, "d")}</span>
      <span>
        偏心率 {planet.eccentricity?.toPrecision(3) ?? "未知 / 虚线布局"}
      </span>
      <span>
        倾角 {planet.inclinationDeg?.toPrecision(4) ?? "展示方向"}
      </span>
      <span className="truncate" title={planet.geometryProvenance}>
        轨道 {planet.geometryProvenance}
      </span>
      <span className="truncate" title={planet.phaseProvenance}>
        相位 {planet.phaseProvenance}
      </span>
    </div>
  );
}

function ExoplanetOrbitSystem({
  system,
  paused,
  speed,
  selectedPlanetId,
  view,
  visualRendererProfile,
}: {
  system: ExoplanetSystemDocument;
  paused: boolean;
  speed: number;
  selectedPlanetId: string;
  view: OrbitView;
  visualRendererProfile: ReturnType<typeof resolveAtlasVisualProfileV299>;
}) {
  const refs = useRef<Array<THREE.Mesh | null>>([]);
  const elapsed = useRef(0);
  const scale = useMemo(() => {
    const outer = Math.max(
      0.02,
      ...system.planets.map((planet) => planet.semiMajorAxisAu ?? 0),
    );
    return Math.min(3200, 220 / outer);
  }, [system.planets]);
  const orbits = useMemo(
    () =>
      system.planets.map((planet, index) => {
        const a = displayOrbitRadius(planet, index, scale);
        const eccentricity = planet.eccentricity ?? 0;
        const b = a * Math.sqrt(Math.max(0.05, 1 - eccentricity * eccentricity));
        const points = Array.from({ length: 129 }, (_, pointIndex) => {
          const angle = (pointIndex / 128) * Math.PI * 2;
          return new THREE.Vector3(
            Math.cos(angle) * a - a * eccentricity,
            0,
            Math.sin(angle) * b,
          );
        });
        return { a, b, eccentricity, points };
      }),
    [scale, system.planets],
  );
  const stellarMaterial = useMemo(
    () =>
      stellarMaterialProfile({
        id: system.id,
        fallbackColor: hostColorForTeff(system.stellarTeffK),
      }),
    [system.id, system.stellarTeffK],
  );
  const stellarPortrait = useMemo(
    () =>
      createStellarPortraitProfileV7({
        material: stellarMaterial,
        teffK: system.stellarTeffK,
        radiusSolar: system.stellarRadiusSolar,
      }),
    [stellarMaterial, system.stellarRadiusSolar, system.stellarTeffK],
  );

  useFrame((_, delta) => {
    if (!paused) elapsed.current += Math.min(0.1, delta) * speed;
    system.planets.forEach((planet, index) => {
      const mesh = refs.current[index];
      if (!mesh) return;
      const orbit = orbits[index];
      const phase =
        deterministicDisplayPhase(planet.id) +
        elapsed.current / Math.max(2, (planet.periodDays ?? 20) * 0.25);
      mesh.position.set(
        Math.cos(phase) * orbit.a - orbit.a * orbit.eccentricity,
        0,
        Math.sin(phase) * orbit.b,
      );
    });
  });

  return (
    <group rotation={view === "transit" ? [0, 0, 0] : [-0.18, 0, 0.08]}>
      <mesh>
        <sphereGeometry args={[5.5, 72, 48]} />
        <StellarPortraitMaterial material={stellarMaterial} portrait={stellarPortrait} />
      </mesh>
      <mesh>
        <sphereGeometry args={[7.2, 36, 24]} />
        <meshBasicMaterial
          color={stellarMaterial.coronaColor}
          transparent
          opacity={0.08}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      {system.planets.map((planet, index) => {
        const orbit = orbits[index];
        const selected = planet.id === selectedPlanetId;
        return (
          <group key={planet.id}>
            <Line
              points={orbit.points}
              color={
                selected
                  ? "#b8f3ff"
                  : planet.eccentricity == null
                    ? "#425b6d"
                    : "#478ba2"
              }
              opacity={visualRendererProfile.runtimeTokens.exoplanet.orbitOpacity}
              transparent={visualRendererProfile.runtimeTokens.exoplanet.orbitOpacity < 1}
              lineWidth={selected ? 2.5 : planet.eccentricity == null ? 1 : 1.4}
              dashed={planet.eccentricity == null}
              dashSize={3}
              gapSize={2}
            />
            <mesh
              ref={(node) => {
                refs.current[index] = node;
              }}
            >
              <sphereGeometry args={[planetRadius(planet), 24, 16]} />
              <meshStandardMaterial
                emissive={selected ? "#183d4a" : "#000000"}
                color={planetColor(
                  planet,
                  index,
                  system.stellarTeffK,
                  system.stellarRadiusSolar,
                  visualRendererProfile.runtimeTokens.exoplanet.temperatureColorMix,
                )}
                roughness={Math.max(
                  visualRendererProfile.planetRoughnessMinimum,
                  0.72 * visualRendererProfile.planetRoughnessMultiplier,
                )}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function displayOrbitRadius(
  planet: ExoplanetOrbitDocument,
  index: number,
  scale: number,
): number {
  return Math.max(0.8, (planet.semiMajorAxisAu ?? 0.04 + index * 0.035) * scale);
}

function planetRadius(planet: ExoplanetOrbitDocument): number {
  return Math.max(0.45, Math.min(1.45, (planet.radiusEarth ?? 1) * 0.17));
}

function planetColor(
  planet: ExoplanetOrbitDocument,
  index: number,
  stellarTeffK: number | null,
  stellarRadiusSolar: number | null,
  temperatureMix: number,
): string {
  const base = new THREE.Color(
    (planet.radiusEarth ?? 0) > 8
      ? "#d6a060"
      : (planet.massEarth ?? 0) > 10
        ? "#8ab8d3"
        : ["#bd7553", "#72a3bd", "#b8b09b", "#8b9a7a"][index % 4],
  );
  const equilibriumTemperatureK = estimateEquilibriumTemperatureK(
    stellarTeffK,
    stellarRadiusSolar,
    planet.semiMajorAxisAu,
  );
  if (equilibriumTemperatureK == null || temperatureMix <= 0) return `#${base.getHexString()}`;
  const temperatureColor = new THREE.Color(
    equilibriumTemperatureK < 220
      ? "#6f9fc4"
      : equilibriumTemperatureK < 420
        ? "#9bb9b0"
        : equilibriumTemperatureK < 850
          ? "#d2aa72"
          : "#d87552",
  );
  return `#${base.lerp(temperatureColor, temperatureMix).getHexString()}`;
}

function estimateEquilibriumTemperatureK(
  stellarTeffK: number | null,
  stellarRadiusSolar: number | null,
  semiMajorAxisAu: number | null,
): number | null {
  if (
    stellarTeffK == null || !Number.isFinite(stellarTeffK) || stellarTeffK <= 0 ||
    stellarRadiusSolar == null || !Number.isFinite(stellarRadiusSolar) || stellarRadiusSolar <= 0 ||
    semiMajorAxisAu == null || !Number.isFinite(semiMajorAxisAu) || semiMajorAxisAu <= 0
  ) return null;
  const solarRadiusAu = 0.00465047;
  return stellarTeffK * Math.sqrt((stellarRadiusSolar * solarRadiusAu) / (2 * semiMajorAxisAu));
}

function hostColorForTeff(teffK: number | null): string {
  if (teffK == null) return "#ffe6b8";
  if (teffK < 3_700) return "#ff7b4f";
  if (teffK < 5_200) return "#ffb46b";
  if (teffK < 6_500) return "#fff0cf";
  if (teffK < 9_000) return "#d9e9ff";
  return "#9fc6ff";
}

function formatValue(value: number | null, precision: number, unit: string): string {
  return value == null ? "未知" : `${value.toPrecision(precision)} ${unit}`;
}
