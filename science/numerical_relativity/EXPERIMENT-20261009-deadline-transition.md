# Explicit source transition: RK locality deadline boundary

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns
- Origin Mode: prospective engineering correction and source-lineage validation
- Origin Date: 2026-10-09
- Verification Status: PROSPECTIVE; NO NEW PHYSICAL VALIDATION
- Version Label: nr-deadline-transition-v1

## Authorized scope and retained failures

Correct the already observed 900-second deadline failure without changing any
physics equation, simulation parameter, numerical threshold, storage reserve,
or completed experimental artifact. The old 1298-pass/1-fail report remains
unchanged. The old Schwarzschild T=1M failures remain failures.

The closed nonlinear SAT parent/replay and independent audit are immutable:

- `nr-k3-nonlinear-sat-v1-20261009/receipt.json`:
  `e51a2b6dd4ad3ec3ed613135ef67561dae2ba3c6d9f105f90ac1464ae6d7a281`.
- `nr-k3-nonlinear-sat-replay-v1-20261009/receipt.json`:
  `bdacba46c4cb2ab04d3e80cc660ce242eaf4eb7e65604b6aaf5ab6495a5b39d4`.
- `nr-k3-nonlinear-sat-audit-v1-20261009.json`:
  `1e6149bb69b53826b0dde9be17cbbba72b6b71b6a65226d52d847c45513be7c6`.

Only two inherited files may differ from that parent:

| Path | Parent SHA256 | Permitted change |
|---|---|---|
| scripts/run-nr-k3-rk-stage-locality.py | e3e448edf7bdde7b570bc4628972192a91901dddbf353109b822934792b24eb7 | Evaluate remaining time against `started+900` directly; no grace interval |
| scripts/tests/test_nr_rk_stage_locality.py | b488b7f82f3e39519202eb767630b1e7a866cf240a4fdf8628a1bb7ee7358687 | Deterministic representable-before/at/after deadline regression cases |

## Diagnosis and acceptance

The expression `900-(now-started)` can leave a positive floating residual at
the represented value `now=started+900`. Compare to the represented absolute
deadline instead. Require strict positive remaining time: at and after the
deadline must fail; the immediately preceding representable value may proceed
with exactly its remaining budget. Preserve the per-command 180s cap.

First retain a failing regression with controlled clock origins. Then require
the expanded old runner tests and the previous merged focused regression
(including the new nonlinear auditor) to pass. Do not rerun real scientific
campaigns merely to repair this resource-guard defect.

## New lineage, not rewriting history

Verify every old parent/replay artifact against its frozen manifest, including
old source snapshots. Compare current inherited files against those snapshots;
only the two listed edits are allowed. Verify independent-auditor identities
and the retained native binary. Snapshot the new current source set and bind
the new regression report to a fresh transition receipt.

The old runners/auditors keep their strict current-source checks: they are
expected to reject this newer checkout if invoked directly. Historical replay
must use the retained snapshot; subsequent experiments explicitly inherit the
new transition receipt. Do not disable ancestry checks globally or claim the
old scientific result was produced by the newer source version.

Fresh E-drive directory only. C>=3GiB; E>=4GiB+32MiB. No cleanup, installs,
native rebuilds, art changes, live promotion or scientific payload writeback.
