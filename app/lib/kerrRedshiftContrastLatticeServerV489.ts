import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

import { canonicalKerrRedshiftContrastLatticeV489, createKerrRedshiftContrastLatticeSummaryV489, parseKerrRedshiftContrastLatticeArtifactV489, type KerrRedshiftContrastLatticeArtifactV489, type KerrRedshiftContrastLatticeSummaryV489 } from "./kerrRedshiftContrastLatticeV489";
const ROOT = "dist/science/kerr-redshift-contrast-lattice-v489";
const FILES = Object.freeze({ artifact: { name: "contrast-lattice.json" as const, maxBytes: 128 * 1024 }, svg: { name: "contrast-lattice.svg" as const, maxBytes: 128 * 1024 } });
const digest = (value: Uint8Array | string) => createHash("sha256").update(value).digest("hex");
export type KerrRedshiftContrastLatticeLoadedV489 = Readonly<{ artifact: KerrRedshiftContrastLatticeArtifactV489; summary: KerrRedshiftContrastLatticeSummaryV489; artifactExport: Readonly<{ name: "contrast-lattice.json"; bytes: Uint8Array; fileSha256: string; contentType: "application/json; charset=utf-8" }>; svg: Readonly<{ name: "contrast-lattice.svg"; bytes: Uint8Array; fileSha256: string; contentType: "image/svg+xml; charset=utf-8" }> }>;
let cache: Readonly<{ fingerprint: string; promise: Promise<KerrRedshiftContrastLatticeLoadedV489> }> | null = null;
export async function loadKerrRedshiftContrastLatticeV489(root = process.cwd()): Promise<KerrRedshiftContrastLatticeLoadedV489> {
  const artifactPath = resolve(root, ROOT, FILES.artifact.name), svgPath = resolve(root, ROOT, FILES.svg.name);
  const [artifactStat, svgStat] = await Promise.all([stat(artifactPath), stat(svgPath)]);
  if (!artifactStat.isFile() || artifactStat.size <= 0 || artifactStat.size > FILES.artifact.maxBytes || !svgStat.isFile() || svgStat.size <= 0 || svgStat.size > FILES.svg.maxBytes) throw new Error("v489-lattice-size");
  const [artifactBytes, svgBytes] = await Promise.all([readFile(artifactPath).then((value) => new Uint8Array(value)), readFile(svgPath).then((value) => new Uint8Array(value))]);
  const artifactFileSha256 = digest(artifactBytes), svgFileSha256 = digest(svgBytes);
  const fingerprint = [artifactPath, artifactStat.mtimeMs, artifactStat.size, artifactFileSha256, svgPath, svgStat.mtimeMs, svgStat.size, svgFileSha256].join(":");
  if (cache?.fingerprint === fingerprint) return cache.promise;
  const promise = Promise.resolve().then(() => {
    const artifact = parseKerrRedshiftContrastLatticeArtifactV489(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(artifactBytes)));
    if (digest(canonicalKerrRedshiftContrastLatticeV489(artifact)) !== artifact.artifactSha256 || svgFileSha256 !== artifact.vectorDiagnostic.fileSha256) throw new Error("v489-lattice-sha");
    const svgText = new TextDecoder("utf-8", { fatal: true }).decode(svgBytes);
    if (!svgText.startsWith("<?xml") || !svgText.includes("Gauge-free contrasts, bounded claims") || svgText.includes("<script") || /(?:href|src)=["'](?:https?:|data:|javascript:)/i.test(svgText)) throw new Error("v489-svg-boundary");
    return Object.freeze({ artifact, summary: createKerrRedshiftContrastLatticeSummaryV489(artifact), artifactExport: Object.freeze({ name: FILES.artifact.name, bytes: artifactBytes, fileSha256: artifactFileSha256, contentType: "application/json; charset=utf-8" as const }), svg: Object.freeze({ name: FILES.svg.name, bytes: svgBytes, fileSha256: svgFileSha256, contentType: "image/svg+xml; charset=utf-8" as const }) });
  });
  cache = Object.freeze({ fingerprint, promise });
  try { return await promise; } catch (error) { if (cache?.promise === promise) cache = null; throw error; }
}
export function resetKerrRedshiftContrastLatticeServerCacheForTestsV489(): void { cache = null; }
