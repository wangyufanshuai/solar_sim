# Orbit Atlas Final Form Roadmap

## Objective

The final product is a reproducible Web/Next standalone scientific-cinematic atlas that runs on a 16 GB Windows machine, serves all required runtime assets from verified local content packs, keeps one WebGL2 Canvas active, and reports product readiness separately from scientific-model promotion.

The default scientific kernel remains `legacy-eih-1pn`. The `eih-1pn-2pn-lt` candidate remains shadow-only until it demonstrates aggregate and independent per-body improvement. Desktop installers and scientific promotion are optional follow-on tracks, not hidden requirements for the Web release candidate.

## v168-v174 Implementation Status

- v168: Next 15.5.18 security baseline, verified React 19/R3F 9 App Router pairing, typed root-evidence compatibility facade and responsive launch/mobile dock work implemented.
- v169: atomic runtime context, typed panel sessions and panel coordinator foundation implemented.
- v170: launch/focus controller extraction remains incremental; behavior compatibility takes priority over the line-count target.
- v171: standalone-full and checksummed 65.8 MiB Vercel Lite delivery profiles implemented locally; no cloud deploy is claimed.
- v172-v173: touch sizing, safe-area layout, scene-revision texture sampling and expanded resource observability are implemented; final browser soak/performance evidence must be regenerated against the final build.
- v174: capability matrix and fail-closed checksummed dossier builder implemented; the dossier is generated only after the serial validation matrix succeeds.

## Phase 0 — Evidence And Allowed Boundaries

Sources read before this roadmap:

- `README.md`
- `docs/TECHNICAL_OVERVIEW.md`
- `app/lib/atlasExtremeReleaseV166.ts`
- `app/lib/scientificExperienceEvidenceV7.ts`
- local Codex rollout `019f362b-ae7a-7ac0-9212-a4eb19d42e56`
- project-scoped `git status`

Allowed implementation surfaces:

- React/Next shell, panel routing, scene composition and selector stores already present in `app/`.
- Existing content-pack API, asset resolver, manifests and verification scripts.
- Existing Vitest and Playwright commands in `package.json`.
- Additive release evidence and reports under `dist/science`.

Protected surfaces:

- scientific gates and historical fixtures
- live and Worker physics
- RK4/DP and legacy EIH 1PN
- Kerr core
- V9 sky direction
- v75/v97 budgets and v99 opacity caps
- reset, revert, clean, stage and commit operations

## Current Assessment

### Strengths

- The v160 content-pack route is operational: six packs, 805 files and 539.1 MiB are served from the production standalone origin.
- v166 regression, production build, desktop/mobile fresh Browser QA, asset delivery and network preflight are complete.
- Named RTX 4060 production evidence now covers overview, Earth inspect, Gaia inspect, launch and Kerr with hardware rendering, passing FPS/P95 thresholds, clean resource return and zero console/page errors.
- Scientific claims are conservative: V2 is not promoted, ordinary-star portraits are parameter-derived, Kerr is isolated test-particle work, and the product does not claim numerical relativity or mission-grade ephemerides.

### Remaining Gaps

- `app/UniverseRuntimeController.tsx` is still a 3978-line compatibility coordinator with 33 local `useState` calls. The three-line `UniversePage` is a useful entry split, but not the final runtime decomposition.
- Historical and current release semantics coexist. v166 truthfully records its pending handoff; v167 must be the authoritative current product/science split until old compatibility surfaces are retired deliberately.
- `app/lib/atlasReleaseProgram.ts` still contains historical Windows/Tauri final-product language while current delivery documentation defers installers. It must not be reused as a current release claim without an explicit migration.
- Performance telemetry reports `drawCalls=1` for several complex scenes. FPS evidence is valid for the current gate, but GPU workload counters need a separate observability audit before they are used as optimization proof.
- The project lives inside a much larger dirty repository. Project-scoped status currently contains 71 tracked changes and thousands of generated/untracked files. Final packaging must use explicit manifests and allowlists rather than assuming a clean Git tree.

## Phase 1 — v167 Product Release Evidence Closure

Status: implemented in the current working tree.

Implementation:

- Reuse the existing named-hardware scene flow from `tests/atlas-browser/scientific-performance-v5.spec.ts`.
- Run it against the production standalone profile in `playwright.atlas.performance-v166.config.ts`.
- Publish `AtlasProductReleaseV167` with independent product and scientific statuses.
- Build a fail-closed combined report from `performance-v166-report.json` and `regression-v166-report.json`.

Verification:

- `npm run test:atlas:hardware-performance-v166`
- `npm run test:atlas:product-release-v167`
- `npm run build:product-release-evidence-v167`

Guards:

- Do not turn product QA success into V2 promotion.
- Do not overwrite the historical v166 release record.
- Do not reuse the older v153/v5 report as the v166 production artifact.

## Phase 2 — v168-v170 Runtime Architecture Convergence

Implementation:

1. Extract panel/session routing from `UniverseRuntimeController` into a typed `AtlasPanelCoordinator` using the existing `atlasRuntimeStore` selector pattern.
2. Extract launch state and handoff orchestration into an `AtlasLaunchController` while keeping `localLaunchPhysics`, telemetry protocols and handoff math unchanged.
3. Extract focus, mission capsule and report/workflow session state into an `AtlasSessionController` without changing camera commands or serialized ids.
4. Leave `UniverseRuntimeController` as composition glue with a target below 1200 lines and no duplicated historical summary construction.

