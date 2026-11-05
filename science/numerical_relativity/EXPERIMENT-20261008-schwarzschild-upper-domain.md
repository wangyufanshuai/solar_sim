# Schwarzschild upper-face-only domain control v1

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns
- Origin Mode: prospective deterministic simulation, inline
- Origin Date: 2026-10-08
- Verification Status: UNVERIFIED (frozen before native execution)
- Version Label: nr-k3-schwarzschild-upper-domain-v1

## Question and immutable predecessors

The last turn was assessment only, not a new kernel result. This study tests
whether the retained domain-difference convergence anomalies persist when ONLY
the three upper coordinate faces move. It does not identify a reflection
coefficient or prove a unique causal mechanism.

Retain the original [1,3]^3 failed T=1 window, SHA256
`2aef22efc6bbb38fbbdcfed2211071487a709a81f01fab3a35fec99d360591c2`.
Retain the later [.5,3.5]^3 failed matched-domain study, SHA256
`7e8ed82d234b56309c54093298ec475da4f00a2e47eea5a052a48026bd2d2157`,
and its completed audit, SHA256
`72604cc5c78215806d920e0704aa8efae7d52d63edeb5ae846413f8ee930b652`.
Neither failure is rescored. The old expansion added a stronger-curvature inner
region; this study does not. New upper-side active cells still introduce their
own truncation error, so even this control does not isolate pure reflection.

## Fixed setup

Use the SAME Windows native 0.5.0 binary, SHA256
`fc7ffb4eb3b40fbe8547c7178eb3f274f5ccbc6f6fa5d5f1decd1e2f1f761cbc`.
No rebuild or equation, gauge, relaxation, stencil or diagnostic change.
All 58 slots evolve independently with FD4 and RK4; the two analytic fixed
layers remain fixed at every RK stage. M=1, G=c=1, tau_inverse=1 and the
existing field-dependent gauge profile are unchanged. This is an exterior
cube, not a horizon, puncture, excision or physical boundary experiment.

| Original grid on [1,3]^3 | New grid on [1,3.5]^3 | Spacing |
|---|---|---|
| 17 | 21 | 1/8 |
| 25 | 31 | 1/12 |
| 33 | 41 | 1/16 |

Keep all lower faces at 1 and all 125 primary observation nodes at
{1.5,1.75,2,2.25,2.5}^3. No interpolation, state overwrite or new measurement
region. Compare shared initial coordinates <=2e-15 and all 58 slots <=2e-14;
record byte equality independently. Fixed halo bytes must equal their own
saved initial bytes exactly. Initial rounding cannot be repaired by copying.

## Five ordered batches and outputs

1. `n21`: fresh analytic initial data, dt=1/256; eight 32-step four-thread
   calls save T=.125,.25,.375,.5,.625,.75,.875,1.
2. `n31`: the same schedule on N31.
3. `n41`: the same schedule on N41. Complete the three-grid assessment and
   12 original/new domain comparisons at T=.125,.25,.5,1.
4. `dt41`: fresh N41 initial data with all slot bytes equal to the main
   initial state, dt=1/512; four 128-step calls save T=.25,.5,.75,1.
   Compare all 13 signed diagnostic fields at T=.25,.5,1.
5. `replay`: one 256-step, one-thread N21 run from the same initial data.
   Checkpoint AND manifest must match the staged four-thread T=1 files.

Exactly 31 distinct diagnostic samples: 3 initials + 24 spatial outputs +
4 half-step outputs. The separate half-step initial and serial replay are
identity controls, not extra diagnostic samples. There are 29 new native
calls, not 31 simulations. Retained baseline computation is reported separately.

## Prospective decisions

- At T=.25,.5,1, compute state/H/M/Ricci/vacuum-Weyl-proxy RMS on all three
  new grids: 15 groups. Require BOTH adjacent observed orders >=3, using
  ratios 1.5 and 4/3 and the existing 2e-12 measurability floor.
- Apply the identical rule to SIGNED FIELD DIFFERENCES between the original
  and new domains: another 15 groups. This is not subtraction of RMS norms.
- Preserve the existing all-below-floor bounded-null and mixed-floor
  unresolved rules; an unresolved group is not a pass.
- All 39 timestep comparisons use the original <=5% ratio or both-below-floor
  rule. Two timesteps test sensitivity, not temporal convergence order.
- All samples require finite values, 0<alpha<2, chi>0, active-state maximum
  deviation <=.01 and analytic halo error<=2e-14. These are boundedness
  screens, not universal physical accuracy targets.
- Execution completion and numerical success remain separate. Study success
  requires all declared groups, controls, boundedness and byte replay.
- Independently rerun diagnostics in another process, checking sample identity,
  manifests, halo bytes, all spatial decisions and all signed controls. This
  uses the same frozen geometric definitions, NOT a third-party solver.
- Numerical failures do not stop controls; execution errors stop the batch
  without automatic retry. Never select a favorable subset to rescore a run.
- All physical, boundary, black-hole, AMR, waveform, GPU, live and scientific
  payload admission flags remain false even if this diagnostic study passes.

## Resource contract

New files only in fresh E-drive children of `tmp/nr-shadow-evidence`.
User reserves: C>=3GiB; E>=4GiB+32MiB plus next-output headroom.
No deletion, moving previous evidence, installs, art edits, commit or push.

| Stage | Stage seconds cap | Output cap | Next-output headroom | Native call cap |
|---|---:|---:|---:|---:|
| n21 | 900 | 128MiB | 16MiB | 180s |
| n31 | 1400 | 256MiB | 32MiB | 180s |
| n41 | 2200 | 448MiB | 48MiB | 240s |
| dt41 | 2600 | 288MiB | 48MiB | 700s |
| replay | 700 | 32MiB | 8MiB | 600s |

Total new stage-chain cap: 7800s, excluding tests and audit. Independent
audit cap:1200s/8MiB. Runtime limits are prospective budgets, not performance
claims. Check process status on the same live handle and communicate within
60s; do not restart because a tool observation timeout expires. A native
call can be silent until its bounded segment finishes. Only the declared hard
timeout may terminate it; a numerical failure is retained as evidence.

Each stage records current and snapshotted source hashes, binary/protocol
identity, parent receipt hash, command/exit metadata and artifact hashes.
Check source and protocol identity again at completion. Tests use synthetic
fixtures and are not scientific evidence.

## Entry points

`D:\python\python.exe -B scripts/run-nr-k3-schwarzschild-upper-domain.py`
requires `--stage n21|n31|n41|dt41|replay` and a fresh `--output-directory`.
Later stages require the previous `--parent-receipt` and `--parent-sha256`.
The independent audit uses `scripts/audit-nr-k3-schwarzschild-upper-domain.py`
with the final receipt, its SHA256 and a new output directory.

No new physical claim is derived from external literature in this experiment.
The original FO-CCZ4 and boundary-method limitations remain those recorded in
`ANALYSIS-20261007-boundary-admission-gap.md` and the prior domain protocol.
