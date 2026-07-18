# Orbit Atlas Technical Overview

## Current Product Architecture

Orbit Atlas is a scientific-cinematic astronomy atlas. The current reproducible baseline is the v233 governance candidate with one WebGL2 scene host, 603 frozen root attributes, standalone/Lite delivery and six local content packs. Product delivery and scientific promotion remain separate: the local Web candidate is validated, while every candidate scientific model remains offline and shadow-retained.

## v233 Current Evidence Authority

- `AtlasCurrentEvidenceManifestV233` is generated from the checksummed weak-field, Kerr shard, STM, bundle, lifecycle, content-pack and security reports.
- `ScientificPromotionDecisionV7` retains its fail-closed decision logic; its current input is generated from the manifest instead of the historical V5 constants.
- The weak-field candidate improves aggregate ten-year RMS in the current V7 report but retains 15 per-body regressions, so the default remains `legacy-eih-1pn`.
- Dense Kerr progress is 1/49 release shards, 64/3097 rays and 512 executions. Partial results are never aggregated.
- Variational STM remains smoke-only. Thirty-day calibration, three fit iterations and ten-year blind holdout are release-qualification work, not completed evidence.
- The 603 root attributes remain a historical Browser compatibility snapshot. Mutable research progress is published on a non-root diagnostics surface.
- The current governance dossier and classified dirty-worktree inventory are generated with `npm run build:dossier:v233`; no Git mutation is part of that process.
- The v160-v232 high-level timeline is archived in `docs/archive/RELEASE_TRACKS_V160_V232.md`.

## v225-v232 Final Product Track

- Web GA is versioned as `orbit-atlas-web-1.0.0-ga` at `solar.wangyufan.xyz`; standalone-full, content-pack manifests and signed installers use immutable `/orbit-atlas/1.0.0/` download paths.
- `AtlasReleaseManifestV1` keeps Lite, standalone and desktop capabilities distinct. A missing SHA-256 or `planned` artifact state is not a downloadable release claim.
- Production security fails closed: the debug-log route is loopback development-only, TLE retrieval is allowlisted and bounded, npm production audit must be empty, and Webpack SRI/CSP plus Tauri CSP are enforced before public release.
- The default runtime kernel remains `legacy-eih-1pn`. Dense Kerr and integrated variational STM evidence can improve research status but cannot promote the runtime model in this track.

## v168-v174 Final Web RC Track

- The framework security baseline is Next.js 15.5.18. Production Browser QA demonstrated that its App Router runtime cannot host the React 18/R3F 8 reconciler, so the verified pairing is React 19.2.7, R3F 9.6.1, Drei 10.7.7 and postprocessing 3.0.4; Three remains 0.170. Dynamic route params use the Next 15 asynchronous contract and standalone output remains enabled.
- `AtlasRuntimeEvidenceFacadeV168` moves the 603 controller-owned historical root attributes into a typed, ordered compatibility facade. `AtlasAppShell` retains its additional current release/resource attributes on the same root node.
- `atlasRuntimeStore` now publishes scene, quality and selected-object context atomically and includes typed panel sessions. `AtlasPanelCoordinator` defines desktop coexistence, modal inertness, mobile foreground-sheet, Escape and focus-return behavior without introducing a second state framework.
- `AtlasDeliveryProfile` has two values: `standalone-full` keeps the six local content packs, while `vercel-lite` resolves only the versioned `/atlas-lite/` payload. The Lite manifest is checksummed, capability-scoped and limited to 82 MiB; it never falls back to loopback or the full content-pack API.
- Runtime texture-memory traversal is sampled after scene revisions rather than continuously. Cheap `gl.info` counters remain observational; a reported `drawCalls=1` is explicitly not accepted as optimization proof. Resource counters cover Workers, render targets, textures, models, subscriptions and camera locks.
- `AtlasFinalWebReleaseV174` and `build-final-web-release-v174.mjs` keep standalone/Lite capabilities distinct and preserve the `legacy-eih-1pn` default with V2 shadow-only. Cloud deployment and desktop installers are not release claims.

The target product has six scene families:

1. Orbit Atlas for Solar System overview and mission trajectories.
2. Object Inspect for planets, moons and parameter-derived stellar portraits.
3. Stellar and Exoplanet Systems for universal search and isolated system scenes.
4. Mission Launch for deterministic launch direction, telemetry replay and payload deployment.
5. Relativity Lab for Newton, legacy EIH 1PN, V2 shadow comparison and Kerr test particles.
6. Scene Lab for isolated parameter copies, A/B comparison and export.

## v160-v166 Extreme Convergence

- `AtlasContentPackManifestV3` and the content-pack API provide manifest-whitelisted file streaming, byte ranges, ETags, correct MIME types, immutable caching and path traversal rejection. Standalone reads `dist/content-packs`; Vercel remains a thin preview.
- `AtlasAssetResolver` routes V9 sky, planet maps, KTX2/Basis codecs and GLB spacecraft through local pack, optional remote pack and core fallback candidates. Runtime NASA texture hotlinks are not used.
- `app/UniversePage.tsx` is a three-line entry. `UniverseRuntimeController`, `AtlasSceneHost` and selector-based stores separate the compatibility controller from the single Canvas and current release shell.
- `PlanetRenderGraphV3` caps inspect composition at six presentation layers. `StellarPortraitMaterialV7` retains the three-draw photosphere/corona/halo path with scene-linear temperature color, deterministic granulation and no hard corona ring.
- Catalog V7 exposes 1,224,219 focusable objects and 218,617 parameter-rich records without increasing the frozen visible Gaia budget. `OrbitDirectorV3` changes presentation priority only and does not synthesize stellar galactic orbits.
- `LaunchCinematicV3` uses pack-delivered SLS/Orion/CubeSat/Gateway assets, explicit fallback state, a screen-space eight-stage HUD and stage-specific safe framing.
- `ScientificExperienceEvidenceV7` is fail-closed. The current v166 serial regression is recorded in `dist/science/regression-v166-report.json` after 673 unit/contract tests and desktop/mobile fresh Browser QA passed. RTX 4060 hardware evidence remains pending, the default remains `legacy-eih-1pn`, and V2 remains shadow-only.

The final bullet above records the historical v166 handoff state. v167 closes the named-hardware product gate without changing the scientific promotion decision.

## v167 Product Release Evidence Closure

- `AtlasProductReleaseV167` separates Web/Next standalone product readiness from scientific-kernel promotion. The combined status is `product-rc-verified-science-shadow-retained`.
- `dist/science/performance-v166-report.json` records five production standalone scenes on an NVIDIA GeForce RTX 4060 Laptop GPU. The run rejects software rendering, enforces overview/science-scene FPS and P95 frame-time thresholds, requires resource counters to return to baseline, and requires zero console/page errors.
- `dist/science/regression-v166-report.json` remains the confirmed serial regression source. `scripts/build-product-release-evidence-v167.mjs` fails closed unless both reports have the expected versions and passing status.
- `ATLAS_NEXT_DIST_DIR` and `start-atlas-standalone.mjs --dist-dir` allow a candidate build to use an isolated output directory while an older standalone preview remains online. The default output remains `.next`.
- The product status is `verified-web-standalone-release-candidate`. The scientific status remains `shadow-retained-no-demonstrated-improvement`; `legacy-eih-1pn` stays the default and `eih-1pn-2pn-lt` stays shadow-only.
- v167 changes release evidence, runtime markers and documentation only. It does not modify scientific gates, historical fixtures, live/Worker physics, RK4/DP, legacy EIH 1PN, the Kerr core, V9 sky, v75/v97 budgets or v99 opacity caps.

## v154-v159 Core Experience Layer

- `AtlasFocusTargetV2` unifies Solar System, bright-star, Gaia, catalog-search and deep-link focus commands. Visible star picking runs only after a short pointer click and does not increase the frozen Gaia draw budget.
- Navigator query state and the stellar search Worker mount inside `AtlasNavigatorRuntimePanel`; they no longer rerender `UniversePage` for every keystroke. History snapshot polling is similarly local to its own bar.
- Catalog V7 local delivery reads only whitelisted manifest chunks from `ATLAS_LOCAL_CONTENT_PACK_ROOT`. The 344 MiB database is not copied into Web or Vercel build artifacts.
- `StellarPortraitMaterialV6` uses a three-draw surface/corona/halo renderer. `CameraFrameSolverV5` frames the physical subject or ring extent against Passport and dock safe regions.
- `LaunchFrameRequestV2` defines stage-specific composition. SLS, Orion and CubeSat transforms are fixed by a local asset manifest; OpenRocket remains an offline import boundary.
- `ScientificPromotionDecisionV6` is the current promotion decision. It records that the V2 candidate passes the absolute error limits but is 0.002088 km worse in aggregate ten-year position RMS than legacy, and that current independent per-body DOP853 evidence is incomplete. V2 therefore remains shadow-only.

## v147-v153 Scientific Data Layer

The v147-v153 train adds reproducible build-time data and independent evidence while preserving the frozen live/worker integrators:

- `.venv-science` is project-local. Its manifest records Python/package versions and wheel SHA-256 values, avoiding the machine-wide NumPy/pyarrow ABI conflict.
- Catalog V7 contains 1,224,219 focusable objects, 218,617 `parameter-rich` records and 63,091 rich named/host records. The 344.3 MiB SQLite database is distributed as 22 verified chunks; the lite path receives a 4.8 MiB rich-parameter sidecar.
- The NASA observation snapshot contains 4,735 systems and 6,319 planets in 37 shards. V2 values carry explicit `reported`, `derived`, `assumption` or `display-only` provenance.
- Independent observation fixtures pass at 0.162 ppm transit RMS and `9.81e-15 m/s` RV RMS. The full ten-year SciPy DOP853 report passes at 56.653 km and 0.1603 m/s, with one-year convergence and 30-day reversal gates also passing.
- `ScientificEvidenceBundleV5` remains the checksummed absolute-gate evidence source. `ScientificPromotionDecisionV6` adds the comparative and per-body requirements; the current candidate is not eligible for promotion and the default remains `legacy-eih-1pn`.
- V7 Teff, logg, radius, metallicity and temperature intervals reach the selected-star V5 material through both OPFS SQLite and lite sidecar search paths. Metallicity and uncertainty only influence bounded presentation parameters.
- Heavy scientific panels mount only while open. Search, observation and evidence resources are released on unmount and old Worker request IDs cannot replace current results.
- The Vercel thin preview excludes the 21.6 MiB full observation snapshot while retaining the basic exoplanet atlas and V7 lite parameter sidecar. Standalone/core packs retain the full snapshot; no runtime TAP fallback is introduced.

The desktop installer remains deferred in this train. Web/standalone is the delivery baseline; no Rust, MSI or NSIS success is claimed.

## v141-v146 Convergence Layer

The v141-v146 train adds a fail-closed convergence layer without changing the frozen live/worker physics or historical visual budgets:

- `CameraFrameSolverV4` solves subject coverage against a `ResizeObserver`-published safe viewport. Focus remains `command -> transition -> lock`; launch entry clears all inspect selections and focus commands.
- Catalog V6 separates a 224,361-row, 27.1 MiB gzip lite index from the optional 1,224,219-row SQLite pack. The web installer writes sequential verified chunks to one OPFS partial file and opens SQLite from a dedicated Worker using the official OO1 API.
- `StellarPortraitMaterialV5` uses temperature anchors in scene-linear output, controlled local tone mapping, deterministic convection and a soft dithered corona. Hard prominence rings are not part of the close-up renderer. Planet render profiles cap close-up layer counts at eight.
- The observational lab runs transit and Keplerian radial-velocity display models in a separate Worker and keeps measured, derived and assumption fields distinct.
- `ScientificEvidenceBundleV4` is retained as historical evidence. Current release decisions use V5 only.
- The Vercel thin preview carries the app, V9-required sky, lite catalog and low-tier assets only. Production localhost asset rewrites are disabled.

The current code still retains `UniversePage` as the compatibility coordinator while scene Canvas, heavy panels, catalog Workers and launch/exoplanet modules are isolated and lazy-loaded. Completing the physical file split is architectural follow-up, not a claimed v146 release pass.

The v141-v146 status remains historical. Current V5 status and measured artifacts are described above; historical bundles cannot substitute for current regression or performance evidence.

## Runtime Structure

### Application shell

- `app/UniversePage.tsx` is the lightweight route entry; `app/UniverseRuntimeController.tsx` retains compatibility coordination while scene modules continue to be extracted.
- `app/components/AtlasAppShell.tsx` publishes only the current v166 release manifest and resource baseline. It does not construct historical summaries.
- `app/lib/atlasRuntimeStore.ts` is a small `useSyncExternalStore` store for scene, focus and quality state.
- Heavy panels and the R3F Canvas are dynamically loaded. Launch and exoplanet scenes replace the normal atlas scene rather than rendering behind it.
- Search workers mount only while the navigator is open. Kerr render targets are not allocated on the mobile-safe fallback path.

### Scene isolation

The web scene modes remain `atlas`, `inspect`, `launch`, `kerr` and `exoplanet-system`. The desktop shell adds `relativity-lab` and `scene-lab` product modes without inserting experimental state into the canonical N-body arrays.

Scene transitions must release temporary Workers, GPU render targets, textures, models, subscriptions and camera locks. `atlasResourceLifecycle.ts` exposes the runtime counters used by Browser QA and the final release gate.

### Rendering

- React Three Fiber owns the WebGL2 Canvas.
- `AtlasVisualDirectorV4` controls scene-specific ACES exposure, Bloom restraint, background weight, texture tier, dark-side readability, subject coverage and camera transition duration.
- Overview favors the selected orbit, major bodies and current mission trajectory.
- Inspect mode suppresses nonessential labels and reference orbits around the subject.
- Launch uses a fixed screen-space HUD; world-space telemetry text is not scaled by camera distance.
- Kerr uses a bounded 0.5-0.75 resolution offscreen target. Mobile-safe renders trajectories and a shadow boundary without the offscreen pass.

## Scientific Runtime

### Solar System physics

The default runtime continues to use the established Newton/EIH 1PN implementation and its existing worker path. Positions and velocities use SI units inside the integrator and presentation mappings outside it. SharedArrayBuffer is enabled by COOP/COEP; the main-thread implementation remains the compatibility fallback.

The following remain frozen unless an explicit scientific promotion passes: scientific gates, historical fixtures, live and worker physics, RK4/DP behavior, legacy EIH 1PN, V9 sky, v75 accuracy evidence, v97 Gaia draw budgets and v99 opacity caps.

### Relativity V2

`RelativityForceModelV2` adds solar 2PN monopole and Lense-Thirring terms only in shadow comparison. The independent V5 SciPy DOP853 runner reports 56.652680 km / 0.1603359 m/s at +10 years, 0.000192 km one-year step convergence and 0.00133 m / `4.45e-11 m/s` 30-day reverse-time residuals. Legacy EIH 1PN reports 56.650591 km / 0.1603351 m/s on the same aggregate checkpoint. The absolute thresholds pass, but V2 does not improve the aggregate result and the current runner lacks independent per-body comparison output. This is not promotion eligibility; `legacy-eih-1pn` remains the applied default.

### Kerr

The Kerr module supports non-equatorial null and timelike test-particle phase space with E, Lz and Carter Q diagnostics. It remains isolated from Solar System N-body state. The procedural accretion disk is a display model, not a GRMHD result.

## Catalog Architecture

### Catalog V7

The generated SQLite/FTS5 catalog contains 1,224,219 unique focusable objects. Named HYG, IAU and NASA host records use FTS5; Gaia-only records use an indexed 64-bit `source_id` path. This avoids duplicating one million Gaia designations in the full-text index.

Current generated artifact:

- Rows: 1,224,219.
- Parameter-rich rows: 218,617; rich named/host rows: 63,091.
- SQLite size: 361,029,632 bytes.
- SHA-256: `cf121d7ae5179996fb080d54f18e087f798e9e196c472238d23d1d3469f3ab17`.
- Build source: ten deterministic Gaia DR3 random-index ranges, `astrophysical_parameters`, explicit Hipparcos best-neighbour matches and local HYG/IAU/NASA data.
- Runtime network access: none.

The visible Gaia starfield remains fixed at 1,000 / 1,800 / 3,000 objects. Search scale does not increase scene draw budgets.

### Data tiers

- `parameter-rich`: Teff, logg and radius are present.
- `photometric-derived`: Teff, BP-RP or spectral type supports a constrained portrait.
- `catalog-basic`: coordinates and identity are available; appearance uses an explicit fallback.

All three tiers can focus. None claims that an ordinary stellar surface has been spatially resolved.

### Exoplanets

The local NASA Exoplanet Archive catalog is split by system. Reported, Kepler-derived and layout-only orbit geometry remain distinguishable. Unknown eccentricity, inclination and phase are not replaced with hidden observed values.

## Material System

`StellarPortraitProfileV5` selects a data tier and surface regime, then drives deterministic convection warp, granulation, differential rotation, active latitude, spot clusters, faculae, soft corona layers and a bounded prominence budget. V7 temperature intervals produce a presentation confidence marker; metallicity applies only a bounded chromatic/contrast variation. Selected stars and exoplanet hosts share the V5 material path, and every ordinary-star portrait remains labelled as parameter-derived rather than a resolved surface.

Planet materials use low-resolution core fallbacks and optional KTX2/HD content. Earth, Moon, Mars, Jupiter and Saturn load higher tiers only for inspect scenes. V9 sky remains untouched.

## Launch Architecture

The launch director covers Prelaunch, Ignition, Tower Clear, Max-Q, MECO/Separation, Coast, Insertion and Payload Deploy. Manual Orbit pauses camera direction; Restore Follow resumes from the current view.

OpenRocket supports offline `.ork`, CSV and JSON imports. Browser code never launches an executable. In Tauri, file selection and launching `OpenRocket.exe` require explicit user actions and an allowlisted configured executable path. GUI automation is not used.

## Desktop Distribution

### Tauri service boundary

The Tauri command surface provides runtime information, SQLite search, object lookup, content-pack management, OpenRocket import/launch and log-directory access. Production starts a packaged Node runtime and Next standalone server on a random loopback port, preserving API routes, middleware, COOP/COEP and SharedArrayBuffer.

Rust is installed outside the project. The current workstation has WebView2 and MSVC, but desktop compilation remains blocked until a Rust toolchain can be installed on a drive with sufficient free space.

### Content packs

Generated installed sizes:

- Core: 292.7 MiB, including the catalog, exoplanet data, required V9 sky, Gaia render data, runtime manifests and low-resolution planet fallbacks.
- Planet HD: 321.7 MiB.
- Deep sky: 68.7 MiB, excluding the V9 files already shipped in core.
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

The final gate is fail-closed and split by claim. Catalog/content delivery, Web standalone regression and named-hardware performance determine the product release-candidate claim. Installer signing remains deferred. Scientific promotion is a separate decision and remains blocked while V2 lacks demonstrated aggregate and independent per-body improvement; one passing area cannot hide a failure in another.

## Development Commands

`npx tsc --noEmit` validates TypeScript. `npm run test:atlas:visual-final` covers the final visual contracts. `npm run test:science:promotion-v3` covers shadow promotion and Kerr invariants. `npm run fetch:catalog-v5:gaia` downloads deterministic build-time Gaia shards. `npm run build:catalog-v5:gaia` produces SQLite/FTS5. `npm run build:content-packs` creates versioned manifests. `npm run build:desktop` requires Rust, WebView2 and MSVC.

## v22 Celestial Catalog Atlas / Deep Sky Provenance

Orbit Atlas v22 adds `app/lib/celestialCatalog.ts`, a pure curated local catalog summary that aggregates nearby stars, bright stars, nebulae, star clusters, bright galaxies / Local Group objects, pulsars, and all 88 IAU constellation overlays. The catalog version is `v22-celestial-catalog-atlas`.

The Orbit Atlas Layers menu exposes `Constellations`, `Deep sky objects`, and `Catalog labels`; Sandbox object browser uses the same catalog entries for search and camera-direction focus. These entries are presentation/navigation overlays only. They do not create physical bodies, do not enter the SolarSystemIntegrator, and do not change EIH 1PN solar-system dynamics.

The Evidence Ledger keeps version `v21-claim-passports` but adds the `celestial-catalog-atlas` claim. Its passport reports the source chain, coordinate frames, entry count, kind/source breakdown, finite-coordinate checks, 88-constellation check, and trusted boundary: curated local catalog, not SIMBAD/VizieR, not the full Gaia archive, and not a deep-sky astrophysical evolution model.

## v23 Celestial Object Passport / Catalog Drilldown

Orbit Atlas v23 extends the v22 catalog with deterministic object-level passports. `createCelestialObjectPassport()` derives a passport from any `CelestialCatalogEntry` or stable catalog id and returns identity, source chain, coordinate frame, metrics, confidence rationale, assumptions, limitations, related evidence claim, and display sections.

The rendered inspector is `app/components/CelestialObjectPassportPanel.tsx`. It appears when a catalog entry is selected from the object browser and exposes `data-celestial-object-passport-version="v23-object-passports"`, open state, object id, kind, source, and per-section markers. The object passport can open the catalog-level Evidence Ledger claim `celestial-catalog-atlas`.

This drilldown remains a catalog provenance layer. It does not create physical bodies, does not insert deep-sky objects into the SolarSystemIntegrator, does not alter EIH 1PN dynamics, and does not claim SIMBAD/VizieR or full Gaia archive completeness.

## v24 Unified Atlas Navigator / Command Palette

Orbit Atlas v24 adds `app/lib/atlasNavigator.ts`, a pure local index helper. `createAtlasNavigatorSummary()` aggregates four deterministic result kinds: solar bodies, Celestial Catalog objects, Evidence Ledger claims, and panel actions. It returns version `v24-unified-atlas-navigator`, stable item ids, query/result counts, selected default id, and result rows carrying source, metric, and action labels.

The rendered surface is `app/components/AtlasNavigatorPanel.tsx`. Existing Search buttons in Orbit Atlas and Sandbox now open this panel, and `Ctrl/Cmd+K` opens it globally when focus is not inside an input or textarea. Desktop renders as a centered command palette; mobile renders as a bottom sheet. Keyboard navigation supports ArrowUp, ArrowDown, Enter, and Escape.

