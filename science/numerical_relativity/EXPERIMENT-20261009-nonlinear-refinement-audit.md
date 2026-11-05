# Independent saved-state audit of nonlinear refinement

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns
- Origin Mode: independent diagnostic and decision transcription
- Origin Date: 2026-10-09
- Verification Status: PROSPECTIVE; NO PHYSICAL ADMISSION
- Version Label: nr-nonlinear-refinement-audit-v1

The refinement experiment and thresholds are unchanged. This audit imports
no production evolution, geometry, state construction or refinement runner.
Generalize the retained independent dense SBP metric/Kij diagnostic
transcription to N=9/13/17. Verify its helper's exact source identity before
loading it. Recover physical gamma=h/chi and Kij=(a+hK/3)/chi, including the
physical trace in the mixed-index momentum constraint. Reconstruct H, M,
det(h)-1, trace(a), Theta and A/B/D/P definition constraints from saved arrays.

Reconstruct analytic initial slots and the prescribed perturbation separately;
max slot discrepancy must be <=2e-14. Recompute every recorded initial/final
full-domain and regional norm; maximum absolute discrepancy <=2e-12. A
perturbed state's state_error is measured against the unperturbed analytic
reference, matching the declared norm, not against its own perturbed initial
data. Region masks are exactly those in the frozen refinement protocol.

For a completed six-case matrix, recompute both adjacent spatial orders and
the same-grid three-level temporal differences independently. Reproduce all
pass/fail/unresolved outcomes and the aggregate decision. A reproducibly
failed scientific screen remains failed. Numerical orders use an absolute
comparison allowance of 1e-7 only when both differences are resolved; norm
agreement alone cannot excuse a different pass/fail decision. A below-floor
measurement remains unresolved.

Validate stage record ordering, unchanged parameters, bound source and
artifact sets, explicit three-file transition, the retained parent identities
and no-admission flags. Reconstruct only stored initial/final arrays; full
intermediate RK states are absent and must not be called independently
validated. A failed/incomplete campaign cannot close the full audit gate;
retain any audit failure report rather than dropping it.

The auditor may run on a completed campaign that failed refinement. A
separate-process evolution replay is an additional requirement for a passing
refinement closure, not implied by independent diagnostic transcription.
Do not automatically repeat a failed or timed-out evolution campaign.

Fresh E-drive JSON output only; C>=3GiB and E>=4GiB+32MiB before/after audit.
All physical/live flags and closure_completed remain false in this standalone
audit, even when its diagnostic reconstruction succeeds. No old frozen source
or receipt is edited. Record the auditor, tests, protocol and dense helper
hashes before/after audit.
