# Frozen nonlinear longer-window guard probe

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns
- Origin Mode: prospective bounded simulation protocol after determinant analysis
- Origin Date: 2026-10-09
- Verification Status: PROSPECTIVE; NO STABILITY OR PHYSICAL ADMISSION
- Version Label: nr-nonlinear-longer-window-probe-v1

## Question and unchanged method

Can the present method reach T=1/16M on the same N13 exterior cube without
violating its existing stage contract? This is a two-case guard probe, NOT
a space/time convergence study or a long-time stability demonstration.
The preceding determinant analysis motivates the question after the fact;
it does not predict or guarantee a successful extension.

Retain the actual nonlinear FO-CCZ4 volume, stage-local characteristic SAT,
RK4 implementation, [1,3]^3 domain, G=c=M=1 and static analytic incoming
targets. No equation, damping, gauge, perturbation or physical limit changes.
Keep all old failed receipts. No determinant projection or reconstruction of
the independently evolved A/B/D/P fields is permitted.

Run fresh from the original initial data, in this fixed order:

1. static-13-long: N=13, dt=1/256, 16 steps, unperturbed analytic data.
2. perturbed-13-long: same grid/time, original 1e-4 disturbance in slots 11:.

Stop the campaign on the first exception/failed gate; no automatic retry.
Both cases must reproduce every saved initial/accepted state and all stage
records of their T=1/32M parents (spatial-13 / temporal-medium) exactly.
Also compare the old/new regional diagnostics, parameters and operator
identity over that prefix. A prefix mismatch is a failure, never tolerated.

## Observation and failure preservation

A subclass observes the unchanged step() through rhs()/field()/state()
calls. It must not change the returned values or reports. Test exact equality
against the original driver before the scientific run. Its extra copies and
resource checks are not a new numerical time integrator.

Apply the existing per-stage limits immediately after each returned RHS
report: CFL<=0.25 (existing roundoff allowance), positive finite lapse/chi,
min(lapse)<2, characteristic condition<=1e6 and residual<=2e-11,
max|det(h)-1|<=1e-10, complete six-face records. The production profile
itself continues to require ALL lapse values strictly between zero and two.
Also check the SAME determinant limit on the candidate endpoint before it
becomes accepted. This additional endpoint observation does not relax any
old gate or retroactively regrade a parent run.

Save every accepted state and the same dual regional diagnostics. Retain
each attempted stage, distinguishing RHS completion, stage-contract passage
and step acceptance. On failure, save the first rejected candidate and its
already-computed RHS when available, without advancing or projecting it.
Also retain the latest persisted accepted state. Rejected data is diagnostic
only, NOT a checkpoint or an allowed restart state. If persistence fails,
record that failure explicitly without replacing the original exception.

After the first failure, only provenance verification and bounded evidence
finalization are allowed; do not continue this case or later cases. A passed
probe requires both complete 16-step cases, 18 exact prefix states, 16 exact
prefix step records and all stage/endpoint gates. No convergence order is
calculated from this two-case probe. Full trajectory replay is not part of
this first probe; independent diagnostics/failure-state checks follow.

## Provenance and resources

Require the completed dual-diagnostic parent/audit, exact determinant-budget
analysis/replay and the green 1749-test regression. Snapshot the inherited
310 source keys plus this protocol, observer runner and its tests. Require
current/source-snapshot identity, original rollback native hash, unchanged
test reports and all inherited artifact hashes before and after execution.

Windows-native D:/python/python.exe -B; one BLAS/OpenMP thread; E-drive
TEMP/TMP. New direct child of tmp/nr-shadow-evidence only, never overwrite.
1800s absolute scientific deadline, 96MiB output including snapshots and
8MiB reporting reserve. Check resources before/after each RHS, step and I/O.
At timeout only bounded finalization may proceed, not renewed calculation.
Keep C>=3GiB and E>=4GiB+32MiB, including attempted failure-array writes.
No cleanup, installs, art work, native replacement, live switch or scientific
payload writeback. All physical/admission flags stay false even on success.
