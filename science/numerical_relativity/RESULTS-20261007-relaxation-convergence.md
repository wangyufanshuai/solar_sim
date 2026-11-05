# Vacuum-slice relaxation convergence v1: complete, aggregate FAIL

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent, inline
- Origin Mode: deterministic numerical experiment and read-only verification
- Origin Date: 2026-10-07
- Verification Status: LOCAL VERIFIED execution; convergence aggregate FAILED
- Version Label: nr-k3-relaxation-convergence-v1

## Outcome

The unchanged Windows-native 0.4.0 solver completed all 26 cases, 78 samples,
53 successful native commands and one direct/serial replay in 909.13 seconds.
All final fields remained admissible under the existing finite-state contract.
The receipt reports `completed=true`, `convergence_passed=false`, `errors=[]`.
The runner deliberately returns a non-success code for this failed numerical
gate; this is not a native process crash. None of the thresholds was changed.

74 of 80 constraint-refinement groups pass. The six failures are Hamiltonian
constraint groups on the coarse N8 to N16 pair. Every N16 to N32 constraint
pair passes its predeclared threshold. This suggests a resolution-dependent
effect, but does not establish its cause or excuse the failed aggregate.

The initial data are a rotated vacuum harmonic-gauge-wave **slice**. Evolution
uses advective 1+log/Gamma-driver, not harmonic lapse. No evolved-field claim
is made against the incompatible harmonic-wave time-dependent solution.

## Measured convergence

Orders below are for the oblique wave, with lambda=0; lambda=1 gives nearly
identical orders. All norms and both rates are retained in the receipt.

| Quantity | FD2 | FD4 | Frozen requirement |
| --- | ---: | ---: | --- |
| H, t=0.125, N8 to N16 | 1.08859 | passes | >=1.5 / >=3.0 |
| H, t=0.25, N8 to N16 | 0.92579 | 2.93403 | >=1.5 / >=3.0: FAIL |
| H, t=0.25, N16 to N32 | 1.65688 | 3.87452 | >=1.5 / >=3.0: PASS |
| All-58 state spatial self-convergence | 1.87048 | 3.86852 | >=1.5 / >=3.0: PASS |
| All-58 state RK4 timestep refinement | 3.99255 | 3.99071 | >=3.5: PASS |

At FD4/N32/lambda0/t=0.25, independent metric H L2 is `7.96758e-6`
and M L2 is `1.65908e-6`. The t=0.25 fine-pair A/B/D/P orders are
3.91641 / 3.91722 / 3.91664 / 3.91646. Nonzero constraints are not
silently replaced by zero or reconstructed from evolved auxiliary variables.

The maximum temporal-contamination ratio across the four combinations is
`0.000417204` (0.041721%, below the frozen 5% limit). This supports the
specified spatial comparison, not arbitrary timesteps or long-time evolution.

Finite relaxation does not cure coarse-grid H convergence. At FD4/N32,
lambda1/lambda0 ratios are 0.81916 for determinant residual and 0.87231 for
trace residual, while H/M/A/B/D/P ratios remain close to one. This is not
universal constraint damping or evidence for replacing lambda=0 by default.

## Reproducibility and independent checks

- Four 64-step Python/native comparisons pass; maximum all-slot absolute
  disagreement `1.34615e-15` (limit `2e-12`).
- Fresh 128-step, one-thread FD4/N16/lambda1 output equals the four-thread,
  64+64-step checkpoint **and manifest byte-for-byte**.
- A separate process recomputed all 78 metric/auxiliary diagnostic records
  exactly, rechecked all four saved Python pairs and the replay, and recovered
  the identical aggregate. The independent diagnostic uses FFT symbols of the
  centered FD operator, not the evolution geometry/RHS implementation.
- H/M use reconstructed physical metric and curvature, including their actual
  trace even when the algebraic constraint is violated. A separate retained
  metric implementation agrees on the FD2/N32/lambda0 final sample to
  `8.644e-13` in H and `8.081e-16` in M. This latter comparison covers one
  sample, not the whole matrix or a second independent evolution code.
- All 170 current/source-snapshot identities and 438 artifact hashes match;
  binary and protocol hashes also match. The evidence directory contains 439
  files and 293,022,558 bytes, including its receipt.
- **435 focused Python tests passed** in 20.72 s; the 34 new tests are included
  in that total. New-file Ruff checks passed. This is not the whole repo suite.
- Existing DP fallback reporting and main/worker regime serialization were
  refreshed separately: two Vitest files / four tests passed. They are mocked
  unit checks, not new browser or worker physical-equivalence evidence.

The v1 assessment uses `order` for observed state-difference order, overwriting
the stencil label in its spatial/temporal row construction. The unambiguous
matrix ordering is FD2/lambda0, FD2/lambda1, FD4/lambda0, FD4/lambda1; case
records and constraint rows retain stencil identity. This reporting limitation
does not alter numerical decisions. The frozen receipt is preserved; a future
runner must use separate `spatial_order` and `observed_order` keys.

## Immutable identities

- Evidence: `C:/Users/86137/NRShadowEvidence/nr-k3-relaxation-convergence-v1-20261007`
- Receipt SHA-256:
  `bfbc9c97a57d97e9fab733331f54adaf4d975e9d8aad438c6a72f2a28a78e5b3`
- Protocol SHA-256:
  `581de5067caa502e390424b8fb6e78f66d10a37a4585e0b5dee34e2564b7487d`
- Native 0.4.0 binary SHA-256:
  `20402d8e8ac65e1c24d87df4a5ad828846c40929c10af5f64b2c8b3ce1c27e38`
- Parent finite-rate receipt SHA-256:
  `7398ecaa7563a0e1df58e45903721b6b21be3fe86b7dca74dec88c1e79133c80`

## Interpretation and next controlled work

The first testable hypothesis is that N8 is outside an asymptotic range for
the metric Hamiltonian residual of this oblique data. Freeze a separate
N16/24/32 study with the same constraint-order thresholds, an unequal-grid
Richardson state comparison and new fine-grid timestep controls. Do not
regrade this N8/16/32 campaign or assert the hypothesis before that test.

A separate hypothesis concerns the initial discrete Gamma constraint:
analytic GammaHat is combined with centered metric derivatives. Its initial
truncation residual converges but is not exactly zero. GRChombo's
[GammaCalculator](https://github.com/GRTLCollaboration/GRChombo/blob/main/Source/CCZ4/GammaCalculator.hpp)
constructs contracted Gamma from numerical metric derivatives. That source
supports a future controlled initializer comparison, not silently altering
this baseline. Its
[metric constraint implementation](https://github.com/GRTLCollaboration/GRChombo/blob/main/Source/CCZ4/NewConstraints.impl.hpp)
also provides a primary-source formula comparison; no GRChombo run, vendoring
or cross-code validation was performed.

Periodic weak-field slice tests do not cover physical outer boundaries,
strong-field black-hole evolution, long-time stability, AMR transfer,
horizons, ADM surface integrals, Psi4 extraction or GPU execution. Physical
validation, full constraint-propagation proof, strong hyperbolicity, CPBC,
black-hole/AMR/CUDA admission, live admission and scientific payload writeback
remain false. The wider NR goal remains active.
