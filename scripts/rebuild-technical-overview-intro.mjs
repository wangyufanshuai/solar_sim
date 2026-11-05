import { readFile, writeFile } from "node:fs/promises";

const path = "docs/TECHNICAL_OVERVIEW.md";
const current = await readFile(path, "utf8");
const historyMarker = "## v22 Celestial Catalog Atlas / Deep Sky Provenance";
const historyIndex = current.indexOf(historyMarker);
if (historyIndex < 0) throw new Error("Technical overview history marker not found");

const intro = `# Orbit Atlas Technical Overview

## Final Product Architecture

Orbit Atlas is a Windows-first scientific-cinematic astronomy atlas. The canonical desktop distribution uses Tauri, WebView2 and a loopback Next.js standalone service. Browser mode remains an offline-compatible preview with a reduced catalog path.

The product has six scene families:

1. Orbit Atlas for Solar System overview and mission trajectories.
2. Object Inspect for planets, moons and parameter-derived stellar portraits.
3. Stellar and Exoplanet Systems for universal search and isolated system scenes.
4. Mission Launch for deterministic launch direction, telemetry replay and payload deployment.
5. Relativity Lab for Newton, legacy EIH 1PN, V2 shadow comparison and Kerr test particles.
6. Scene Lab for isolated parameter copies, A/B comparison and export.

## Runtime Structure

### Application shell

- \`app/UniversePage.tsx\` coordinates durable product state and existing scientific refs.
- \`app/components/AtlasAppShell.tsx\` publishes the active v131-v140 contract and resource baseline.
- \`app/lib/atlasRuntimeStore.ts\` is a small \`useSyncExternalStore\` store for scene, focus and quality state.
- Heavy panels and the R3F Canvas are dynamically loaded. Launch and exoplanet scenes replace the normal atlas scene rather than rendering behind it.
- Search workers mount only while the navigator is open. Kerr render targets are not allocated on the mobile-safe fallback path.

### Scene isolation

The web scene modes remain \`atlas\`, \`inspect\`, \`launch\`, \`kerr\` and \`exoplanet-system\`. The desktop shell adds \`relativity-lab\` and \`scene-lab\` product modes without inserting experimental state into the canonical N-body arrays.

Scene transitions must release temporary Workers, GPU render targets, textures, models, subscriptions and camera locks. \`atlasResourceLifecycle.ts\` exposes the runtime counters used by Browser QA and the final release gate.

### Rendering

- React Three Fiber owns the WebGL2 Canvas.
- \`AtlasVisualDirectorV3\` controls scene-specific ACES exposure, Bloom restraint, background weight, texture tier, subject coverage and camera transition duration.
- Overview favors the selected orbit, major bodies and current mission trajectory.
- Inspect mode suppresses nonessential labels and reference orbits around the subject.
- Launch uses a fixed screen-space HUD; world-space telemetry text is not scaled by camera distance.
- Kerr uses a bounded 0.5-0.75 resolution offscreen target. Mobile-safe renders trajectories and a shadow boundary without the offscreen pass.

## Scientific Runtime

### Solar System physics

The default runtime continues to use the established Newton/EIH 1PN implementation and its existing worker path. Positions and velocities use SI units inside the integrator and presentation mappings outside it. SharedArrayBuffer is enabled by COOP/COEP; the main-thread implementation remains the compatibility fallback.

The following remain frozen unless an explicit scientific promotion passes: scientific gates, historical fixtures, live and worker physics, RK4/DP behavior, legacy EIH 1PN, V9 sky, v75 accuracy evidence, v97 Gaia draw budgets and v99 opacity caps.

### Relativity V2

\`RelativityForceModelV2\` adds solar 2PN monopole and Lense-Thirring terms only in shadow comparison. The independent v137 DE440 runner reports 20.645 km / 0.050014 m/s at +10 years, with 365-day step convergence and 30-day reverse-time evidence. Promotion still requires Kerr invariant, hardware performance and full regression gates; pending evidence keeps \`legacy-eih-1pn\` as the default.

### Kerr

The Kerr module supports non-equatorial null and timelike test-particle phase space with E, Lz and Carter Q diagnostics. It remains isolated from Solar System N-body state. The procedural accretion disk is a display model, not a GRMHD result.

## Catalog Architecture

### Desktop catalog V5

The generated SQLite/FTS5 catalog contains 1,224,219 unique focusable objects. Named HYG, IAU and NASA host records use FTS5; Gaia-only records use an indexed 64-bit \`source_id\` path. This avoids duplicating one million Gaia designations in the full-text index.

Current generated artifact:

- Rows: 1,224,219.
- SQLite size: 280,305,664 bytes.
- SHA-256: \`d7e8c2bd6621f117d91f12353662c372b4f69417882cbc99524ad07e8728122f\`.
- Build source: ten deterministic Gaia DR3 ranges plus local v4 HYG/IAU/NASA data.
- Runtime network access: none.

The visible Gaia starfield remains fixed at 1,000 / 1,800 / 3,000 objects. Search scale does not increase scene draw budgets.

### Data tiers

- \`parameter-rich\`: Teff, logg and radius are present.
- \`photometric-derived\`: Teff, BP-RP or spectral type supports a constrained portrait.
- \`catalog-basic\`: coordinates and identity are available; appearance uses an explicit fallback.

All three tiers can focus. None claims that an ordinary stellar surface has been spatially resolved.

### Exoplanets

The local NASA Exoplanet Archive catalog is split by system. Reported, Kepler-derived and layout-only orbit geometry remain distinguishable. Unknown eccentricity, inclination and phase are not replaced with hidden observed values.

## Material System

\`StellarPortraitProfileV4\` selects a data tier and surface regime, then drives deterministic convection warp, granulation, differential rotation, active latitude, spot clusters, faculae, corona layers and a bounded prominence budget. Selected stars and exoplanet hosts share the V4 material path.

Planet materials use low-resolution core fallbacks and optional KTX2/HD content. Earth, Moon, Mars, Jupiter and Saturn load higher tiers only for inspect scenes. V9 sky remains untouched.

## Launch Architecture

The launch director covers Prelaunch, Ignition, Tower Clear, Max-Q, MECO/Separation, Coast, Insertion and Payload Deploy. Manual Orbit pauses camera direction; Restore Follow resumes from the current view.

OpenRocket supports offline \`.ork\`, CSV and JSON imports. Browser code never launches an executable. In Tauri, file selection and launching \`OpenRocket.exe\` require explicit user actions and an allowlisted configured executable path. GUI automation is not used.

## Desktop Distribution

### Tauri service boundary

The Tauri command surface provides runtime information, SQLite search, object lookup, content-pack management, OpenRocket import/launch and log-directory access. Production starts a packaged Node runtime and Next standalone server on a random loopback port, preserving API routes, middleware, COOP/COEP and SharedArrayBuffer.

Rust is installed outside the project. The current workstation has WebView2 and MSVC, but desktop compilation remains blocked until a Rust toolchain can be installed on a drive with sufficient free space.

### Content packs

Generated installed sizes:

- Core: 276.4 MiB, including the catalog, exoplanet data and low-resolution planet fallbacks.
- Planet HD: 321.7 MiB.
- Deep sky: 83.2 MiB.
- Spacecraft: 68.9 MiB.
- Science fixtures: 0.1 MiB.

Every manifest records app compatibility, quality tier, path, size, SHA-256, source and license. Installation is sequential, resumable, cancellable and rejects path traversal, incompatible app versions, insufficient disk space and checksum mismatch.

## Performance And Release Gates

The target hardware class is a 16GB Windows laptop with a 4GB GPU. Heavy catalog builds, texture transcodes, production builds and Playwright runs execute serially.

- Idle working set: at most 1.2GB.
- Atlas/inspect peak: at most 2.5GB.
- Launch/Kerr peak: at most 3GB.
- Overview median: at least 55 FPS.
- Inspect, stellar, exoplanet, launch and Kerr median: at least 45 FPS.
- Focus command to first camera motion: below 100ms.
- Desktop hot search: below 50ms; cold search: below 150ms.
- Console errors, page errors and Renderer Faults: zero.

The final gate is fail-closed. Catalog scale, installer signing, hardware performance and scientific promotion are independent evidence inputs; one passing area cannot hide a failure in another.

## Development Commands

\`npx tsc --noEmit\` validates TypeScript. \`npm run test:atlas:visual-final\` covers the final visual contracts. \`npm run test:science:promotion-v3\` covers shadow promotion and Kerr invariants. \`npm run fetch:catalog-v5:gaia\` downloads deterministic build-time Gaia shards. \`npm run build:catalog-v5:gaia\` produces SQLite/FTS5. \`npm run build:content-packs\` creates versioned manifests. \`npm run build:desktop\` requires Rust, WebView2 and MSVC.

`;

