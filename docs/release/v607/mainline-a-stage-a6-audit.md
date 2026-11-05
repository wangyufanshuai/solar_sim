# Mainline A — A6 performance and delivery audit

Build records corrected on 2026-09-10. This audit concerns the Gaia art and knowledge presentation layer. It does not modify EIH, Newton N-body, 2PN/Lense–Thirring, or Kerr kernels. The latest production build passed; its source binding remains `not-established`, and `finalReleaseQualified` remains `false`.

| Requirement | Current evidence | Remaining work |
|---|---|---|
| Production build | Latest `vercel-lite` build: session `5869`, `.next-mainline-a-v607-final2`, build ID `b0Qlo9DpNH8k4uiXN1wF3`, exit code 0, 10 static pages. Its raw receipt reports native SWC, 8 GiB heap and qualified standalone topology. | Establish immutable build-input provenance; qualify standalone-full and Lite behavior under the measured runtime budget |
| TypeScript checking | The production build passed with the filtered `.atlas-build-tsconfig.json`. The latest full-workspace `tsc --noEmit --incremental false` exits 2 only because `app/lib/kerrObservationEnvelopeV560.test.ts` imports the missing `dist/science/kerr-sparse-observation-envelope-v560/manifest.json`; the A3 fixture type error is resolved. | Resolve the missing artifact through its authoritative science workflow before claiming full-workspace TypeScript success; do not fabricate a manifest |
| Device frame-time/GPU budget | Existing application exposes FPS, p95, frame-sample, GPU/resource and canvas diagnostics | Collect new desktop/mobile samples on the final build; historical v263/v275/v300/v596 numbers do not prove v607 performance |
| Resource lifecycle and memory | Existing V300/V596 tools establish sample and teardown semantics | Capture before/peak/after for repeated object focus transitions, then 30-cycle heap samples and resource return; do not treat a DOM screenshot as memory evidence |
| Sources, bands and credit | A1/A3 contracts retain page IDs, direct URLs, exact credit and band encoding; acquisition receipt has per-image hash, size and dimensions | Per-image rights review and local texture manifests are complete for six images; remaining six first-set markers still require future image acquisition and review |
| Reproducible release packet | `build-mainline-a6-release-packet.mjs` creates a deterministic ZIP with a complete hash inventory; verifier checks archived bytes and worktree drift. The build helper does not consume the ZIP, so these checks establish no binding to build inputs. | Review this overlay with the complete repository; establish build-input provenance and complete final runtime checks and assets |

## Commands and records

The latest successful build invocation used this PowerShell environment and command:

```powershell
$env:ATLAS_BUILD_RECEIPT_NAME = 'atlas-mainline-a-v607-lite-build.json'
$env:ATLAS_NODE_HEAP_MB = '8192'
$env:ATLAS_ROUTE_OVERLAY = 'on'
node scripts/build-atlas-profile.mjs --profile vercel-lite --dist-dir .next-mainline-a-v607-final2 --previous-dist-dir .next-mainline-a-v607-final2-previous
```

The shell process was observed through session `5869` until its terminal result, `exit_code: 0`. The latest raw receipt, `dist/release/atlas-mainline-a-v607-lite-build.json`, and `.next-mainline-a-v607-final2/BUILD_ID` both identify `b0Qlo9DpNH8k4uiXN1wF3`. The receipt reports the route overlay as 264 directories, including 202 historical evidence routes. Compilation took 22.1 seconds and production TypeScript checking took 23.6 seconds, with 10 static pages. These are phase timings from this build's output, not a complete elapsed-time benchmark. The build is recorded in [mainline-a-stage-a6-build.json](./mainline-a-stage-a6-build.json).

All three completed production runs remain distinct:

| Run | Session | Dist directory | Build ID | Exit | Compile / production typecheck | Static pages |
|---|---|---|---|---|---|---|
| Historical A6 | `81051` | `.next-mainline-a-v607-a6` | `sTK3yfNJPS3ESOQwfMbfr` | 0 | 27.7 s / 27.0 s | 10 |
| Historical final | `42031` | `.next-mainline-a-v607-final` | `H5WDBj-Fb36aJLLe4ChTM` | 0 | 20.4 s / 22.7 s | 10 |
| Latest final2 | `5869` | `.next-mainline-a-v607-final2` | `b0Qlo9DpNH8k4uiXN1wF3` | 0 | 22.1 s / 23.6 s | 10 |

The first run used the helper's default receipt name. Later runs used `ATLAS_BUILD_RECEIPT_NAME=atlas-mainline-a-v607-lite-build.json`, whose current content describes only final2; the earlier identities and timings are retained as historical observations. Do not combine one run's timing, receipt or build ID with another run. A read-only `node --version` check after the latest build returned `v24.14.0`; that shell observation is not a separate build-runtime receipt.

