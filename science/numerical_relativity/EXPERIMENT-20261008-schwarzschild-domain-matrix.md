# Matched-spacing Schwarzschild domain matrix v1

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns; Exa Search
- Origin Mode: prospective deterministic experiment, inline
- Origin Date: 2026-10-08
- Verification Status: UNVERIFIED (freeze before new native evolution)
- Version Label: nr-k3-schwarzschild-matched-domain-v1

## Question, retained failure and scope

The completed original T=1 window FAILS two FD4 fine-pair H/Ricci groups.
Its immutable final SHA256 is
`2aef22efc6bbb38fbbdcfed2211071487a709a81f01fab3a35fec99d360591c2`.
The subsequent audit SHA256 is
`6993655b9d71015cef1d61d165f9c5f3c93abb47e7601b473aa65bcf9a99ed35`.
The previous goal turn was PROGRESS: completion plus reproduced numerical
failure and signed-error decomposition. There is no live process to resume.

Test whether the expanded [.5,3.5]^3 region has the expected spatial behavior
at matched spacings and whether differences between the two domains themselves
converge. Compare original N17/25/33 with expanded N25/37/49, respectively:
dx = 1/8, 1/12, 1/16. All diagnostics use the same original 125 physical nodes.

Retain the original failed decision even if this new study passes. Do not
selectively choose another grid triple to regrade it. Regional differences
remain field differences, NOT reflection coefficients. Expanded activity in
the stronger-curvature region is a confound; no causal claim follows alone.

Native 0.5.0, its binary hash, all equations, gauge, kappa values, finite-rate
relaxation, 58 independent slots, FD4 centered interior and two exact frozen
layers remain unchanged. No well-balancing, projection, reconstruction,
dissipation, new physical boundary, rebuild, installs or live writes.

## Four ordered batches

1. **n37:** retain all eight existing expanded N25 samples (.125 through 1 in
   .125 increments), including splits, and its initial checkpoint. Run expanded
   N37 from its fresh analytic T0 data to the same eight times, dt=1/256,
   four threads, 32 steps per invocation. Save every checkpoint and diagnostic.
2. **n49:** repeat the same eight 32-step invocations for expanded N49. Compute
   all 12 same-spacing domain comparisons: three grid pairs and four primary
   times (.125,.25,.5,1), with all original 13 signed fields.
3. **dt49:** expanded N49, dt=1/512, analytic T0 with all 58 state arrays
   byte-identical to the main N49 initial state. Four 128-step invocations save
   T=.25,.5,.75,1. At .25,.5,1 compare all 13 signed fields to dt=1/256.
   The larger call length is prospectively declared to limit disk use; it is
   NOT a retry or change to any previous resource contract.
4. **replay:** existing expanded N25 initial T0 to T1 in ONE 256-step,
   one-thread call; checkpoint AND manifest must equal retained staged
   four-thread N25 output byte-for-byte. This validates this coarse expanded
   case, not a serial N49 run or an external backend comparison.

The finite-window sample inventory is exactly 31 distinct diagnostics:
three spatial initials, 24 spatial positive-time samples, four half-step
samples. Nine diagnostics are retained (N25 initial + eight outputs),
22 new. The dt49 initial state is recorded separately and is field-identical
to the main N49 initial; serial replay is checked separately. New native calls:
8 + 8 + 4 + 1 = 21. Every intermediate output remains saved.

## Initial matching and floating point

Continuous initial data and spacings are identical in the shared [1,3]^3 box.
Non-binary dx=1/12 can cause different last bits when coordinates are formed
from different lower bounds. A pre-evolution check measured 4.44e-16 maximum
shared-field difference for N25/N37; byte equality was false.

For each declared pair require coordinate difference <=2e-15 and all-slot
initial difference <=2e-14 (the existing analytic-halo roundoff allowance),
record exact byte equality separately, and NEVER overwrite shared initials to
manufacture byte equality. All evolved halos must remain bit-identical to their
own saved initial checkpoint. There is no tolerance for halo byte drift.

## Frozen numerical decisions

