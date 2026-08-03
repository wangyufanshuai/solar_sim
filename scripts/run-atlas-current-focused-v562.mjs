import { spawnSync } from "node:child_process";

const tests = [
  "app/lib/atlasVisualCandidateV562.test.ts",
  "app/lib/atlasContentPackServerV3.test.ts",
  "app/lib/atlasBrowserQualificationV562.test.ts",
  "app/lib/atlasHeroBrowserQualificationV562.test.ts",
  "app/lib/atlasRuntimeReleaseQualificationV567.test.ts",
  "app/lib/atlasActiveReleaseGateV567.test.ts",
  "app/lib/atlasProxyContractV562.test.ts",
  "app/lib/orbitRelativityEngineV561.test.ts",
  "app/lib/orbitRelativityEngineServerV561.test.ts",
  "app/api/atlas/relativity-evidence/v561/engine/route.test.ts",
  "app/lib/ixpeMeasuredIntakeV562.test.ts",
  "app/lib/ixpeMeasuredIntakeServerV562.test.ts",
  "app/api/atlas/relativity-evidence/v562/ixpe-intake/route.test.ts",
  "app/lib/ixpeMetadataProbeV563.test.ts",
  "app/lib/ixpeMetadataProbeServerV563.test.ts",
  "app/api/atlas/relativity-evidence/v563/ixpe-metadata/route.test.ts",
  "app/components/IxpeMetadataProbeSurfaceV563.test.tsx",
  "app/components/OrbitAtlasHeroScenesV562.test.tsx",
  "app/lib/atlasActiveReleaseGateV562.test.ts",
  "app/lib/atlasBuildRouteOverlayV564.test.ts",
  "app/lib/atlasNextDevWatchOptionsV566.test.ts",
  "app/lib/sha256BrowserV566.test.ts",
];
const result = spawnSync(process.execPath, ["node_modules/vitest/vitest.mjs", "run", ...tests], { stdio: "inherit", env: { ...process.env, ATLAS_CURRENT_FOCUSED_GATE: "v562-v563" } });
process.exitCode = result.status ?? 1;