Execution stays inside existing boundaries. Solar results use existing body focus. Catalog results use camera-direction focus and open the v23 Object Passport. Evidence results open the v21 Evidence Ledger with the selected claim. Panel actions open existing surfaces such as Evidence Ledger, Kerr Relativity Lab, Object Browser, View, and Tools. The Navigator does not perform online search, does not create simulation bodies, does not alter `SolarSystemIntegrator` or EIH 1PN dynamics, and does not change the Kerr kernel id `eih-1pn+kerr-geodesic-v17`.

DOM contracts: the page root exposes `data-atlas-navigator-version="v24-unified-atlas-navigator"`, open/query/result-count/selected-id markers, and each rendered result exposes a stable `data-atlas-navigator-item-id`.

## v25 Atlas Workflows / Guided Scientific Missions

Orbit Atlas v25 adds `app/lib/atlasWorkflows.ts`, a pure workflow helper. `createAtlasWorkflowSummary()` maps curated scientific mission paths onto existing Navigator item ids, Evidence Ledger claim ids, Celestial Catalog ids, and panel actions. The workflow version is `v25-atlas-workflows`.

The rendered surface is `app/components/AtlasWorkflowPanel.tsx`. It exposes Solar Validation, Relativity Lab, Deep Sky Provenance, Cosmology Validation, and Gaia / Galactic Context workflows. Each step reports target, source, model, expected UI surface, trusted boundary, and a single `Run step` action.

Entry points are intentionally redundant: Navigator can open `Atlas Workflows`, Orbit Atlas Layers includes `Atlas workflows`, and Sandbox Tools includes `Atlas workflows`. Step execution reuses the v24 Navigator executor so object focus, Object Passport, Evidence Passport, Kerr Lab, Orbit Analysis, View, and Tools behavior stays centralized.

This remains a product guidance layer. It does not add physics models, does not fetch online datasets, does not create catalog bodies in the SolarSystemIntegrator, does not change EIH 1PN dynamics, and does not change the Kerr kernel id `eih-1pn+kerr-geodesic-v17`.

DOM contracts: the page root exposes `data-atlas-workflow-version="v25-atlas-workflows"`, open/selected/active-step markers, and the panel exposes stable `data-atlas-workflow-id` and `data-atlas-workflow-step-id` markers.

## v26 Atlas Mission Hub / Scientific Session Memory

Orbit Atlas v26 adds `app/lib/atlasMissionHub.ts`, a pure session-summary helper. `createAtlasMissionHubSummary()` combines the v24 Navigator index, v25 Workflow summary, selected body/catalog/evidence/workflow state, recent actions, pinned items, and recommended next actions. The version is `v26-atlas-mission-hub`.

The rendered surface is `app/components/AtlasMissionHubPanel.tsx`. Desktop presents current mission context, recents, pins, and a context passport. Mobile uses a bottom-sheet layout with Current / Recent / Pinned segments. Every executable item routes back through the existing Navigator or Workflow executor; Mission Hub does not duplicate focus, Evidence Ledger, Object Passport, Kerr Lab, or Orbit Analysis logic.

Session memory is intentionally local: recents and pins are serialized to browser `localStorage` under the v26 key, with an in-memory fallback when storage is unavailable or invalid. Stored entries contain stable item ids, item kind, and timestamp only. Missing future ids render as readable stale entries rather than crashing.

Entry points are Navigator `Mission Hub`, Orbit Atlas Layers `Mission hub`, Sandbox Tools `Mission hub`, and a Workflow-panel shortcut. This layer does not create bodies, run online search, add datasets, change EIH 1PN solar-system dynamics, or alter the Kerr geodesic kernel.

DOM contracts: the page root exposes `data-atlas-mission-hub-version="v26-atlas-mission-hub"`, open/current/recent/pinned markers, and each rendered hub item exposes `data-atlas-mission-hub-item-id`.

## v27 Mission Capsules / Reproducible Atlas Links

Orbit Atlas v27 adds `app/lib/atlasMissionCapsule.ts`, a pure local reproducibility helper. `createAtlasMissionCapsule()` captures compact UI/session state from Mission Hub; `serializeAtlasMissionCapsule()` encodes it for URL hash links; `parseAtlasMissionCapsule()` accepts hash/base64url or JSON payloads; `restoreAtlasMissionCapsule()` validates ids against the current Navigator and Workflow indexes and returns restored/warning counts.

Capsules store reproducible UI state only: presentation mode, scale mode, render budget, boolean view settings, selected body/catalog/evidence/workflow ids, Mission Hub recents and pins, and Kerr Lab UI controls (`showKerrBlackHole`, spin, preset, impact parameter, render mode). They deliberately exclude live physics buffers, ephemeris arrays, telemetry samples, screenshots, large catalog rows, and any backend or account state.

The rendered controls live inside `app/components/AtlasMissionHubPanel.tsx`: `Copy link`, `Export capsule`, `Import capsule`, and `Clear capsule`. URL restore happens from `#atlas-capsule=...` on page load/hashchange and opens Mission Hub with restore source, createdAt, restored count, and readable warnings. `useSolarPresentation()` preserves the hash when it rewrites presentation query parameters so restored capsule links remain shareable after applying scale/budget state.

Evidence Ledger remains `v21-claim-passports` and adds the informational `mission-capsule-reproducibility` claim. Its passport states that Mission Capsules are UI/session provenance, not a simulation data archive, not a Horizons refresh, not telemetry storage, and not a scientific publication archive.

DOM contracts: the page root and Mission Hub expose `data-atlas-mission-capsule-version="v27-mission-capsules"`, active/restored/warning markers, and each capsule action button exposes `data-atlas-capsule-action="copy-link|export|import|clear"`.

## v28 Scientific Report / Evidence Dossier

Orbit Atlas v28 adds `app/lib/atlasScientificReport.ts`, a pure report-summary and serializer layer. `createAtlasScientificReportSummary()` combines the current Mission Capsule, Mission Hub summary, Evidence Ledger summary, selected Object Passport, Workflow context, and Kerr Lab UI parameters into a deterministic `v28-scientific-report` dossier. `serializeAtlasScientificReportMarkdown()` emits the human-readable report; `serializeAtlasScientificReportJson()` emits machine-readable provenance.

The rendered surface is `app/components/AtlasScientificReportPanel.tsx`. It is available from Navigator, Mission Hub, Orbit Atlas Layers, and Sandbox Tools. The panel shows Session overview, Mission capsule, Evidence claims, Selected object/body, Workflow context, Kerr lab, and Trusted boundaries, then offers `Export Markdown`, `Export JSON`, and `Copy summary`.

Evidence Ledger remains `v21-claim-passports` and adds the informational `scientific-report-dossier` claim. Its passport states that the report is local UI/session and evidence provenance only. It is not a PDF pipeline, not a Horizons refresh, not telemetry export, not ephemeris storage, and not a scientific publication archive.

The report intentionally excludes live physics buffers, SharedArrayBuffer state, ephemeris arrays, telemetry samples, screenshots, large catalog rows, backend account state, and cloud state. It does not mutate the SolarSystemIntegrator, EIH 1PN main dynamics, or Kerr geodesic kernel.

DOM contracts: the page root and report panel expose `data-atlas-scientific-report-version="v28-scientific-report"`, open/section-count/export-format markers, and each report section exposes `data-atlas-scientific-report-section-id`.

## v29 Report Studio / Printable Evidence Dossier

Orbit Atlas v29 keeps `createAtlasScientificReportSummary()` as the v28-compatible report summary helper and adds a Report Studio layer in `app/lib/atlasScientificReport.ts`. `createAtlasReportStudioSummary()` derives deterministic template settings, section toggle state, included-section counts, and preview sections from the current report summary. The new export helper `serializeAtlasScientificReportHtml()` emits self-contained printable HTML with inline CSS only.

The fixed templates are `mission-dossier`, `evidence-audit`, `object-brief`, `relativity-lab-brief`, and `catalog-provenance`. Templates only select sections and change emphasis order; they do not alter scientific claims or create new measurements. Section toggles cover Session overview, Mission capsule, Evidence claims, Selected target, Workflow context, Kerr lab, Trusted boundaries, and Excluded state. Trusted boundaries are retained even if the user disables every section.

The rendered surface remains `app/components/AtlasScientificReportPanel.tsx`, now presented as Report Studio. It exposes a template segmented control, section checklist, preview statistics, and `Export Markdown`, `Export JSON`, `Export HTML`, and `Copy summary`. The existing Navigator panel id remains `panel:scientific-report`, but its title/search surface now includes `Report Studio`, `html report`, and `printable dossier`.

Evidence Ledger remains `v21-claim-passports` and updates the informational `scientific-report-dossier` passport to include Report Studio v29, fixed templates, and Markdown / JSON / self-contained printable HTML. The dossier remains local UI/session and evidence provenance. It is not PDF generation, not a publication archive, not a Horizons refresh, not telemetry export, not ephemeris storage, and not a simulation-state snapshot.

DOM contracts add `data-atlas-report-studio-version="v29-report-studio"`, `data-atlas-report-template-id`, `data-atlas-report-included-section-count`, `data-atlas-report-export-format`, and stable `data-atlas-report-section-toggle-id` markers while preserving the v28 `data-atlas-scientific-report-*` markers.

## v30 Validation Console / Trust Matrix

Orbit Atlas v30 adds `app/lib/atlasValidationConsole.ts`, a pure local readiness helper. `createAtlasValidationConsoleSummary()` aggregates Evidence Ledger group status, Mission Capsule restore warnings, Mission Hub context, Navigator/Workflow availability, and Report Studio template/section readiness into a deterministic `v30-validation-console` status matrix.

The rendered surface is `app/components/AtlasValidationConsolePanel.tsx`. Desktop uses a matrix/detail layout; mobile uses Matrix / Issues / Context tabs. Each domain shows status, source, model, primary metric, trusted boundary, and one related action routed through the existing Navigator/panel executor.

The console is intentionally read-only. It does not rerun validations, download data, refresh Horizons, call online services, certify scientific correctness, calculate a 0-100 score, create physics bodies, mutate `SolarSystemIntegrator`, change EIH 1PN solar-system dynamics, or change the Kerr kernel id `eih-1pn+kerr-geodesic-v17`.

Entry points are Navigator `Validation Console`, Orbit Atlas Layers `Validation console`, Sandbox Tools `Validation console`, Mission Hub, and Report Studio. Evidence Ledger remains `v21-claim-passports` and adds the informational `validation-console-readiness` claim/passport to document the console boundary.

DOM contracts: the page root and panel expose `data-atlas-validation-console-version="v30-validation-console"`, open/status/count/selected-domain markers, and stable `data-atlas-validation-domain-id` / `data-atlas-validation-issue-id` markers.

## v31 Atlas Observatory Deck / Scientific Control Workbench

Orbit Atlas v31 adds `app/lib/atlasObservatoryDeck.ts`, a pure local workbench helper. `createAtlasObservatoryDeckSummary()` aggregates Mission Hub, Validation Console, Report Studio, Navigator, Workflows, Evidence Ledger, selected body/catalog/evidence/workflow ids, and Kerr Lab UI parameters into a deterministic `v31-observatory-deck` summary.

The rendered surface is `app/components/AtlasObservatoryDeckPanel.tsx`. Desktop uses a four-zone scientific instrument layout: Current target, Trust matrix, Mission path, and Report/export. Mobile uses a bottom-sheet layout with Target / Trust / Mission / Report segments. Each zone shows status, source, model, primary metric, trusted boundary, metrics, and explicit actions.

Action execution stays centralized. Observatory Deck actions reference existing Navigator items or Workflow steps, then route through the same executors used by Mission Hub, Workflows, Evidence Ledger, Kerr Lab, Validation Console, and Report Studio. The deck does not duplicate body focus, catalog focus, Evidence Passport, Object Passport, Kerr Lab, report export, or workflow execution logic.

Entry points are Navigator `Observatory Deck`, Orbit Atlas Layers `Observatory deck`, Sandbox Tools `Observatory deck`, Mission Hub, Validation Console, and Report Studio. Evidence Ledger remains `v21-claim-passports` and adds the informational `observatory-deck-workbench` claim/passport.

This is a UI orchestration and control-workbench layer only. It does not become the default first screen, does not replace Mission Hub, Evidence Ledger, Validation Console or Report Studio, does not run online validation, does not create physical bodies, does not add datasets, does not mutate `SolarSystemIntegrator`, does not change EIH 1PN solar-system dynamics, and does not change the Kerr kernel id `eih-1pn+kerr-geodesic-v17`.

DOM contracts: the page root and panel expose `data-atlas-observatory-deck-version="v31-observatory-deck"`, open/zone/current/readiness markers, and stable `data-atlas-observatory-zone-id` / `data-atlas-observatory-action-id` markers.

## v32 Instrument Polish System / Workbench Visual Refinement

Orbit Atlas v32 adds `app/lib/atlasInstrumentUi.ts` and `app/components/AtlasInstrumentUi.tsx`. The lib exports the stable `v32-instrument-polish` version and the shared workbench panel kinds. The component module provides presentation-only primitives: panel shell, header, stat strip, status badge, info block, metric pill, action button, section card, and mobile segmented tabs.

The rendered workbench surfaces `AtlasMissionHubPanel`, `AtlasObservatoryDeckPanel`, `AtlasValidationConsolePanel`, and `AtlasScientificReportPanel` now share the same cold science instrument shell, header hierarchy, stat density, button treatment, info blocks, and mobile segmented tab language. Their props, action callbacks, Navigator/Workflow executor routes, Mission Capsule controls, Report Studio exporters, Evidence Ledger content, and existing v21-v31 DOM contracts are preserved.

Orbit Atlas Layers and Sandbox Tools receive light entry polish: workbench action buttons use the same cyan instrument accent, readable pressed/open states, and root-level instrument UI version markers. These entry changes do not replace the categorized object browser or alter any command execution path.

DOM contracts add `data-atlas-instrument-ui-version="v32-instrument-polish"` on the page root and shared instrument surfaces, and `data-atlas-instrument-panel-kind="mission-hub|observatory-deck|validation-console|report-studio"` on the four polished workbench panel shells.

## v33 Deep Sky Navigation / Readability Layer

Orbit Atlas v33 adds a presentation/readability layer over the existing v22 Celestial Catalog Atlas. The new pure helper is `createCelestialVisualLayerSummary()` in `app/lib/celestialCatalog.ts`, with version `v33-deep-sky-navigation`. It summarizes current constellation/deep-sky/label toggles, selected catalog object, deterministic label count, kind breakdown, catalog count, and the trusted boundary for the visual navigation layer.

The curated local catalog gains a small set of additional deep-sky navigation entries: California Nebula, Witch Head Nebula, Cocoon Nebula, Crescent Nebula, Wild Duck Cluster, M46, M67, Caroline's Rose, M83, M106, M94, NGC 300, and NGC 55. These entries reuse the existing `CelestialCatalogEntry` schema and therefore automatically enter Navigator search, Object Passport, Mission Capsule selected-catalog restore, Mission Hub context, Report Studio, and Observatory Deck current-target summaries.

Rendering stays lightweight and local. `CelestialCatalogLabels` now uses deterministic density caps for Orbit Atlas/mobile states and keeps the selected catalog object in the label candidates. `CelestialCatalogFocusMarker` adds a cold-cyan selected-object focus marker with kind/source cue. These are camera/navigation overlays only; no catalog object is inserted into `SolarSystemIntegrator`, no N-body state is created, and EIH 1PN dynamics and the Kerr geodesic kernel remain unchanged.

Evidence Ledger remains `v21-claim-passports`. The `celestial-catalog-atlas` claim passport now includes the v33 deep-sky navigation version, local expansion count, visual-navigation method text, and conservative limitations. DOM contracts add `data-deep-sky-navigation-version="v33-deep-sky-navigation"`, selected id/kind, label count, catalog count, and layer-state markers on the page root.

This version is a visual refinement layer only. It does not add physics models, download data, create physical bodies, alter `SolarSystemIntegrator`, change EIH 1PN solar-system dynamics, change the Kerr kernel id `eih-1pn+kerr-geodesic-v17`, rerun validation, or change report/capsule serialization semantics.

## v34 Performance Budget / Render Stability Gate

Orbit Atlas v34 adds `app/lib/atlasPerformanceBudget.ts`, a pure local render-budget helper. `createAtlasPerformanceBudgetSummary()` classifies the current presentation mode, scale/budget, viewport width, device pixel ratio, deep-sky toggles, catalog label count, Kerr Lab visibility, workbench-open state, readiness fallback, and visual-enhancement state into a deterministic `v34-performance-budget` summary.

The summary reports a conservative tier (`mobile-safe`, `balanced`, `dense`, or `diagnostic`), render stability (`ready`, `warming`, `fallback`, or `constrained`), a recommended render budget, a deep-sky label budget, and a list of readable recommendations. It intentionally does not produce a 0-100 score and does not automatically disable any user-enabled science layer.

The v33 deep-sky readability layer now accepts the v34 label budget. `CelestialCatalogLabels` uses that budget for deterministic density while preserving the selected catalog object in the label candidates. This keeps selected M83, California Nebula, M11, M67, and other catalog targets readable on desktop and 390px-class mobile viewports without inserting them into N-body physics.

Evidence Ledger remains `v21-claim-passports` and adds the informational `performance-budget-readiness` claim/passport. Validation Console includes a Performance Budget domain, and Observatory Deck's Trust zone can surface the current budget cue. The Physics Performance HUD displays a compact Render Budget strip in Sandbox mode.

DOM contracts: the page root exposes `data-atlas-performance-version="v34-performance-budget"`, `data-atlas-performance-tier`, `data-atlas-performance-render-stability`, `data-atlas-performance-recommendation-count`, `data-atlas-performance-deep-sky-label-budget`, and `data-atlas-performance-workbench-open`.

This is a local render-stability and observability layer only. It does not add workers, dependencies, online profiling, datasets, physics models, automatic degradation, telemetry export, or validation refresh. It does not mutate `SolarSystemIntegrator`, `physicsEngine`, EIH 1PN solar-system dynamics, or the Kerr kernel id `eih-1pn+kerr-geodesic-v17`.

## v35 Kerr Relativity Studio / Strong-Field Experiment Deck

Orbit Atlas v35 adds `app/lib/kerrRelativityStudio.ts`, a pure summary helper over the existing Kerr geodesic visualization and validation layers. `createKerrRelativityStudioSummary()` accepts the current spin `a/M`, impact parameter `b/M`, orbit preset id, render mode, optional track set, and optional validation summary, then returns deterministic Studio metrics: null-probe status, weak-field `4M/b` reference, prograde/retrograde ISCO radii, ISCO split, Hamiltonian drift, radial range, track count, sample count, and trusted boundary.

The rendered Kerr panel remains `app/components/KerrBlackHolePanel.tsx`, but now presents the surface as `Kerr Relativity Studio`. It keeps the existing controls and adds Overview / Probe / ISCO / Error / Boundary tabs plus experiment cards for photon ring, ISCO split, capture cone, wide bend, and frame split. The visual layer still highlights `probe-null` in cold cyan, lets users highlight track kinds, and keeps weak-field teaching particles secondary to geodesic-backed tracks.

Provenance stays stable. Evidence Ledger remains `v21-claim-passports`; the existing `kerr-geodesic-lab` claim id now includes v35 Studio metrics, including Studio version, probe status, ISCO split, Hamiltonian drift, and `test-particle-null-geodesic-lab` boundary. Navigator keeps the stable action id `panel:kerr-relativity-lab` while showing the title `Kerr Relativity Studio`, so Workflows, Mission Hub, Mission Capsule, Report Studio, Validation Console, and Observatory Deck continue to route through the same panel action.

The DOM contract adds `data-kerr-relativity-studio-version="v35-kerr-relativity-studio"`, `data-kerr-studio-mode`, `data-kerr-studio-preset`, `data-kerr-studio-probe-status`, `data-kerr-studio-isco-split-m`, `data-kerr-studio-hamiltonian-drift`, and `data-kerr-studio-boundary="test-particle-null-geodesic-lab"` on the page/panel when Kerr is visible.

This version is a productization and explanation layer for the existing strong-field lab. It does not add a full Kerr ray tracer, solve Einstein field equations, claim full numerical relativity, mutate `SolarSystemIntegrator`, change EIH 1PN solar-system dynamics, or change the Kerr geodesic kernel id `eih-1pn+kerr-geodesic-v17`.

## v36 Release Candidate Gate / Product Hardening

Orbit Atlas v36 adds `app/lib/atlasReleaseGate.ts`, a pure local release hardening helper. `createAtlasReleaseGateSummary()` accepts existing Validation Console domains and derives a deterministic `v36-release-candidate-gate` summary: status, blocker count from failed domains, warning count from pending domains, source domain ids, and a trusted boundary.

The rendered surface remains the existing `AtlasValidationConsolePanel`. `createAtlasValidationConsoleSummary()` now appends a `Release Candidate Gate` domain after the existing readiness domains, and Navigator searches for `release candidate`, `rc gate`, or `hardening` open the stable `panel:validation-console` action. No new panel id is introduced.

Evidence Ledger remains `v21-claim-passports` and adds the informational `release-candidate-gate` claim/passport. The passport explicitly states that the gate is a local product-readiness rollup and does not run lint, TypeScript, tests, builds, browser checks, online validation, or scientific certification from inside the runtime UI.

DOM contracts: the page root exposes `data-atlas-release-gate-version="v36-release-candidate-gate"`, `data-atlas-release-gate-status`, `data-atlas-release-gate-blocker-count`, and `data-atlas-release-gate-warning-count`.

This version is a hardening and observability layer only. It does not mutate `SolarSystemIntegrator`, `physicsEngine`, EIH 1PN solar-system dynamics, or the Kerr geodesic kernel id `eih-1pn+kerr-geodesic-v17`; it does not claim full numerical relativity, cosmological N-body, complete online astronomy database coverage, or CI/runtime command status.

## v37 Relativity Observable Atlas / Science Depth Layer

Orbit Atlas v37 adds `app/lib/relativityObservableAtlas.ts`, a pure read-only science-depth helper. `createRelativityObservableAtlasSummary()` accepts the current `SimulationDiagnostics` snapshot and optional `KerrRelativityStudioSummary`, then returns deterministic `v37-relativity-observable-atlas` rows for Mercury perihelion advance, solar-limb light deflection, Shapiro radar delay, gravitational/kinematic time dilation, Kerr null-probe `4M/b`, Kerr ISCO split, and Kerr Hamiltonian drift.

