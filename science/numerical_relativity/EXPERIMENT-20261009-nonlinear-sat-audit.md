# Nonlinear SAT saved-state and process-replay audit

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns
- Origin Mode: prospective independent diagnostic reconstruction
- Origin Date: 2026-10-09
- Verification Status: PROSPECTIVE; NO PHYSICAL ADMISSION
- Version Label: nr-nonlinear-sat-audit-v1

Audit a successful run of the unchanged20261008 nonlinear SAT protocol and a
separate-process replay. Do not change campaign equations, fixtures, thresholds,
sources or saved results. This audit is not an alternative to a failed campaign.

Use a separately transcribed dense SBP(4,2) matrix from the retained
`scripts/audit-nr-k3-full58-sbp.py`. Do not import production evolution, geometry,
state constructors, diagnostic functions or the nonlinear campaign runner.
Reconstruct physical gamma=h/chi and Kij=(aij+hij*K/3)/chi directly from58
canonical saved slots. Use the physical trace of Kij, not the stored K alone.

Recompute direct-metric Hamiltonian/momentum, det(h)-1, trace(a), Theta and the
A/B/D/P reduction residuals. Follow the declared discrete mixed-index momentum
operator: equivalent continuum expressions obtained through a discrete product
rule are NOT interchangeable at machine precision. This independent transcription
checks diagnostic arithmetic/indexing, not a third-party continuum solution.

Frozen verification bounds: maximum absolute difference of recorded diagnostic
RMS values <=2e-12; independently rebuilt initial slots <=2e-14; scalar control
reconstruction <=2e-14. These are reconstruction tolerances, not scientific
accuracy or convergence requirements. No bound is fitted to the final results.

Check all seven saved58x9x9x9 arrays and all five cases, both initial/final
diagnostics, exact split/continuous final-state bytes, declared dt/index/steps,
all80 curved RK records and four flat-control records. Preserve the original
CFL/condition/residual/positivity/SAT/control criteria and recompute the decision.
Hash source snapshots, current sources, every declared artifact and retained
parent/closure/native identities. Distinguish source-key count from unique
resolved source files; slash aliases must never hide contradictory digests.

The replay must match all parsed receipt fields except elapsed seconds and all
artifact bytes. Physical, strong-hyperbolicity, CPBC, black-hole, AMR, waveform,
GPU, live and scientific-payload-writeback flags must stay false. The volume
component's evolution_supported=false describes that component, not this new
explicitly named SAT/RK4 driver.

Use fresh E-drive outputs. C>=3GiB, E>=4GiB+32MiB; no cleanup or installs. Failure
must remain visible. The unrelated retained RK-locality900s clock-boundary
regression failure from the combined suite is not regraded by this audit.

Next after success: a separately frozen nonlinear spatial/time/domain and
incident-returning study, not automatic live or native-boundary promotion.

## Audit implementation checks before execution

The auditor must reject using the same receipt or directory twice, omitted
inherited source identities, altered parent/volume/resource bindings, boolean
step indices, unfinished final writes, and stage records outside the already
declared lapse/determinant bounds. Its CLI preserves a failed audit receipt
with a nonzero exit code and cannot overwrite an existing result. These are
verification-integrity checks, not new physical acceptance thresholds.

Only the seven retained curved arrays are independently reconstructed.
Intermediate RK states and the Minkowski final state are not retained by this
campaign: their records can be checked and replayed, not independently
reconstructed from saved state. A successful audit must explicitly report this
coverage limitation. No physical gate is inferred from the exact replay.
