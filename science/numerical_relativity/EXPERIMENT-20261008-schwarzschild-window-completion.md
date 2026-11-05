# Schwarzschild full-window completion: FD4, controls and replay v1

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns
- Origin Mode: implementation and bounded deterministic simulation, inline
- Origin Date: 2026-10-08
- Verification Status: UNVERIFIED (prospective frozen protocol)
- Version Label: nr-k3-schwarzschild-window-completion-v1

## Fixed identity and scope

Finish the scientific matrix of the original
[window protocol](EXPERIMENT-20261007-schwarzschild-window.md), NOT a weaker gate.
The original timeout and the separate FD2-only completion remain immutable.
Native0.5.0, all188 inherited sources, equations, dt, domain, gauges, stencils,
diagnostic definitions, noise floor and all scientific thresholds stay unchanged.
Add only this completion runner and its tests. No rebuild or live writeback.

FD2 anchor SHA256: `e2a53d442dcf20ab3b915933a600490e1d1dea4714d7540b6525b5e677603141`.
Binary SHA256: `fc7ffb4eb3b40fbe8547c7178eb3f274f5ccbc6f6fa5d5f1decd1e2f1f761cbc`.
All previous receipt/source/artifact identities are checked before each batch.

## Three ordered execution batches

1. `fd4`: retain the12 completed FD2 primary samples and4 declared splits.
   Continue FD4/N17,N25,N33 from their retained T=.125 checkpoints to
   T=.25,.5,1 using at most32 steps per invocation,4threads,dt1/256.
   Save all21 new checkpoints and full diagnostics:9 primary plus12 splits.
   The complete primary grid/time matrix is then24 samples (15 retained,9 new).
   Compute all30 original refinement groups, including the retained FD2 ones.
2. `controls`: expanded FD4/N25 box[.5,3.5]^3 with identical dx to mainN17;
   compare ALL initial58 slots on the shared[1,3]^3 grid byte-for-byte.
   Evolve toT=.125,.25,.5,1 in32-step segments (eight commands), saving all
   samples and the four original same-position boundary comparisons.
   Then continue retained FD4/N33/dt1/512 fromT=.125 toT=.25,.5,.75,1
   (fourteen32-step commands). Save all14 samples; .75 is the original
   declared split, three times receive all13 signed-field timestep checks.
3. `replay`: FD4/N17 from originalT0,256 steps in ONE native invocation
   on1thread, compared with staged4threadT1. Both checkpoint AND manifest
   must match byte-for-byte. No substitute split replay or reduced interval.

All62 distinct saved diagnostic samples enter the finite-window guard:
24 primary,4 expanded primary,3 time-control primary,one declaredT=.75
time split, and30 other retained/new execution splits. Serial replay has
identical fields to its compared sample and is verified separately.

All58 interior variables evolve independently. No projections, auxiliary
reconstruction, threshold retuning, discarded failures or reference fill-in.
The analytic halo is tested for exact byte preservation, including signed zero.

## Original decisions, unchanged

- Five primary metrics on the same125 physical nodes: state error, H, M,
  Ricci error, vacuum Weyl invariant error. AtT=.25,.5,1 both adjacent
  measured refinement orders must be>=1.5(FD2) or>=3(FD4). Floor2e-12;
  allbelow bounded-null passes, mixed floor remains unresolved/false.
- Each of39 signed timestep differences requires ratio<=.05 or both
  norms<=2e-12, exactly as in the original protocol.
- Every saved sample: finite,0<alpha<2,chi>0,all-active state maxerror<=.01,
  analytic halo error<=2e-14. This is a numerical excursion bound, not accuracy.
- Boundary-location differences remain descriptive, not a pass/fail gate.
  They do not by themselves prove a reflection coefficient, causal arrival
  or accuracy of either domain. All13 fields and all four times are required.
- `completed` means the full matrix is present, NOT that it passed.
  `window_passed` additionally requires all30 refinement groups,39 time
  checks, all sample guards and exact replay. Physical, boundary, fullBH,
  AMR, waveform, CUDA and scientific/live-writeback admission remain false.

Numerical failure does NOT stop collection of remaining controls. Execution
failure stops that batch; no automatic retry. Later batches require a completed
preceding execution receipt, NOT a favorable numerical result. Process exit0
means execution completed; callers MUST inspect scientific flags separately.

## Resources and preservation

New evidence is stored in a fresh child of
`E:/86137/myai/solar_sim/next-web/tmp/nr-shadow-evidence/` to preserve C capacity.
No old evidence is moved/deleted; this increases local retained disk usage.

| Batch | Execution cap | Artifact cap / reserve | Native invocation cap |
|---|---:|---:|---:|
| fd4 |2000s|256MiB /32MiB|180s|
| controls |2400s|384MiB /32MiB|180s|
| replay |900s|64MiB /8MiB|600s|

The new three-batch chain additionally has a5000s cumulative execution cap.
Both E and C must retain>=4GiB+32MiB before each invocation and at completion.
Record new batch seconds, cumulative extension seconds and combined time with
the prior1257.3827551s attempts. The original resource contract remains failed.
The explicit600s exception is only for the required UNSPLIT serial replay;
it does not change the old failed command or the scientific criteria.

All intermediate checkpoints/manifests/logs and source snapshots remain saved.
No installation, environment changes, cleanup, artwork edits, commit or push.
No source/protocol changes while any batch or subsequent batch is in progress.

Entry point: `python -B scripts/run-nr-k3-schwarzschild-window-completion.py`.
Use `--stage fd4|controls|replay` and a new `--output-directory` for each.
Controls/replay additionally require the exact preceding `--parent-receipt`
and independently checked `--parent-sha256`. A failed numerical assessment
must not be silently reclassified by a later execution stage.
