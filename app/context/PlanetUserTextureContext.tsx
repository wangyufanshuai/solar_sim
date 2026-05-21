"use client";

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
import {
  userTextureIdbDelete,
  userTextureIdbGet,
  userTextureIdbGetAllKeys,
  userTextureIdbSet,
} from "../lib/planetTextureUserStore";

type TextureEntry = {
  texture: THREE.Texture;
  objectUrl: string;
};

function configureUserAlbedoTexture(tex: THREE.Texture, maxAnisotropy: number) {
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = Math.min(8, maxAnisotropy);
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.needsUpdate = true;
}

function disposeEntry(entry: TextureEntry | undefined) {
  if (!entry) return;
  URL.revokeObjectURL(entry.objectUrl);
  entry.texture.dispose();
}

type PlanetUserTextureValue = {
  ready: boolean;
  getUserAlbedo: (bodyId: string) => THREE.Texture | undefined;
  hasUserAlbedo: (bodyId: string) => boolean;
  /** Blob URL for sidebar preview (same image as loaded texture). */
  getUserPreviewObjectUrl: (bodyId: string) => string | undefined;
  setUserAlbedoFromFile: (bodyId: string, file: File) => Promise<void>;
  clearUserAlbedo: (bodyId: string) => Promise<void>;
};

const PlanetUserTextureContext = createContext<PlanetUserTextureValue | null>(
  null,
);

export function usePlanetUserTextures(): PlanetUserTextureValue {
  const ctx = useContext(PlanetUserTextureContext);
  if (!ctx) {
    return {
      ready: true,
      getUserAlbedo: () => undefined,
      hasUserAlbedo: () => false,
      getUserPreviewObjectUrl: () => undefined,
      setUserAlbedoFromFile: async () => {},
      clearUserAlbedo: async () => {},
    };
  }
  return ctx;
}

export function PlanetUserTextureProvider({ children }: { children: ReactNode }) {
  const entriesRef = useRef<Map<string, TextureEntry>>(new Map());
  const [ready, setReady] = useState(false);
  const [epoch, setEpoch] = useState(0);

  const maxAnisoRef = useRef(8);
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
      if (gl) {
        const ext = gl.getExtension("EXT_texture_filter_anisotropic");
        if (ext) {
          const max = gl.getParameter(ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
          if (typeof max === "number" && Number.isFinite(max)) {
            maxAnisoRef.current = Math.min(16, max);
          }
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  const bump = useCallback(() => setEpoch((e) => e + 1), []);

  const hydrateFromIdb = useCallback(async () => {
    entriesRef.current.forEach(disposeEntry);
    entriesRef.current.clear();
    try {
      const keys = await userTextureIdbGetAllKeys();
      const loader = new THREE.TextureLoader();
      const maxA = maxAnisoRef.current;
      for (const bodyId of keys) {
        const blob = await userTextureIdbGet(bodyId);
        if (!blob || blob.size === 0) continue;
        const objectUrl = URL.createObjectURL(blob);
        try {
          const texture = await loader.loadAsync(objectUrl);
          configureUserAlbedoTexture(texture, maxA);
          entriesRef.current.set(bodyId, { texture, objectUrl });
        } catch {
          URL.revokeObjectURL(objectUrl);
        }
      }
    } catch {
      /* private mode / blocked IDB */
    }
    setReady(true);
    bump();
  }, [bump]);

  useEffect(() => {
    void hydrateFromIdb();
    return () => {
      /* Dispose latest entries on unmount (texture cache ref, not a DOM node). */
      // eslint-disable-next-line react-hooks/exhaustive-deps -- read ref at unmount to dispose current textures
      const m = entriesRef.current;
      m.forEach(disposeEntry);
      m.clear();
    };
  }, [hydrateFromIdb]);

  const getUserAlbedo = useCallback((bodyId: string) => {
    return entriesRef.current.get(bodyId)?.texture;
  }, []);

  const hasUserAlbedo = useCallback(
    (bodyId: string) => {
      void epoch;
      return entriesRef.current.has(bodyId);
    },
    [epoch],
  );

  const getUserPreviewObjectUrl = useCallback(
    (bodyId: string) => {
      void epoch;
      return entriesRef.current.get(bodyId)?.objectUrl;
    },
    [epoch],
  );

  const setUserAlbedoFromFile = useCallback(
    async (bodyId: string, file: File) => {
      const blob = file.slice(0, file.size, file.type || "image/jpeg");
      await userTextureIdbSet(bodyId, blob);
      const prev = entriesRef.current.get(bodyId);
      disposeEntry(prev);
      entriesRef.current.delete(bodyId);
      const objectUrl = URL.createObjectURL(blob);
      const loader = new THREE.TextureLoader();
      const texture = await loader.loadAsync(objectUrl);
      configureUserAlbedoTexture(texture, maxAnisoRef.current);
      entriesRef.current.set(bodyId, { texture, objectUrl });
      bump();
    },
    [bump],
  );

  const clearUserAlbedo = useCallback(
    async (bodyId: string) => {
      await userTextureIdbDelete(bodyId);
      const prev = entriesRef.current.get(bodyId);
      disposeEntry(prev);
      entriesRef.current.delete(bodyId);
      bump();
    },
    [bump],
  );

  const value = useMemo<PlanetUserTextureValue>(() => {
    void epoch;
    return {
      ready,
      getUserAlbedo,
      hasUserAlbedo,
      getUserPreviewObjectUrl,
      setUserAlbedoFromFile,
      clearUserAlbedo,
    };
  }, [
    epoch,
    ready,
    getUserAlbedo,
    hasUserAlbedo,
    getUserPreviewObjectUrl,
    setUserAlbedoFromFile,
    clearUserAlbedo,
  ]);

  return (
    <PlanetUserTextureContext.Provider value={value}>
      {children}
    </PlanetUserTextureContext.Provider>
  );
}
