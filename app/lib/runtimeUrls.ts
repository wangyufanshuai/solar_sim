function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function trimLeadingSlash(value: string): string {
  return value.replace(/^\/+/, "");
}

export function solarAssetBaseUrl(): string | undefined {
  const raw =
    typeof process !== "undefined"
      ? process.env.NEXT_PUBLIC_SOLAR_ASSET_BASE?.trim()
      : undefined;
  return raw ? trimTrailingSlash(raw) : undefined;
}

export function solarAssetUrl(path: string): string {
  if (/^(https?:)?\/\//.test(path) || path.startsWith("data:")) return path;
  const base = solarAssetBaseUrl();
  if (!base) return path;
  return `${base}/${trimLeadingSlash(path)}`;
}

export function runtimeWsUrl(path: string, envUrl?: string): string {
  if (envUrl?.trim()) return envUrl.trim();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (typeof window === "undefined") return `ws://127.0.0.1${normalizedPath}`;
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}${normalizedPath}`;
}
