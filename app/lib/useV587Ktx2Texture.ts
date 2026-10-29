"use client";

import { useThree } from "@react-three/fiber";
import { useEffect, useState } from "react";
import * as THREE from "three";
import type { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";
import { acquireAtlasTextureResourceV289 } from "./atlasResourceLifecycle";
import { sha256BytesHexV566, sha256Utf8HexV566 } from "./sha256BrowserV566";
import type { KerrObservationVariantV587 } from "./kerrObservationV587";

type VisualManifest = Readonly<{
  manifestSha256: string;
  assets: readonly Readonly<{
    id: string;
    variant: KerrObservationVariantV587;
    ktx2: string;
    preview: string;
    output: Readonly<{ ktx2Sha256: string; previewSha256: string; colorSpace: string }>;
  }>[];
}>;

const EXPECTED_MANIFEST_SHA256 = "0a521797d81252364792d6728be4fe4445583531a2e2cfc8331d74d5caf7fa30";
const MANIFEST_URL = `/data/kerr-observation-v587/visual-manifest.json?sha256=${EXPECTED_MANIFEST_SHA256}`;
const loaderCache = new WeakMap<THREE.WebGLRenderer, KTX2Loader>();
let loaderModulePromise: Promise<typeof import("three/examples/jsm/loaders/KTX2Loader.js")> | null = null;

async function getLoader(gl: THREE.WebGLRenderer): Promise<KTX2Loader> {
  const cached = loaderCache.get(gl);
  if (cached) return cached;
  loaderModulePromise ??= import("three/examples/jsm/loaders/KTX2Loader.js");
  const { KTX2Loader } = await loaderModulePromise;
  const loader = new KTX2Loader()
    .setTranscoderPath("/basis/")
    .setWorkerLimit(1)
    .detectSupport(gl);
  loaderCache.set(gl, loader);
  return loader;
}

function parseManifest(value: unknown): VisualManifest {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("v587-visual-manifest-object");
  const source = value as Record<string, unknown>;
  if (source.manifestSha256 !== EXPECTED_MANIFEST_SHA256 || !Array.isArray(source.assets)) {
    throw new Error("v587-visual-manifest-contract");
  }
  const unsigned = { ...source };
  delete unsigned.manifestSha256;
  if (sha256Utf8HexV566(JSON.stringify(canonicalize(unsigned))) !== source.manifestSha256) {
    throw new Error("v587-visual-manifest-sha");
  }
  const assets = source.assets.filter((entry): entry is VisualManifest["assets"][number] => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return false;
    const asset = entry as Record<string, unknown>;
    const output = asset.output;
    return asset.variant === "desktop" || asset.variant === "mobile"
      ? typeof asset.ktx2 === "string"
        && typeof asset.preview === "string"
        && !!output
        && typeof output === "object"
        && /^[a-f0-9]{64}$/.test(String((output as Record<string, unknown>).ktx2Sha256 ?? ""))
        && /^[a-f0-9]{64}$/.test(String((output as Record<string, unknown>).previewSha256 ?? ""))
      : false;
  });
  if (assets.length !== 2) throw new Error("v587-visual-manifest-coverage");
  return { manifestSha256: String(source.manifestSha256), assets };
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  const source = value as Record<string, unknown>;
  return Object.fromEntries(Object.keys(source).sort().map((key) => [key, canonicalize(source[key])]));
}

function parseKtx2(loader: KTX2Loader, buffer: ArrayBuffer): Promise<THREE.Texture> {
  return new Promise((resolve, reject) => loader.parse(buffer, resolve, reject));
}

function loadPreview(url: string): Promise<THREE.Texture> {
  return new Promise((resolve, reject) => {
    new THREE.TextureLoader().load(url, resolve, undefined, reject);
  });
}

async function fetchVerified(url: string, expectedSha256: string): Promise<ArrayBuffer> {
  const response = await fetch(url, { cache: "force-cache" });
  if (!response.ok) throw new Error(`v587-visual-fetch:${response.status}`);
  const buffer = await response.arrayBuffer();
  if (sha256BytesHexV566(new Uint8Array(buffer)) !== expectedSha256) throw new Error("v587-visual-sha");
  return buffer;
}

function configure(texture: THREE.Texture, source: string, sha256: string) {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.userData = {
    ...texture.userData,
    atlasCandidate: "v587",
    atlasVisualAssetSource: source,
    atlasVisualAssetSha256: sha256,
    atlasPresentationOnly: true,
    atlasScientificPayloadMutation: false,
  };
  texture.needsUpdate = true;
}

/**
 * Loads only the v587 cinematic presentation layer. Science never requests
 * this hook, so the verified classification/redshift/delay/EVPA fields stay
 * independent of the KTX2 art path.
 */
export function useV587Ktx2Texture(
  variant: KerrObservationVariantV587,
  enabled: boolean,
): THREE.Texture | null {
  const gl = useThree((state) => state.gl);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    let alive = true;
    let loaded: THREE.Texture | null = null;
    let release: (() => void) | null = null;
    if (!enabled) {
      setTexture(null);
      return () => undefined;
    }
    setTexture(null);
    const finish = (candidate: THREE.Texture, source: string, hash: string) => {
      configure(candidate, source, hash);
      if (!alive) {
        candidate.dispose();
        return;
      }
      loaded = candidate;
      release = acquireAtlasTextureResourceV289(candidate, "kerr", `v587-cinematic-${variant}`, "v587-cinematic-presentation");
      setTexture(candidate);
    };
    const run = async () => {
      const response = await fetch(MANIFEST_URL, { cache: "force-cache" });
      if (!response.ok) throw new Error(`v587-visual-manifest-fetch:${response.status}`);
      const manifest = parseManifest(await response.json());
      const asset = manifest.assets.find((entry) => entry.variant === variant);
      if (!asset) throw new Error(`v587-visual-asset:${variant}`);
      try {
        const buffer = await fetchVerified(asset.ktx2, asset.output.ktx2Sha256);
        const candidate = await parseKtx2(await getLoader(gl), buffer);
        finish(candidate, asset.ktx2, asset.output.ktx2Sha256);
      } catch {
        const buffer = await fetchVerified(asset.preview, asset.output.previewSha256);
        const objectUrl = URL.createObjectURL(new Blob([buffer], { type: "image/jpeg" }));
        try {
          const candidate = await loadPreview(objectUrl);
          finish(candidate, asset.preview, asset.output.previewSha256);
        } finally {
          URL.revokeObjectURL(objectUrl);
        }
      }
    };
    void run().catch(() => undefined);
    return () => {
      alive = false;
      release?.();
      loaded?.dispose();
      loaded = null;
      setTexture(null);
    };
  }, [enabled, gl, variant]);

  return texture;
}
