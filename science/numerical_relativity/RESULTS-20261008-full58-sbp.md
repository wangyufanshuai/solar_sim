# Full58 SBP/SAT: linear-plane campaign and saved-state audit

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns
- Origin Mode: bounded implementation, simulation and separate-process audit
- Origin Date: 2026-10-08
- Verification Status: FROZEN LINEAR PLANE GATE PASSED; PHYSICAL GATES OPEN
- Version Label: nr-full58-sbp-v1

The new optional Python module couples all58 Minkowski-linearized FO-CCZ4
variables, including native damping and tau_inverse=1 trace relaxation, to
SBP(4,2) derivatives and incoming-characteristic SATs. This is NOT a nonlinear
three-dimensional boundary, physical CPBC, or a native-solver modification.

The prospectively frozen campaign contains24 spatial runs, six time controls,
four homogeneous-incoming controls and two split continuations. Full58 state
orders are3.01187--3.05798; TT-plus orders are2.86777--2.92193. Time orders are
4.04556 and4.02674. Source-inclusive energy identities, continuum TT reference
and exact split/restart comparisons pass. The operator remains interior-order4,
boundary-order2; no everywhere-fourth-order claim is made.

Metric Hamiltonian error in the general full58 family decreases at only
1.34167--1.56407 order. The frozen constraint criterion is decreasing error
or bounded null, NOT third/fourth-order constraints. That family is generally
off the constraint surface. Its nonzero constraint magnitudes are not physical
constraint decay. TT null fields are not assigned a fictitious convergence order.

## Reproducibility and independent reconstruction

- Main receipt: `tmp/nr-shadow-evidence/nr-k3-full58-sbp-v1-20261008/receipt.json`,
  SHA256 `e69c15474f85414dbc3dad3a440f1be07e7612c9b8c99df71e2f4e5665d2b9af`.
- Separate-process replay: `nr-k3-full58-sbp-replay-v1-20261008/receipt.json`,
  SHA256 `3dd987aa0869e3e6d178734f96439e41b5fe65dae7cd32dda2a2a0fbbc29ad00`.
  All parsed fields except elapsed seconds agree exactly. The source sets each
  contain255 files; all590 artifacts across both runs rehash correctly.
- Saved-state audit: `tmp/nr-shadow-evidence/nr-k3-full58-sbp-audit-v1-20261008.json`,
  SHA256 `e5d83fe051c3643abfd8e46d6a659791c287ba5f18cf50a008b12aefb75c279a`.
  All34 final states are reconstructed with a separately assembled dense SBP
  matrix and physical-metric/Christoffel tensor algebra. The maximum norm
  difference is3.9898639947466563e-17; spatial/constraint/time decisions agree.
  This still shares the stored principal/source matrices and is not independent
  third-party validation of the complete Einstein formulation.

The existing combined focused regression has1033 passed. The newly executed
auditor subset has9 passed and Ruff passes; these are separately executed suites,
not a claim that a combined1042-test invocation has already completed.

## What remains

Each direction uses its own positive symmetrizer. These do not automatically
form a common three-dimensional energy norm. The next implementation must sum
the actual x/y/z operators, include tangential dependence, add SATs on all six
faces including shared edges/corners, and retain any nonsymmetric volume terms
in its energy accounting. A plane wave rotated into another direction is not
that test. Curved coefficients, nonlinear stages and physical boundary data are
subsequent mandatory gates; the chosen gauge is still an unadmitted candidate.

Native0.5.0 and the old Schwarzschild T=1M failures are unchanged. No black-hole,
AMR, waveform, GPU, strong-hyperbolicity, CPBC, live or payload admission occurs.
The broad goal remains active; no art, installation, cleanup, commit or push.
