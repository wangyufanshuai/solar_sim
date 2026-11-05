"use client";

import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { SOLAR_SYSTEM_BODIES } from "../data/planetsJ2000";
import {
  assembleBodyTextureSlots,
  collectPlanetTextureLoadTasks,
  preloadPlanetTextureUrls,
  type BodyTextureSlots,
} from "../lib/planetTextureManager";
import { acquireAtlasTextureResourceV289 } from "../lib/atlasResourceLifecycle";

const TEXTURE_PROGRESS_MESSAGE = "正在载入本地行星纹理";

export type TextureAssetProgress = {
  ratio: number;
  message: string;
  loaded: number;
  total: number;
};

type PlanetTextureAssetsValue = {
  ready: boolean;
  texturesById: Record<string, BodyTextureSlots>;
  getSlots: (bodyId: string) => BodyTextureSlots;
};

const PlanetTextureAssetsContext = createContext<PlanetTextureAssetsValue | null>(
  null,
);

export function usePlanetTextureAssets(): PlanetTextureAssetsValue {
  const ctx = useContext(PlanetTextureAssetsContext);
  if (!ctx) {
    return {
      ready: true,
      texturesById: {},
      getSlots: () => ({}),
    };
  }
  return ctx;
}

export function PlanetTextureAssetsProvider({
  children,
  onTextureAssetProgress,
}: {
  children: ReactNode;
  onTextureAssetProgress?: (s: TextureAssetProgress) => void;
}) {
  const gl = useThree((s) => s.gl);
  const [ready, setReady] = useState(false);
  const [texturesById, setTexturesById] = useState<
    Record<string, BodyTextureSlots>
  >({});
  const disposedRef = useRef(false);
  const texturesRef = useRef<Map<string, THREE.Texture>>(new Map());
  const textureReleaseRef = useRef<Map<string, () => void>>(new Map());

  const extraNormalById = useMemo(() => {
    const m: Record<string, string | undefined> = {};
    for (const def of SOLAR_SYSTEM_BODIES) {
      if (def.normalMap) m[def.id] = def.normalMap;
    }
    return m;
  }, []);

  const bodyIds = useMemo(() => SOLAR_SYSTEM_BODIES.map((b) => b.id), []);

  const reportProgress = useCallback(
    (loaded: number, total: number) => {
      const ratio = total > 0 ? loaded / total : 1;
      onTextureAssetProgress?.({
        ratio,
        message: TEXTURE_PROGRESS_MESSAGE,
        loaded,
        total,
      });
    },
    [onTextureAssetProgress],
  );

  useEffect(() => {
    disposedRef.current = false;
    const tasks = collectPlanetTextureLoadTasks(bodyIds, extraNormalById);
    reportProgress(0, tasks.length);

    let cancelled = false;

    preloadPlanetTextureUrls(
      tasks,
      gl,
      (loaded, total) => {
        if (!cancelled) reportProgress(loaded, total);
      },
      "high",
    ).then((byUrl) => {
      if (cancelled || disposedRef.current) {
        byUrl.forEach((texture) => texture.dispose());
        return;
      }
      texturesRef.current = byUrl;
      byUrl.forEach((texture, url) => {
        textureReleaseRef.current.set(
          url,
          acquireAtlasTextureResourceV289(texture, "atlas", `planet-texture:${url}`, "solar-textures"),
        );
      });
      setTexturesById(
        assembleBodyTextureSlots(bodyIds, byUrl, extraNormalById),
      );
      setReady(true);
      reportProgress(tasks.length, tasks.length);
    });

    const textureReleases = textureReleaseRef.current;
    const loadedTextures = texturesRef.current;
    return () => {
      cancelled = true;
      disposedRef.current = true;
      textureReleases.forEach((release) => release());
      textureReleases.clear();
      loadedTextures.forEach((texture) => texture.dispose());
      loadedTextures.clear();
      setTexturesById({});
      setReady(false);
    };
  }, [gl, bodyIds, extraNormalById, reportProgress]);

  const getSlots = useCallback(
    (bodyId: string) => texturesById[bodyId] ?? {},
    [texturesById],
  );

  const value = useMemo<PlanetTextureAssetsValue>(
    () => ({ ready, texturesById, getSlots }),
    [ready, texturesById, getSlots],
  );

  return (
    <PlanetTextureAssetsContext.Provider value={value}>
      {children}
    </PlanetTextureAssetsContext.Provider>
  );
}