The rendered surface is `app/components/RelativityObservableAtlasPanel.tsx`, opened by Navigator action `panel:relativity-observables`. It uses the shared v32 instrument UI primitives and shows each row's formula, measured/display value, reference value, source, status/confidence, and trusted boundary. Navigator keywords include `relativity observables`, `observable atlas`, `Mercury precession`, `Shapiro`, `time dilation`, `ISCO`, and `Hamiltonian drift`.

Provenance is additive. Evidence Ledger remains `v21-claim-passports` and adds the informational `relativity-observable-atlas` claim/passport. Validation Console adds the `relativity-observables` domain, Report Studio adds a `relativity-observables` section for exports, and Observatory Deck's Trust zone can surface the ready/total observable count and open the new panel.

Kerr contracts remain preserved. The v37 rows reuse `v35-kerr-relativity-studio`, `test-particle-null-geodesic-lab`, and `eih-1pn+kerr-geodesic-v17`. Kerr Hamiltonian drift is labeled as numerical stability/health only, not an astrophysical observable.

DOM contracts: the page root exposes `data-relativity-observable-atlas-version="v37-relativity-observable-atlas"`, `data-relativity-observable-count`, `data-relativity-observable-ready-count`, and `data-relativity-observable-boundary`. The panel also marks each row with `data-relativity-observable-row-id`, kind, and status.

This version is a science explanation layer only. It does not run tests, fetch data, mutate state, add or alter physics integration, solve Einstein field equations, claim full numerical relativity, add cosmological N-body, claim complete online astronomy database coverage, or change `SolarSystemIntegrator`, `physicsEngine`, EIH 1PN dynamics, worker physics, or the Kerr kernel id.

## v38 Browser Acceptance Harness / Regression Gate

Orbit Atlas v38 adds `app/lib/atlasBrowserAcceptance.ts`, a pure metadata helper. `createAtlasBrowserAcceptanceSummary()` returns deterministic `v38-browser-acceptance-harness` information for the local Playwright harness: system Chrome, desktop `1440x900`, mobile `390x844`, checked v35/v36/v37 DOM contracts, console/page error capture, and horizontal overflow checks.

The browser harness is tooling, not a new runtime panel. `playwright.atlas.config.ts` uses `@playwright/test` with `channel: "chrome"` so it targets installed system Chrome instead of Playwright-managed browser downloads. The acceptance spec lives in `tests/atlas-browser/atlas-browser-acceptance.spec.ts` and opens `/?presentation=sandbox` through the local dev server.

Command boundaries are explicit. `npm run test:atlas:browser` runs the browser smoke suite. `npm run verify:atlas:full` runs the existing `npm run verify:atlas` gate and then browser acceptance. `npm run verify:atlas` remains the fast default gate: lint, TypeScript, atlas tests, and production build.

Provenance is additive. Evidence Ledger remains `v21-claim-passports` and adds the informational `browser-acceptance-harness` claim/passport. Validation Console adds the `browser-acceptance` domain, and Navigator searches for `browser acceptance`, `playwright smoke`, `desktop mobile`, and `regression gate` open the stable `panel:validation-console` action. No new panel id is introduced.

DOM contracts: the page root exposes `data-atlas-browser-acceptance-version="v38-browser-acceptance-harness"`, `data-atlas-browser-acceptance-command`, `data-atlas-browser-acceptance-runtime-status="not-claimed-in-app"`, `data-atlas-browser-acceptance-viewport-count`, and `data-atlas-browser-acceptance-boundary`.

This version is a local regression-automation layer only. The runtime UI advertises harness availability but does not claim the latest command result, CI certification, online validation, scientific certification, full numerical relativity, cosmological N-body, or physics mutation. It does not change `SolarSystemIntegrator`, `physicsEngine`, EIH 1PN dynamics, worker physics, or the Kerr kernel id `eih-1pn+kerr-geodesic-v17`.

## v39 Relativity Observable Explainer / Derivation Cards

Orbit Atlas v39 extends `app/lib/relativityObservableAtlas.ts` with `createRelativityObservableExplainerSummary()`, a pure local helper returning deterministic `v39-relativity-observable-explainer` metadata. It maps the existing seven v37 observable row ids to seven derivation cards; it does not create new observable rows or recalculate physics.

The rendered surface remains `app/components/RelativityObservableAtlasPanel.tsx`, opened by the stable Navigator action `panel:relativity-observables`. Each existing row now carries a derivation card with formula title/expression, variable glossary with units/source notes, four explanation steps, scale interpretation, applicability, source, and trusted boundary. Navigator keywords `relativity explainer`, `formula steps`, `derivation cards`, and `variable glossary` route to the existing panel.

Provenance is additive. Evidence Ledger remains `v21-claim-passports` and adds the informational `relativity-observable-explainer` claim/passport. Validation Console adds the `relativity-explainer` domain. Report Studio adds explainer version/card/step metrics to the Relativity Observable Atlas section, and Observatory Deck's Trust zone can surface the explainer card/step cue.

DOM contracts: the page root and Observable Atlas panel expose `data-relativity-explainer-version="v39-relativity-observable-explainer"`, `data-relativity-explainer-card-count`, `data-relativity-explainer-step-count`, and `data-relativity-explainer-boundary`. Each derivation card exposes `data-relativity-explainer-card-id`, `data-relativity-explainer-observable-id`, `data-relativity-explainer-variable-count`, and `data-relativity-explainer-step-count`.

This version is a science explanation layer only. It does not add or change observables, run tests from the UI, fetch data, mutate state, change physics integration, solve Einstein field equations, claim full numerical relativity, add cosmological N-body, claim online validation or online catalog completeness, or change `SolarSystemIntegrator`, `physicsEngine`, EIH 1PN dynamics, worker physics, or the Kerr kernel id `eih-1pn+kerr-geodesic-v17`.

## v40 Relativity Guided Tour / Science Story Mode

Orbit Atlas v40 adds `app/lib/relativityGuidedTour.ts`, a pure local helper returning deterministic `v40-relativity-guided-tour` metadata. `createRelativityGuidedTourSummary()` maps the existing seven v37 observable row ids and v39 derivation cards into seven guided workflow steps: Mercury perihelion advance, solar-limb light deflection, Shapiro radar delay, gravitational/kinematic time dilation, Kerr null-probe `4M/b`, Kerr ISCO split, and Kerr Hamiltonian drift as numerical health only.

The rendered surface remains `app/components/AtlasWorkflowPanel.tsx`. `app/lib/atlasWorkflows.ts` adds the `relativity-guided-tour` workflow under the existing `panel:atlas-workflows` route. Weak-field tour steps open `panel:relativity-observables`; Kerr tour steps open the stable `panel:kerr-relativity-lab` action and preserve the v35 boundary plus the kernel id `eih-1pn+kerr-geodesic-v17`. Navigator keywords `relativity tour`, `guided relativity`, `science story`, and `observable walkthrough` route to the existing Workflows panel.

Provenance is additive. Evidence Ledger remains `v21-claim-passports` and adds the informational `relativity-guided-tour` claim/passport. Validation Console adds the `relativity-tour` domain, Report Studio adds guided-tour metrics to the Relativity Observable Atlas section, and Observatory Deck can surface the tour readiness cue in Trust and Mission Path zones.

DOM contracts: the page root exposes `data-relativity-guided-tour-version="v40-relativity-guided-tour"`, `data-relativity-guided-tour-workflow-id="relativity-guided-tour"`, `data-relativity-guided-tour-step-count`, `data-relativity-guided-tour-ready-count`, and `data-relativity-guided-tour-boundary`. Atlas Workflows also marks the tour workflow and each step with stable `data-relativity-guided-tour-*` attributes for browser acceptance.

This version is guided-navigation and explanation metadata only. It does not add observables, run runtime commands, fetch data, mutate state, change physics integration, solve Einstein field equations, claim full numerical relativity, add cosmological N-body, claim online validation or online catalog completeness, or change `SolarSystemIntegrator`, `physicsEngine`, EIH 1PN dynamics, worker physics, or the Kerr kernel id `eih-1pn+kerr-geodesic-v17`.

## v41 Accessible Atlas Workbench / WCAG 2.2 AA Local Gate

Orbit Atlas v41 adds `app/lib/atlasWorkbenchAccessibility.ts`, a pure metadata helper returning deterministic `v41-atlas-workbench-accessibility` information. The summary defines the local `wcag-2.2-aa-target`, a 24px minimum effective target size, Navigator's modal focus-trap policy, non-modal workbench focus-entry policy, reduced-motion policy, and a fixed nine-surface scope: Navigator, Atlas Workflows, Relativity Observable Atlas, Kerr Relativity Studio, Evidence Ledger, Validation Console, Report Studio, Mission Hub, and Observatory Deck.

`app/components/AtlasInstrumentUi.tsx` provides the shared workbench focus-entry and focus-return behavior for non-modal panels. Navigator remains the one modal dialog: it focuses its search input, traps `Tab`, retains Arrow/Enter selection behavior, closes on `Escape`, and restores focus to its invoking control or the persistent Search fallback. Non-modal panels are labelled complementary regions; opening targets their labelled focus surface, and `Escape` closes the active panel and returns focus. Kerr Studio is a labelled complementary region with `aria-expanded` and `aria-controls`; `Escape` collapses only its details and returns focus to the Kerr title toggle without changing the Kerr layer or physics state.

The accessible workbench visual system uses opaque dark surfaces and shared high-contrast text, border, status, and focus tokens. It does not rely on the WebGL scene for contrast. Surface buttons, inputs, sliders, checkboxes, and icon controls have a 24px minimum effective hit area, status text is not color-only, scroll regions are keyboard reachable, and a global `prefers-reduced-motion: reduce` policy suppresses nonessential animation and transition behavior.

Provenance is additive. Evidence Ledger remains `v21-claim-passports` and adds the informational `accessibility-workbench` claim/passport. Validation Console adds the `accessibility-workbench` domain. Navigator keywords `accessibility`, `keyboard navigation`, `reduced motion`, `WCAG`, and `AA audit` route to the stable `panel:validation-console` action; no panel or existing action id changes.

DOM contracts: the page root exposes `data-atlas-workbench-accessibility-version="v41-atlas-workbench-accessibility"`, `data-atlas-workbench-accessibility-scope`, `data-atlas-workbench-accessibility-standard="wcag-2.2-aa-target"`, surface-count, minimum-target-px, focus-policy, motion-policy, `data-atlas-workbench-accessibility-runtime-status="not-claimed-in-app"`, and boundary markers. Each scoped surface exposes `data-atlas-accessibility-surface-id` and `data-atlas-accessibility-focus-target` for browser assertions.

`@axe-core/playwright` is a direct development dependency. `tests/atlas-browser/atlas-browser-acceptance.spec.ts` tests the two existing system Chrome viewports, validates focus behavior and target sizes, emulates reduced motion, and scans each visible scoped workbench surface with WCAG 2.0/2.1/2.2 A/AA tags without rule suppressions. This is local tooling only: the runtime advertises no latest scan result, command pass/fail result, CI certification, online validation, or formal accessibility conformance certification.

This version does not change `SolarSystemIntegrator`, `physicsEngine`, EIH 1PN dynamics, worker physics, or the Kerr kernel id `eih-1pn+kerr-geodesic-v17`. It does not claim full numerical relativity, Einstein field-equation solving, cosmological N-body, complete online astronomy database coverage, or runtime scientific certification.

## v42 Cinematic Scientific Workbench / AAA-Inspired Visual Reset

Orbit Atlas v42 adds `app/lib/atlasCinematicWorkbench.ts`, a pure metadata helper returning deterministic `v42-cinematic-science-workbench` information. The summary records the visual target `scientific-instrument-cinematic`, quality target `aaa-inspired-local-art-direction`, the preserved v41 AA boundary, existing-assets-only scene policy, `not-applied` physics mutation, and `not-claimed-in-app` runtime certification status.

The reset is presentation/rendering work only. `app/globals.css` now defines a cohesive graphite instrument palette with ivory text, cold-gold orbit accents, restrained cyan instrumentation, smaller radii, lower blur, opaque workbench panels, and shared cinematic classes for docks, control clusters, menus, panels, and workbench shells. `BottomControlBar` and `OrbitAtlasHud` use lower-interference bottom dock layouts with stable `data-atlas-cinematic-*` markers for browser acceptance. `PhysicsPerformanceHud` is quieter and smaller.

Scene tuning keeps the existing assets and shaders. `ScienceBackdrop`, `GalaxyEnvironmentSphere`, `GaiaStarField`, `ReferenceOrbitDecor`, `OrbitAtlasLabels`, `CelestialCatalogLabels`, `ThreeJsPostPipeline`, and `orbitAtlasPresentation` rebalance sky exposure, star opacity, orbit widths/alpha, label clutter, bloom, and vignette so major planetary paths read as luminous scientific rails while minor/background paths recede. These changes do not alter body positions, integration, EIH 1PN terms, Kerr geodesic validation, or worker physics.

Provenance is additive. Evidence Ledger remains `v21-claim-passports` and adds the informational `cinematic-visual-system` claim/passport. Validation Console adds the `visual-system` domain. Navigator keywords `visual polish`, `cinematic ui`, `art direction`, `universe sandbox`, and `aaa visual` route to the stable `panel:validation-console` action; no new panel id is introduced.

DOM contracts: the page root exposes `data-atlas-cinematic-workbench-version="v42-cinematic-science-workbench"`, `data-atlas-cinematic-workbench-visual-target`, quality target, AA boundary, scene policy, physics mutation, runtime certification, and trusted boundary markers. HUD surfaces expose `data-atlas-cinematic-hud`, and primary HUD groups expose `data-atlas-cinematic-control-cluster` so browser tests can check bounds and overlap without relying on visible copy.

Browser acceptance extends the v38/v41 harness with v42 root-marker checks, `visual-system` routing, bottom dock bounds, primary HUD cluster overlap checks, opaque AA workbench-surface checks, reduced-motion policy, v35-v41 contract preservation, desktop/mobile horizontal overflow, console/page errors, and Axe scans. Screenshot capture is for local human review only and is not a committed golden snapshot system.

This version is local visual presentation only. It does not add an external asset pipeline, mutate `SolarSystemIntegrator`, `physicsEngine`, EIH 1PN dynamics, worker physics, or the Kerr kernel id `eih-1pn+kerr-geodesic-v17`. It does not claim formal AAA art certification, WCAG certification, scientific certification, CI/runtime command status, online validation, full numerical relativity, Einstein field-equation solving, cosmological N-body, or complete online astronomy database coverage.

## v43 Planetary Close-Up & Deep-Space Fidelity Pass

Orbit Atlas v43 adds `app/lib/atlasPlanetaryVisualFidelity.ts`, a pure metadata helper returning deterministic `v43-planetary-visual-fidelity-pass` information. The summary records the selected-body close-up realism target, restrained scientific-instrument style target, `network-prepared-local-runtime` asset policy, local-public-textures-only runtime source, preserved v41/v42 boundaries, and explicit non-claims for runtime certification, scientific certification, online validation, asset completeness certification, and physics mutation.

The rendering work is presentation-only. `SolarSystemBodies` now lets selected major bodies prefer the existing local HD texture manifest with the existing 2K overview fallback. `Planet` reduces the flat self-emissive texture look, separates Earth night lights into a dark-side visual layer, tightens cloud opacity, and tunes atmosphere/rim strength by body profile. Gas giants keep banded texture structure without claiming simulated atmosphere physics. `SunBody` keeps the existing procedural solar shader while restraining bloom/corona and adding more readable close-up surface structure.

Deep-space composition adapts to close-up state. `ScienceBackdrop` and `GalaxyEnvironmentSphere` dim bright-star noise, lower sky exposure, preserve a darker Milky Way band, and keep the v42 orbit-overview readability when no body is selected. `UniverseScene` tightens inspect/lock camera distances for major bodies so close-ups frame the object rather than the orbit network. These changes do not alter body positions, integration cadence, force models, Kerr geodesic validation, or worker physics.

Provenance is additive. Evidence Ledger includes the informational `planetary-visual-fidelity` passport. Validation Console includes the `planetary-visual-fidelity` domain. Navigator keywords `planet closeup`, `planet realism`, `earth detail`, `sun surface`, `deep space backdrop`, `sky fidelity`, and `universe background` route to the stable `panel:validation-console` action; no new panel id is introduced. Report Studio and Observatory Deck can surface the v43 visual target, style target, asset policy, and trusted boundary as local presentation cues.

DOM contracts: the page root exposes `data-atlas-planetary-visual-fidelity-version="v43-planetary-visual-fidelity-pass"`, visual target, style, asset policy, boundary, selected-body visual id, selected-body visual tier, selected-body close-up active state, selected-body atmosphere profile, and sky close-up profile markers. Browser acceptance uses these markers alongside v35-v42 contracts, desktop/mobile overflow checks, console/page-error capture, focus/accessibility checks, and local screenshot capture for human visual review without committed golden snapshots.

This version is a local visual fidelity pass only. It may use network access during development to prepare or refresh local texture assets, but the runtime reads local `public/textures` assets only and does not claim online validation, real-time downloading, online database completeness, asset completeness certification, formal AAA art certification, WCAG certification, scientific certification, CI/runtime command status, full numerical relativity, Einstein field-equation solving, cosmological N-body, or physics mutation. It does not change `SolarSystemIntegrator`, `physicsEngine`, EIH 1PN dynamics, worker physics, or the Kerr kernel id `eih-1pn+kerr-geodesic-v17`.

## v44 Cinematic Lighting & Post-FX / AAA Close-Up Composition

Orbit Atlas v44 adds `app/lib/atlasCinematicLightingComposition.ts`, a pure metadata helper returning deterministic `v44-cinematic-lighting-composition` information. The summary records target `closeup-cinematic-lighting-composition`, lighting profile `filmic-closeup-balanced`, post-FX profile `aces-vignette-restrained-bloom`, asset policy `dev-prepared-local-runtime`, local-public-textures-only runtime source, supported body lighting profiles, preserved v41/v42/v43 boundaries, and explicit non-claims for runtime certification, AAA certification, WCAG certification, scientific certification, online validation, asset completeness, and physics mutation.

The rendering work remains presentation-only. `UniversePage` derives a selected-body lighting profile (`earth-night-closeup`, `terrestrial-closeup`, `lunar-mars-closeup`, `gas-giant-closeup`, `solar-closeup`, or `overview`) and exposes it through root DOM markers. `ScienceBackdrop` and `GalaxyEnvironmentSphere` use the close-up profile to lower star noise and sky exposure further than v43 while keeping the Milky Way as a dark structural band. `Planet`, `SunBody`, `UniversePostProcessing`, and `ThreeJsPostPipeline` rebalance material fill, cloud opacity, Earth night lights, gas-giant band readability, lunar/Mars relief cues, solar edge glow, bloom, and vignette without modifying positions, integration, force models, Kerr geodesics, or workers.

Provenance is additive. Evidence Ledger includes the informational `cinematic-lighting` passport. Validation Console includes the `cinematic-lighting` domain. Navigator keywords `cinematic lighting`, `filmic exposure`, `post fx`, `color grading`, `closeup composition`, and `planet lighting` route to the stable `panel:validation-console` action; no new panel id is introduced. Report Studio and Observatory Deck can surface the v44 lighting profile, post-FX profile, asset policy, and trusted boundary as local presentation cues.

DOM contracts: the page root exposes `data-atlas-cinematic-lighting-version="v44-cinematic-lighting-composition"`, visual target, lighting profile, post-FX profile, asset policy, selected-body lighting profile, and trusted boundary markers. Browser acceptance uses these markers alongside v35-v43 contracts, v41 focus/Axe/reduced-motion checks, desktop/mobile overflow checks, console/page-error capture, and local screenshot capture for human visual review without committed golden snapshots.

This version is a local lighting and composition pass only. It uses existing local assets and shaders, does not add runtime online downloads, does not claim online validation, formal AAA art certification, WCAG certification, scientific certification, CI/runtime command status, full numerical relativity, Einstein field-equation solving, cosmological N-body, or physics mutation, and does not change `SolarSystemIntegrator`, `physicsEngine`, EIH 1PN dynamics, worker physics, or the Kerr kernel id `eih-1pn+kerr-geodesic-v17`.

## v45 Chinese Scientific Interface And Deep-Space Fidelity
Orbit Atlas v45 adds `app/lib/atlasChineseDeepSpaceFidelity.ts`, a pure metadata helper returning deterministic `v45-chinese-deep-space-fidelity` information. The summary records the primary UI language `zh-CN`, localization mode `zh-cn-primary-scientific-ids-preserved`, deep-space visual profile `milky-way-constellation-nebula-balanced`, local-runtime asset policy, featured local visual layers, preserved v41/v42/v43/v44 boundaries, and explicit non-claims for runtime pass/fail, certification, online validation, online catalog completeness, and physics mutation.

The interface work is Chinese-first but keeps stable scientific identifiers. `BottomControlBar`, `OrbitAtlasHud`, `AtlasNavigatorPanel`, workbench panel chrome, status labels, object browser groups, and high-frequency aria labels now use Simplified Chinese. Formulas, export field names, version strings, DOM markers, action ids, catalog ids, and the Kerr kernel id remain unchanged so tests and scientific references stay stable.

The deep-space and body presentation remains rendering-layer only. `GalaxyEnvironmentSphere`, `ScienceBackdrop`, `ConstellationLines`, `NebulaMarkers`, `StarClusterMarkers`, `BrightGalaxyMarkers`, `CelestialCatalogLabels`, and the Sandbox object browser use existing local assets and curated display metadata to reduce background noise, keep the Milky Way readable as a dark structural band, soften constellation/deep-sky overlays, and show reliable Chinese names for selected nebulae, constellations, star clusters, galaxies, pulsars, and nearby stars. Close-up body lighting continues to use the v43/v44 profiles without altering positions, integration, force models, Kerr geodesics, or workers.

Provenance is additive. Evidence Ledger and Validation Console expose the Chinese interface and deep-space fidelity boundary. Navigator keywords use clean Chinese and standard English terminology.

DOM contracts: the page root exposes `data-atlas-chinese-interface-version="v45-chinese-deep-space-fidelity"`, `data-atlas-ui-language="zh-CN"`, `data-atlas-localization-mode="zh-cn-primary-scientific-ids-preserved"`, `data-atlas-deep-space-fidelity-version`, `data-atlas-deep-space-visual-profile="milky-way-constellation-nebula-balanced"`, `data-atlas-deep-space-asset-policy="local-runtime-assets"`, and `data-atlas-deep-space-boundary`. Browser acceptance uses these markers alongside v35-v44 contracts, v41 focus/Axe/reduced-motion checks, desktop/mobile overflow checks, console/page-error capture, Chinese Navigator searches, and local screenshot review without committed golden snapshots.