Verification per extraction:

- focused unit tests for the extracted coordinator
- `npx tsc --noEmit`
- `npm run test:atlas:runtime-architecture-v3`
- `npm run test:atlas:product-release-v167`
- one desktop and one mobile Browser smoke before the next extraction

Guards:

- Copy existing store/subscription and dynamic-panel patterns; do not invent a second state framework.
- Do not rewrite camera, launch physics, Worker ownership or scene math during structural extraction.
- Keep one Canvas and release all temporary Workers, render targets, subscriptions and camera locks on scene exit.

## Phase 3 — v171 Reproducible Delivery And Provenance

Implementation:

- Add one release manifest that lists the Next standalone build, six content-pack manifests, catalog location, checksums, source/license metadata and compatibility versions.
- Verify a fresh staged output directory without deleting or cleaning the current tree.
- Reconcile documented installed sizes with actual pack API output.
- Keep Vercel as a thin preview and forbid production loopback fallback.

Verification:

- `npm run verify:asset-delivery-v3`
- `npm run verify:vercel:thin-preview`
- production HTTP 200, Range, ETag, MIME, checksum and traversal-rejection checks
- cold start using only the staged standalone output plus declared pack roots

Guards:

- Do not derive release contents from `git status`.
- Do not copy large content packs into `.next`, `public` or Vercel source upload.
- Do not claim an installer, signature or online asset completeness.

## Phase 4 — v172 UX, Accessibility And Visual Closure

Implementation:

- Validate the six product scene families through stable user journeys: overview, object inspect, stellar/exoplanet system, launch, relativity and Scene Lab.
- Close responsive safe-area, focus-return, keyboard, reduced-motion and Chinese-copy issues found by Browser QA.
- Use the existing visual director, material profiles and content packs; treat screenshots as review evidence rather than scientific truth.

Verification:

- desktop `1440x900` and mobile `390x844`
- zero horizontal overflow, console errors, page errors, Renderer Faults and production 404s
- Axe A/AA scan on the scoped workbench surfaces
- focus, escape, reset and scene-unmount resource checks

Guards:

- No v97 draw-budget or v99 opacity-cap increases.
- No V9 sky replacement.
- No visual layer may be described as resolved stellar surface, GRMHD or physical atmosphere simulation without corresponding evidence.

## Phase 5 — v173 Performance And Soak Closure

Implementation:

- Audit GPU counter provenance so draw-call/triangle values represent the active renderer before using them as optimization evidence.
- Add a bounded scene-cycle soak that repeatedly enters and exits inspect, launch and Kerr while checking workers, render targets, textures, camera locks and memory trend.
- Measure search hot/cold latency and focus-command latency independently from frame-rate windows.

Verification:

- RTX 4060 named-hardware gate, single worker
- overview median at least 55 FPS; science scenes at least 45 FPS; P95 frame time at most 50 ms
- hot search below 50 ms; cold search below 150 ms; focus motion below 100 ms
- resource counts return to baseline after every cycle

Guards:

- Optimize presentation scheduling and lifecycle first.
- Do not lower scientific fidelity, change integrators or raise frozen visual budgets to pass the gate.

## Phase 6 — v174 Web Release Candidate Packaging

Implementation:

- Produce a checksummed Web standalone release dossier containing app version, content-pack versions, commands, machine profile, Browser QA, performance report, regression report, known limitations and rollback instructions.
- Mark the Web build as release candidate only when every product evidence file is present and internally consistent.
- Keep the science decision and blockers visible in the same dossier without treating them as product failure.

Verification:

- fresh staged cold start
- complete product evidence builder
- full serial regression and production build
- final desktop/mobile Browser QA

Guards:

- No claim of Tauri/MSI/NSIS/signing unless that separate track is actually built and tested.
- No claim of scientific-kernel promotion while the V6 comparison blockers remain.

## Optional Track A — Desktop Distribution

Only begin after v174. Package the same Next standalone runtime and content-pack contract through Tauri/WebView2, then independently verify Rust toolchain, random loopback port, file dialogs, OpenRocket allowlist, updater/rollback, MSI/NSIS and signing. Failure or deferral in this track does not invalidate the Web release candidate.

## Optional Track B — Scientific V2 Promotion Research

Generate independent per-body DOP853 comparisons for legacy and V2, isolate the 2PN and Lense-Thirring effects, define uncertainty-aware improvement criteria and rerun the full scientific evidence chain. Promotion is allowed only if the candidate improves the agreed metrics without weakening absolute gates or changing historical fixtures silently.

## Final Acceptance Definition

Orbit Atlas reaches its practical final form when phases 1-6 are complete: the Web standalone starts from a declared artifact set, all six scene families are usable on desktop and mobile, content and licenses are auditable, resources remain bounded on a 16 GB machine, product evidence is reproducible, and scientific limitations are explicit. Desktop installation and V2 promotion remain separately versioned capabilities rather than prerequisites hidden inside the product release status.
