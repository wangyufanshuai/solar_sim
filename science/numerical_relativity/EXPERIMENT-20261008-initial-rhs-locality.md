# Schwarzschild initial RHS locality v1

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns
- Origin Mode: plan; hypothesis-discriminating instantaneous operator analysis
- Origin Date: 2026-10-08
- Verification Status: UNVERIFIED; protocol fixed before execution
- Version Label: nr-schwarzschild-initial-rhs-locality-v1

## Question and hypotheses

The retained error-localization analysis has SHA256
`482420cef8dbb07276c75da3a4456f3f73ddf9424cdfad4e55a4ea14cdfa9e3a`.
It completed 45 checkpoints, 72 profiles and 48 signed pair profiles but does
not identify a unique cause of the retained T=1 convergence failures.

Compare the actual 58-slot instantaneous RHS on matched analytic initial data:
are differences present on common fully active nodes, or confined to original
fixed-layer locations which become active in expanded domains? A mismatch in
the common active region requires investigating input identity, stencil and
indexing before blaming propagation. Agreement excludes that limited initial
locality hypothesis, NOT later nonlinear/auxiliary/boundary coupling.

## Fixed cases and outputs

- Original [1,3]^3: N17/25/33; upper [1,3.5]^3: N21/31/41;
  both [.5,3.5]^3: N25/37/49. Same h=1/8,1/12,1/16; T=0 only.
- Read the nine original initial checkpoints identified by the localization
  inventory; verify hashes and exact analytic seed bytes. Do not regenerate
  or overwrite input evidence. No perturbation, evolution or residual subtraction.
- Preserve FD4, 1+log, field-dependent shift/ordering profile, tau_inverse=1,
  M=1, dt=1/256 metadata and two-layer analytic fixed RHS.
- Build the EXISTING read-only native RHS probe against the frozen current
  0.5.0 solver source using the installed Windows MSVC/OpenMP environment.
  Snapshot source first; no install, global environment change or GPU use.
- Nine four-thread native RHS calls, nine Python RHS evaluations, plus one
  original N17 one-thread byte-replay control. Derivatives use the distinct
  NRFORHS1 format and cannot be restarted as states.
- Retain all 58 named slot norms on the 125 core nodes for every case.
- At each spacing, crop to all original-domain nodes with no interpolation.
  Compare upper-original and both-upper, preserving all 58 slots in the core,
  shared active region, lower-only, upper-only and mixed lower/upper layers.
  The last four masks partition the original cube; the core is a separate subset.
- Record input differences and coordinate alignment, rather than assuming
  off-core seed bytes match across floating-point grid construction.
- Record radius-2 and radius-4 Cartesian support-envelope reach to the actual
  fixed layers. These are conservative geometric reach counts, not measured
  influences, nonzero derivative coefficients or domains of dependence.

## Prospective checks and interpretation

- Full input shape/identity/finiteness and all 9 cases, 6 pairs, 58 slots required.
- Python/native RHS maximum component difference <=2e-12 (existing parity
  tolerance); original/common input difference <=2e-14.
- Common active/core native RHS difference <=2e-12 is an initial operator
  consistency check, NOT a convergence/physical-validation threshold.
- Each domain's prescribed halo has exactly zero RHS. Thread replay is byte exact.
- Nonzero differences on released old halo locations are recorded, not required
  to pass and not automatically labeled errors. All slots remain reported.
- Structural checks are kept separate from floating-point comparisons.
- No acceptance threshold or field of any predecessor is changed. Black-hole,
  boundary, AMR, waveform, GPU and writeback admissions stay false.

## Execution and resources

Entry: `D:\python\python.exe -B scripts/run-nr-k3-initial-rhs-locality.py`
with one fresh `--output-directory` child of workspace `tmp/nr-shadow-evidence`.

Total budget 900 seconds, each subprocess <=180 seconds, 384 MiB total output
with 64 MiB next-output headroom. Preserve C>=3 GiB and E>=4 GiB+32 MiB,
with 384 MiB available beyond the E reserve at startup. Compiler TEMP/TMP are
child-process-only paths inside the fresh E output directory. No input copying.

Retain source snapshots, native RHS files, build logs and binary identity,
Python comparisons, support summaries, pair tables and receipt.json. Failures
produce a partial receipt and are not silently retried. Poll the same handle;
no wait exceeds 60 seconds. Unit tests use synthetic fields, separate from the
actual retained-data experiment. This protocol does not authorize live use.
