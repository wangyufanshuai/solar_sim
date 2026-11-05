# Orbit Atlas v192 readiness dossier

Status: **host-validated-install-qa-pending**

The host validation chain is complete. This is not yet the final dual-end RC claim because MSI/NSIS install QA is pending on the user's second Windows 11 computer. The eventual evidence-based label would be `web-and-desktop-beta-rc-ready-science-shadow-retained`; it has not been applied.

## Verified now

- Next 16.2.10, React 19.2.7, R3F 9.6.1, Three ^0.170.0.
- standalone-full production build passed; cold Canvas-ready JS 644905 B (hard limit 655360 B).
- vercel-lite production build passed; cold Canvas-ready JS 644907 B (hard limit 655360 B).
- Camera bridge split: public bridge 292 lines; focus runtime 642 lines.
- Science decision is `shadow-retained`; default remains `legacy-eih-1pn`, V2 remains `eih-1pn-2pn-lt` shadow-only.
- Full regression is 673/673 across 107/107 test files. Content integrity is 805/805 files across 6 packs.
- All 45 recorded missing assets were restored byte-for-byte. Frozen V9 was copied from an exact checksummed v167 content-pack artifact and was not regenerated.
- Fresh Chrome QA passed at 1440x900 and 390x844 with one Canvas, no horizontal overflow, no console/page errors, no 4xx/5xx responses, Escape close and focus return verified.
- The 10-cycle production soak passed: heap 41138052 -> 43978040 B; textures 27 -> 27; programs 28 -> 28.
- RTX 4060 production performance passed all five scenes; overview median 121 FPS and worst recorded P95 12.5 ms. Draw-call value 1 is observational only and is not used as optimization proof.
- Desktop Rust fmt/check/test/release-check passed with 3/3 unit tests.
- Desktop compact MSI/NSIS builds passed from the v192 stage (220.9 MiB, 2738 files); both installers are intentionally unsigned and second-computer install QA remains pending.

## Release blockers

- **desktop-install-qa:** MSI/NSIS install, launch, exit, uninstall and reinstall matrix is pending on the user's second Windows 11 computer

## Maintainability gates

| Source | Lines | Target | Result |
|---|---:|---:|---:|
| UniverseRuntimeController | 49 | <1200 | pass |
| AtlasRuntimeWorkbench | 1593 | <1600 | pass |
| Camera public bridge | 292 | <650 | pass |
| Camera focus runtime | 642 | <650 | pass |
| Rust lib.rs | 9 | <600 | pass |
| Rust commands.rs | 844 | domain module | pass |
| Rust lifecycle.rs | 113 | domain module | pass |
| Rust resources.rs | 56 | domain module | pass |

## Evidence SHA-256

- `dist/science/scientific-evidence-v7.json`: `634a366ac20226de9dfb175eac57706aa273211d2fdb2169836224163b7c5b0e`
- `dist/science/relativity-dop853-v7-report.json`: `27cdc19da3277fb4ed17fa5e6e2267daa8d2a5dbfc1c3c9af8ff10ea2ade08be`
- `dist/science/content-pack-integrity-v192.json`: `0f09234010136557573361c6538611b3e3057dd7cc30f7695c6467bf92af1fe6`
- `dist/science/client-bundle-v192-standalone-full.json`: `5b0c644fa5ca2ffec7a300a2bffe102ea726c6ce813b6b7a8f3a2645bb37aca4`
- `dist/science/client-bundle-v192-vercel-lite.json`: `4f03f8aedbf22ac01fab29c3a0d448df14c2c2b623130099717a760ab00b5b83`
- `dist/science/browser-qa-v192.json`: `7c3ac4daa66c092580c8d1a87f3f65c92de2587cf2fba7b35bb472171ff5e1db`
- `dist/science/lifecycle-soak-v192-report.json`: `51b948a06c8053e3af958209df8a2d4d9cffdaa52eae796ba5cb70f3f4443689`
- `dist/science/performance-v192-report.json`: `6805ae210c7c8a3a74ad8c898c34b4fee6a992e86621c741a19fd3267e107d65`
- `dist/science/desktop-rust-v192.json`: `5f6d0488df374ac35074ffea36c447ae06cb721a49b6c0cd4f5a0c6d36c3a9b4`
- `dist/science/desktop-build-v192.json`: `b14cc540c4c1ae9ba1b22c963f2cc5c0017810538fc0ba11677f44434488362c`
- `dist/release/orbit-atlas-v192-content-recovery.json`: `15cfce889709ac015e895fd36dcfe7dcfbb7ce1d0dc1e7a1be1955ba44bb887f`

## Recovery result

All 45 recovery entries now match their recorded byte size and SHA-256 through the 805/805 content-pack verifier. The frozen V9 files remain exact restores; no regeneration or visual substitution was performed.