let history = current.slice(historyIndex)
  .replace("## v45 涓枃绉戝鐣岄潰涓庢繁绌烘槦浣撲繚鐪熷寮?", "## v45 Chinese Scientific Interface And Deep-Space Fidelity")
  .replace("## v46 Cinematic Deep-Space Camera / 3A 绉戠爺妯℃嫙鏋勫浘鍗囩骇", "## v46 Cinematic Deep-Space Camera")
  .replace("## v47 Universe Sandbox Reference Backdrop / 3A 娣辩┖鑳屾櫙瀵规瘮鍗囩骇", "## v47 Universe Sandbox Reference Backdrop");
const cleanProvenanceLines = {
  "chinese-deep-space-fidelity": "Provenance is additive. Evidence Ledger and Validation Console expose the Chinese interface and deep-space fidelity boundary. Navigator keywords use clean Chinese and standard English terminology.",
  "cinematic-deep-space-camera": "Provenance is additive. Evidence Ledger and Validation Console expose the cinematic camera profile, background-noise policy, quality budget and trusted boundary.",
  "universe-sandbox-reference-backdrop": "Provenance is additive. Evidence Ledger and Validation Console expose the reference backdrop, subject visibility and screenshot-review policy.",
  "reference-grade-space-art": "Provenance is additive. Evidence Ledger and Validation Console expose the reference-grade composite, sky, starfield, subject matte and asset policy.",
  "planetary-material-composition": "Provenance is additive. Evidence Ledger and Validation Console expose planet materials, ring fidelity, Earth cloud layers and solar surface presentation boundaries.",
  "numerical-integrity-gate": "Provenance is additive. Evidence Ledger and Validation Console expose numerical integrity, timestep sensitivity, time reversal and conservation-drift evidence.",
  "cinematic-planetary-art-direction": "Provenance is additive. Evidence Ledger and Validation Console expose planetary art direction, gas-giant bands, Saturn rings, Earth night layers and global grading.",
  "cinematic-deep-space-backdrop": "Provenance is additive. Evidence Ledger and Validation Console expose the deep-space source policy, sky manifest, starfield, nebula and negative-space profiles.",
  "sparse-deep-space-director": "Provenance is additive. Evidence Ledger and Validation Console expose sparse deep-space direction, Milky Way contrast, pixel budgets and negative-space profiles.",
};
history = history.split(/\r?\n/).map((line) => {
  if (!line.startsWith("Provenance is additive.")) return line;
  const entry = Object.entries(cleanProvenanceLines).find(([id]) => line.includes(`\`${id}\``));
  return entry?.[1] ?? line;
}).join("\n");
await writeFile(path, `${intro}${history.trimEnd()}\n`, "utf8");
console.log("Technical overview introduction rebuilt with clean UTF-8 architecture text.");
