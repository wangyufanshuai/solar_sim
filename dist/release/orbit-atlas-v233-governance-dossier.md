# Orbit Atlas v233 release governance dossier

Status: **governance-verified-product-candidate-science-failed-shadow-retained**

## Current authority

- Evidence manifest: `dist/release/orbit-atlas-current-evidence-v233.json`
- Manifest SHA-256: `9b897052d5a03984e75b78f177fe131e6a9e04baecc59d24d6b03655065c8ce8`
- Default scientific kernel: `legacy-eih-1pn`
- Scientific status: **failed-shadow-retained**
- Dense Kerr campaign: **failed**
- Dense Kerr accepted coverage: **3/49 shards**, 192/3097 rays, no partial aggregation
- Dense Kerr attempted coverage: **256 rays / 2048 executions**
- Dense Kerr failed shard: **3**, watchdog timeouts 4, automatic retry prohibited
- Variational STM: **smoke**, release qualification pending
- Weak-field per-body regressions: **15**

## Product evidence

- Content packs: 809/809
- Standalone Canvas-ready JavaScript: 594330 B
- Lite Canvas-ready JavaScript: 594330 B
- v255 catalog expansion: Gaia 46000; IAU 88; asterisms 32; clusters 96; nebulae 128
- v255 active Gaia budgets: mobile 1000; balanced 4000; dense 8000; closeup 1200
- Local product gates: passed

## Compatibility boundary

- The 603 root attributes remain the historical Browser compatibility snapshot.
- Current research progress is published on the non-root evidence surface.
- Root key hash remains `ac6470fcc517e1b2ba2c6618f530f7af57d1a0caa52fffae0af7232f912f9867`.
- No runtime or Worker physics, frozen scientific gate, fixture, V9 asset or visual budget was modified.

## Evidence precedence

1. Terminal aggregate/STM evidence when available; otherwise terminal campaign progress plus immutable failed-shard evidence.
2. Research campaign V13.
3. Current evidence V233.
4. This governance dossier.
5. README and Technical Overview summaries.

Historical V6/V7 reports remain immutable negative evidence and cannot replace the current authority.

## Dirty worktree inventory

- Entries: 695
- configuration: 7
- content-or-runtime-asset: 27
- documentation: 2
- generated-evidence: 2
- other: 31
- parent-workspace: 529
- source-or-test: 97

## Fail-closed blockers

- Dense Kerr V8 failed at shard 3; 4 watchdog timeouts are retained as immutable negative evidence and automatic retry is prohibited.
- Variational STM evidence is smoke-only; 30-day calibration and ten-year blind qualification are pending.
- The worktree has no authorized Git release baseline.
- Vercel Lite staging is verified at 599 files / 71.9 MiB with no loopback fallback, but Preview deployment is not confirmed: the claimable upload returned no URL or deployment id and the official CLI credential check timed out without output.
- Production deployment, domain migration, DNS rollback, signing and external Windows install QA were not performed.

No confirmed deployment URL or id was produced. No production deployment, DNS migration, signing, Git staging, commit, reset, revert or clean operation was performed.
