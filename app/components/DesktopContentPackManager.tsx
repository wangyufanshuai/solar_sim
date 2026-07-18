"use client";

import { Database, FileDown, LoaderCircle, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  installDesktopContentPack,
  listDesktopContentPacks,
  rollbackDesktopContentPack,
  selectDesktopContentPackManifest,
  type DesktopContentPackStatus,
} from "../lib/desktopBridge";

type Props = {
  onUnavailable: () => void;
};

export default function DesktopContentPackManager({ onUnavailable }: Props) {
  const [packs, setPacks] = useState<readonly DesktopContentPackStatus[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    try {
      setPacks(await listDesktopContentPacks());
    } catch {
      onUnavailable();
    }
  }, [onUnavailable]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const installedCount = useMemo(
    () => packs.filter((pack) => pack.status === "installed").length,
    [packs],
  );
  const rollbackCandidate = packs.find(
    (pack) => pack.status === "installed" && Boolean(pack.rollbackVersion),
  );

  const install = async () => {
    if (busy) return;
    const manifestPath = await selectDesktopContentPackManifest();
    if (!manifestPath) return;
    setBusy(true);
    setError("");
    try {
      const installed = await installDesktopContentPack({ kind: "local", manifestPath });
      await refresh();
      if (installed.id === "core") {
        window.dispatchEvent(new CustomEvent("atlas-catalog-pack-installed"));
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
  };

  const rollback = async () => {
    if (!rollbackCandidate || busy) return;
    setBusy(true);
    setError("");
    try {
      await rollbackDesktopContentPack(rollbackCandidate.id);
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="flex min-w-0 flex-1 items-center gap-2"
      data-desktop-content-pack-manager="v186"
      data-desktop-content-pack-count={packs.length}
      data-desktop-content-pack-installed={installedCount}
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-white/10 bg-black/20 text-cyan-100/65">
        {busy ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Database className="h-3.5 w-3.5" />}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[10px] text-white/58">
          桌面内容包 {installedCount}/{packs.length || 6} 已安装
        </div>
        <div className="mt-1 h-0.5 overflow-hidden bg-white/8">
          <div className="h-full bg-cyan-300/70" style={{ width: `${installedCount / Math.max(1, packs.length || 6) * 100}%` }} />
        </div>
        {error ? <div className="mt-1 truncate text-[9px] text-rose-200/70" title={error}>{error}</div> : null}
      </div>
      {rollbackCandidate ? (
        <button
          type="button"
          onClick={rollback}
          disabled={busy}
          className="flex min-h-10 shrink-0 items-center gap-1 rounded border border-amber-100/18 px-2 text-[9px] text-amber-50/75 disabled:opacity-40"
          title={`回退 ${rollbackCandidate.id} 至 ${rollbackCandidate.rollbackVersion}`}
        >
          <RotateCcw className="h-3 w-3" />回退
        </button>
      ) : null}
      <button
        type="button"
        onClick={install}
        disabled={busy}
        className="flex min-h-10 shrink-0 items-center gap-1 rounded border border-cyan-100/18 px-2 text-[9px] text-cyan-50/75 disabled:opacity-40"
        title="选择本地清单并校验安装内容包"
      >
        <FileDown className="h-3 w-3" />安装
      </button>
    </div>
  );
}
