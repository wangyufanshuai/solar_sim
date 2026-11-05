# Schwarzschild first RK4 stage locality v1

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns
- Origin Mode: plan; prospective first-step mechanism discrimination
- Origin Date: 2026-10-08
- Verification Status: UNVERIFIED; frozen before execution
- Version Label: nr-schwarzschild-rk-stage-locality-v1

## Question and retained evidence

The initial-RHS parent has SHA256
`015b8b831c7a3b7042c2325279a611bfd943b0cc36abed07f1d1892187e7c9bf`.
Its six shared-core comparisons are byte-identical, with at most 8.90e-16
active-node differences. This excludes only a measurable initial shared-core
operator discrepancy. It does not fix the retained T=1M failures.

At which RK4 stage do differences from released old fixed layers enter the
shared active cube/core? Does their spatial support agree with repeated local
FD4 derivatives, rather than an unexpected nonlocal dependency? A support
match is not a measured physical characteristic speed or a boundary proof.

## Fixed cases and outputs

- Reuse the nine immutable initial checkpoints in the parent, with original
  N17/25/33, upper N21/31/41, both N25/37/49. Same spacing, original 125-node
  core, FD4, dt=1/256, M=1, tau_inverse=1, field-dependent gauge and fixed halo.
- One RK4 step only. Preserve all 58 fields, no projection, damping changes,
  subtraction of analytic residuals, auxiliary reconstruction or intervention.
- A separate C++ diagnostic includes the unchanged solver source and calls its
  fo_rhs/state_add. It writes eight full-grid blocks in order:
  k1, s2, k2, s3, k3, s4, k4, final. k blocks are RHS; s blocks are RK inputs,
  not independent solutions at half/full times. Final is at t=1/256.
- NRRKSTG1 is a new fixed-size trace format, not a checkpoint or live payload.
  Every case compares its traced final arrays byte-for-byte with the untouched
  ordinary advance_fo on the same input. This repeats a one-step control,
  not a two-step trajectory. k1 must reproduce the parent RHS bytes.
- Nine four-thread traces plus one N17 original serial replay. Three declared
  negative CLI controls: existing-output collision, invalid thread count,
  unknown option. Each must reject without new output or altering input/output.
- Python follows its existing _state_add/_state_rk4_update and RHS for all
  eight blocks in every case. Full 58-slot maximum differences <=2e-12, with
  no relaxation for RK stages. Python packed log fields may differ by roundoff.
- Native state-stage/final halo bytes must equal input; all native/Python
  halo RHS must be exactly zero. Every full trace must be finite.

## Pair analysis and prospective criteria

At each spacing compare upper-original and both-upper at all eight blocks:
48 stage-pair rows. Crop original physical nodes without interpolation.
Record all 58 difference-slot norms, exact byte equality, node counts above
the inherited 2e-12 absolute diagnostic floor, and maximum locations.

Report original active, lower-only, upper-only, mixed layers and core. Also
partition active nodes by oriented distance in grid cells from the changed
old fixed face: high for upper-original; low for both-upper. Active bands
are 1-2, 3-4, 5-6, and >=7. They partition active nodes, while core overlaps.

An active node adjacent to an old fixed node has depth 1. Conservative support
depths are k1/s2:0, k2/s3:2, k3/s4:4, k4/final:6. Differences beyond that
envelope must stay <=2e-12, allowing the already observed tiny input mismatch.
These are local-stencil consistency checks, NOT continuum causality claims.
Differences inside the envelope, including core differences, are measured;
they are not required to be zero or to exceed a floor to pass.

Separately reconstruct final-step H and Ricci error from the metric using the
existing diagnostic, and retain all signed core fields and pair differences.
This checks diagnostic sensitivity even when core state arrays agree. It is
not a new convergence-order or physical-accuracy gate; do not regrade old runs.

## Execution, identity and limits

Entry: `D:\python\python.exe -B scripts/run-nr-k3-rk-stage-locality.py`
with a fresh workspace `tmp/nr-shadow-evidence` output child.

Freeze and snapshot the parent's 212 files plus this protocol and the six new
stage-probe/analysis/runner/test files before building. Compile using installed
Windows MSVC/OpenMP; child TEMP/TMP only inside fresh E output. No installs.

Total cap 900s, each subprocess <=180s, total output <=2GiB with 512MiB
next-output headroom. Startup requires E reserve (4GiB+32MiB) plus 2GiB;
per-case requires E reserve plus 512MiB. C minimum remains 3GiB.
Retain full traces, source snapshots, logs, binary identity and partial receipt
on failure. No automatic experiment retries; poll the same live handle, with
no blocking wait longer than 60s. Tests use fresh E directories and no cache.

All physical, boundary, black-hole, AMR, waveform, GPU and writeback flags
remain false. The previous three evolution failures remain false.
