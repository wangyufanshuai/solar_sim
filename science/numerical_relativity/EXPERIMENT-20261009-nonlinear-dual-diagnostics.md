# Fresh nonlinear evolution with simultaneous metric diagnostics

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns
- Origin Mode: prospective bounded simulation and independent reconstruction
- Origin Date: 2026-10-09
- Verification Status: PROSPECTIVE; SHADOW ONLY
- Version Label: nr-nonlinear-dual-diagnostics-v1

## Question and controlled intervention

Does the independently analytic-tested metric-Hessian H diagnostic retain
resolved convergence when measured during a fresh nonlinear evolution, without
altering any evolved value? Keep the original derivative-of-connection H and
its failed convergence verdict. This is a diagnostic intervention, NOT a new
evolution discretization or a cure for the original failed diagnostic.

Use the unchanged nonlinear 58-field SBP/SAT driver, gauge, volume/source,
stage-local characteristic decomposition and incoming Schwarzschild targets.
The positive-octant exterior patch [1,3]^3 contains neither puncture nor horizon.
There is no physical outgoing/constraint-preserving boundary claim.

## Frozen matrix

All cases end at T=1/32 M, matching the existing controlled experiment:

| Case | N | dt | Steps | Perturbation |
|---|---:|---:|---:|---|
| spatial-9 | 9 | 1/256 | 8 | none |
| spatial-13 | 13 | 1/256 | 8 | none |
| spatial-17 | 17 | 1/256 | 8 | none |
| temporal-coarse | 13 | 1/128 | 4 | 1e-4 canonical slots 11..57 |
| temporal-medium | 13 | 1/256 | 8 | same |
| temporal-fine | 13 | 1/512 | 16 | same |

The disturbance is exactly the inherited smooth deterministic three-direction
function. Total: 52 RK4 steps, 208 stages, 112 disturbed stages. No parameter
search, projection, auxiliary reconstruction, threshold change or retry.
Longer-time propagation is a separate future experiment: at the current
endpoint the disturbed det(h) defect is already about 5.35e-11 against the
unchanged 1e-10 stage cap. This campaign cannot establish long-time stability.

## Measurement and decision contracts

Save the initial state and EVERY accepted endpoint (58 FP64 arrays total).
The final endpoint uses the original <case>-final.npy name; intermediate
states have numbered names. Record both H definitions, both M definitions,
their differences, and all original auxiliary/state diagnostics at every
saved point. Retain SBP-weighted component-mean RMS for whole domain,
central [1.5,2.5]^3, and disjoint boundary faces/edges/corners. No boundary
nodes are removed from the primary norm. Verify inputs unchanged bytewise.

The original decision is calculated unchanged: state/H_old/M orders >=1.5
for both adjacent spatial pairs; time order in [3.5,4.5] with both same-grid
state differences >2e-13; active changing SAT coefficients. It remains a
separately reported legacy decision, including expected H_old failures.

A separately named metric-Hessian diagnostic screen requires both adjacent
whole-domain H_new orders >=2.2 (the already frozen general-geometry contract),
state and M orders >=1.5, the SAME time/floor/activity requirements, and all
six complete cases. Every saved point requires new/old M max difference and
Ricci antisymmetry <=2e-11. An unresolved quantity is not a pass. The new
screen does not replace or regrade the original screen.

Require the freshly evolved initial/final arrays to match all 12 corresponding
historical state records byte-for-byte. Compare the complete old stage records,
old initial/final diagnostics, operator identity and parameters exactly.
This is independent-process re-execution of the unchanged evolution, not an
independent physical solver. Intermediate RK stage fields are not saved and
are not independently reconstructed.

## Independent audit and stop conditions

After completion, independently reconstruct old diagnostics from the retained
dense SBP tensor transcription and new H from a separately coded dense D2
metric-Hessian curvature contraction, on all 58 saved points. Verify all
artifact/source hashes and the full matrix/trajectory ordering. Require
diagnostic norm agreement <=2e-12 and resolved-order agreement <=1e-7;
strictly compare all pass/fail/unresolved verdicts. Analytic flat, curved and
non-diagonal controls must test the auditor independently before it runs.
Do not call diagnostic agreement independent time integration or CPBC proof.

Stage limits are inherited unchanged: CFL <=0.25 (existing floating-point
allowance), positive metric/chi/lapse, min lapse <2, characteristic basis
condition <=1e6, residual <=2e-11 and det(h) error <=1e-10. The inherited
stage summary records minimum, not maximum, lapse; the independent saved-state
audit additionally checks every lapse <2 and cannot certify unsaved stages.
Any stage/resource/nonfinite/persistence failure stops this run, retains the
attempted and last accepted step, and saves failure evidence where safe.
No automatic retry. Preserve all old receipts and native rollback binary.

## Source, execution and resources

Require completed general-metric primary/replay, their exact scientific JSON
excluding only elapsed seconds, all current inherited 298 source keys, old
refinement/audit identities, and the 1623-test regression. Add only this
protocol, the new runner and its tests to the run snapshot. Require a fresh
green runner test report. Recheck sources, receipts, tests and binary at end.

Entry: D:/python/python.exe -B scripts/run-nr-k3-nonlinear-dual-diagnostics.py
--output-directory <fresh E-drive tmp/nr-shadow-evidence direct child>
--test-report <fresh green runner XML>.
Use one BLAS/OpenMP thread; TEMP/TMP in the existing E-drive tmp directory.
Absolute cooperative deadline: 2400 seconds, checked at every RK boundary
callback and around diagnostics/I/O. A single native operation is not
preemptible; monitor the process and report any overdue stop explicitly.

Keep C>=3GiB and E>=4GiB+32MiB. New output cap is 96MiB including snapshots,
with 8MiB receipt reserve, because all accepted fields are now retained
(approximately 62MiB raw state files). This increases only the per-run
evidence allowance, not the user's minimum free-space threshold. No cleanup,
installation, art edits, live switch, native rewrite or physical admission.