This version is a local UI and visual fidelity pass only. Runtime reads local `public/textures` and local catalog data only, does not claim online validation, online asset completeness, formal AAA art certification, WCAG certification, scientific certification, CI/runtime command status, full numerical relativity, Einstein field-equation solving, cosmological N-body, or physics mutation, and does not change `SolarSystemIntegrator`, `physicsEngine`, EIH 1PN dynamics, worker physics, or the Kerr kernel id `eih-1pn+kerr-geodesic-v17`.

## v46 Cinematic Deep-Space Camera

Orbit Atlas v46 adds `app/lib/atlasCinematicDeepSpaceCamera.ts`, a pure metadata helper returning deterministic `v46-cinematic-deep-space-camera` information. The summary records target `cinematic-deep-space-camera-composition`, supported camera profiles `overview-atlas`, `selected-body-cinematic`, and `showcase-deep-space`, sky composition profiles, background-noise profiles, target-separation profiles, quality budget `stable-high-fidelity`, local runtime asset source, preserved v41/v42/v43/v44/v45 boundaries, and explicit non-claims for runtime pass/fail, AAA certification, WCAG certification, scientific certification, online validation, online catalog completeness, online asset completeness, and physics mutation.

The rendering work remains presentation-only. `UniversePage` derives active v46 root markers from the selected-body state and visual-enhancement state: overview uses `overview-atlas`, selected-body close-up uses `selected-body-cinematic`, and non-mobile showcase enhancement can use `showcase-deep-space`. `ScienceBackdrop` and `GalaxyEnvironmentSphere` read the active camera/noise profile to reduce bright-star pressure, suppress high-frequency Milky Way white noise, cool the sky tint, and keep selected-body inspections on a darker subject-separated background. `ConstellationLines`, `NebulaMarkers`, `StarClusterMarkers`, and `BrightGalaxyMarkers` scale opacity by camera profile so overview remains readable while close-ups become quieter.

Provenance is additive. Evidence Ledger and Validation Console expose the cinematic camera profile, background-noise policy, quality budget and trusted boundary.

DOM contracts: the page root exposes `data-atlas-cinematic-deep-space-camera-version="v46-cinematic-deep-space-camera"`, `data-atlas-cinematic-camera-profile`, `data-atlas-cinematic-sky-composition-profile`, `data-atlas-cinematic-background-noise-profile`, `data-atlas-cinematic-target-separation-profile`, `data-atlas-cinematic-quality-budget="stable-high-fidelity"`, and `data-atlas-cinematic-deep-space-boundary`. Browser acceptance uses these markers alongside v35-v45 contracts, v41 focus/Axe/reduced-motion checks, desktop/mobile overflow checks, console/page-error capture, Chinese/English Navigator searches, selected-body close-up profile checks, and local screenshot review without committed golden snapshots.

This version is a local camera and deep-space composition pass only. Runtime reads local `public/textures` and local catalog data only, does not claim online validation, online asset completeness, formal AAA art certification, WCAG certification, scientific certification, CI/runtime command status, full numerical relativity, Einstein field-equation solving, cosmological N-body, or physics mutation, and does not change `SolarSystemIntegrator`, `physicsEngine`, EIH 1PN dynamics, worker physics, or the Kerr kernel id `eih-1pn+kerr-geodesic-v17`.

## v47 Universe Sandbox Reference Backdrop

Orbit Atlas v47 adds `app/lib/atlasUniverseSandboxReferenceBackdrop.ts`, a pure metadata helper returning deterministic `v47-universe-sandbox-reference-backdrop` information. The summary records reference mode `inspired-reference-comparison`, background art direction `sparse-stars-layered-milky-way`, overview/close-up/showcase depth profiles, selected-body subject visibility, local-only image review, local runtime asset source, preserved v41-v46 boundaries, and explicit non-claims for Universe Sandbox clone status, AAA/WCAG/science certification, latest runtime command result, online validation, online catalog completeness, online asset completeness, and physics mutation.

The rendering work remains presentation-only. `UniversePage` derives v47 root markers from the active v46 camera profile: overview uses `overview-sparse-layered-milky-way`, selected-body close-up uses `closeup-subject-negative-space`, and showcase uses `showcase-reference-depth`. `GalaxyEnvironmentSphere` adds shader uniforms for reference depth and negative-space suppression, keeps Milky Way structure as a dark band, and remaps the star layer through a threshold shader so bright stars remain sparse while background noise recedes. `ScienceBackdrop` forwards the active profile; deep-sky markers keep v45/v46 softening behavior.

Selected-body framing is verified without mutating physics. `CinematicSubjectFramingBridge` reads the current selected body position from existing physics state, projects it through the active camera, estimates screen radius, and writes `data-atlas-cinematic-subject-*` markers to the page root. Browser acceptance waits for Earth, Sun, Jupiter, and Saturn to be in frame before screenshot capture, preventing close-up review frames where the target is off-screen.

Provenance is additive. Evidence Ledger and Validation Console expose the reference backdrop, subject visibility and screenshot-review policy.

DOM contracts: the page root exposes `data-atlas-universe-sandbox-reference-version="v47-universe-sandbox-reference-backdrop"`, `data-atlas-universe-sandbox-reference-mode`, `data-atlas-background-art-direction`, `data-atlas-background-depth-profile`, `data-atlas-background-subject-visibility-profile`, `data-atlas-reference-screenshot-review`, `data-atlas-background-reference-boundary`, and selected-subject screen framing markers. Browser acceptance uses these markers alongside v35-v46 contracts, v41 focus/Axe/reduced-motion checks, desktop/mobile overflow checks, console/page-error capture, WebGL backdrop pixel-budget checks, selected-body in-frame checks, and local screenshot review without committed golden snapshots.

This version is a local visual reference pass only. Runtime reads local `public/textures` and local catalog data only, does not copy Universe Sandbox assets, does not claim a Universe Sandbox clone, online validation, online asset completeness, formal AAA art certification, WCAG certification, scientific certification, CI/runtime command status, full numerical relativity, Einstein field-equation solving, cosmological N-body, or physics mutation, and does not change `SolarSystemIntegrator`, `physicsEngine`, EIH 1PN dynamics, worker physics, stable panel ids, or the Kerr kernel id `eih-1pn+kerr-geodesic-v17`.

## v48 Reference-Grade Deep Space Composite / 3A Scientific Space Art Layer

Orbit Atlas v48 adds `app/lib/atlasReferenceGradeSpaceArt.ts`, a pure metadata helper returning deterministic `v48-reference-grade-space-art` information. The summary records art direction `cinematic-scientific-space-simulation`, asset policy `generated-local-runtime-assets`, review mode `local-reference-screenshot-rubric`, overview/close-up/showcase composite profiles, sky-layer profiles, starfield profiles, subject-matte profiles, planet-material profiles, preserved v41-v47 boundaries, and explicit non-claims for runtime pass/fail, Universe Sandbox clone status, AAA certification, WCAG certification, scientific certification, online validation, online catalog completeness, online asset completeness, and physics mutation.

The generated sky asset path is local. `scripts/build-universe-sandbox-sky.py` keeps the v9 outputs compatible and adds v48 local outputs under `public/textures/sky`: `orbit-atlas-v48-base-8k.jpg`, `orbit-atlas-v48-base-4k.jpg`, `orbit-atlas-v48-stars-4k.jpg`, `orbit-atlas-v48-stars-2k.jpg`, `orbit-atlas-v48-dust-2k.jpg`, and `orbit-atlas-v48-negative-space-2k.jpg`. `orbitAtlasPresentation` exposes `ORBIT_ATLAS_V48_SKY` and sets the active `ORBIT_ATLAS_SKY` manifest to v48 while retaining `ORBIT_ATLAS_V9_SKY` as fallback.

The rendering work remains presentation-only. `GalaxyEnvironmentSphere` samples the v48 base/stars/dust/negative-space layers, remaps stars into sparse primary points plus dim background structure, and applies subject-matte uniforms so selected body close-ups get darker negative space behind the limb. `ScienceBackdrop` forwards the active v48 sky/starfield/subject-matte profiles. `CinematicSubjectFramingBridge` still only reads selected-body projection and writes DOM markers plus the visual matte ref; it does not move bodies or mutate physics.

Close-up body tuning is also visual-only. `Planet` lowers selected-body self-emission cues, protects Earth dark-side night-light behavior, raises local texture microcontrast, and improves gas-giant band readability. `SunBody` restrains halo overexposure while preserving the existing solar shader. `SolarSystemBodies` improves Saturn ring readability and Cassini-gap contrast through existing ring geometry and shader styling. `UniversePostProcessing` and `ThreeJsPostPipeline` use a v48 close-up composite profile with lower bloom, stronger restrained vignette, cold deep-space floor, and subject contrast protection.

Provenance is additive. Evidence Ledger and Validation Console expose the reference-grade composite, sky, starfield, subject matte and asset policy.

DOM contracts: the page root exposes `data-atlas-reference-grade-space-art-version="v48-reference-grade-space-art"`, `data-atlas-reference-grade-art-direction`, `data-atlas-reference-grade-composite-profile`, `data-atlas-reference-grade-sky-layer-profile`, `data-atlas-reference-grade-starfield-profile`, `data-atlas-reference-grade-subject-matte-profile`, `data-atlas-reference-grade-planet-material-profile`, `data-atlas-reference-grade-asset-policy="generated-local-runtime-assets"`, `data-atlas-reference-grade-review-mode="local-reference-screenshot-rubric"`, and `data-atlas-reference-grade-boundary`. Browser acceptance uses these markers alongside v35-v47 contracts, v41 focus/Axe/reduced-motion checks, desktop/mobile overflow checks, console/page-error capture, WebGL backdrop pixel-budget checks, selected-body in-frame checks, and v48 local screenshot review without committed golden snapshots.

This version is a local visual composition pass only. Runtime reads local `public/textures` and local catalog data only, does not copy Universe Sandbox assets, does not claim a Universe Sandbox clone, online validation, online asset completeness, formal AAA art certification, WCAG certification, scientific certification, CI/runtime command status, full numerical relativity, Einstein field-equation solving, cosmological N-body, or physics mutation, and does not change `SolarSystemIntegrator`, `physicsEngine`, EIH 1PN dynamics, worker physics, stable panel ids, or the Kerr kernel id `eih-1pn+kerr-geodesic-v17`.

## v49 Planetary Material Composition / 3A Close-Up Body Material Layer

Orbit Atlas v49 adds `app/lib/atlasPlanetaryMaterialComposition.ts`, a pure metadata helper returning deterministic `v49-planetary-material-composition` information. The summary records target `closeup-body-material-depth`, asset policy `dev-refresh-prepared-local-runtime`, supported selected-body material profiles, atmosphere-depth profiles, terminator profiles, Saturn ring profile, preserved v41-v48 boundaries, and explicit non-claims for runtime pass/fail, AAA certification, WCAG certification, scientific certification, online validation, online asset completeness, asset completeness certification, and physics mutation.

The generated material asset path is local. `scripts/build-planet-materials-v49.py` reads existing local HD/2K planet maps and writes derived maps under `public/textures/planets/v49`, including Earth cloud alpha/night masks, roughness cues, Jupiter/Saturn band masks, Saturn ring color/alpha cues, and Sun/Mars/Moon fallback material maps. `planetTextureManifest` exposes those paths through `v49TextureManifestEntryForBodyId()` while retaining the existing HD and 2K fallback manifest functions.

The rendering work remains presentation-only. `SolarSystemBodies` lets selected Earth, Sun, Jupiter, Saturn, Mars and Moon prefer v49 local maps before falling back to HD/2K textures. `Planet` uses v49 profile props to reduce flat self-emission, keep Earth night lights constrained to the dark-side mask, use cloud alpha maps, add gas-giant band-mask contrast, and tune atmosphere/terminator cues. `SunBody` adds a v49 solar granulation depth uniform and restrained edge shell. Saturn rings keep the existing geometry but use v49 ring profile and local color/alpha cues to improve Cassini-gap readability.

Provenance is additive. Evidence Ledger and Validation Console expose planet materials, ring fidelity, Earth cloud layers and solar surface presentation boundaries.

DOM contracts: the page root exposes `data-atlas-planetary-material-composition-version="v49-planetary-material-composition"`, `data-atlas-planetary-material-target="closeup-body-material-depth"`, `data-atlas-planetary-material-asset-policy="dev-refresh-prepared-local-runtime"`, `data-atlas-selected-body-material-profile`, `data-atlas-selected-body-atmosphere-depth-profile`, `data-atlas-selected-body-terminator-profile`, `data-atlas-selected-body-ring-profile`, and `data-atlas-planetary-material-boundary`. Browser acceptance uses these markers alongside v35-v48 contracts, v41 focus/Axe/reduced-motion checks, desktop/mobile overflow checks, console/page-error capture, selected-body material profile checks, non-brittle close-up pixel budgets, and v49 local review images without committed golden snapshots.

This version is a local material/composition pass only. Runtime reads local `public/textures` and local catalog data only, does not claim online validation, online asset completeness, asset completeness certification, formal AAA art certification, WCAG certification, scientific certification, CI/runtime command status, full numerical relativity, Einstein field-equation solving, cosmological N-body, or physics mutation, and does not change `SolarSystemIntegrator`, `physicsEngine`, EIH 1PN dynamics, worker physics, stable panel ids, or the Kerr kernel id `eih-1pn+kerr-geodesic-v17`.

## v50 Cinematic Close-Up Director / 3A Subject Composition Layer

Orbit Atlas v50 adds `app/lib/atlasCinematicCloseupDirector.ts`, a pure metadata helper returning deterministic `v50-cinematic-closeup-director` information. The summary records target `aaa-inspired-closeup-subject-composition`, supported selected-body composition profiles, panel-avoidance profiles, Saturn ring-showcase profiles, quality budget `stable-high-fidelity`, local runtime asset source, preserved v41-v49 boundaries, and explicit non-claims for runtime pass/fail, Universe Sandbox clone status, AAA certification, WCAG certification, scientific certification, online validation, online catalog completeness, online asset completeness, and physics mutation.

The rendering work remains presentation-only. `UniversePage` derives active v50 root markers from the selected body: Earth uses `earth-limb-portrait`, Sun uses `solar-surface-portrait`, Jupiter and other gas giants use `gas-giant-band-portrait`, Saturn uses `saturn-ring-showcase`, and Moon/Mars use `lunar-mars-relief-portrait`. `UniverseScene` forwards those profiles to selected-body rendering and lets `CinematicSubjectFramingBridge` include the Saturn ring-showcase radius when writing subject-in-frame DOM markers.

Close-up body tuning remains local and visual. `Planet` uses the v50 composition profile to raise controlled gas-giant band fill and local contrast without turning the body into full self-emission. `SolarSystemBodies` expands and tilts Saturn's existing ring presentation profile, strengthens Cassini-gap readability, and keeps the work inside current ring geometry and shader/material layers. Ring camera distance is slightly widened for selected Saturn so the enlarged ring system stays in frame.

Provenance is additive. Evidence Ledger includes the informational `cinematic-closeup-director` passport. Validation Console includes the `cinematic-closeup-director` domain. Navigator keywords `closeup director`, `planet composition`, `saturn showcase`, `gas giant portrait`, and `subject composition` route through existing stable actions; no new panel id is introduced. Report Studio and Observatory Deck can surface the close-up composition target, profile set, panel-avoidance profile, ring showcase cue, asset policy, and trusted boundary as local presentation cues.

DOM contracts: the page root exposes `data-atlas-cinematic-closeup-director-version="v50-cinematic-closeup-director"`, `data-atlas-closeup-composition-target`, `data-atlas-closeup-composition-profile`, `data-atlas-closeup-panel-avoidance-profile`, `data-atlas-closeup-ring-showcase-profile`, `data-atlas-closeup-quality-budget`, `data-atlas-closeup-asset-policy`, and `data-atlas-cinematic-closeup-director-boundary`. Browser acceptance uses these markers alongside v35-v49 contracts, v41 focus/Axe/reduced-motion checks, desktop/mobile overflow checks, console/page-error capture, selected-body material profile checks, subject-in-frame checks, non-brittle close-up pixel budgets, and v50 local review images without committed golden snapshots.

This version is a local close-up composition pass only. Runtime reads local `public/textures` and local catalog data only, does not copy Universe Sandbox assets, does not claim a Universe Sandbox clone, online validation, online asset completeness, formal AAA art certification, WCAG certification, scientific certification, CI/runtime command status, full numerical relativity, Einstein field-equation solving, cosmological N-body, or physics mutation, and does not change `SolarSystemIntegrator`, `physicsEngine`, EIH 1PN dynamics, worker physics, stable panel ids, or the Kerr kernel id `eih-1pn+kerr-geodesic-v17`.

## v51 Cinematic Key-Light Director / 3A Phase Readability Layer

Orbit Atlas v51 adds `app/lib/atlasCinematicKeyLightDirector.ts`, a pure metadata helper returning deterministic `v51-cinematic-key-light-director` information. The summary records target `selected-body-readable-key-light-phase`, supported selected-body key-light profiles, quality budget `stable-high-fidelity`, local runtime asset source, preserved v41-v50 boundaries, and explicit non-claims for runtime pass/fail, Universe Sandbox clone status, AAA certification, WCAG certification, scientific certification, online validation, online catalog completeness, online asset completeness, and physics mutation.

The rendering work remains presentation-only. `UniversePage` derives active v51 markers from the selected body: overview uses `overview-natural-phase`, Earth uses `earth-cloud-night-key-balance`, Sun uses `solar-surface-edge-key`, Jupiter and the outer gas giants use `gas-giant-readable-key-fill`, Saturn uses `saturn-ring-key-fill`, and Moon/Mars use `lunar-mars-relief-key`. `UniverseScene` and `SolarSystemBodies` pass this profile into selected-body rendering without moving bodies, changing light-source physics, or altering integrators.

Close-up body tuning is limited to material and shader presentation. `Planet` uses the v51 gas-giant profile to apply a nonuniform phase-fill shader with limb and latitude weighting, so Jupiter/Saturn close-ups remain readable without becoming flat emissive spheres. The gas-band mask is used as a controlled local highlight layer instead of only a dark multiply pass. Saturn's existing ring geometry receives a slightly warmer key-fill cue while preserving the v49/v50 ring showcase contracts. `SunBody` reads the solar key-light profile to keep the edge glow restrained while maintaining photosphere structure.

Provenance is additive. Evidence Ledger includes the informational `cinematic-key-light-director` passport. Validation Console includes the `cinematic-key-light-director` domain. Navigator keywords `key light`, `phase director`, `planet phase`, `gas giant lighting`, `saturn lighting`, `ring exposure`, and `body key light` route through existing stable actions; no new panel id is introduced. Report Studio and Observatory Deck can surface the lighting target, gas-giant key-light profile, Saturn key-light profile, asset policy, quality budget, and trusted boundary as local presentation cues.

DOM contracts: the page root exposes `data-atlas-cinematic-key-light-director-version="v51-cinematic-key-light-director"`, `data-atlas-key-light-target`, `data-atlas-selected-body-key-light-profile`, `data-atlas-key-light-quality-budget`, `data-atlas-key-light-asset-policy`, and `data-atlas-cinematic-key-light-boundary`. Browser acceptance uses these markers alongside v35-v50 contracts, v41 focus/Axe/reduced-motion checks, desktop/mobile overflow checks, console/page-error capture, selected-body key-light profile checks, non-brittle close-up pixel budgets, and v51 local review images without committed golden snapshots.

This version is a local key-light and phase-readability pass only. Runtime reads local `public/textures` and local catalog data only, does not copy Universe Sandbox assets, does not claim a Universe Sandbox clone, online validation, online asset completeness, formal AAA art certification, WCAG certification, scientific certification, CI/runtime command status, full numerical relativity, Einstein field-equation solving, cosmological N-body, or physics mutation, and does not change `SolarSystemIntegrator`, `physicsEngine`, EIH 1PN dynamics, worker physics, stable panel ids, or the Kerr kernel id `eih-1pn+kerr-geodesic-v17`.

## v52 Planetary Depth Lighting / 3A Terminator And Ring-Shadow Layer

Orbit Atlas v52 adds `app/lib/atlasPlanetaryDepthLighting.ts`, a pure metadata helper returning deterministic `v52-planetary-depth-lighting` information. The summary records target `closeup-atmospheric-terminator-ring-depth`, supported selected-body depth-lighting profiles, quality budget `stable-high-fidelity`, local runtime asset source, preserved v41-v51 boundaries, and explicit non-claims for runtime pass/fail, Universe Sandbox clone status, AAA certification, WCAG certification, scientific certification, online validation, online catalog completeness, online asset completeness, and physics mutation.

The rendering work remains presentation-only. `UniversePage` derives active v52 markers from the selected body: overview uses `overview-no-depth-lighting`, Earth uses `earth-atmospheric-terminator-depth`, Sun uses `solar-granulation-limb-depth`, Jupiter and the outer gas giants use `gas-giant-banded-phase-depth`, Saturn uses `saturn-ring-shadow-depth`, and Moon/Mars use `airless-relief-terminator-depth`. `UniverseScene` and `SolarSystemBodies` pass this profile into selected-body rendering without moving bodies, changing light-source physics, or altering integrators.

Close-up body tuning is limited to material and shader presentation. `Planet` adds a nonphysical depth-lighting matte that uses the existing selected body, camera-facing normal and local sun-direction cue to darken terminators, preserve atmospheric rims, increase gas-band local depth, and place a subtle equatorial ring-shadow cue on Saturn. `SolarSystemBodies` forwards the Saturn profile into the existing ring shader for deeper Cassini/ring-layer readability, and `SunBody` uses the solar profile to strengthen granulation and limb depth while suppressing overexposed close-up halos.

Provenance is additive. Evidence Ledger includes the informational `planetary-depth-lighting` passport. Validation Console includes the `planetary-depth-lighting` domain. Navigator keywords `planet depth lighting`, `depth lighting`, `terminator depth`, `atmosphere rim`, `ring shadow`, `saturn ring shadow`, and `gas band depth` route through existing stable actions; no new panel id is introduced. Report Studio and Observatory Deck can surface the depth-lighting target, profile set, Saturn ring-shadow cue, asset policy, quality budget, and trusted boundary as local presentation cues.

