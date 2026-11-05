# Nonlinear FO-CCZ4 SBP volume integration: prospective protocol

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns
- Origin Mode: implementation and bounded deterministic verification
- Origin Date: 2026-10-08
- Verification Status: PROSPECTIVE; NOT EXECUTED
- Version Label: nr-nonlinear-sbp-volume-v1

The preceding goal turn was a requested status assessment: no new kernel or
physical gate was completed. This turn must change the actual nonlinear RHS.
The complete single-hole/AMR/binary/waveform/CPU/GPU goal remains active.

## Objective and non-goals

Extract the existing nonlinear 58-field volume equations behind an explicit
first-derivative argument, with the legacy public RHS retaining its boundary
contracts. Couple that SAME nonlinear equation body to the existing SBP(4,2)
operator, not to flat matrices, regenerated auxiliaries, a modified equation,
or a post-processing correction. Include every derivative in the geometry,
ordering equations and transport, and every nonlinear source.

Introduce an explicit nonperiodic `sbp-volume` Grid3D label. It has no SAT or
physical boundary data yet. Old evolution/checkpoint entry points must reject
this label; no new time evolution or restart format is authorized by this
volume-only protocol. Do not pretend that a periodic or fixed-halo grid is an
SBP grid. Surface derivatives are computed, not zeroed or analytically reset.

This is a necessary component of the nonlinear boundary candidate, NOT a
boundary solver, stability theorem, black-hole evolution, or physical gate.

## Explicit source-identity transition

The parent is `tmp/nr-shadow-evidence/nr-k3-sbp-cube-v1-20261008/receipt.json`,
SHA256 `395e3068455ad9939e476d424b401794e82bb61aea50ebf4d589816dbdc7b886`.
Its source snapshots and all historical receipts stay unchanged. Of its262
current source files, only these inherited paths may change in this experiment:

- `science/numerical_relativity/fo_ccz4_rhs.py`, old SHA256
  `9f46de1be40409b4ee5412684df3ebb77cc96f2fc72ba9db43c42da9a883fdc3`.
- `science/numerical_relativity/nr3d.py`, old SHA256
  `07a88b18da845c5c77d048d1de8694b6b54719de1b4179ca360221511a819451`.

The new receipt must record old and new identities, verify every other inherited
source, hash the new protocol/module/tests/runner, and preserve source snapshots.
An old frozen runner is expected to reject the changed CURRENT source tree;
that is not permission to edit its source hashes or regrade its old evidence.
The archived old RHS is imported under a separate module name for bit-exact
rollback comparisons. Native0.5.0 source/binary remain unchanged.

## Frozen experiments and gates

Use Windows Python/NumPy with BLAS/OpenMP thread counts1, no installs and no
`.pyc` writes. Native equations and all scientific/live flags are unchanged.

1. Legacy equivalence: periodic FD2, periodic FD4, Sommerfeld-proxy FD2 and
   Schwarzschild fixed-halo FD4; include constant and state-dependent gauges,
   and tau0/1. Compare all58 RHS slots and two RK4 steps at dt=1e-4 against
   the archived pre-refactor RHS. Require exact bytes, not a tolerance.
2. Static curved volume: M=1, [1,3]^3, N17/25/33, analytic independent
   A/P initial fields, advective1+log, state-dependent profile(3,.2), tau1.
   All58 volume RHS slots should approach the stationary continuum value0;
   Ricci must approach the NONZERO analytic Schwarzschild tensor. No masking
   of surface RHS and no finite-difference auxiliary reconstruction.
3. Measure coordinate-component RMS on the fixed125 nodes
   {1.5,1.75,2,2.25,2.5}^3; both adjacent orders for RHS and Ricci error
   must be >=3. Separately measure tensor-product SBP-weighted whole-domain
   RMS and six-face RMS; require both errors to decrease there, reporting
   their orders without claiming globally fourth-order behavior. All norms
   used for order measurements must exceed2e-12; a subfloor result is
   inconclusive, not a measured order. Six-face samples count edges/corners
   with their face multiplicity, identically at each resolution.
4. Independent spatial arithmetic: rebuild the SBP matrix from rational table
   entries, WITHOUT calling SBP42.derivative/matrix. On an all58 nonlinear
   perturbation of the N9 Schwarzschild state (amplitude.005), compare the
   actual nonlinear RHS with this independently applied dense derivative.
   Require max absolute difference <=2e-11. This shares the nonlinear equation
   body and is not independent physics validation.
5. Local principal/source decomposition: on that same curved perturbed state,
   compare R(q,Dq)-R(q,0) against sum A^i(q)D_i q at five fixed points:
   (0,0,0),(0,4,8),(4,4,4),(8,8,8),(7,3,1). Assemble A^i from the existing
   independently contracted pointwise principal module, not flat scaling.
   Include the11 ODE rows. Require maximum absolute difference <=2e-11.
6. Nonlinear-to-flat consistency: N9, [-1,1]^3, fixed nonparallel smooth
   all58 perturbation. Symmetric finite-amplitude derivatives at amplitudes
   1e-3,5e-4,2.5e-4 must approach sum A^i D_i v+S v with both remainder
   orders >=1.8 and measurable norms >2e-12. This verifies the expected
   second-order central-amplitude remainder, not a nonlinear stability proof.
7. Save the three curved initial states, RHS and Ricci tensors and the small
   full58 perturbation input/RHS. Re-run in a fresh process/output directory.
   Require equal parsed scientific fields and byte-identical array/source
   artifacts; only elapsed seconds may differ. Preserve failures without
   changing these gates after inspecting outputs.

## Resources, outputs and execution

Entry: `D:/python/python.exe -B scripts/run-nr-k3-sbp-volume.py
--output-directory tmp/nr-shadow-evidence/nr-k3-sbp-volume-v1-20261008`.
Replay uses a distinct `nr-k3-sbp-volume-replay-v1-20261008` directory.
The runner refuses existing output paths. Record progress per case and a final
receipt even on a numerical gate failure. Total execution cap1200s, output
cap96MiB including a4MiB receipt reserve. C reserve3GiB; E reserve4GiB+32MiB.
Check resources before starting and between bounded cases. No cleanup or
duplicate restart of a live process. Fresh test temporary directories on E.

No physical boundary, strong-hyperbolicity, CPBC, black-hole, AMR, waveform,
GPU, runtime-writeback or scientificPayloadWriteback admission follows. A pass
allows the next stage-local nonlinear SAT design; a failure is retained and
diagnosed before coupling a boundary or porting this change to C++.