The production helper generates `.atlas-build-tsconfig.json` with application and generated route types while excluding test files, `tests/**`, `scripts/**`, `tmp/**` and the default `.next/**`. Production success therefore does not supersede the observed full-workspace `tsc` failure (exit code 2) caused by the missing v560 science manifest. The A3 fixture type error was corrected and targeted tests pass; the latest full-workspace check still reports only the authoritative science import.

Generate and verify the source/evidence overlay after all stage edits are complete:

```text
node --test scripts/build-mainline-a6-release-packet.test.mjs
node scripts/build-mainline-a6-release-packet.mjs
node scripts/build-mainline-a6-release-packet.mjs --verify-existing
```

Output: `dist/release-exports/mainline-a-v607/mainline-a-source-evidence.zip`. Its receipt is [mainline-a-stage-a6-release-packet.json](./mainline-a-stage-a6-release-packet.json). This is an overlay for the existing repository; it includes the mainline source, build configuration, lockfile, source records and stage evidence. It excludes its own external receipt to avoid a circular hash. It contains an internal `MAINLINE-A-MANIFEST.json` and `REPRODUCE.md`.

The current regenerated packet contains 147 source/evidence files and verifies against the worktree. Its receipt records the archive byte count and SHA-256. It includes the h08 camera telemetry receipt plus the prior Rb2 HTTP, A2 visual, A5 lifecycle, and A6 browser-performance receipts; those older browser receipts require rebind after the telemetry rebuild, so this remains a review packet rather than final release qualification.

The packet verifier checks archive integrity and agreement with the worktree at verification time. The build does not use that ZIP as an input, its raw receipt has `candidateSourceManifestSha256: null`, and no immutable input manifest binds the latest build to the archive. Even a successful post-build packet verification leaves `sourceBinding: not-established`; it cannot prove which exact source bytes the build consumed. Because this correction changes packet-eligible evidence documents, regenerate and verify the packet after all parallel edits are complete before reporting the packet as current.

## Performance collection criteria

Use the existing application's established thresholds from `atlasPerformanceQualificationV300.ts` for comparable evidence: at least 10,000 ms per sample, at least 241 rendered-frame samples, overview median FPS at least 55, scene median FPS at least 45, and frame p95 at most 50 ms. Record the adapter; software rendering is not evidence for the workstation GPU. For catalog presentation the existing GPU increment budget is 32 MiB. Missing values remain missing.

Capture overview, constellation (Orion), nebula (M42), and stellar (Betelgeuse) paths on desktop and mobile. Each observation must retain the build identity, viewport, quality mode, visible object ID, canvas count, start/end timestamps and raw runtime diagnostics. A mobile viewport on this workstation must be labeled viewport emulation; it does not establish physical-phone performance. The current 30-cycle focus resource identity sample is recorded in [A5 lifecycle evidence](./mainline-a5-focus-lifecycle-current-20260913.json); a heap slope and physical-device run remain separate gates.

A6 remains in progress until real-device interpretation, long-task review, h08 browser rebinds and release checks are complete for the intended final build. The prior Rb2 Codex In-app Browser sample passed the frame budget on desktop and 390×844 emulation with zero console/page errors; see [browser performance evidence](./mainline-a6-browser-performance-current-20260913.json). It does not establish physical-device performance or h08 binding. Full-workspace `tsc` is now clean for the current tree except the authoritative v560 science manifest chain remains absent in the unbuilt historical import path; see [science blocker](./mainline-a6-science-manifest-blocker-20260913.json). Packet/worktree agreement cannot qualify a final release, so `finalReleaseQualified` remains `false`.

## Current listed-input build and asset delivery (2026-09-10)

The new `node scripts/build-mainline-a6-bound-profile.mjs` run exited 0 (session 55295), build `KPEQxmoz4FJ5OA-_XrXDC`. It captured 5375 app-tree, script, configuration and mainline-image files before the build, passed their digest to the profile builder, and confirmed the same list and hashes afterwards. The profile receipt contains that input digest. This qualifies the listed inputs only: node_modules/native tools, environment values, other public assets and generated inputs outside the listed trees remain unbound. See [bounded build](./mainline-a-stage-a6-bound-build.json) and its log.

The compiled production service returned HTTP 200 for the entry page and all twelve current Mainline A JPEGs; every served JPEG matched `image/jpeg`, reviewed SHA-256, and byte size (3,324,626 bytes total). The Rb2 service used port 3017 and the bound standalone launcher; see [current HTTP evidence](./mainline-a6-http-assets-current-20260913.json). This is delivery evidence, not browser or device-performance acceptance.

The current in-app Browser module is unavailable in the active environment. Six stellar SVGs were rasterized from the real React component and inspected as [a contact sheet](./visuals/stellar-portraits-v607.png); that check does not establish CSS layout, click handling, FPS or GPU memory in a browser. Final acceptance remains pending.