DOM contracts: the page root exposes `data-atlas-planetary-depth-lighting-version="v52-planetary-depth-lighting"`, `data-atlas-depth-lighting-target`, `data-atlas-selected-body-depth-lighting-profile`, `data-atlas-depth-lighting-quality-budget`, `data-atlas-depth-lighting-asset-policy`, `data-atlas-depth-lighting-ring-shadow-cue`, and `data-atlas-planetary-depth-lighting-boundary`. Browser acceptance uses these markers alongside v35-v51 contracts, v41 focus/Axe/reduced-motion checks, desktop/mobile overflow checks, console/page-error capture, selected-body depth-lighting profile checks, non-brittle close-up pixel budgets, and v52 local review images without committed golden snapshots.

This version is a local depth-lighting and ring-shadow presentation pass only. Runtime reads local `public/textures` and local catalog data only, does not copy Universe Sandbox assets, does not claim a Universe Sandbox clone, online validation, online asset completeness, formal AAA art certification, WCAG certification, scientific certification, CI/runtime command status, full numerical relativity, Einstein field-equation solving, cosmological N-body, or physics mutation, and does not change `SolarSystemIntegrator`, `physicsEngine`, EIH 1PN dynamics, worker physics, stable panel ids, or the Kerr kernel id `eih-1pn+kerr-geodesic-v17`.

## v53 Planetary Color Grading / 3A Color And Gas-Layer Microcontrast

Orbit Atlas v53 adds `app/lib/atlasPlanetaryColorGrading.ts`, a pure metadata helper returning deterministic `v53-planetary-color-grading` information. The summary records target `closeup-planet-color-layer-depth`, supported selected-body color-grade profiles, quality budget `stable-high-fidelity`, local runtime asset source, preserved v41-v52 boundaries, and explicit non-claims for runtime pass/fail, Universe Sandbox clone status, AAA certification, WCAG certification, scientific certification, online validation, online catalog completeness, online asset completeness, and physics mutation.

The rendering work remains presentation-only. `UniversePage` derives active v53 markers from the selected body: overview uses `overview-neutral-color`, Earth uses `earth-ocean-cloud-color-depth`, Sun uses `solar-photosphere-color-depth`, Jupiter and the outer gas giants use `gas-giant-layer-color-grade`, Saturn uses `saturn-ring-occlusion-color-grade`, and Moon/Mars use `airless-regolith-color-depth`. `UniverseScene` and `SolarSystemBodies` pass this profile into selected-body rendering without moving bodies, changing light-source physics, or altering integrators.

Close-up body tuning is limited to material and shader presentation. `Planet` adds a subtle transparent color-grade layer that uses the existing selected body, camera-facing normal and local sun-direction cue to separate warm highlights from cool shadow, strengthen gas-giant band microcontrast, keep Earth cloud/ocean color restrained, and add a Saturn equatorial occlusion tone. `SolarSystemBodies` forwards the Saturn color profile into the existing ring shader for warmer ring highlights and darker body/ring occlusion cues. `SunBody` reads the solar color profile to deepen photosphere color structure while keeping close-up halo exposure restrained.

Provenance is additive. Evidence Ledger includes the informational `planetary-color-grading` passport. Validation Console includes the `planetary-color-grading` domain. Navigator keywords `planet color grade`, `color grading planet`, `gas layer color`, `saturn occlusion tone`, `earth color depth`, `jupiter color depth`, `行星调色`, `气态层流`, `土星遮挡色调`, and `木星色彩层次` route through existing stable actions; no new panel id is introduced. Report Studio and Observatory Deck can surface the color target, color-grade profile set, gas-layer cue, Saturn occlusion cue, asset policy, quality budget, and trusted boundary as local presentation cues.

DOM contracts: the page root exposes `data-atlas-planetary-color-grading-version="v53-planetary-color-grading"`, `data-atlas-color-grading-target`, `data-atlas-selected-body-color-grade-profile`, `data-atlas-color-grading-quality-budget`, `data-atlas-color-grading-asset-policy`, `data-atlas-color-grading-gas-layer-cue`, and `data-atlas-planetary-color-grading-boundary`. Browser acceptance uses these markers alongside v35-v52 contracts, v41 focus/Axe/reduced-motion checks, desktop/mobile overflow checks, console/page-error capture, selected-body color-grade profile checks, non-brittle close-up pixel budgets, and v53 local review images without committed golden snapshots.

This version is a local color-grading and gas-layer microcontrast presentation pass only. Runtime reads local `public/textures` and local catalog data only, does not copy Universe Sandbox assets, does not claim a Universe Sandbox clone, online validation, online asset completeness, formal AAA art certification, WCAG certification, scientific certification, CI/runtime command status, full numerical relativity, Einstein field-equation solving, cosmological N-body, or physics mutation, and does not change `SolarSystemIntegrator`, `physicsEngine`, EIH 1PN dynamics, worker physics, stable panel ids, or the Kerr kernel id `eih-1pn+kerr-geodesic-v17`.

## v54 Numerical Integrity Gate / Physics Audit Layer

Orbit Atlas v54 adds `app/lib/atlasNumericalIntegrity.ts`, a pure metadata and local-test helper returning deterministic `v54-numerical-integrity-gate` information. Runtime summary creation consumes only `SimulationDiagnostics | null`: existing `energyHistory`, `angMomHistory`, `relEnergyDrift`, and `relAngMomDrift` are classified into drift trends (`stable`, `watch`, `warning`, `insufficient-data`) and a local integrity status (`ready`, `watch`, `warning`, `informational`).

The helper also exposes deterministic local test utilities for timestep sensitivity, two-body time reversal, and unit/boundary audit. These fixtures use cloned arrays plus existing RK4 stepping and constants, and are only run by unit tests. They do not instantiate `SolarSystemIntegrator`, do not write runtime state, do not change `physicsEngine`, and do not alter EIH 1PN dynamics, worker physics, or Kerr behavior.

Provenance is additive. Evidence Ledger and Validation Console expose numerical integrity, timestep sensitivity, time reversal and conservation-drift evidence.

DOM contracts: the page root exposes `data-atlas-numerical-integrity-version="v54-numerical-integrity-gate"`, `data-atlas-numerical-integrity-status`, `data-atlas-energy-drift-trend`, `data-atlas-angular-momentum-drift-trend`, `data-atlas-timestep-sensitivity-coverage`, `data-atlas-time-reversal-coverage`, `data-atlas-unit-audit-coverage`, and `data-atlas-numerical-integrity-boundary`. Browser acceptance verifies these markers alongside v35-v53 contracts, the preserved Kerr kernel id `eih-1pn+kerr-geodesic-v17`, desktop/mobile overflow checks, console/page-error capture, and the v41 focus/Axe/reduced-motion gate.

This version is a local numerical-integrity audit layer only. Runtime UI does not run heavy benchmarks and does not claim the latest command result, CI certification, scientific certification, online validation, online completeness, new physics, full numerical relativity, Einstein field-equation solving, cosmological N-body, or physics mutation. `SolarSystemIntegrator`, `physicsEngine`, EIH 1PN dynamics, worker physics, stable panel ids, and Kerr kernel behavior remain unchanged.

## v55 Cinematic Planetary Art Direction / 3A Planet And Backdrop Composite Layer

Orbit Atlas v55 adds `app/lib/atlasCinematicPlanetaryArtDirection.ts`, a pure metadata helper returning deterministic `v55-cinematic-planetary-art-direction` information. The summary records reference mode `universe-sandbox-inspired-local-comparison`, quality target `aaa-inspired-scientific-space-simulation`, asset policy `dev-refresh-prepared-local-runtime`, selected-body art profiles for gas giants, Saturn rings, Earth cloud/night treatment, solar surface treatment, global color grading, background art grading, and explicit non-claims for runtime pass/fail, Universe Sandbox clone status, AAA certification, WCAG certification, scientific certification, online validation, online asset completeness, asset-completeness certification, and physics mutation.

The generated art-direction asset path is local. `scripts/build-planetary-art-v55.py` writes small derived auxiliary maps under `public/textures/planets/v55`, including Earth cloud/night masks, gas-band contrast cues, Saturn ring opacity/Cassini cues, a sky-noise matte support map, and a local cinematic color LUT placeholder. Runtime rendering reads only prepared local `public/textures` assets and local catalog data.

The rendering work remains presentation-only. `UniversePage` derives active v55 root markers from the selected body and forwards the resulting profiles through `UniverseScene` into `ScienceBackdrop`, `GalaxyEnvironmentSphere`, `Planet`, `SunBody`, `SolarSystemBodies`, and the post-FX gates. Earth uses a cleaner cloud/night profile with dark-side-constrained city lights and thinner atmosphere. Jupiter and Saturn use stronger band-local contrast and controlled low-light fill without full-sphere self-emission. Saturn rings keep existing geometry while adding layered opacity, Cassini readability, and restrained backlit edge tone. The Sun keeps the existing procedural shader while lowering overexposed halo and increasing granulation/edge structure. Global grading uses a cooler deep-space floor, lower bloom, controlled vignette, planet highlight protection, and background star-noise restraint.

Provenance is additive. Evidence Ledger and Validation Console expose planetary art direction, gas-giant bands, Saturn rings, Earth night layers and global grading.

DOM contracts: the page root exposes `data-atlas-cinematic-planetary-art-version="v55-cinematic-planetary-art-direction"`, `data-atlas-cinematic-art-reference-mode`, `data-atlas-cinematic-art-quality-target`, `data-atlas-cinematic-art-asset-policy`, `data-atlas-selected-body-gas-giant-art-profile`, `data-atlas-selected-body-saturn-ring-art-profile`, `data-atlas-selected-body-earth-cloud-night-profile`, `data-atlas-selected-body-solar-surface-profile`, `data-atlas-global-color-grade-profile`, `data-atlas-background-art-grade-profile`, and `data-atlas-cinematic-planetary-art-boundary`. Browser acceptance uses these markers alongside v35-v54 contracts, the preserved Kerr kernel id `eih-1pn+kerr-geodesic-v17`, desktop/mobile overflow checks, console/page-error capture, v41 focus/Axe/reduced-motion checks, selected-body art profile checks, non-brittle pixel budgets, and v55 local screenshot review without committed golden snapshots.

This version is a local visual art-direction pass only. Runtime reads local `public/textures` and local catalog data only, does not copy Universe Sandbox assets, does not claim a Universe Sandbox clone, online validation, online asset completeness, formal AAA art certification, WCAG certification, scientific certification, CI/runtime command status, full numerical relativity, Einstein field-equation solving, cosmological N-body, or physics mutation, and does not change `SolarSystemIntegrator`, `physicsEngine`, EIH 1PN dynamics, worker physics, stable panel ids, or the Kerr kernel id `eih-1pn+kerr-geodesic-v17`.

## v56 Cinematic Deep-Space Backdrop Reconstruction / 3A Background Layer

Orbit Atlas v56 adds `app/lib/atlasCinematicDeepSpaceBackdrop.ts`, a pure metadata helper returning deterministic `v56-cinematic-deep-space-backdrop` information. The summary records reference mode `universe-sandbox-inspired-local-comparison`, source policy `nasa-svs-prepared-local-runtime`, sky manifest `orbit-atlas-v56`, overview and close-up starfield/nebula/negative-space profiles, preserved v41-v55 boundaries, and explicit non-claims for runtime pass/fail, Universe Sandbox clone status, AAA certification, WCAG certification, scientific certification, online validation, online asset completeness, asset-completeness certification, and physics mutation.

The generated sky asset path stays inside the existing sky pipeline. `scripts/build-universe-sandbox-sky.py` keeps v9 and v48 outputs as fallback, caches NASA SVS `milkyway_2020_8k.exr`, `hiptyc_2020_8k.exr`, and `starmap_random_2020_8k_gal.exr` during development, and writes `orbit-atlas-v56-base-8k.jpg`, `orbit-atlas-v56-base-4k.jpg`, `orbit-atlas-v56-stars-4k.jpg`, `orbit-atlas-v56-stars-2k.jpg`, `orbit-atlas-v56-dust-2k.jpg`, `orbit-atlas-v56-nebula-haze-2k.jpg`, and `orbit-atlas-v56-negative-space-2k.jpg` under `public/textures/sky`. Runtime rendering reads only prepared local `public/textures` assets and does not download or validate online assets.

The rendering work remains presentation-only. `ORBIT_ATLAS_SKY` now points at `ORBIT_ATLAS_V56_SKY`, while v48 and v9 constants stay available as fallbacks. `GalaxyEnvironmentSphere` samples base, sparse-star, dust, nebula-haze, and negative-space layers, then remaps close-up star opacity and subject-matte contrast to reduce white-noise star walls behind Earth, Sun, Jupiter, and Saturn. `ScienceBackdrop` forwards the active v56 profiles from `UniversePage` into the sky shader. This only changes shader uniforms, local textures, exposure, and composition; it does not move bodies, change camera physics, change mass/velocity state, or alter the EIH 1PN and worker physics paths.

Provenance is additive. Evidence Ledger and Validation Console expose the deep-space source policy, sky manifest, starfield, nebula and negative-space profiles.

DOM contracts: the page root exposes `data-atlas-cinematic-deep-space-backdrop-version="v56-cinematic-deep-space-backdrop"`, `data-atlas-cinematic-backdrop-reference-mode`, `data-atlas-cinematic-backdrop-source-policy`, `data-atlas-cinematic-backdrop-sky-manifest`, `data-atlas-cinematic-backdrop-starfield-profile`, `data-atlas-cinematic-backdrop-nebula-profile`, `data-atlas-cinematic-backdrop-negative-space-profile`, and `data-atlas-cinematic-backdrop-boundary`. Browser acceptance verifies these markers alongside v35-v55 contracts, the preserved Kerr kernel id `eih-1pn+kerr-geodesic-v17`, desktop/mobile overflow checks, console/page-error capture, v41 focus/Axe/reduced-motion checks, selected-body close-up profile checks, non-brittle background pixel budgets, and v56 local screenshot review without committed golden snapshots.

This version is a local visual backdrop pass only. Runtime reads local `public/textures` and local catalog data only, does not copy Universe Sandbox assets, does not claim a Universe Sandbox clone, online validation, online asset completeness, formal AAA art certification, WCAG certification, scientific certification, CI/runtime command status, full numerical relativity, Einstein field-equation solving, cosmological N-body, or physics mutation, and does not change `SolarSystemIntegrator`, `physicsEngine`, EIH 1PN dynamics, worker physics, stable panel ids, or the Kerr kernel id `eih-1pn+kerr-geodesic-v17`.

## v125-v130 Data, Material and Relativity Architecture

The v125 universal search path separates alias postings from document storage. A normalized two-character prefix loads one small posting shard, and only the document range shards containing matched IDs are fetched. Exact Gaia source IDs retain a source-range path. HYG-to-Gaia joins use HIP and Gaia DR3 external-catalogue best-neighbour rows only; no fuzzy positional merge runs in the build or browser.

The v126 texture pipeline is reproducible and project-local. `bootstrap-ktx-tools.ps1` pins Khronos KTX-Software 4.4.2 with URL, SHA-256 and Apache-2.0 metadata. `optimize-planet-textures-v2.ps1` is resumable, runs one input at a time with two encoder threads, excludes V9 sky and writes a checksum manifest. `KTX2Loader` is limited to one transcoder worker and automatically falls back to source JPG/PNG.

The v127 exoplanet runtime loads the manifest, resolves a system ID to one shard, and mounts only that system scene. URL state uses `?system=<id>` and popstate restoration. Orbit geometry never fills missing measurements with hidden fake values: inferred semimajor axes, unknown eccentricities, display orientations and display phases retain distinct provenance.

`RelativityForceModelV2` is an additive SI shadow model. It evaluates the existing EIH 1PN acceleration unchanged, then compares a solar test-particle 2PN harmonic-coordinate monopole and arbitrary-axis Lense-Thirring term. The solar pole is fixed in J2000 and the relative correction is distributed to preserve linear momentum. No V2 value is written into `SolarSystemIntegrator` or the physics Worker.

The v129 Kerr phase-space module uses separated Boyer-Lindquist equations in Mino parameter for null and timelike test particles. It tracks energy E, axial angular momentum Lz, Carter Q, Hamiltonian drift, horizon capture and escape/turning classifications. The renderer is isolated from N-body state. Its procedural disk and photon ring are a bounded display model rather than radiative-transfer or GRMHD output.

The v130 promotion function is intentionally fail-closed. Its historical compatibility markers retain `blocked-shadow-retained`, `legacy-eih-1pn` as the default and `relativity-force-model-v2` as the shadow kernel. V5 records the absolute gates; V6 separately requires demonstrated improvement and independent per-body evidence. Those V6 requirements are not currently met, so no promotion action is permitted.

## v110-v113 Visible UX and Scientific Core Visibility Track

v110 adds `v110-critical-ui-relativity-visibility-lock` and profile `v110-visible-chinese-copy-relativity-core-entry`. It is a visible UI and observability pass: bottom controls, Launch Control, Navigator and Relativity Observable Atlas expose cleaned Chinese copy and a direct `相对论核心` entry. The core panel summarizes existing EIH 1PN, DP5(4)/RK4, Mercury precession, Shapiro delay, light deflection, Kerr ISCO, Hamiltonian drift and the trusted scientific boundary.

### v111 Camera Close-up & Stellar Portrait

v111 adds `v111-camera-stellar-closeup-lock` and profile `v111-camera-rig-stellar-portrait-closeup`. `UniverseScene` preserves user orbit/zoom distance while target anchors move, and selected Gaia/local stars render `StellarPortrait` close-ups from BP-RP, G magnitude and parallax presentation material. This remains a catalog-derived visual portrait, not a resolved stellar-surface claim.

### v112 Launch Gameplay & OpenRocket Import Bridge

v112 adds `v112-launch-gameplay-openrocket-bridge-lock` and profile `v112-mission-scene-openrocket-import-bridge`. `LaunchSceneView` exposes mission-scene HUD markers, deterministic launch visual profiles for LEO satellite, SLS/Artemis and Mars cargo, a larger rocket/satellite stack, service tower, Max-Q cue and satellite deployment cue. `openRocketImportBridge.ts` imports user-provided `.ork` text or OpenRocket CSV/JSON exports toward local `public/data/openrocket/*.json`; the browser never starts `D:\86137\OpenRocket\OpenRocket.exe`.

v113 adds `v113-scientific-model-upgrade-contract` and profile `v113-fixture-budget-comparison-rollback-plan`. It defines fixtures, error budgets, baseline/shadow/candidate/reference comparison and rollback requirements for a future scientific upgrade. It is contract-only and does not modify scientific gates, fixtures, live physics, worker physics, RK4/DP, EIH 1PN, Kerr, V9 sky/background, v75 budgets, v97 Gaia budgets or v99 opacity caps.

## v114 Visual Launch Performance Upgrade

v114 adds `v114-visual-launch-performance-lock` and profile `v114-scene-director-runtime-quality`. It is a presentation-layer upgrade for visible launch copy, launch sequence staging and runtime quality scheduling. `LaunchSequenceDirector` names Prelaunch, Liftoff, Max-Q, Stage separation/Fairing, Coast/Insertion and Payload deploy phases; `LaunchSceneView` exposes runtime markers for quality tier, director phase, plume budget, telemetry source and OpenRocket import status.

## v115 Runtime Scene Isolation & Focus Latency

v115 adds `v115-runtime-scene-focus-performance-lock` and profile `v115-scene-isolation-telemetry-focus-latency`. `AtlasSceneMode` is derived in `UniversePage` and passed into R3F. Launch mode mounts only `LaunchRuntimeScene` and `LaunchSceneView`; atlas catalog subscriptions, `ScienceBackdrop`, solar-system layers and nonessential DOM/HUD panels are outside that subtree.

Launch telemetry no longer drives a 250 ms page tick. `LaunchTelemetrySubscriber` owns its snapshot state, reads `localTelemetryRef`, and schedules updates using `getAtlasRuntimeQualityProfile(tier).hudUpdateMs`. `UniverseCanvas` uses shallow simulation-prop equality to suppress unrelated parent renders.

Camera focus durations use viewport-aware bounds: desktop 700-1000 ms, mobile 900-1200 ms, and 900 ms when viewport input is unavailable. The camera bridge caches the Browser QA marker root once per mount and throttles changed marker values to 120 ms while preserving manual control override, locked zoom, origin/Escape reset and launch Escape abort.

The focused command is `npm run test:atlas:runtime-scene-focus-performance`. The lock is presentation-runtime-only and preserves scientific gates, fixtures, live/worker physics, RK4/DP, EIH 1PN, Kerr, V9 sky/background and v75/v97/v99 budgets.

## v116 Offline Stellar Search Catalog V2

v116 introduces `v116-offline-stellar-search-catalog-v2` with profile `v116-100k-sharded-worker-alias-search`. The offline build command queries Gaia DR3 into 16 deterministic source-ID shards totaling 100,000 searchable rows and records checksums and provenance in `public/data/stellar-search/manifest.json`.

The browser Worker owns manifest and shard loading, uses monotonically increasing request IDs, and ignores stale results in the client hook. Exact Gaia source IDs select one shard; offline cross-identification aliases support catalog names such as HD and HIP. A failed manifest or shard returns `query-error`; the main navigator continues to use the existing 5,000-row Gaia and curated catalogs.

Search-only records are converted to a temporary Gaia index entry only for selection and derived portrait presentation. This does not add them to the rendered starfield. The v97 `1000/1800/3000` render budgets, scientific core, fixtures, live/worker physics, integrators, Kerr and V9 sky remain frozen. Focused verification is `npm run test:atlas:stellar-search-catalog-v2`.

## v117 Scientific Cinematic Art Direction

`v117-scientific-cinematic-art-lock` uses a single `StellarPortraitMaterial` shader for selected local and Gaia stars. The fragment model combines deterministic 3D value noise, granulation, activity-dependent spots, limb darkening and a chromatic rim derived from the existing catalog material profile. It replaces the previous stack of basic transparent spheres and torus rings.

