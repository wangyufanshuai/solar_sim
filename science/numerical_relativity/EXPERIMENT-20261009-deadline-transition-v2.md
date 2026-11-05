# Deadline transition v2: include the parent RHS locality guard

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns
- Origin Mode: explicit correction-scope amendment after a retained regression failure
- Origin Date: 2026-10-09
- Verification Status: PROSPECTIVE; NO PHYSICAL ADMISSION
- Version Label: nr-deadline-transition-v2

The [v1 protocol](EXPERIMENT-20261009-deadline-transition.md) is retained.
Its first expanded merged regression completed with 1367 passed / 1 failed:
`tmp/nr-deadline-regression-tests-v1-20261009.xml`. The stage guard was fixed,
but `test_time_cap_is_not_reset_between_cases` exposed the identical arithmetic
defect in the parent RHS locality runner. Do not regrade or overwrite that run.

Extend the v1 allowed inherited-source transition set by exactly one file:

- `scripts/run-nr-k3-initial-rhs-locality.py`
- parent SHA256 `5f315a6dcb9f42195ac86687a18af1366af6438962a3409ed6da966f809dcf6c`
- same strict `(started+900)-now` correction, preserving 180s command cap and
  all storage/output limits. No grace interval or physical change.

Parameterize the already allowed stage guard test file over both runner
classes. Cover six fixed clock origins, their adjacent representable times,
and repeated budget checks. The parent test file stays unchanged.
The total allowed inherited-source changes are now THREE files, not a global
allowlist exemption. Other historical timeout implementations are not being
certified by this bounded correction.

Require the full previous focused regression plus the new auditor and
expanded guard tests to pass under the new identities. Subsequent nonlinear
refinement evidence must record this v2 transition, including every old/new
digest and both failed regression reports. The completed short-window
scientific receipts and their snapshots remain untouched.

All v1 physics, identity, resource, no-cleanup, shadow-only and failure-retention
rules remain in force. This amendment does not change any scientific gate.
