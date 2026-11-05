# Schwarzschild window: explicit FD2-only completion v1

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns
- Origin Mode: bounded implementation and native execution, inline
- Origin Date: 2026-10-07
- Verification Status: UNVERIFIED (prospective frozen protocol)
- Version Label: nr-k3-schwarzschild-fd2-completion-v1

## Why this separate experiment exists

The longer-window attempt stopped at FD2/N33, T=.25 -> .5 because its64-step
native invocation exceeded180s. It retained7 successful new samples plus3
inherited samples; it did NOT complete the full matrix. It remains false.
Receipt SHA256: `1145c54a096e6754f56b9de15067b017d9d29881a661b3779b7fbd631765e887`.
Elapsed execution685.1441304s; the total1200s cap was not reached, but the
180s per-command cap was exceeded. No completed output exists for that command.

Observed32-step N33 time102.56s supports smaller saved segments without changing
dt, equations, grid, numerical thresholds or solver. Cause of timing differences
from the earlier short study is unresolved; this is not a performance benchmark.

## Frozen scope

Retain the original failed receipt, all209 artifacts, all186 source identities,
its parent503 artifacts, and the native0.5.0 binary. Do not edit/rebuild them.
Add ONLY the FD2-completion runner and its tests to the source capsule.

Recompute the10 retained sample diagnostics before further evolution. Continue
ONLY FD2/N33 from the savedT=.25 checkpoint to .375,.5,.625,.75,.875,1 using
six consecutive32-step invocations on4threads, dt1/256. Save every checkpoint,
manifest and13-field diagnostic; all58 interior fields still evolve. T=.5,1
join the primary matrix; the other four checkpoints are declared execution
splits, retained and checked but not extra primary convergence times.

The resulting FD2 matrix has3 grids x4 saved primary times =12 samples,
including10 retained and only2 new PRIMARY samples. Four additional new split
samples are also retained. No FD4, moved-boundary, dt-halving or serial replay
is executed in this batch. The full longer-window gate MUST remain false.

## Unchanged decisions

At T=.25,.5,1, all five primary metrics use the same125 physical nodes,
FD2 minimum adjacent refinement order1.5 and floor2e-12:15 groups. Allbelow
is bounded-null; mixed floor is unresolved/false. Report every failure without
stopping the remaining declared numerical matrix. Do not change thresholds.

All12 primary plus4 split samples must meet the previous finite-window guard:
finite values,0<alpha<2,chi>0, all-active58-slot max error<=.01,
analytic-halo max error<=2e-14. Each native manifest/checksum/header and
unchanged restart halo are validated. Constraints are independently rebuilt
from the physical metric, not the evolution auxiliary values.

FD2 completion passes only with all six commands, all15 refinement groups and
all16 bounded samples. Even a pass means only this FD2 submatrix passed;
full-window, physical boundary, black-hole, waveform, AMR, GPU, live and
scientificPayloadWriteback remain false.

## Resource and recovery limits

After immutable-lineage preflight: this separate run<=1000s, each command<=180s,
outputs<=128MiB with16MiB headroom. Cfree>=4GiB+32MiB, Efree>=1GiB.
Record both new elapsed time and combined original+completion elapsed time;
never claim that splitting repaired the original failed resource contract.
No automatic retry, cleanup, installation, source edits during execution,
artwork changes, or changes to live dynamics. A new execution failure stops.

`python -B scripts/run-nr-k3-schwarzschild-fd2-completion.py --output-directory C:/Users/86137/NRShadowEvidence/nr-k3-schwarzschild-fd2-completion-v1-20261007`

This protocol narrows the recovery batch for resource control. It does not
replace or weaken the [original full-window protocol](EXPERIMENT-20261007-schwarzschild-window.md).
