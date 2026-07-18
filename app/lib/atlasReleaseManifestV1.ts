export const ATLAS_RELEASE_MANIFEST_VERSION_V1 = "v227-atlas-release-manifest-v1" as const;
export const ATLAS_PUBLIC_RELEASE_VERSION = "1.0.0" as const;
export const ATLAS_PUBLIC_ORIGIN = "https://solar.wangyufan.xyz" as const;

export type AtlasReleaseChannel = "web-ga" | "desktop-beta" | "research-shadow";
export type AtlasReleaseProfileV1 = "vercel-lite" | "standalone-full" | "desktop-beta" | "content-pack";
export type AtlasArtifactStatusV1 = "planned" | "published";

export type AtlasDownloadArtifactV1 = {
  id: string;
  profile: AtlasReleaseProfileV1;
  label: string;
  url: string;
  status: AtlasArtifactStatusV1;
  bytes: number | null;
  sha256: string | null;
  immutable: true;
  rangeRequests: true;
};

export type AtlasReleaseCapabilityV1 = {
  id: string;
  label: string;
  vercelLite: boolean;
  standaloneFull: boolean;
  desktopBeta: boolean;
};

export type AtlasReleaseManifestV1 = {
  schemaVersion: typeof ATLAS_RELEASE_MANIFEST_VERSION_V1;
  productVersion: typeof ATLAS_PUBLIC_RELEASE_VERSION;
  webChannel: "orbit-atlas-web-1.0.0-ga";
  desktopChannel: "orbit-atlas-desktop-1.0.0-beta.1";
  researchChannel: "relativity-v12-shadow-retained";
  defaultScientificKernel: "legacy-eih-1pn";
  shadowScientificModels: true;
  downloadBase: string;
  capabilities: readonly AtlasReleaseCapabilityV1[];
  artifacts: readonly AtlasDownloadArtifactV1[];
};

export type AtlasProductionHealthV1 = {
  schemaVersion: "v227-atlas-production-health-v1";
  status: "ok";
  productVersion: typeof ATLAS_PUBLIC_RELEASE_VERSION;
  deliveryProfile: "standalone-full" | "vercel-lite";
  defaultScientificKernel: "legacy-eih-1pn";
  deploymentId: string | null;
  commitSha: string | null;
  checkedAt: string;
};

const CONTENT_PACK_IDS = [
  "core",
  "planet-hd",
  "deep-sky",
  "spacecraft",
  "science-fixtures",
  "runtime-codecs",
] as const;

function normalizeDownloadOrigin(value?: string): string {
  const candidate = value?.trim() || ATLAS_PUBLIC_ORIGIN;
  const url = new URL(candidate);
  if (url.protocol !== "https:") throw new Error("Atlas public download origin must use HTTPS");
  return url.origin;
}

function plannedArtifact(
  origin: string,
  id: string,
  profile: AtlasReleaseProfileV1,
  label: string,
  relativePath: string,
): AtlasDownloadArtifactV1 {
  return {
    id,
    profile,
    label,
    url: new URL(`/orbit-atlas/${ATLAS_PUBLIC_RELEASE_VERSION}/${relativePath}`, origin).toString(),
    status: "planned",
    bytes: null,
    sha256: null,
    immutable: true,
    rangeRequests: true,
  };
}

export function createAtlasReleaseManifestV1(options: {
  downloadOrigin?: string;
} = {}): AtlasReleaseManifestV1 {
  const origin = normalizeDownloadOrigin(options.downloadOrigin);
  const artifacts: AtlasDownloadArtifactV1[] = [
    plannedArtifact(origin, "standalone-full", "standalone-full", "Standalone Full", "standalone-full/orbit-atlas-standalone-full-1.0.0.zip"),
    ...CONTENT_PACK_IDS.map((id) => plannedArtifact(
      origin,
      `content-pack-${id}`,
      "content-pack",
      `${id} manifest`,
      `content-packs/${id}.manifest.json`,
    )),
    plannedArtifact(origin, "desktop-msi", "desktop-beta", "Windows MSI", "desktop-beta/orbit-atlas-1.0.0-beta.1-x64.msi"),
    plannedArtifact(origin, "desktop-nsis", "desktop-beta", "Windows NSIS", "desktop-beta/orbit-atlas-1.0.0-beta.1-x64-setup.exe"),
  ];
  return {
    schemaVersion: ATLAS_RELEASE_MANIFEST_VERSION_V1,
    productVersion: ATLAS_PUBLIC_RELEASE_VERSION,
    webChannel: "orbit-atlas-web-1.0.0-ga",
    desktopChannel: "orbit-atlas-desktop-1.0.0-beta.1",
    researchChannel: "relativity-v12-shadow-retained",
    defaultScientificKernel: "legacy-eih-1pn",
    shadowScientificModels: true,
    downloadBase: `${origin}/orbit-atlas/${ATLAS_PUBLIC_RELEASE_VERSION}/`,
    capabilities: [
      { id: "overview", label: "太阳系与天体检查", vercelLite: true, standaloneFull: true, desktopBeta: true },
      { id: "lite-search", label: "基础离线搜索", vercelLite: true, standaloneFull: true, desktopBeta: true },
      { id: "million-catalog", label: "百万恒星目录", vercelLite: false, standaloneFull: true, desktopBeta: true },
      { id: "full-observations", label: "完整观测与科研数据包", vercelLite: false, standaloneFull: true, desktopBeta: true },
      { id: "launch", label: "发射演示与 OpenRocket 回放", vercelLite: true, standaloneFull: true, desktopBeta: true },
      { id: "research", label: "完整可复核科研证据", vercelLite: false, standaloneFull: true, desktopBeta: true },
    ],
    artifacts,
  };
}
