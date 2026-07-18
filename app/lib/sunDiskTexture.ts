/**
 * The current release does not ship a solar photo texture. SunBody uses its deterministic
 * procedural photosphere so production never probes an absent file or performs a network fetch.
 */
export function useSunDiskTexture(): null {
  return null;
}
