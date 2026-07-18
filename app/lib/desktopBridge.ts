import type { ContentPackState } from "./atlasReleaseProgram";

export type DesktopCapabilitySnapshot = {
  available: boolean;
  platform: string;
  architecture: string;
  appVersion: string;
  catalogBackend: "sqlite-fts5" | "web-worker-shards";
  contentPackBackend: string;
  crossOriginIsolationRequired: boolean;
  desktopReleaseProfile: "desktop-compact" | "web";
  runtimeBundleVersion: string;
  contentPackCount: number;
};

export type ContentPackInstallSource =
  | { kind: "local"; manifestPath: string }
  | { kind: "https"; manifestUrl: string };

export type DesktopContentPackStatus = ContentPackState & {
  manifestSha256?: string | null;
  rollbackVersion?: string | null;
};

export type CatalogSearchQuery = { query: string; limit?: number };
export type CatalogSearchResultV5 = {
  id: string;
  displayName: string;
  designation: string;
  objectType: "star" | "exoplanet-host";
  raDeg: number;
  decDeg: number;
  dataTier: "parameter-rich" | "photometric-derived" | "catalog-basic";
  exoplanetSystemId: string | null;
  gaiaSourceId: string | null;
  magG: number | null;
  bpRp: number | null;
  parallaxMas: number | null;
  teffK: number | null;
  logg: number | null;
  radiusSolar: number | null;
  spectralType: string | null;
};

function hasTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

const WEB_CAPABILITIES: DesktopCapabilitySnapshot = {
  available: false,
  platform: "web",
  architecture: "browser",
  appVersion: "web",
  catalogBackend: "web-worker-shards",
  contentPackBackend: "unavailable",
  crossOriginIsolationRequired: true,
  desktopReleaseProfile: "web",
  runtimeBundleVersion: "web",
  contentPackCount: 0,
};

let capabilitiesPromise: Promise<DesktopCapabilitySnapshot> | null = null;

async function invoke<T>(command: string, args: Record<string, unknown> = {}): Promise<T> {
  const { invoke: tauriInvoke } = await import("@tauri-apps/api/core");
  return tauriInvoke<T>(command, args);
}

export async function getDesktopCapabilities(): Promise<DesktopCapabilitySnapshot> {
  if (!hasTauriRuntime()) return WEB_CAPABILITIES;
  capabilitiesPromise ??= invoke<Partial<Omit<DesktopCapabilitySnapshot, "available">>>("get_runtime_info")
    .then((result) => ({
      ...WEB_CAPABILITIES,
      ...result,
      available: true,
      desktopReleaseProfile: "desktop-compact" as const,
    }))
    .catch((error) => {
      capabilitiesPromise = null;
      throw error;
    });
  return capabilitiesPromise;
}

export async function searchDesktopCatalog(input: CatalogSearchQuery): Promise<readonly CatalogSearchResultV5[]> {
  if (!hasTauriRuntime()) return [];
  return invoke("search_catalog", input);
}

export async function listDesktopContentPacks(): Promise<readonly DesktopContentPackStatus[]> {
  if (!hasTauriRuntime()) return [];
  return invoke("list_content_packs");
}

export async function getDesktopCatalogObject(id: string): Promise<CatalogSearchResultV5 | null> {
  if (!hasTauriRuntime()) return null;
  return invoke("get_catalog_object", { id });
}

export async function installDesktopContentPack(
  source: ContentPackInstallSource,
): Promise<DesktopContentPackStatus> {
  return invoke("install_content_pack", { source });
}

export async function cancelDesktopContentPackInstall(id: string): Promise<boolean> {
  if (!hasTauriRuntime()) return false;
  return invoke("cancel_content_pack_install", { id });
}

export async function rollbackDesktopContentPack(id: string): Promise<DesktopContentPackStatus> {
  return invoke("rollback_content_pack", { id });
}

export async function selectDesktopContentPackManifest(): Promise<string | null> {
  if (!hasTauriRuntime()) return null;
  const { open } = await import("@tauri-apps/plugin-dialog");
  const selected = await open({
    multiple: false,
    directory: false,
    filters: [{ name: "Orbit Atlas 内容包清单", extensions: ["json"] }],
  });
  return typeof selected === "string" ? selected : null;
}

export async function openDesktopLogDirectory(): Promise<void> {
  return invoke("open_log_directory");
}

export async function importOpenRocketDesktop(sourcePath: string): Promise<string> {
  return invoke("import_openrocket", { sourcePath });
}

export async function selectOpenRocketFileDesktop(): Promise<string | null> {
  if (!hasTauriRuntime()) return null;
  const { open } = await import("@tauri-apps/plugin-dialog");
  const selected = await open({
    multiple: false,
    directory: false,
    filters: [{ name: "OpenRocket", extensions: ["ork", "csv", "json"] }],
  });
  return typeof selected === "string" ? selected : null;
}

export async function launchOpenRocketDesktop(filePath?: string): Promise<void> {
  return invoke("launch_openrocket", { filePath: filePath ?? null });
}
