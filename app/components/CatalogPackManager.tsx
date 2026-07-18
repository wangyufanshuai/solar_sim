"use client";

import { Database, Download, HardDrive, LoaderCircle, Square } from "lucide-react";
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import {
  installCatalogMillionV7,
  readCatalogPackInstallStateV7,
} from "../lib/catalogPackInstallerV7";
import type {
  CatalogPackAvailability,
  CatalogPackInstallStateV7,
  WebCatalogPackManifestV3,
} from "../lib/catalogV7";
import { getAtlasDeliveryProfile } from "../lib/atlasDeliveryProfile";
import { getDesktopCapabilities } from "../lib/desktopBridge";

const DesktopContentPackManager = lazy(() => import("./DesktopContentPackManager"));

const LOCAL_MANIFEST_URL = "/api/atlas/catalog-pack/manifest";
const REMOTE_MANIFEST_URL = process.env.NEXT_PUBLIC_ATLAS_CATALOG_PACK_MANIFEST_URL?.trim() ?? "";

type CatalogPackProbeResult = {
  availability: Extract<CatalogPackAvailability, "local" | "remote" | "unavailable">;
  manifest: WebCatalogPackManifestV3 | null;
};

let catalogPackProbePromise: Promise<CatalogPackProbeResult> | null = null;

async function fetchManifest(url: string): Promise<WebCatalogPackManifestV3 | null> {
  if (!url) return null;
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) return null;
  return await response.json() as WebCatalogPackManifestV3;
}

function probeCatalogPack(): Promise<CatalogPackProbeResult> {
  catalogPackProbePromise ??= (async () => {
    const local = await fetchManifest(LOCAL_MANIFEST_URL).catch(() => null);
    if (local) return { availability: "local", manifest: local };
    const remote = await fetchManifest(REMOTE_MANIFEST_URL).catch(() => null);
    return remote
      ? { availability: "remote", manifest: remote }
      : { availability: "unavailable", manifest: null };
  })();
  return catalogPackProbePromise;
}

function statusText(args: {
  availability: CatalogPackAvailability;
  state: CatalogPackInstallStateV7 | null;
}): string {
  if (args.state?.status === "installed") return "122.4 万颗恒星目录已离线启用";
  if (args.state?.status === "checking-space") return "正在检查本地存储空间";
  if (args.state?.status === "downloading") return `正在安装目录分块 ${args.state.completedChunks}/${args.state.totalChunks}`;
  if (args.state?.status === "verifying") return "正在校验百万恒星目录";
  if (args.state?.status === "paused") return "安装已暂停，可继续下载";
  if (args.state?.status === "insufficient-space") return "本地持久存储空间不足";
  if (args.state?.status === "corrupt") return "目录包损坏，需重新安装";
  if (args.availability === "checking") return "正在检查百万恒星目录包";
  if (args.availability === "local") return "本地百万恒星目录包可安装";
  if (args.availability === "remote") return "远程百万恒星目录包可安装";
  return "轻量目录已启用，百万包未配置";
}

export default function CatalogPackManager() {
  if (getAtlasDeliveryProfile() === "vercel-lite") {
    return (
      <div
        className="flex min-w-0 flex-1 items-center gap-2 rounded border border-amber-100/14 bg-amber-100/[0.035] px-2 py-1.5"
        data-catalog-pack-version="v171-vercel-lite-disabled"
        data-catalog-pack-status="unavailable-in-lite"
        data-catalog-pack-availability="unavailable"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-white/10 text-amber-100/70">
          <HardDrive className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0 text-[10px] leading-4 text-white/62">
          Lite 版使用轻量目录；百万恒星安装与完整观测包请使用 standalone-full。
        </div>
      </div>
    );
  }
  return <DesktopAwareCatalogPackManager />;
}

function DesktopAwareCatalogPackManager() {
  const [desktop, setDesktop] = useState<boolean | null>(null);
  const useWebFallback = useCallback(() => setDesktop(false), []);

  useEffect(() => {
    let active = true;
    void getDesktopCapabilities()
      .then((capabilities) => {
        if (active) setDesktop(capabilities.available);
      })
      .catch(() => {
        if (active) setDesktop(false);
      });
    return () => { active = false; };
  }, []);

  if (desktop === true) {
    return (
      <Suspense fallback={<div className="min-h-10 min-w-0 flex-1" aria-busy="true" />}>
        <DesktopContentPackManager onUnavailable={useWebFallback} />
      </Suspense>
    );
  }
  if (desktop === null) return <div className="min-h-10 min-w-0 flex-1" aria-busy="true" />;
  return <StandaloneCatalogPackManager />;
}

