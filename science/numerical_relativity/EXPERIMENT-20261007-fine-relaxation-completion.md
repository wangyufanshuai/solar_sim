# Explicit finer-grid resource-stop completion v1

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent, inline
- Origin Mode: run / explicitly frozen checkpoint continuation
- Origin Date: 2026-10-07
- Verification Status: UNVERIFIED (prospective completion protocol)
- Version Label: nr-k3-fine-relaxation-completion-v1

## Why a separate completion exists

The fine-grid v1 study reached its predeclared 1800-second total limit at
1800.123 seconds. It recorded 23 successful commands, then a timeout with
only52.018 seconds remaining for the last N32/FD4/lambda1/dt1/1024 interval.
It saved59 of60 samples and did not reach serial/direct replay. The aborted
command produced neither a checkpoint nor a manifest. This is an execution
budget miss, not proof of a divergent state. The old receipt stays
`completed=false, convergence_passed=false`; its budget was NOT met.

The paused input is a verified checkpoint at t=0.125, not a partial output
from the killed process. This separately announced stage completes only the
missing interval and replay. No silent full-campaign retry, no regrading, no
scientific threshold change, no recompilation or solver edit.

Resource-stop receipt:
`C:/Users/86137/NRShadowEvidence/nr-k3-fine-relaxation-v1-20261007/receipt.json`
SHA-256 `8425a85ee03170aafef3236a43c07c1e46c8021b8477c6a733e940189bee0fb5`.
Parent protocol SHA-256:
`6827d85e112812cb4227ac97255c823d251877d1a5b16ba28e3572a09f9ca308`.
Retain all174 parent sources; add only the completion runner and its test,
for176 source snapshots. Bind both parent receipts, all retained artifacts,
the unchanged native0.4.0 binary and every reused diagnostic before execution.

## Exact two-command completion

1. Resume `fd4-n32-rate1-s1024-k111-t0.125.bin` from the resource-stop
   directory for128 RK4 steps on4 threads, to t=0.25. Store new output under
   the fresh completion directory; never overwrite the failed command paths.
2. Run FD4/N24/lambda1/dt1/512 directly for128 steps on1 thread from its
   original initial checkpoint. Require final checkpoint AND manifest bytes
   equal the already retained4-thread64+64-step output.

Both native commands must exit0. Recompute the new final independent
diagnostics, append it to a deep copy of the59 retained samples, then run the
UNCHANGED fine-grid assessor over all20 cases /60 samples. Require all80
constraint-refinement groups,4 generalized state-refinement groups,8 state
timestep-contamination groups,160 signed constraint-timestep groups, and
serial/direct replay. Recompute all59 inherited diagnostics before continuing.
The original coarse-grid study also remains convergence=false.

Report completion-only and combined elapsed time separately. An extended
study pass does not assert that the original1800-second run succeeded.
The `origin` case field remains relative to the original fine-grid matrix;
absolute sample paths and inherited_sample_count distinguish reuse from
fresh completion output. No reused sample is called newly simulated.

## Resource limits and command

Completion execution <=900s after retained-data preflight; each native
command <=180s. New output <=128MiB with32MiB reserve. Keep C>=4GiB and
E>=1GiB. Combined execution budget is the old1800s plus this separate900s;
report the small timeout/finalization overhead, not a fictitious exact cap.
Output directory must not already exist. Stop and preserve on any new error;
do not retry a second failure automatically.

`python -B scripts/finish-nr-k3-fine-relaxation.py --output-directory C:/Users/86137/NRShadowEvidence/nr-k3-fine-relaxation-completion-v1-20261007`

All physical, strong-hyperbolicity, full constraint-propagation, CPBC,
black-hole, AMR, horizon, Psi4, GPU, live and scientific-writeback admission
flags remain false. This stage can establish only the already specified
finite-window finer-grid convergence and reproducibility result.
