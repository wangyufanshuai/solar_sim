import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const output = "dist/science/atlas-visual-runtime-matrix-v334/matrix-audit.json";
const consumers = [
  ["app/components/GalaxyEnvironmentSphere.tsx", "sky", "visualRendererProfile.groups.sky"],
  ["app/components/Planet.tsx", "solar", "visualRendererProfile.groups.solar"],
  ["app/components/GaiaStarField.tsx", "catalog", "visualRendererProfile.groups.catalog"],
  ["app/components/UniversePmndrsPostProcessing.tsx", "postFx", "visualProfile.groups.postFx"],
  ["app/components/KerrBlackHole.tsx", "strongGravity", "visualRendererProfile.runtimeTokens.strongGravity"],
  ["app/components/LaunchSceneView.tsx", "launch", "visualRendererProfile.runtimeTokens.launch"],
  ["app/components/ExoplanetSystemScene.tsx", "exoplanet", "visualRendererProfile.runtimeTokens.exoplanet"],
  ["app/components/ScienceCinematicVisualSurfaceV261.tsx", "hud", "rendererProfile.runtimeTokens.hud"],
];
const bytes = (relative) => readFileSync(resolve(root, relative));
const text = (relative) => bytes(relative).toString("utf8");
const fileSha = (relative) => createHash("sha256").update(bytes(relative)).digest("hex");
const canonicalize = (value) => Array.isArray(value) ? value.map(canonicalize)
  : !value || typeof value !== "object" ? value
    : Object.fromEntries(Object.entries(value)
      .filter(([key]) => !["generatedAt", "auditSha256"].includes(key))
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, canonicalize(entry)]));
const sha = (value) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const rows = consumers.flatMap(([path, group, tokenPath]) => ["science-cinematic-v5-v299", "science-cinematic-v6-v300"].map((profile) => ({ profile, group, consumerPath: path, tokenPath, useHook: text(path).includes("useAtlasVisualRuntimeConsumerV300"), groupMarker: text(path).includes(`group: \"${group}\"`), tokenRead: text(path).includes(tokenPath) })));
const checks = {
  rowCount: rows.length === 16,
  allGroupsHaveV5AndV6: consumers.every(([, group]) => rows.filter((row) => row.group === group).length === 2),
  allRuntimeHooksPresent: rows.every((row) => row.useHook),
  allGroupMarkersPresent: rows.every((row) => row.groupMarker),
  allTokenReadsPresent: rows.every((row) => row.tokenRead),
  noUnboundedConsumerPath: rows.every((row) => row.consumerPath.startsWith("app/components/")),
};
if (Object.values(checks).some((value) => value !== true)) throw new Error(`v334 static consumer audit failed:${JSON.stringify(checks)}`);
const sourceManifest = ["app/lib/atlasVisualRuntimeMatrixV334.ts", "app/lib/atlasVisualRuntimeMatrixV334.test.ts", ...consumers.map(([path]) => path)].map((path) => ({ path, sha256: fileSha(path) }));
const unsigned = {
  version: "v334-atlas-visual-runtime-matrix-audit-v1",
  generatedAt: new Date().toISOString(),
  status: "qualified-static-v5-v6-eight-group-runtime-consumption-browser-pending",
  profiles: ["science-cinematic-v5-v299", "science-cinematic-v6-v300"],
  groups: ["sky", "solar", "catalog", "postFx", "strongGravity", "launch", "exoplanet", "hud"],
  rows,
  checks,
  scienceBoundary: "V5-V6-science-fields-equivalent-linear-no-grade-no-science-mutation",
  cinematicBoundary: "V5-V6-presentation-fields-distinct-seeded-only",
  resolverBoundary: "resolved-profile-reference-stable-no-selector-nested-object-allocation",
  sourceManifest,
  browserQualification: "not-run",
};
const audit = { ...unsigned, auditSha256: sha(unsigned) };
const target = resolve(root, output);
mkdirSync(dirname(target), { recursive: true });
const temporary = `${target}.${process.pid}.part`;
writeFileSync(temporary, `${JSON.stringify(audit, null, 2)}\n`);
renameSync(temporary, target);
console.log(JSON.stringify({ status: audit.status, auditSha256: audit.auditSha256, rows: audit.rows.length, groups: audit.groups.length, browserQualification: audit.browserQualification }, null, 2));
