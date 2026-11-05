import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { canonicalKerrObservationAuthorityJoinV553, parseKerrObservationAuthorityJoinV553, type KerrObservationAuthorityJoinArtifactV553 } from "./kerrObservationAuthorityJoinV553";
const FILE = "dist/science/kerr-observation-authority-join-v553/atlas.json";
export type LoadedKerrObservationAuthorityJoinV553 = Readonly<{ artifact: KerrObservationAuthorityJoinArtifactV553; bytes: Uint8Array; fileSha256: string }>;
let cache: Readonly<{ fingerprint: string; promise: Promise<LoadedKerrObservationAuthorityJoinV553> }> | null = null;
const sha = (value: Uint8Array | string) => createHash("sha256").update(value).digest("hex");
export async function loadKerrObservationAuthorityJoinV553(root = process.cwd()): Promise<LoadedKerrObservationAuthorityJoinV553> { const path = resolve(root, FILE), metadata = await stat(path); if (!metadata.isFile() || metadata.size <= 0 || metadata.size > 128 * 1024) throw new Error("v553-file-size"); const bytes = new Uint8Array(await readFile(path)), fileSha256 = sha(bytes), fingerprint = `${metadata.mtimeMs}:${metadata.size}:${fileSha256}`; if (cache?.fingerprint === fingerprint) return cache.promise; const promise = Promise.resolve().then(() => { const artifact = parseKerrObservationAuthorityJoinV553(JSON.parse(Buffer.from(bytes).toString("utf8"))); if (createHash("sha256").update(canonicalKerrObservationAuthorityJoinV553(artifact)).digest("hex") !== artifact.artifactSha256) throw new Error("v553-artifact-integrity"); return Object.freeze({ artifact, bytes, fileSha256 }); }); cache = Object.freeze({ fingerprint, promise }); try { return await promise; } catch (error) { if (cache?.promise === promise) cache = null; throw error; } }
export function resetKerrObservationAuthorityJoinServerCacheForTestsV553(): void { cache = null; }