- On expanded N25/37/49 at T=.25,.5,1, check state, H, M, Ricci and vacuum Weyl
  proxy RMS: 15 groups, each two adjacent rates >=3. Use the original ratios
  1.5 and 4/3, floor 2e-12, all-below bounded-null rule, mixed-floor unresolved
  rule. Do not change the diagnostic definitions.
- Independently apply those same >=3/floor rules to the RMS SIGNED FIELD
  DIFFERENCE between domains for the five metrics and three times: another
  15 groups. These are differences of fields, not differences of RMS norms.
- All 39 N49 timestep comparisons use the original <=5% or both-below-2e-12
  rule. Two timesteps do not establish a temporal convergence order.
- All 31 diagnostics: finite, 0<alpha<2, chi>0, active all-slot maxerror<=.01,
  analytic halo error<=2e-14; native/manifest/halo byte checks always apply.
- Exact declared replay and complete initial/time/domain identity are required.
- `study_completed` means the full matrix exists. `study_passed` additionally
  requires both sets of spatial groups, all time checks, all sample bounds and
  replay. Execution stage completion is separate from numerical success.
- Numerical failures do not stop remaining declared controls. An execution
  failure stops its batch with an immutable receipt; no automatic retries.
- Physical boundary, full black-hole, AMR, waveform, GPU, live and scientific
  writeback admission remain false even if this new study passes.

## Resources and preservation

All new outputs are fresh children of `tmp/nr-shadow-evidence/` on E.
User reserves remain C>=3GiB and E>=4GiB+32MiB. Before calls, require additional
E space for the stated next-output headroom, so our next checkpoint cannot use
the protected reserve. Check again at completion. Do not clean or move anything.

| Batch | Total cap | Output cap | Next-output headroom | Native call cap |
|---|---:|---:|---:|---:|
| n37 | 1400s | 320MiB | 32MiB | 180s |
| n49 | 2400s | 640MiB | 64MiB | 180s |
| dt49 | 3000s | 384MiB | 64MiB | 600s |
| replay | 800s | 32MiB | 8MiB | 600s |

New-chain total cap: 7200s. Approximate expected retained size is 1GiB;
N37/N49 raw checkpoint sizes are 23,503,184 / 54,589,328 bytes each.
No hardware speed claim or guaranteed runtime follows from the budget.
Snapshot source files and this protocol; verify parent hashes before every
batch. Do not change any frozen source or protocol until all batches terminate.
Tests are fixtures, not evolved evidence; test temporary outputs also use E.

## External method checks (not independent run evidence)

One targeted Exa search requested ten candidates (including mirrors). Selected
original material and GitHub code were read; this was not an exhaustive review.

- [Original FO-CCZ4 paper](https://arxiv.org/html/1707.09910v3): the 58-variable
  formulation's hyperbolicity proof is tied to specified gauge/ordering choices,
  and its numerical implementation uses ADER-DG and a subcell limiter. Its
  claims do not automatically validate this finite-difference boundary setup.
- [Well-balanced FD-WENO paper](https://arxiv.org/html/2406.05450v2): describes
  equilibrium-preserving schemes for a 54-equation FO-Z4 system. This is a
  possible future research direction, not a validated drop-in replacement for
  our 58-variable kernel. No reference-state forcing has been subtracted here.
- [GRChombo boundary source](https://github.com/GRTLCollaboration/GRChombo/blob/main/Source/GRChomboCore/BoundaryConditions.cpp#L593-L660),
  blob `98bd0d571fe34833211b1ed767669c56545de799`, uses componentwise radial
  Sommerfeld derivatives and second-order edge stencils in the read section.
  That implementation is not a proof of our nonlinear FO-CCZ4 CPBC.

No external code was copied, installed or run; sources are used for method
boundaries only. The HTML conversion's displayed date is not treated as the
original publication date.

## Entry point

`python -B scripts/run-nr-k3-schwarzschild-domain-matrix.py`
requires `--stage n37|n49|dt49|replay` and a fresh `--output-directory`.
Stages after n37 require the independently checked previous `--parent-receipt`
and `--parent-sha256`; unfavorable numerical results remain admissible parents
only when their execution was complete and error-free.
