# Schwarzschild longer-window and boundary-location study v1

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns
- Origin Mode: implement diagnostics and run deterministic simulation, inline
- Origin Date: 2026-10-07
- Verification Status: UNVERIFIED (prospective frozen protocol)
- Version Label: nr-k3-schwarzschild-window-v1

## Purpose and unchanged numerical model

Extend the exact same native0.5.0 Schwarzschild exterior study fromT=.125 to
T=1M. No solver edits, rebuild, stencil/gauge/damping changes, projection,
interior replacement or threshold retuning. A fixed analytic halo is a test
boundary, NOT a physically admitted absorbing/constraint-preserving condition.
Passing this experiment cannot admit black-hole, AMR, horizon, waveform or live.

Parent receipt SHA256:
`118aa862fd0646a122a9b1d5e60ac1d8737875ec2cb098ffd404d8781366a964`.
Native binary SHA256:
`fc7ffb4eb3b40fbe8547c7178eb3f274f5ccbc6f6fa5d5f1decd1e2f1f761cbc`.
All182 inherited source files, parent503 artifacts, old receipt and binary
must match. Add only the window diagnostic, runner and their two test files.

## Frozen execution matrix

1. Continue all six FD2/4 x N17/25/33 parent checkpoints atT=.125,
   dt1/256, lambda1, domain[1,3]^3, toT=.25,.5,1 (32,64,128 new RK4 steps).
   All58 interior fields evolve independently; the two outer layers remain
   prescribed. Store each checkpoint/manifest and diagnostics, not just exits.
2. Boundary-location control: FD4,N25,domain[.5,3.5]^3,M1,dt1/256. This has
   EXACTLY the same dx=.125 as base N17 on[1,3]^3. Start fresh and output at
   T=.125,.25,.5,1. Require identical initial58 fields over the entire shared
   [1,3]^3 grid. Compare the same physical125 interior points; no interpolation.
   Moving BOTH boundaries is the only altered setup. The more inward part of
   the expanded box remains outside r=M/2; no horizon/excision claim.
3. Time-step control: continue the retained FD4/N33/dt1/512 checkpoint atT=.125
   toT=.25,.5,.75,1, using64,128,128,128 steps. TheT=.75 checkpoint is a declared
   execution split, retained but not a primary diagnostic time. Compare both
   signed state and signed constraint/reduction/curvature fields atT=.25,.5,1.
4. Deterministic replay: FD4/N17 original initial state,256 steps on1thread,
   compared byte-for-byte (checkpoint AND manifest) with the staged4threadT1.

## Diagnostics and decisions

Evaluate the original125 common physical positions[1.5,2.5]^3 for all norms.
Primary metrics remain all58 state error, independent H/M constraints, Ricci
error, vacuum Weyl invariant error. Independent physical-metric diagnostic
definitions and analytic static reference are unchanged.

For each of FD2/4 andT=.25,.5,1 and each of the five primary norms: both
adjacent refinement orders must be>=1.5 or>=3.0 respectively. These30 groups
are new; do not claim the inheritedT=.125 data were rerun. Use nonuniform
resolution ratios24/16,32/24, common absolute floor2e-12. Allbelow is bounded-null;
mixed floor is unresolved/false. Report failures without stopping the rest of
the declared numerical matrix. Execution failure stops; no automatic retry.

Also report A/B/D/P/Ghat, det(h)-1, tr(h^-1 a),Theta. The diagnostic derivatives
use independent polynomial-moment weights, not evolution auxiliaries. At each
saved sample store a seven-position error profile along(x,2,2),
x=1.25,1.5,1.75,2,2.25,2.5,2.75. Near-edge diagnostics may use one-sided
polynomial closure and are DESCRIPTIVE, not a hidden extra convergence gate.
Record all-active-cell state error separately from the common interior.

Finite-window guard: at all saved main/control samples, finite data,
0<alpha<2 and chi>0, unchanged halo bytes, and all-active maximum state error
<=.01. This is a declared numerical excursion bound, not scientific accuracy.

Time-step differences: per signed core field, RMS(dt-dt/2)/max(RMS(dt),2e-12)
<=5%, or both norms<=2e-12 (bounded null). Require all13 fields at all3 times.
Do not infer a temporal convergence order from a noise-level difference.

Boundary-location differences are NOT graded as pass/fail. Record absolute
signed-field RMS difference, base analytic/reduction error, ratio and whether
absolute difference exceeds2e-12. A resolved difference is evidence of domain
sensitivity on this grid, NOT proof of a reflection coefficient, causal arrival,
well-posedness or accuracy of either box. Use the actual comparison, not elapsed
time alone, to discuss boundary impact. A coarse expanded-domain control is not
a substitute for subsequent two-domain grid refinement.

Overall window pass requires complete matrix,30 refinement groups,39 signed
time-step checks, finite-window guard and replay. The physical boundary and
full black-hole admission remain false regardless of this local result.

## Resources and preservation

After immutable parent preflight, execution<=1200s; each native call<=180s.
Output<=384MiB with32MiB reserve; Cfree>=4GiB+32MiB,Efree>=1GiB. Follow exact
process handles; no restart just because an observation yields no output.
No installs, external data uploads, artwork/live changes or cleanup. Preserve
failed/incomplete receipts and all outputs; no overwrite or silent extension.

`python -B scripts/run-nr-k3-schwarzschild-window.py --output-directory C:/Users/86137/NRShadowEvidence/nr-k3-schwarzschild-window-v1-20261007`

Sources: this is a controlled extension of the inspected
[parent protocol](EXPERIMENT-20261007-schwarzschild-domain.md), not a new
literature claim or a reproduction of a published long black-hole run.