function StandaloneCatalogPackManager() {
  const [state, setState] = useState<CatalogPackInstallStateV7 | null>(null);
  const [availability, setAvailability] = useState<CatalogPackAvailability>("checking");
  const [manifest, setManifest] = useState<WebCatalogPackManifestV3 | null>(null);
  const [busy, setBusy] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const installedState = await readCatalogPackInstallStateV7().catch(() => null);
      if (cancelled) return;
      setState(installedState);
      if (installedState?.status === "installed") {
        setAvailability("installed");
        return;
      }
      const probe = await probeCatalogPack();
      if (cancelled) return;
      setManifest(probe.manifest);
      setAvailability(probe.availability);
    })();
    return () => {
      cancelled = true;
      abortRef.current?.abort();
    };
  }, []);

  const install = async () => {
    if (!manifest || busy) return;
    const controller = new AbortController();
    abortRef.current = controller;
    setBusy(true);
    try {
      const installed = await installCatalogMillionV7(manifest, {
        signal: controller.signal,
        onProgress: setState,
      });
      setState(installed);
      if (installed.status === "installed") {
        setAvailability("installed");
        window.dispatchEvent(new CustomEvent("atlas-catalog-pack-installed", {
          detail: { filename: installed.activeFilename },
        }));
      }
    } catch {
      setState(await readCatalogPackInstallStateV7().catch(() => null));
    } finally {
      abortRef.current = null;
      setBusy(false);
    }
  };

  const progress = state && state.installedBytes > 0
    ? Math.min(100, state.downloadedBytes / state.installedBytes * 100)
    : 0;
  const installed = state?.status === "installed";
  const canInstall = Boolean(manifest) && !installed;

  return (
    <div
      className="flex min-w-0 flex-1 items-center gap-2"
      data-catalog-pack-version="v156-catalog-million-local-delivery"
      data-catalog-pack-status={state?.status ?? "not-installed"}
      data-catalog-pack-availability={availability}
      data-catalog-pack-row-count={manifest?.rowCount ?? (installed ? 1_224_219 : 224_361)}
      data-catalog-pack-parameter-rich={manifest?.parameterRichCount ?? (installed ? 218_617 : 0)}
      data-catalog-pack-focusable={installed ? 1_224_219 : 224_361}
      data-catalog-pack-runtime-policy="search-scale-decoupled-from-v97-render-budget"
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-white/10 bg-black/20 text-cyan-100/65">
        {busy ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : installed ? <Database className="h-3.5 w-3.5" /> : <HardDrive className="h-3.5 w-3.5" />}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[10px] text-white/58">{statusText({ availability, state })}</div>
        <div className="mt-1 h-0.5 overflow-hidden bg-white/8">
          <div className="h-full bg-cyan-300/70 transition-[width]" style={{ width: `${installed ? 100 : progress}%` }} />
        </div>
        {state?.error ? <div className="mt-1 truncate text-[9px] text-rose-200/70">{state.error}</div> : null}
      </div>
      {busy ? (
        <button
          type="button"
          onClick={() => abortRef.current?.abort()}
          className="flex h-7 shrink-0 items-center gap-1 rounded border border-rose-100/18 px-2 text-[9px] text-rose-50/72 hover:bg-rose-100/8"
          title="暂停百万恒星目录安装"
        >
          <Square className="h-3 w-3" />暂停
        </button>
      ) : !installed ? (
        <button
          type="button"
          onClick={install}
          disabled={!canInstall}
          className="flex h-7 shrink-0 items-center gap-1 rounded border border-cyan-100/16 px-2 text-[9px] text-cyan-50/70 hover:bg-cyan-100/8 disabled:cursor-not-allowed disabled:opacity-35"
          title={canInstall ? "安装可选百万恒星目录" : "当前仅使用轻量恒星目录"}
        >
          <Download className="h-3 w-3" />{state?.status === "paused" ? "继续" : "安装"}
        </button>
      ) : null}
    </div>
  );
}