`StellarPortraitProfile` records temperature, seed, granulation scale, activity, spot coverage and limb darkening under the explicit `gaia-derived-presentation-not-resolved-surface` classification. The Passport exposes portrait, spectrum and data tabs. The shader and metadata stay below the 8 MB common-material budget and do not modify sky/background or Gaia opacity/render budgets. Verify with `npm run test:atlas:scientific-cinematic-art`.

## v118 Launch Scene Reconstruction & OpenRocket Replay

`v118-launch-scene-openrocket-replay-lock` removes the launch mission HUD from R3F world-space HTML and publishes a fixed DOM overlay from the isolated telemetry subscriber. The extended director is additive to the v114 compatibility function and covers ignition, tower clear, Max-Q, MECO/separation, coast, insertion and payload deployment.

Official NASA 3D resources are downloaded only by `optimize:spacecraft-assets`, converted to local GLB where necessary, and recorded with URL, usage policy, byte size and SHA-256. SLS is the initial launch asset; Orion, CubeSat and the 66 MB Gateway model are deferred, keeping initial transfer below 25 MB.

`OpenRocketReplayManifest` fixes vehicle, stages, events, telemetry, SI units, source and checksum fields. `import:openrocket` opens `.ork` ZIP design XML with a structured parser and accepts comma, semicolon or tab telemetry exports. Runtime consumes generated local JSON only and never starts `OpenRocket.exe`. Focused verification is `npm run test:atlas:launch-scene-openrocket-replay`.

## v119 Visual Integration & Release Gate

`v119-visual-integration-release-gate` defines eight deterministic review scenes and a passive `AtlasRuntimePerformanceProbe`. The probe samples animation-frame deltas and browser Long Tasks, then writes median FPS, P95 frame time, maximum long task, under-50-ms ratio and sample count to the cached Atlas root at 1 Hz.

The target baseline is 55 FPS for desktop overview, 45 FPS for desktop close-up/launch, 30 FPS for mobile-safe, mobile P95 frame time at most 50 ms, and no selection task above 100 ms. CI captures these metrics as observational evidence; absolute FPS is enforced only on a named hardware-accelerated runner. The release contract also exposes 35-55% close-up subject coverage and fixed-overlay safe-area policies without changing rendering or scientific budgets.

The quality governor selects `balanced`, `mobile-safe`, `launch-cinematic` or `closeup-inspect`. It controls label density, particle budget, HUD cadence, nonessential layer visibility and launch visual detail only. It does not change v75/v97/v99 budgets or scientific/runtime physics. OpenRocket remains offline import only for `.ork`, CSV or JSON data; the browser does not start `D:\86137\OpenRocket\OpenRocket.exe` or drive the GUI.

DOM contracts: the page root and Relativity Observable Atlas expose `data-atlas-critical-ui-relativity-visibility-*`, `data-atlas-camera-stellar-closeup-*`, `data-atlas-launch-gameplay-openrocket-bridge-*`, `data-atlas-scientific-model-upgrade-contract-*` and `data-atlas-visual-launch-performance-*` markers. Evidence Ledger includes `critical-ui-relativity-visibility-lock`, `camera-stellar-closeup-lock`, `launch-gameplay-openrocket-bridge-lock`, `scientific-model-upgrade-contract` and `visual-launch-performance-lock`; Validation Console exposes matching domains. Focused verification commands are `npm run test:atlas:critical-ui-relativity-visibility`, `npm run test:atlas:camera-stellar-closeup`, `npm run test:atlas:launch-gameplay-openrocket-bridge` and `npm run test:atlas:visual-launch-performance`.

## v102 Maintenance Evidence Index

### Maintenance Evidence Index / Repo Hygiene

Orbit Atlas v102 adds `app/lib/atlasMaintenanceEvidenceIndex.ts`, a deterministic v93-v101 maintenance evidence and repo hygiene index. Its version is `v102-maintenance-evidence-index` and its profile is `v102-v93-v101-maintenance-evidence-index`.

`npm run test:atlas:maintenance-evidence-index` reuses the v101 heavy audit, then statically audits focused command coverage, maintenance verification entrypoints, browser screenshot artifact paths, Browser QA evidence, docs/surfaces, dirty worktree policy, Windows Watchpack noise policy and protected mutation flags. `npm run verify:atlas:maintenance-evidence` runs the v102 audit before `npm run verify:atlas:browser-resource`. Runtime UI exposes deterministic metadata with default status `pending-runtime-run`; it does not claim the latest external command result.

The dirty worktree policy identifier is `no-reset-no-revert-no-clean-no-stage-no-commit`. v102 does not reset, revert, clean, stage or commit the dirty worktree. Only `scoped implementation files` may be staged later after an explicit user request.

Windows Watchpack messages referencing `DumpStack.log.tmp` or `pagefile.sys` are classified as `known non-failure noise`, `not app console error`, and `not Playwright failure`. The policy records environment stderr noise without changing Next.js or webpack configuration.

Browser QA policy is `root-observable-evidence-validation-console-errors-zero-teardown-clear`: root, Observable Atlas, Evidence Ledger and Validation Console markers must exist, console errors must remain zero, and 3015/3016 must have no listener after teardown.

The artifact index locks these screenshot directory contracts: `test-results/v93-scientific-gate-release-evidence/`, `test-results/v94-browser-ci-stability-lock/`, `test-results/v95-release-artifact-manifest-lock/`, `test-results/v97-gaia-starfield-enhancement/`, `test-results/v98-relativity-simulation-optimization/`, `test-results/v99-art-polish/`, `test-results/v100-post-enhancement-maintenance-baseline/`, `test-results/v101-browser-resource-performance-lock/`, and `test-results/v102-maintenance-evidence-index/`.

Protected mutations remain `not-applied` for scientific gates, Horizons fixtures, live runtime physics, worker physics, RK4/DP, EIH 1PN, Kerr kernel id, v75 budgets, V9 sky/background direction, v97 Gaia budgets, v99 opacity caps, screenshot thresholds, release packaging and certification claims.

Evidence Ledger includes `maintenance-evidence-index`, Validation Console includes the matching domain, the page root exposes v102 DOM markers, Relativity Observable Atlas renders the v102 strip/table, and browser acceptance captures v102 desktop/mobile screenshots.

## v103 Presentation Runtime Performance Lock

Orbit Atlas v103 adds `app/lib/atlasPresentationRuntimePerformanceLock.ts`, a presentation runtime performance lock over v102. Its version is `v103-presentation-runtime-performance-lock` and its profile is `v103-gaia-constellation-label-runtime-cost`.

`npm run test:atlas:presentation-runtime-performance` reuses the v102 heavy audit, then statically audits `package.json`, README and Technical Overview docs, root DOM markers, Observable Atlas markers, Evidence claim text, Validation domain text, browser acceptance markers, Gaia runtime write dedupe, constellation material write dedupe, label DOM/visibility write dedupe, frozen budgets and protected mutation flags. It does not read the network, start a browser, generate fixtures, create a release archive or reduce browser QA cost.

`npm run verify:atlas:presentation-runtime` first runs the v103 heavy audit, then runs `npm run verify:atlas:maintenance-evidence`. `test:atlas` only includes the lightweight v103 contract test.

The allowed optimization is presentation runtime performance only. Gaia keeps the v97 Gaia budgets `1000/1800/3000` and v99 opacity caps `0.62/1.05/1.20/0.18`, while avoiding repeated identical uniform writes and using static instance color/size attributes. Constellation lines keep their existing opacity formulas and values while gating repeated visible/material writes by a frame signature. Body and catalog labels keep label counts, labelBudget, distance fades, occlusion logic and visual thresholds while deduping DOM style and visibility writes.

Frozen thresholds remain unchanged: v97 Gaia budgets, v99 opacity caps, v75 budgets, browser screenshot thresholds, screenshot retry count, and pixel settle/retry policy. v103 is not a browser acceptance runtime cost reduction, not a scientific model upgrade, not a fixture update, not a visual budget change, not a sky replacement, not release packaging and not official certification.

Protected mutations remain `not-applied` for browser acceptance cost, runtime performance budget mutation, live runtime physics, worker physics, RK4/DP, EIH 1PN, Kerr kernel id, Horizons fixtures, v75 budgets, V9 sky/background direction, v97 Gaia budgets, v99 opacity caps, release packaging and certification claims.

Evidence Ledger includes `presentation-runtime-performance-lock`, Validation Console includes the matching domain, the page root exposes v103 DOM markers, Relativity Observable Atlas renders the v103 strip/table, and browser acceptance writes v103 screenshots under `test-results/v103-presentation-runtime-performance-lock/`.

## v104 Browser Acceptance Runtime Cost Lock

Orbit Atlas v104 adds `app/lib/atlasBrowserAcceptanceRuntimeCostLock.ts`, a browser acceptance runtime cost lock over v103. Its version is `v104-browser-acceptance-runtime-cost-lock` and its profile is `v104-fresh-browser-acceptance-cost-review`.

`npm run test:atlas:browser-acceptance-runtime-cost` reuses the v103 heavy audit, then statically audits `package.json`, README and Technical Overview docs, root DOM markers, Observable Atlas markers, Evidence claim text, Validation domain text, browser acceptance screenshot default/full-review manifests, fresh teardown, console/page-error checks, frozen browser thresholds and protected mutation flags. It does not read the network, start a browser, generate fixtures, create a release archive or change physics.

`npm run verify:atlas:browser-acceptance-runtime` first runs the v104 heavy audit, then runs `npm run test:atlas:browser:fresh`. `test:atlas` only includes the lightweight v104 contract test.

The allowed optimization is browser acceptance screenshot workload splitting only. Default `npm run test:atlas:browser:fresh` keeps desktop/mobile acceptance, root/Observable/Evidence/Validation markers, console/page-error zero checks, 3015 teardown, screenshot retry, pixel settle and pixel thresholds, but captures only current/core screenshots plus v102/v103/v104 key regression tables. Mobile default artifacts keep visual sampling screenshots and skip nonessential historical/table screenshots unless full review is enabled. `npm run test:atlas:browser:fresh:review` sets `ATLAS_BROWSER_REVIEW_SCREENSHOTS=1` and captures the full v93-v104 historical review screenshot set.

Frozen thresholds remain unchanged: v97 Gaia budgets, v99 opacity caps, v75 budgets, browser screenshot thresholds, screenshot retry count and pixel settle/retry policy. v104 is not a scientific model upgrade, not a fixture update, not a visual budget change, not a sky replacement, not release packaging and not official certification.

Protected mutations remain `not-applied` for runtime performance budget mutation, live runtime physics, worker physics, RK4/DP, EIH 1PN, Kerr kernel id, Horizons fixtures, v75 budgets, V9 sky/background direction, v97 Gaia budgets, v99 opacity caps, release packaging and certification claims.

Evidence Ledger includes `browser-acceptance-runtime-cost-lock`, Validation Console includes the matching domain, the page root exposes v104 DOM markers, Relativity Observable Atlas renders the v104 strip/table, and browser acceptance writes default v104 screenshots under `test-results/v104-browser-acceptance-runtime-cost-lock/`. Windows Watchpack `DumpStack.log.tmp` and `pagefile.sys` messages remain known non-failure dev-server noise when fresh browser acceptance exits 0.

## v105 Final Gaia Art Enhancement Lock

Orbit Atlas v105 adds `app/lib/atlasFinalGaiaArtEnhancementLock.ts`, a budget-preserved Gaia art enhancement lock over v104. Its version is `v105-final-gaia-art-enhancement-lock` and its profile is `v105-budget-preserved-gaia-art-polish`.

`npm run test:atlas:final-gaia-art-enhancement` reuses the v104 heavy audit, then statically audits deterministic Gaia ranking, Gaia brightness/color mapping, constellation/nebula readability markers, Browser QA markers, README and Technical Overview text, root DOM markers, Observable Atlas markers, Evidence claim text, Validation domain text, frozen budget boundaries and protected mutation flags. It does not read the network, start a browser, generate fixtures, create a release archive or change physics.

`npm run verify:atlas:final-gaia-art` first runs the v105 heavy audit, then runs `npm run verify:atlas:browser-acceptance-runtime`. `test:atlas` only includes the lightweight v105 contract test.

The allowed optimization is budget-preserved presentation/data polish. `GaiaStarField` uses deterministic `deterministic-bright-near-color-spread-sky-binned` ranking before applying the existing v97 `1000/1800/3000` render budgets, so the default overlay never renders the full 5000-row Gaia catalog. The Gaia brightness/color mapping is presentation-only and does not claim physical photometric calibration.

Frozen thresholds remain unchanged: v97 Gaia budgets `1000/1800/3000`, v99 opacity caps `0.62/1.05/1.20/0.18`, v75 budgets, browser screenshot thresholds, screenshot retry count and pixel settle/retry policy. v105 is not a scientific model upgrade, not a fixture update, not a sky replacement, not release packaging and not official certification.

Protected mutations remain `not-applied` for live runtime physics, worker physics, RK4/DP, EIH 1PN, Kerr kernel id, Horizons fixtures, v75 budgets, V9 sky/background direction, v97 Gaia budgets, v99 opacity caps, release packaging and certification claims.

Evidence Ledger includes `final-gaia-art-enhancement-lock`, Validation Console includes the matching domain, the page root exposes v105 DOM markers, Relativity Observable Atlas renders the v105 strip/table, and browser acceptance writes v105 screenshots under `test-results/v105-final-gaia-art-enhancement-lock/`. Boundary language states that this is not full Gaia archive coverage and not Gaia/NASA/JPL official certification.

## v106 Release Candidate Evidence Closure Lock

Orbit Atlas v106 adds `app/lib/atlasRcEvidenceClosureLock.ts`, a release-candidate evidence closure lock over v105. Its version is `v106-release-candidate-evidence-closure-lock` and its profile is `v106-v93-v105-final-rc-evidence-closure`.

`npm run test:atlas:rc-evidence-closure` reuses the v105 heavy audit, then statically audits `package.json`, README and Technical Overview docs, root DOM markers, Observable Atlas markers, Evidence claim text, Validation domain text, browser acceptance markers, v93-v105 command matrix coverage, browser screenshot artifact directory contracts, dirty worktree policy, Windows Watchpack known non-failure noise and protected mutation flags. It does not read the network, start a browser, generate fixtures, create a release archive, stage files, commit files or change physics.

`npm run verify:atlas:rc-evidence` first runs the v106 heavy audit, then runs `npm run verify:atlas:final-gaia-art`. `test:atlas` only includes the lightweight v106 contract test.

The command matrix indexes v93-v105 focused audits plus `verify:atlas:final-gaia-art`, `verify:atlas:browser-acceptance-runtime`, `verify:atlas:scientific` and `verify:atlas:rc-evidence`. The screenshot artifact index locks these directories: `test-results/v93-scientific-gate-release-evidence/`, `test-results/v94-browser-ci-stability-lock/`, `test-results/v95-release-artifact-manifest-lock/`, `test-results/v97-gaia-starfield-enhancement/`, `test-results/v98-relativity-simulation-optimization/`, `test-results/v99-art-polish/`, `test-results/v100-post-enhancement-maintenance-baseline/`, `test-results/v101-browser-resource-performance-lock/`, `test-results/v102-maintenance-evidence-index/`, `test-results/v103-presentation-runtime-performance-lock/`, `test-results/v104-browser-acceptance-runtime-cost-lock/`, and `test-results/v105-final-gaia-art-enhancement-lock/`.

Dirty worktree policy remains `no-reset-no-revert-no-clean-no-stage-no-commit`; release archive creation, staging and commit mutations remain `not-applied`. Windows Watchpack `DumpStack.log.tmp` and `pagefile.sys` messages remain known non-failure dev-server noise, not app console error and not Playwright failure when fresh browser acceptance exits 0.

Protected mutations remain `not-applied` for live runtime physics, worker physics, RK4/DP, EIH 1PN, Kerr kernel id, Horizons fixtures, v75 budgets, V9 sky/background direction, v97 Gaia budgets, v99 opacity caps, release archive creation, release packaging, staging, commits and certification claims. v106 is not a release archive, not release packaging, not a scientific model upgrade, not a fixture update, not a sky replacement and not official certification.

Evidence Ledger includes `release-candidate-evidence-closure-lock`, Validation Console includes the matching domain, the page root exposes v106 DOM markers, Relativity Observable Atlas renders the v106 strip/table, and browser acceptance writes v106 screenshots under `test-results/v106-release-candidate-evidence-closure-lock/`.

## v107 Interaction & Catalog Completion Lock

v107 introduces one presentation-layer focus coordinator for body, celestial-direction and origin commands. It snapshots the current camera pose, applies bounded `1200-1800ms` smootherstep interpolation, accepts a new target from the current in-flight pose, and cancels direction focus before overview reset. Gaia direction focus is a celestial presentation target, not a physical stellar flyby.

Orbit Atlas exposes the existing Launch Control through a Rocket entry. The `leo_satellite` profile uses the existing local launch physics and `SPACECRAFT_BODY_INDEX` handoff with a 550 km, 53 degree, approximately 1200 kg payload configuration; it does not add an N-body particle, TLE service or worker-physics branch.

The packaged Gaia bright-5000 JSON is loaded through a shared client store. A deterministic index supports source-id and known-name search with a minimum two-character query and maximum 12 Gaia results. Labels use fixed desktop/mobile budgets `24/8`, retain the selected target, and collapse to selected-only in closeup. Gaia point budgets `1000/1800/3000` and v99 opacity caps remain frozen.

The constellation source remains the complete 88-entry IAU guide catalog. A separate label layer exposes a bounded subset without increasing line geometry. The local curated nebula marker catalog contains 80 entries after 21 offline presentation additions.

`npm run test:atlas:interaction-catalog-completion` reuses the v106 heavy audit. `npm run verify:atlas:interaction-catalog` runs v107 first and then the v106 verification chain. Root DOM, Relativity Observable Atlas, Evidence Ledger and Validation Console expose `interaction-catalog-completion-lock`; browser acceptance writes `test-results/v107-interaction-catalog-completion-lock/`.

Protected boundaries remain unchanged: no scientific gate or fixture update, no live/worker physics, RK4/DP, EIH 1PN or Kerr mutation, no V9 sky/background replacement, no Gaia render-budget or opacity-cap increase, and no release archive, staging or commit.

## v108 Interaction Repair & Launch UX Upgrade Lock

v108 separates real-body focus from catalog/Gaia sky focus. Real Solar System targets continue following their physical positions, while a selected catalog or Gaia record creates a deterministic visual proxy at the existing sky-direction scene radius. The proxy is presentation-only, remains visible independently of the Gaia overlay budget, and provides a stable target for camera-distance zoom.

The focus bridge preserves native OrbitControls wheel distance during body locks and clamps sky-target zoom to the existing camera distance range. Bottom-bar zoom uses the same bounded distance model. Passport exit, reset and `Escape` cancel both target classes and return through the existing overview transition.

Launch Control defaults to the existing `leo_satellite` mission and adds mission cards, an orbit/payload/inclination/site summary, countdown, phase timeline and abort/reset visibility. It continues to reuse the local launch simulator and `SPACECRAFT_BODY_INDEX` handoff; no N-body object, worker path or integrator branch is added.

`npm run test:atlas:interaction-repair-launch-ux` reuses the v107 heavy audit and verifies the proxy, zoom, body-lock, launch UX, docs/surface and protected-mutation contracts. `npm run verify:atlas:interaction-repair-launch-ux` then runs the v107 verification chain. Root DOM, Relativity Observable Atlas, Evidence Ledger and Validation Console expose `interaction-repair-launch-ux-lock`; browser acceptance writes `test-results/v108-interaction-repair-launch-ux-lock/`.

## v109 Interaction Freedom / Launch Visual Upgrade / Gaia Stellar Material Lock

v109 keeps focus locked to the selected target position without continuously stealing the camera pose. Body focus, selected Gaia targets and local stars can still follow their target, while user wheel zoom, bottom-bar `+/-` and OrbitControls drag are preserved as manual view overrides. `Escape`, Passport exit and reset clear body, sky and launch camera locks before returning to overview.

The launch scene remains a local presentation layer over the existing launch physics. It adds Auto Follow / Manual Orbit camera state, a Restore Follow command, cleaner Launch Control copy and budgeted procedural vehicle visuals: LEO satellite profiles show a deployer payload with solar panels, while heavy-launch profiles show a larger rocket body, fairing, boosters, engine bells and exhaust layers. This does not add physical bodies or change the integrator.

Gaia and local stellar presentation now use `stellarMaterialProfile`, which deterministically derives color temperature, spectral label, core color, corona color, halo scale, diffraction scale and twinkle seed from offline catalog fields such as BP-RP, G/V magnitude and parallax. The selected sky-target proxy uses this profile for its visible core, corona, diffraction ring and label chip; Gaia overlay rendering keeps the v97 `1000/1800/3000` instance budgets and v99 opacity caps.

`npm run test:atlas:interaction-visual-quality` reuses the v108 heavy audit and verifies camera freedom, launch camera controls, procedural vehicle markers, stellar material helpers, docs/surfaces and protected mutation flags. `npm run verify:atlas:interaction-visual-quality` then runs the v108 verification chain. Root DOM, Relativity Observable Atlas, Evidence Ledger and Validation Console expose `interaction-visual-quality-lock`; browser acceptance writes `test-results/v109-interaction-visual-quality-lock/`.

Protected mutations remain `not-applied` for scientific gates, fixtures, live runtime physics, worker physics, RK4/DP, EIH 1PN, Kerr, Horizons fixtures, v75 budgets, V9 sky/background direction, v97 Gaia budgets, v99 opacity caps, release packaging, staging, commits and certification claims. v109 is presentation/local UX only, not a scientific model upgrade, not a release package, not a full Gaia archive and not Gaia/NASA/JPL official certification.

Protected boundaries remain unchanged: no scientific gate, fixture, live/worker physics, RK4/DP, EIH 1PN, Kerr, V9 sky/background, v75 budget, Gaia point-budget or v99 opacity-cap mutation; no release packaging, staging or commit.

## v79 Release Readiness / Gate Semantics Contract

Orbit Atlas v79 adds `app/lib/atlasReleaseReadiness.ts`, a pure metadata helper returning deterministic `v79-release-readiness-gate-semantics` information. The summary records the v78 product/scientific split, the product full command, the strict scientific command, the known strict Horizons blocker, documentation scope, and explicit mutation flags for budgets, physics, sky assets, materials, and Kerr kernel.

