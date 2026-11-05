import { createHash, timingSafeEqual } from "node:crypto";

export const ATLAS_DESKTOP_SESSION_COOKIE = "atlas-desktop-session-v1";
export const ATLAS_DESKTOP_BOOTSTRAP_QUERY = "desktopToken";
export const ATLAS_DESKTOP_SESSION_MAX_AGE_SECONDS = 12 * 60 * 60;

function digest(value: string) {
  return createHash("sha256").update(value, "utf8").digest();
}

export function configuredAtlasDesktopToken(
  value = process.env.ATLAS_DESKTOP_TOKEN,
): string | null {
  const token = value?.trim();
  return token && token.length >= 32 ? token : null;
}

export function atlasDesktopSessionValue(token: string): string {
  return createHash("sha256")
    .update("orbit-atlas-desktop-session-v1\0", "utf8")
    .update(token, "utf8")
    .digest("hex");
}

export function atlasDesktopSecretMatches(candidate: string | null, expected: string): boolean {
  if (!candidate) return false;
  return timingSafeEqual(digest(candidate), digest(expected));
}

export function atlasDesktopSessionMatches(cookie: string | null, token: string): boolean {
  return atlasDesktopSecretMatches(cookie, atlasDesktopSessionValue(token));
}

