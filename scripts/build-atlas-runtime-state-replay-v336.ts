import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { runAtlasRuntimeStateReplayV336 } from "../app/lib/atlasRuntimeStateReplayV336";

const root = process.cwd();
const output = "dist/science/atlas-runtime-state-replay-v336/replay.json";
const text = (relative: string) => readFileSync(resolve(root, relative), "utf8");
const fileSha = (relative: string) => createHash("sha256").update(readFileSync(resolve(root, relative))).digest("hex");
function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value as Record<string, unknown>)
    .filter(([key]) => !["generatedAt", "artifactSha256", "originalStateDigest", "restoredStateDigest", "baselineResourceIdentityDigest", "restoredResourceIdentityDigest"].includes(key))
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, entry]) => [key, canonicalize(entry)]));
}
const sha = (value: unknown) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");

const canvasSource = text("app/components/UniverseCanvas.tsx");
const hostSource = text("app/components/AtlasSceneHost.tsx");
const storeSource = text("app/lib/atlasRuntimeStore.ts");
const universeCanvasComponentCount = canvasSource.match(/<Canvas\b/g)?.length ?? 0;
const sceneHostMountCount = hostSource.match(/<UniverseCanvas\b/g)?.length ?? 0;
const sceneHostLimitDeclared = hostSource.includes('data-atlas-scene-host-canvas-limit="1"');
const visualSetter = storeSource.match(/setVisualProfile\([\s\S]*?\n  \},/u)?.[0] ?? "";
const visualSetterPresentationOnly = visualSetter.includes("patchState({ visualProfile });")
  && !visualSetter.includes("sceneRevision") && !visualSetter.includes("selectedObjectId")
  && !visualSetter.includes("sceneMode") && !visualSetter.includes("physics");
if (universeCanvasComponentCount !== 1 || sceneHostMountCount !== 1 || !sceneHostLimitDeclared || !visualSetterPresentationOnly) {
  throw new Error("v336-static-canvas-or-profile-setter-audit-failed");
}

const replay = runAtlasRuntimeStateReplayV336({
  canvasCountBefore: 1,
  canvasCountAfter: 1,
  universeCanvasComponentCount: 1,
  sceneHostMountCount: 1,
  sceneHostLimitDeclared: true,
});
const sourceManifest = [
  "app/components/UniverseCanvas.tsx",
  "app/components/AtlasSceneHost.tsx",
  "app/lib/atlasRuntimeStore.ts",
  "app/lib/atlasRuntimeStateReplayV336.ts",
  "app/lib/atlasVisualRuntimeMatrixV334.ts",
  "app/lib/atlasResourceLifecycle.ts",
].map((path) => ({ path, sha256: fileSha(path) }));
const unsigned = {
  version: "v336-atlas-runtime-state-replay-artifact-v1",
  generatedAt: new Date().toISOString(),
  status: "qualified-profile-state-camera-canvas-baseline-return",
  replay,
  staticAudit: {
    universeCanvasComponentCount,
    sceneHostMountCount,
    sceneHostLimitDeclared,
    visualSetterPresentationOnly,
  },
  sourceManifest,
  browserQualification: "not-run",
};
const artifact = { ...unsigned, artifactSha256: sha(unsigned) };
const target = resolve(root, output);
mkdirSync(dirname(target), { recursive: true });
const temporary = `${target}.${process.pid}.part`;
writeFileSync(temporary, `${JSON.stringify(artifact, null, 2)}\n`);
renameSync(temporary, target);
console.log(JSON.stringify({
  status: artifact.status,
  artifactSha256: artifact.artifactSha256,
  transitions: replay.transitions.length,
  sceneRevisionDelta: replay.sceneRevisionDelta,
  cameraBaseline: replay.afterCameraRelease.status,
  singleCanvas: replay.singleCanvasStable,
}, null, 2));