The v79 command boundary split introduced the product full verification gate and the then-unmigrated strict Horizons scientific gate. After the later v89 migration, `npm run verify:atlas:full` remains the product full verification gate, while `npm run test:atlas:horizons-scientific-gate` now uses the v84 barycentric reference path with unchanged v75 budgets. The old center-reference blocker remains preserved by `npm run test:atlas:horizons-scientific-gate:legacy-v75`: `1PN RMS 1.30808e+6 km / 378.557 m/s; Mercury +10y 1PN/Newton 0.997826`.

Provenance is additive. Evidence Ledger includes the informational `release-readiness-documentation` passport. Validation Console includes the `release-readiness` domain. The page root exposes `data-atlas-release-readiness-version="v79-release-readiness-gate-semantics"`, `data-atlas-release-readiness-profile="v79-product-ready-scientific-blocker-disclosed"`, `data-atlas-release-readiness-status="product-ready-scientific-horizons-blocked"`, and `data-atlas-release-readiness-boundary`.

This version is a documentation and release-semantics pass only. It does not relax Horizons thresholds, claim NASA/JPL precision, claim latest CI status, mutate `SolarSystemIntegrator`, `physicsEngine`, EIH 1PN dynamics, worker physics, RK4, the Kerr kernel, v69/v71 sky/background contracts, v76 material contracts, or any sky asset.

## v80 Scientific Horizons Closure Preflight

Orbit Atlas v80 adds `app/lib/atlasScientificGatePreflight.ts`, a pure metadata helper returning deterministic `v80-scientific-horizons-closure-preflight` information. The summary reads the v79 release-readiness state, keeps the current strict Horizons blocker string synchronized, and exposes status `product-ready-strict-scientific-blocked-preflight-ready`.

The preflight candidate list is fixed and deliberately non-mutating. `ephemeris-initial-state-upgrade` targets initial state, epoch, frame and checkpoint alignment. `solar-system-force-model-upgrade` targets force-model parity such as major asteroid perturbations, solar J2 and Earth-Moon barycenter handling. `high-order-integrator-upgrade` targets a future long-horizon integrator comparison beyond fixed-step RK4. Every candidate is marked `not-applied`.

Provenance is additive. Evidence Ledger includes the informational `scientific-gate-preflight` passport. Validation Console includes the `scientific-gate-preflight` domain. The Relativity Observable Atlas gate strip exposes preflight status and candidate count. The page root exposes `data-atlas-scientific-gate-preflight-version="v80-scientific-horizons-closure-preflight"`, `data-atlas-scientific-gate-preflight-profile="v80-horizons-model-limit-upgrade-roadmap"`, `data-atlas-scientific-gate-preflight-status="product-ready-strict-scientific-blocked-preflight-ready"`, and `data-atlas-scientific-gate-preflight-boundary`.

This version is a local roadmap and diagnostic-contract layer only. It does not pass the strict Horizons scientific gate, relax v75 budgets, claim NASA/JPL certification, mutate `SolarSystemIntegrator`, `physicsEngine`, EIH 1PN dynamics, worker physics, RK4, Kerr kernel behavior, v69/v71 sky/background contracts, v76 material contracts, or any sky asset.

## v81 Horizons RTN Residual Decomposition

Orbit Atlas v81 adds a pure RTN projection helper and `app/lib/atlasHorizonsResidualDecomposition.ts`. During the existing Horizons checkpoint comparison, the measured-minus-reference position and velocity vectors are projected onto the radial, transverse and normal basis formed from the Sun-centered reference position and velocity. This occurs inside the existing comparison pass and does not repeat or alter integration.

`HorizonsComparisonBody.orbitalResidual` is optional for compatibility with current-epoch diagnostics and older fixtures. A complete offline run provides ready residuals for 11 non-Sun bodies across Newtonian and EIH 1PN modes at `+30d`, `+365d` and `+10y`, producing 66 rows. The Sun records a degenerate basis and is excluded from contribution fractions.

`createAtlasHorizonsResidualDecompositionSummary()` normalizes squared position and velocity error contributions independently for each mode/checkpoint, identifies dominant bodies and RTN components, and returns per-body `+10y` 1PN/Newtonian position ratios. It deliberately does not infer that a transverse-dominant residual proves phase error or that any component proves a specific force-model defect.

Evidence Ledger includes `horizons-residual-decomposition`, Validation Console includes the matching domain, and Relativity Observable Atlas renders a compact six-checkpoint attribution table. Root DOM markers expose version, profile, readiness status, dominant body and trusted boundary. Browser acceptance writes overview and attribution screenshots under `test-results/v81-horizons-residual-decomposition/`.

The strict scientific blocker and v75 budgets remain unchanged. v81 does not mutate initial states, reference data, force models, RK4, EIH 1PN, worker physics, Kerr, product/scientific release semantics, backgrounds, materials or V9 sky assets.

## v82 Horizons Dynamical Parameter Candidate Lab

Orbit Atlas v82 adds `app/lib/atlasHorizonsCandidateLab.ts`, a pure candidate-contract helper for the strict Horizons closure path. The version marker is `v82-horizons-dynamical-parameter-candidate-lab` and the profile is `v82-de440-gm-softening-step-hierarchy-matrix`.

The live strict runner remains unchanged by default. `runHorizonsValidationDataset()` now accepts optional `dtDays`, `eps2Meters`, and `massKgByBodyId` overrides, but callers that omit them still use the v75 strict path: `HORIZONS_VALIDATION_DT_DAYS = 0.25`, `defaultEps2Meters()`, and current `SOLAR_SYSTEM_BODIES` masses.

The candidate matrix contains five non-applied rows: the v75 strict baseline, DE440 solar GM, DE440 solar GM with zero softening, DE440 solar GM with zero softening and `0.125 day` half-step, and a DE440 system-GM hierarchy candidate. The hierarchy candidate reads `public/data/horizons-validation-j2000-barycenter-candidate.json`, generated separately from the existing strict fixture by `export_horizons_validation_nextweb.py --candidate-barycenters`.

`npm run test:atlas:horizons-candidates` executes the offline matrix. The current result is intentionally not promoted to scientific certification: the velocity budget can be brought under the strict 10 m/s threshold by the solar-GM/zero-softening/half-step candidate, but the Pluto-dominated position RMS remains above the v75 strict position budget. The summary status is therefore `candidate-partial-unapplied` when runtime rows are supplied.

Evidence Ledger includes `horizons-candidate-lab`, Validation Console includes the matching domain, the page root exposes v82 DOM markers, and Relativity Observable Atlas renders the compact candidate table. v82 does not relax v75 budgets, apply candidate rows, mutate the live physics core, mutate worker physics, mutate RK4 defaults, change Kerr, change product/scientific gate semantics, change v69/v71 V9 sky/background assets, change material contracts, or claim NASA/JPL precision certification.

## v83 Pluto Residual Cause Isolation

Orbit Atlas v83 adds `app/lib/atlasPlutoResidualIsolation.ts`, a pure diagnostic-contract helper for Pluto-dominated strict Horizons residuals. The version marker is `v83-pluto-residual-cause-isolation` and the profile is `v83-outer-system-phase-force-model-matrix`.

The heavy runner `app/lib/atlasPlutoResidualIsolationRunner.ts` remains offline-test-only. `npm run test:atlas:horizons-pluto-isolation` runs six non-applied rows over the same Horizons runner: v82 solar-GM zero-softening half-step, solar-GM quarter-step, DE440 system-GM center-reference half/quarter-step, and DE440 system-GM hierarchy-reference half/quarter-step. Runtime physics defaults and the strict scientific gate are not changed.

Current evidence classifies the residual as `likely-force-model-limit`. The best row is still the v82 solar-GM zero-softening half-step candidate with 1PN aggregate `1.27667e+6 km / 8.329 m/s`. Pluto at `+10y` contributes `7.59557e+6 km / 21.244 m/s`, and its dominant RTN position component is transverse. When Pluto is excluded from the same `+10y` non-Sun aggregate, the 1PN position RMS drops to about `1.98442e+5 km`, below the v75 position budget, so the remaining strict position blocker is isolated to Pluto / outer-system modeling rather than timestep alone.

Evidence Ledger includes `pluto-residual-isolation`, Validation Console includes the matching domain, the page root exposes v83 DOM markers, and Relativity Observable Atlas renders a compact Pluto candidate table. v83 does not relax v75 budgets, apply candidate rows, pass `test:atlas:horizons-scientific-gate`, mutate the live physics core, mutate worker physics, mutate RK4 defaults, change Kerr, change product/scientific gate semantics, change v69/v71 V9 sky/background assets, change material contracts, or claim NASA/JPL precision certification.

## v84 Outer-System Force Model Preflight

Orbit Atlas v84 adds `app/lib/atlasOuterSystemForceModelPreflight.ts`, a pure preflight-contract helper for fixture provenance and Pluto / outer-system force-model upgrade paths. The version marker is `v84-outer-system-force-model-preflight` and the profile is `v84-pluto-barycenter-tno-force-model-upgrade-path`.

The heavy runner `app/lib/atlasOuterSystemForceModelPreflightRunner.ts` remains offline-test-only. It first audits whether candidate Horizons fixtures contain explicit target provenance and nonzero outer-system J2000 deltas from the v75 center-reference baseline. This exposes the old v82 hierarchy fixture as provenance-insufficient: it is labelled as a barycenter candidate, but its outer-system J2000 vectors match the baseline and it has no per-body target metadata.

The Horizons export script now uses the requested candidate body list and can write `public/data/horizons-validation-j2000-outer-system-barycenter-v84.json` without replacing `public/data/horizons-validation-j2000.json`. The v84 fixture records body id, target command id, target role, origin, reference plane, aberration mode and epoch. Its current audit is ready with 12 target-provenance entries and 6 system-barycenter targets.

`npm run test:atlas:horizons-outer-system-preflight` runs four non-applied numerical rows plus one metadata-only TNO / Kuiper-belt path. Current evidence is `ready-upgrade-path-actionable` / `barycenter-reference-limit`: the v84 outer-system barycenter plus DE440 system-GM row reaches about `12.43 km / 0.0302 m/s`, and Pluto `+10y` drops to about `6.89 km / 4.94e-5 m/s`. This is an actionable upgrade path, not a strict-gate closure.

Evidence Ledger includes `outer-system-force-model-preflight`, Validation Console includes the matching domain, the page root exposes v84 DOM markers, and Relativity Observable Atlas renders a compact preflight table. v84 does not relax v75 budgets, apply candidate rows, pass `test:atlas:horizons-scientific-gate`, mutate the live physics core, mutate worker physics, mutate RK4 defaults, change Kerr, change product/scientific gate semantics, change v69/v71 V9 sky/background assets, change material contracts, or claim NASA/JPL precision certification.

## v85 Outer-System Reference Adoption Preflight

Orbit Atlas v85 adds `app/lib/atlasOuterSystemReferenceAdoption.ts`, a pure adoption-readiness helper for the v84 outer-system barycenter fixture plus DE440 system-GM candidate path. The version marker is `v85-outer-system-reference-adoption-preflight` and the profile is `v85-barycentric-fixture-adoption-readiness`.

`npm run test:atlas:horizons-reference-adoption` runs the heavy preflight. It reuses `public/data/horizons-validation-j2000-outer-system-barycenter-v84.json`, checks that `public/data/horizons-validation-j2000.json` remains the unmigrated v75 strict fixture, checks that the v84 fixture provenance is still ready, and keeps the old v82 hierarchy fixture as a rejected provenance-regression sentinel.

The v85 adoption candidate uses the v84 outer-system barycenter fixture with DE440 system GM, `0.125 day` fixed step and zero softening. Current heavy evidence is `ready-adoption-candidate` / `default-gate-not-migrated`: the candidate path passes the v75 numerical budget probe, but the default strict scientific gate is intentionally not migrated.

Evidence Ledger includes `outer-system-reference-adoption`, Validation Console includes the matching domain, the page root exposes v85 DOM markers, and Relativity Observable Atlas renders a compact adoption table. v85 does not replace the v75 strict fixture, relax v75 budgets, apply candidate rows to the strict gate, pass `test:atlas:horizons-scientific-gate`, mutate live physics, mutate worker physics, mutate RK4 defaults, change Kerr, change product/scientific gate semantics, change v69/v71 V9 sky/background assets, change material contracts, or claim NASA/JPL precision certification.

## v86 Horizons Candidate Scientific Gate Formalization

Orbit Atlas v86 adds `app/lib/atlasHorizonsCandidateScientificGate.ts`, a pure candidate-gate helper over the v85 adoption path. The version marker is `v86-horizons-candidate-scientific-gate` and the profile is `v86-barycentric-reference-candidate-gate`.

`npm run test:atlas:horizons-candidate-scientific-gate` runs the heavy preflight. It reuses the v85 adoption runner, so the measured candidate path remains `public/data/horizons-validation-j2000-outer-system-barycenter-v84.json` plus DE440 system GM, `0.125 day` fixed step and zero softening. The v75 strict fixture and budget locks remain unchanged.

Current heavy evidence is `candidate-gate-pass-unapplied` / `candidate-budget-pass`: the barycentric reference candidate can pass the v75 numerical budget as a separate opt-in candidate gate. At v86 time the default `test:atlas:horizons-scientific-gate` was still the unmigrated strict gate and remained expected-failing until the later v89 explicit migration.

Evidence Ledger includes `horizons-candidate-scientific-gate`, Validation Console includes the matching domain, the page root exposes v86 DOM markers, and Relativity Observable Atlas renders a compact candidate-gate table. v86 does not replace the v75 strict fixture, relax v75 budgets, apply candidate rows to the strict gate, pass `test:atlas:horizons-scientific-gate`, mutate live physics, mutate worker physics, mutate RK4 defaults, change EIH 1PN, change Kerr, change product/scientific gate semantics, change v69/v71 V9 sky/background assets, change material contracts, or claim NASA/JPL precision certification.

## v87 Strict Horizons Migration Dry-Run Audit

Orbit Atlas v87 adds `app/lib/atlasStrictHorizonsMigrationDryRun.ts`, a pure dry-run migration-diff helper over the v86 candidate gate. The version marker is `v87-strict-horizons-migration-dry-run` and the profile is `v87-default-gate-migration-diff-audit`.

`npm run test:atlas:horizons-migration-dry-run` runs the heavy dry-run audit. It reuses `runAtlasHorizonsCandidateScientificGatePreflight`, verifies the v75 budget lock, keeps the current strict fixture as `public/data/horizons-validation-j2000.json`, and records the candidate target as `public/data/horizons-validation-j2000-outer-system-barycenter-v84.json` with DE440 system GM, `0.125 day` fixed step and zero softening.

Current heavy evidence is `ready-migration-diff-complete` / `default-gate-diff-ready`: the future default-gate migration package is explicit and auditable, but the default `test:atlas:horizons-scientific-gate` command and strict fixture remain unchanged and expected-failing.

Evidence Ledger includes `strict-horizons-migration-dry-run`, Validation Console includes the matching domain, the page root exposes v87 DOM markers, and Relativity Observable Atlas renders a compact migration-diff table. v87 does not replace the v75 strict fixture, relax v75 budgets, apply candidate rows to the strict gate, pass `test:atlas:horizons-scientific-gate`, mutate live physics, mutate worker physics, mutate RK4 defaults, change EIH 1PN, change Kerr, change product/scientific gate semantics, change v69/v71 V9 sky/background assets, change material contracts, mutate screenshots, or claim NASA/JPL precision certification.

## v88 Strict Horizons Shadow Migration Gate

Orbit Atlas v88 adds `app/lib/atlasStrictHorizonsShadowMigrationGate.ts`, a pure shadow-gate helper over the v87 migration dry-run manifest. The version marker is `v88-strict-horizons-shadow-migration-gate` and the profile is `v88-parallel-default-gate-rehearsal`.

`npm run test:atlas:horizons-shadow-migration-gate` runs the future strict-gate configuration as a separate rehearsal command. It reuses the v87 dry-run evidence, keeps the current default strict fixture as `public/data/horizons-validation-j2000.json`, and runs the shadow target as `public/data/horizons-validation-j2000-outer-system-barycenter-v84.json` with DE440 system GM, `0.125 day` fixed step and zero softening.

The heavy v88 result is expected to report `ready-shadow-gate-pass` / `shadow-gate-pass-default-not-migrated`. At v88 time the default strict command still pointed at `npm run test:atlas:horizons-scientific-gate` with the old expected-failing v75 blocker until the later v89 explicit migration.

Evidence Ledger includes `strict-horizons-shadow-migration-gate`, Validation Console includes the matching domain, the page root exposes v88 DOM markers, and Relativity Observable Atlas renders a compact shadow-gate table. v88 does not replace the v75 strict fixture, relax v75 budgets, apply candidate rows to the strict gate, pass `test:atlas:horizons-scientific-gate`, mutate live physics, mutate worker physics, mutate RK4 defaults, change EIH 1PN, change Kerr, change product/scientific gate semantics, change v69/v71 V9 sky/background assets, change material contracts, or claim NASA/JPL precision certification.

## v89 Default Strict Horizons Scientific Gate Migration

Orbit Atlas v89 adds `app/lib/atlasDefaultStrictHorizonsMigration.ts`, a pure migration helper for the default offline strict Horizons gate. The version marker is `v89-default-strict-horizons-scientific-gate-migration` and the profile is `v89-apply-barycentric-reference-default-gate`.

`npm run test:atlas:horizons-scientific-gate` now runs the v88 shadow-proven configuration as the default strict scientific gate: `public/data/horizons-validation-j2000-outer-system-barycenter-v84.json`, DE440 system GM, `0.125 day` fixed step and zero softening. The v75 numerical budgets remain unchanged.

`npm run test:atlas:horizons-scientific-gate:legacy-v75` keeps the old `public/data/horizons-validation-j2000.json` path as a legacy blocker audit. It asserts the preserved old blocker value `1PN RMS 1.30808e+6 km / 378.557 m/s; Mercury +10y 1PN/Newton 0.997826` instead of pretending the old center-reference fixture passes.

`npm run test:atlas:horizons-default-migration` audits command ownership, v88 shadow provenance, v84 fixture provenance, locked v75 budgets and the preserved legacy blocker. `npm run verify:atlas:scientific` can now pass through the migrated default strict gate while still avoiding any NASA/JPL precision certification claim.

Evidence Ledger includes `default-strict-horizons-migration`, Validation Console includes the matching domain, the page root exposes v89 DOM markers, and Relativity Observable Atlas renders a compact migration table. v89 migrates only the offline scientific gate command/config; it does not relax v75 budgets, mutate live physics, mutate worker physics, mutate RK4 runtime defaults, change EIH 1PN, change Kerr, change product gate semantics, change v69/v71 V9 sky/background assets, change material contracts, or claim NASA/JPL precision certification.

## v90 Horizons Provenance Freeze

Orbit Atlas v90 adds `app/lib/atlasHorizonsProvenanceFreeze.ts`, a pure freeze helper for the v89 offline strict Horizons gate contract. The version marker is `v90-horizons-provenance-freeze` and the profile is `v90-default-gate-command-fixture-hash-lock`.

`npm run test:atlas:horizons-provenance-freeze` audits command ownership, `verify:atlas:scientific`, v75 budgets, v89 migration evidence, legacy blocker preservation, documentation boundary text, and fixture hashes. v89 之后默认 `test:atlas:horizons-scientific-gate` 已迁移并通过; the `legacy v75 command` remains `npm run test:atlas:horizons-scientific-gate:legacy-v75` and preserves the old center-reference blocker as rollback evidence.

The migrated fixture contract is `public/data/horizons-validation-j2000-outer-system-barycenter-v84.json`, SHA256 `0610A69D32B0BEAB829C70AEC7034CA0E45ADF420631A5FC13B9E0E2EE58D62D`, size `21863`, variant `v84-outer-system-barycenter-reference`, with 12 target-provenance rows. The legacy fixture contract is `public/data/horizons-validation-j2000.json`, SHA256 `7ACFF5ED1BEB284CF40DFE905B60ACFDE009E5EE5CE1787085353BD03DA5FD1B`, size `14678`.

Evidence Ledger includes `horizons-provenance-freeze`, Validation Console includes the matching domain, the page root exposes v90 DOM markers, and Relativity Observable Atlas renders a compact freeze table. v90 is not a NASA/JPL certification; it does not regenerate Horizons fixture data, relax v75 budgets, mutate live physics, mutate worker physics, mutate RK4 runtime defaults, change EIH 1PN, change Kerr, change product gate semantics, change v69/v71 V9 sky/background assets, or change material contracts.

## v91 Offline-vs-runtime boundary audit

Orbit Atlas v91 adds `app/lib/atlasOfflineRuntimeBoundaryAudit.ts`, a pure boundary helper over the v89/v90 migrated and frozen offline strict Horizons gate. The version marker is `v91-offline-runtime-boundary-audit` and the profile is `v91-scientific-gate-runtime-boundary-lock`.

`npm run test:atlas:offline-runtime-boundary` reuses the v90 provenance freeze audit, then checks command ownership, documentation language, Evidence Ledger claim text, Validation Console domain text, root DOM markers, Observable Atlas markers, and protected mutation flags. The default offline `test:atlas:horizons-scientific-gate` remains migrated and frozen; the legacy v75 command remains the old blocker audit.

v91 is not a physics migration and not a NASA/JPL certification. The live runtime physics remains unchanged: `SolarSystemIntegrator`, `physicsEngine`, worker physics, RK4 runtime defaults, EIH 1PN, Kerr kernel, sky/background assets, material contracts, fixture data and v75 budgets stay guarded by explicit `not-applied` mutation flags.

Evidence Ledger includes `offline-runtime-boundary-audit`, Validation Console includes the matching domain, the page root exposes v91 DOM markers, and Relativity Observable Atlas renders a compact boundary table. Browser acceptance writes v91 screenshots under `test-results/v91-offline-runtime-boundary-audit/`.

## v92 Scientific Gate maintenance runbook

Orbit Atlas v92 adds `app/lib/atlasScientificGateMaintenanceRunbook.ts`, a pure maintenance runbook helper over the v89 migrated default offline strict Horizons gate, the v90 provenance freeze and the v91 offline/runtime boundary. The version marker is `v92-scientific-gate-maintenance-runbook-lock` and the profile is `v92-offline-gate-release-rollback-command-runbook`.

`npm run test:atlas:scientific-gate-runbook` reuses the v91 boundary audit, which reuses the v90 freeze audit and v89 migration evidence. It locks command ownership for `npm run verify:atlas:full`, `npm run verify:atlas:scientific`, `npm run test:atlas:horizons-scientific-gate`, `npm run test:atlas:horizons-scientific-gate:legacy-v75`, `npm run test:atlas:horizons-provenance-freeze`, and `npm run test:atlas:offline-runtime-boundary`.

v92 is not a new scientific model and not a NASA/JPL certification. The live runtime physics remains unchanged. The migrated scientific gate is the maintained default offline scientific gate; the legacy v75 command remains rollback/blocker evidence only. Any rollback or default-gate reconfiguration requires an intentional future migration/audit, not silent script drift.

Evidence Ledger includes `scientific-gate-maintenance-runbook`, Validation Console includes the matching domain, the page root exposes v92 DOM markers, and Relativity Observable Atlas renders a compact runbook table. Browser acceptance writes v92 screenshots under `test-results/v92-scientific-gate-maintenance-runbook-lock/`.

## v93 Scientific Gate release evidence

Orbit Atlas v93 adds `app/lib/atlasScientificGateReleaseEvidence.ts`, a pure release evidence helper over the v89 migrated default offline strict Horizons gate, the v90 provenance freeze, the v91 offline/runtime boundary and the v92 maintenance runbook. The version marker is `v93-scientific-gate-release-evidence-lock` and the profile is `v93-offline-gate-release-evidence-bundle`.

`npm run test:atlas:scientific-gate-release-evidence` reuses the v92 runbook audit, which already reuses the v91 boundary audit, v90 freeze audit and v89 migration evidence. It locks command ownership for `npm run verify:atlas:full`, `npm run verify:atlas:scientific`, `npm run test:atlas:horizons-scientific-gate`, `npm run test:atlas:horizons-scientific-gate:legacy-v75`, `npm run test:atlas:horizons-provenance-freeze`, `npm run test:atlas:offline-runtime-boundary`, and `npm run test:atlas:scientific-gate-runbook`.

v93 is a release evidence bundle lock, not a new scientific model and not a NASA/JPL certification. The live runtime physics remains unchanged. It does not regenerate fixture data, relax v75 budgets, alter RK4/EIH/Kerr, modify sky/background assets or materials, or change default gate configuration.

The release evidence records the frozen v90 fixture contract: migrated fixture `public/data/horizons-validation-j2000-outer-system-barycenter-v84.json` with SHA256 `0610A69D32B0BEAB829C70AEC7034CA0E45ADF420631A5FC13B9E0E2EE58D62D`, size `21863`, variant `v84-outer-system-barycenter-reference`, target provenance rows `12`; legacy fixture `public/data/horizons-validation-j2000.json` with SHA256 `7ACFF5ED1BEB284CF40DFE905B60ACFDE009E5EE5CE1787085353BD03DA5FD1B`, size `14678`.

Evidence Ledger includes `scientific-gate-release-evidence`, Validation Console includes the matching domain, the page root exposes v93 DOM markers, and Relativity Observable Atlas renders a compact release evidence table. Browser acceptance writes v93 screenshots under `test-results/v93-scientific-gate-release-evidence-lock/`.

## v94 Browser/CI Stability Lock

Orbit Atlas v94 adds `app/lib/atlasBrowserCiStabilityLock.ts`, a pure browser and CI stability lock helper over the v93 release evidence bundle and the fresh Playwright acceptance surface. The version marker is `v94-browser-ci-stability-lock` and the profile is `v94-fresh-browser-ci-runtime-stability`.

`npm run test:atlas:browser-ci-stability` reuses the v93 release evidence audit, then statically audits `package.json`, `playwright.atlas.fresh.config.ts`, `tests/atlas-browser/atlas-browser-acceptance.spec.ts`, docs, root DOM markers, Observable Atlas markers, Evidence claim text, Validation domain text and protected mutation flags. It locks the fresh browser command, the 3015 fresh server configuration with teardown, the bounded screenshot retry helper, fresh visual sampling navigation checkpoints, the four-attempt render-settle pixel sampling helpers, and the known Windows Watchpack noise policy.

v94 is a browser and CI stability lock, not a scientific model, visual model, default gate migration, or NASA/JPL certification. It does not change live runtime physics, worker physics, RK4/EIH/Kerr, default scientific gate configuration, fixture data, v75 budgets, materials, or sky/background assets.

Fresh browser acceptance still runs through `npm run test:atlas:browser:fresh`; v94 only locks how the existing command is owned and interpreted. Windows Watchpack warnings for `DumpStack.log.tmp` and `pagefile.sys` are known Windows Watchpack noise and are non-failing when the browser command exits 0.

Evidence Ledger includes `browser-ci-stability-lock`, Validation Console includes the matching domain, the page root exposes v94 DOM markers, and Relativity Observable Atlas renders a compact browser CI stability table. Browser acceptance writes v94 screenshots under `test-results/v94-browser-ci-stability-lock/`.

## v95 Release Artifact Manifest Lock

Orbit Atlas v95 adds `app/lib/atlasReleaseArtifactManifestLock.ts`, a pure release artifact manifest lock helper over the v93 release evidence bundle and the v94 browser CI stability lock. The version marker is `v95-release-artifact-manifest-lock` and the profile is `v95-offline-release-artifact-manifest`.

`npm run test:atlas:release-artifact-manifest` reuses the v94 browser CI stability audit, which already reuses the v93 release evidence audit. It statically audits `package.json`, fixture hash metadata, browser screenshot path contracts, fresh browser teardown policy, README and Technical Overview docs, root DOM markers, Observable Atlas markers, Evidence claim text, Validation domain text, rollback boundary text and protected mutation flags.

v95 is a release artifact manifest lock, not a release archive, not a scientific model, not a browser stability rewrite, and not a NASA/JPL certification. It does not create zip/tar artifacts, regenerate fixture data, relax v75 budgets, alter RK4/EIH/Kerr, mutate live runtime physics or worker physics, modify sky/background assets or materials, or change default scientific gate configuration.

The manifest indexes the command matrix for `npm run verify:atlas:full`, `npm run verify:atlas:scientific`, v93 release evidence, v94 browser CI stability, migrated strict gate, legacy v75 audit, runbook, provenance freeze, offline/runtime boundary and fresh browser acceptance. It records the v84 migrated fixture SHA256 `0610A69D32B0BEAB829C70AEC7034CA0E45ADF420631A5FC13B9E0E2EE58D62D`, size `21863`, provenance rows `12`, and legacy fixture SHA256 `7ACFF5ED1BEB284CF40DFE905B60ACFDE009E5EE5CE1787085353BD03DA5FD1B`, size `14678`.

Browser artifact path contracts remain `test-results/v93-scientific-gate-release-evidence-lock/`, `test-results/v94-browser-ci-stability-lock/`, and `test-results/v95-release-artifact-manifest-lock/`. The legacy v75 command remains rollback/blocker evidence only; v95 records `legacy-v75-rollback-blocker-evidence-only` and does not restore legacy v75 as the default strict gate.

Evidence Ledger includes `release-artifact-manifest-lock`, Validation Console includes the matching domain, the page root exposes v95 DOM markers, and Relativity Observable Atlas renders a compact release artifact manifest table. Browser acceptance writes v95 screenshots under `test-results/v95-release-artifact-manifest-lock/`.

## v96 Final Maintenance Baseline

Orbit Atlas v96 adds `app/lib/atlasFinalMaintenanceBaseline.ts`, a pure final maintenance baseline helper over the v95 release artifact manifest, v94 browser CI stability, v93 release evidence, v92 runbook, v91 offline/runtime boundary and v90 provenance freeze. The version marker is `v96-final-maintenance-baseline` and the profile is `v96-final-offline-maintenance-baseline`.

`npm run test:atlas:final-maintenance-baseline` reuses the v95 artifact manifest audit, then statically audits `package.json`, README and Technical Overview docs, root DOM markers, Observable Atlas markers, Evidence claim text, Validation domain text, browser acceptance markers, post-baseline policy text and protected mutation flags.

v96 is a final maintenance baseline, not a release archive, not a scientific model, not a browser stability rewrite, not a visual upgrade and not a NASA/JPL certification. It does not change live runtime physics, worker physics, RK4/EIH/Kerr, default scientific gate configuration, fixture data, v75 budgets, materials, sky/background assets or release packaging.

The baseline fixes `npm run verify:atlas:full` as the final product verification entrypoint and `npm run verify:atlas:scientific` as the final scientific verification entrypoint. It keeps v90 provenance freeze, v91 offline/runtime boundary, v92 runbook, v93 release evidence, v94 browser CI stability and v95 release artifact manifest as the maintained evidence chain.

v96 records `post-v96-scientific-mainline-requires-intentional-upgrade`: after this baseline, scientific mainline changes require an intentional fixture/model upgrade or true live physics migration. Gaia/constellation/art/relativity optimization remains post-baseline and outside the scientific gate closeout.

Evidence Ledger includes `final-maintenance-baseline`, Validation Console includes the matching domain, the page root exposes v96 DOM markers, and Relativity Observable Atlas renders a compact final maintenance baseline table. Browser acceptance writes v96 screenshots under `test-results/v96-final-maintenance-baseline/`.

## v97 Gaia Starfield / Constellation Enhancement

Orbit Atlas v97 adds `app/lib/atlasGaiaStarfieldEnhancement.ts`, a presentation-only overlay contract for packaged Gaia bright 5000, Gaia kinematics 2000, the normalized 88 IAU constellation presentation contract and curated local nebula markers. The version marker is `v97-gaia-starfield-enhancement` and the profile is `v97-gaia-constellation-nebula-overlay`.

`npm run test:atlas:gaia-starfield-enhancement` statically audits `package.json`, README and Technical Overview docs, root DOM markers, Observable Atlas markers, Evidence claim text, Validation domain text, browser acceptance markers, packaged Gaia row counts, local constellation/nebula catalog counts, fixed overlay budgets, protected mutation flags and the V9 sky boundary.

The Gaia render budget is fixed at mobile `1000`, balanced `1800`, dense `3000`. Runtime overlay activation follows `sandbox-deep-space-and-orbit-atlas-dense`, mobile follows `mobile-uses-1000-star-budget`, and selected-body closeups follow `selected-body-closeup-opacity-suppressed`.

This is presentation-only, not a scientific model, not a scientific gate, not full Gaia archive, not Gaia official certification, not NASA/JPL certification and not a release archive. It does not change live runtime physics, worker physics, RK4/EIH/Kerr, fixture data, v75 budgets, materials, sky/background assets, `ORBIT_ATLAS_SKY === ORBIT_ATLAS_V9_SKY`, or `GalaxyEnvironmentSphere legacy V9` background direction.

Evidence Ledger includes `gaia-starfield-enhancement`, Validation Console includes the matching domain, the page root exposes v97 DOM markers, and Relativity Observable Atlas renders a compact Gaia starfield enhancement table. Browser acceptance writes v97 screenshots under `test-results/v97-gaia-starfield-enhancement/`.

## v98 Relativity Simulation Optimization

Orbit Atlas v98 adds `app/lib/atlasRelativitySimulationOptimization.ts`, a teaching observability contract over the existing Relativity Observable Atlas, Kerr Studio, weak-field readouts, numerical-health explanations and optional collapsed read-only performance HUD policy. The version marker is `v98-relativity-simulation-optimization` and the profile is `v98-relativity-observability-teaching-layer`.

`npm run test:atlas:relativity-simulation-optimization` statically audits `package.json`, README and Technical Overview docs, root DOM markers, Observable Atlas markers, Evidence claim text, Validation domain text, browser acceptance markers, the v37/v39/v40/v73/v74 relativity summary chain, v35 Kerr Studio markers, weak-field/Kerr/numerical-health readout split, optional read-only HUD policy and protected physics mutation flags.

Runtime UI exposes deterministic metadata only. The lightweight summary defaults to `pending-runtime-run`; the heavy runner is the only source for `ready-relativity-optimization-locked`, `ready-relativity-optimization-blocked`, or `ready-teaching-overlay-budgeted`.

v98 is teaching observability only, not a scientific model upgrade, not full numerical relativity, not an Einstein field-equation solver, not online validation and not scientific certification. It does not mutate live runtime physics, worker physics, RK4/DP integration, EIH 1PN, Kerr kernel id, Horizons fixtures, v75 budgets, V9 sky/background assets or the v97 Gaia overlay.

Evidence Ledger includes `relativity-simulation-optimization`, Validation Console includes the matching domain, the page root exposes v98 DOM markers, and Relativity Observable Atlas renders a compact relativity simulation optimization table. Browser acceptance writes v98 screenshots under `test-results/v98-relativity-simulation-optimization/`.

## v99 Art Polish

Orbit Atlas v99 adds `app/lib/atlasArtPolish.ts`, a presentation-only art polish contract over the v97 Gaia overlay and v98 observability baseline. The version marker is `v99-art-polish` and the profile is `v99-gaia-overlay-closeup-presentation-polish`.

`npm run test:atlas:art-polish` statically audits `package.json`, README and Technical Overview docs, root DOM markers, Observable Atlas markers, Evidence claim text, Validation domain text, browser acceptance markers, Gaia opacity caps, v97 Gaia render budgets, constellation line restraint, nebula marker polish, selected-body closeup deemphasis, mobile label/line/nebula density restraint, V9 sky identity and protected mutation flags.

Gaia render budgets remain mobile `1000`, balanced `1800` and dense `3000`. v99 only adjusts presentation opacity caps: mobile `0.62`, balanced `1.05`, dense `1.20` and selected-body closeup `0.18`.

v99 is presentation-only, not a scientific gate, not a physics model, not a fixture update, not a release artifact and not NASA/JPL/Gaia/Universe Sandbox certification. It does not mutate live runtime physics, worker physics, RK4/DP, EIH 1PN, Kerr kernel id, Horizons fixtures, v75 budgets, materials, V9 sky/background direction, `ORBIT_ATLAS_SKY === ORBIT_ATLAS_V9_SKY`, `GalaxyEnvironmentSphere legacy V9`, or v97 Gaia render budgets.

Evidence Ledger includes `art-polish`, Validation Console includes the matching domain, the page root exposes v99 DOM markers, and Relativity Observable Atlas renders a compact art polish table. Browser acceptance writes v99 screenshots under `test-results/v99-art-polish/`.

## v100 Post-Enhancement Maintenance Baseline

Orbit Atlas v100 adds `app/lib/atlasPostEnhancementMaintenanceBaseline.ts`, a pure maintenance baseline over the immutable v96 final baseline, v97 Gaia overlay, v98 teaching observability layer and v99 art polish contract. The version marker is `v100-post-enhancement-maintenance-baseline` and the profile is `v100-v97-v99-visual-teaching-maintenance-lock`.

`npm run test:atlas:post-enhancement-baseline` reuses the v96, v97, v98 and v99 heavy audits, then statically audits `package.json`, README and Technical Overview docs, root DOM markers, Observable Atlas markers, Evidence claim text, Validation domain text, browser acceptance markers, fresh browser config, browser resource lifecycle policy and protected mutation flags. It does not read the network, start a browser, generate fixtures or create a release archive.

`npm run verify:atlas:post-enhancement` first runs the v100 heavy audit, then runs the existing `npm run verify:atlas:scientific` entrypoint. `test:atlas` only includes the lightweight v100 contract test.

v100 freezes Gaia render budgets at mobile `1000`, balanced `1800` and dense `3000`; v99 opacity caps at mobile `0.62`, balanced `1.05`, dense `1.20` and closeup `0.18`; the normalized 88 IAU constellation presentation scope; the curated local nebula marker boundary; and the v98 teaching observability boundary over the existing Kerr kernel id. It is a pure maintenance baseline, not a performance optimization, scientific model upgrade, fixture update, visual parameter change, sky replacement, release archive or official certification.

v100 does not rewrite v95/v96 historical manifest semantics. It references the existing locks and freezes the post-enhancement evidence index without back-editing their contracts.

Browser resource policy remains `about:blank` scene unload, `ImageBitmap.close()`, finite screenshot retry, 3015 teardown and documented Windows Watchpack `DumpStack.log.tmp` / `pagefile.sys` non-failure noise.

Protected mutations remain `not-applied` for live runtime physics, worker physics, RK4/DP, EIH 1PN, Kerr kernel id, Horizons fixtures, v75 budgets, materials, V9 sky/background direction, `ORBIT_ATLAS_SKY === ORBIT_ATLAS_V9_SKY`, `GalaxyEnvironmentSphere legacy V9`, v97 Gaia budgets, v99 opacity caps, release packaging, performance optimization and certification claims.

Evidence Ledger includes `post-enhancement-maintenance-baseline`, Validation Console includes the matching domain, the page root exposes v100 DOM markers, and Relativity Observable Atlas renders a compact post-enhancement maintenance baseline table. Browser acceptance writes v100 screenshots under `test-results/v100-post-enhancement-maintenance-baseline/`.

## v101 Browser Resource Performance Lock

Orbit Atlas v101 adds `app/lib/atlasBrowserResourcePerformanceLock.ts`, a browser resource stability lock over the v100 maintenance baseline. The version marker is `v101-browser-resource-performance-lock` and the profile is `v101-fresh-browser-resource-performance`.

`npm run test:atlas:browser-resource-performance` reuses the v100 heavy audit, then statically audits `package.json`, README and Technical Overview docs, root DOM markers, Observable Atlas markers, Evidence claim text, Validation domain text, browser acceptance markers, screenshot retry policy, the shared screenshot pixel sampler, explicit `ImageBitmap.close()`, canvas zeroing, fresh browser config, fresh teardown and console/page-error observability. It does not read the network, start a browser, generate fixtures or create a release archive.

`npm run verify:atlas:browser-resource` first runs the v101 heavy audit, then runs `npm run test:atlas:browser:fresh`. `test:atlas` only includes the lightweight v101 contract test.

v101 applies one browser acceptance helper resource optimization: backdrop and selected-body closeup pixel sampling now share a single ImageBitmap/canvas path with explicit cleanup. Existing pixel thresholds, screenshot retry count, four-attempt pixel settle behavior, render wait strategy and fresh 3015 server semantics remain unchanged.

Protected mutations remain `not-applied` for runtime performance, live runtime physics, worker physics, RK4/DP, EIH 1PN, Kerr kernel id, Horizons fixtures, v75 budgets, materials, V9 sky/background direction, `ORBIT_ATLAS_SKY === ORBIT_ATLAS_V9_SKY`, `GalaxyEnvironmentSphere legacy V9`, v97 Gaia budgets, v99 opacity caps, release packaging and certification claims. v101 is not a scientific gate, fixture, visual parameter, sky replacement, release artifact or official certification version.

Evidence Ledger includes `browser-resource-performance-lock`, Validation Console includes the matching domain, the page root exposes v101 DOM markers, and Relativity Observable Atlas renders a compact browser resource performance table. Browser acceptance writes v101 screenshots under `test-results/v101-browser-resource-performance-lock/`.

## v57 Sparse Deep-Space Director / 3A Sparse Backdrop Layer

Orbit Atlas v57 adds `app/lib/atlasSparseDeepSpaceDirector.ts`, a pure metadata helper returning deterministic `v57-sparse-deep-space-director` information. The summary records reference mode `universe-sandbox-inspired-sparse-deep-space`, source policy `nasa-svs-16k-prepared-local-runtime`, sky manifest `orbit-atlas-v57`, overview and close-up starfield/Milky Way/nebula/negative-space profiles, preserved v41/v54/v55/v56 boundaries, and explicit non-claims for runtime pass/fail, Universe Sandbox clone status, AAA certification, WCAG certification, scientific certification, CI certification, online validation, online asset completeness, and physics mutation.

The generated sky asset path stays inside the existing sky pipeline. `scripts/build-universe-sandbox-sky.py` keeps v9, v48, and v56 outputs as fallback, caches NASA SVS 16K `milkyway_2020_16k.exr`, `hiptyc_2020_16k.exr`, and `starmap_random_2020_16k_gal.exr` during development, and writes v57 base, primary-star, distant-star, dust, nebula-haze, and negative-space JPG layers under `public/textures/sky`. Runtime rendering reads only prepared local `public/textures` assets and does not download or validate online assets.

The rendering work remains presentation-only. After the v69 legacy background restore, `ORBIT_ATLAS_SKY` points back at `ORBIT_ATLAS_V9_SKY` to recover the 2026-05-21 wide-sky look: dense blue-gray Milky Way texture, visible dust lanes, and discrete bright-star overlay. Later v56-v68 manifests stay available as historical constants, and `GalaxyEnvironmentSphere` keeps the later selected-body close-up suppression and subject-matte protections for Sun/Earth/Jupiter/Saturn. This only changes shader uniforms, local textures, exposure, and composition; it does not move bodies, change camera physics, change mass/velocity state, or alter the EIH 1PN and worker physics paths.

Provenance is additive. Evidence Ledger and Validation Console expose sparse deep-space direction, Milky Way contrast, pixel budgets and negative-space profiles.

DOM contracts: the page root exposes `data-atlas-sparse-deep-space-version="v57-sparse-deep-space-director"`, `data-atlas-sparse-deep-space-reference-mode`, `data-atlas-sparse-deep-space-source-policy`, `data-atlas-sparse-deep-space-sky-manifest`, `data-atlas-sparse-deep-space-starfield-profile`, `data-atlas-sparse-deep-space-milky-way-profile`, `data-atlas-sparse-deep-space-nebula-profile`, `data-atlas-sparse-deep-space-negative-space-profile`, and `data-atlas-sparse-deep-space-boundary`. Browser acceptance verifies these markers alongside v35-v56 contracts, the preserved Kerr kernel id `eih-1pn+kerr-geodesic-v17`, desktop/mobile overflow checks, console/page-error capture, v41 focus/Axe/reduced-motion checks, selected-body close-up sparse-backdrop profile checks, tightened non-brittle background pixel budgets, and v57 local screenshot review without committed golden snapshots.

This version is a local visual backdrop pass only. Runtime reads local `public/textures` and local catalog data only, does not copy Universe Sandbox assets, does not claim a Universe Sandbox clone, online validation, online asset completeness, formal AAA art certification, WCAG certification, scientific certification, CI/runtime command status, full numerical relativity, Einstein field-equation solving, cosmological N-body, or physics mutation, and does not change `SolarSystemIntegrator`, `physicsEngine`, EIH 1PN dynamics, worker physics, stable panel ids, or the Kerr kernel id `eih-1pn+kerr-geodesic-v17`.
