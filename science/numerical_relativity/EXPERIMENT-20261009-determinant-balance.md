# Frozen retained-trajectory log-determinant balance study

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns
- Origin Mode: prospective protocol for a post-hoc mechanism hypothesis
- Origin Date: 2026-10-09
- Verification Status: PROSPECTIVE ANALYSIS; NO NEW EVOLUTION OR PHYSICAL ADMISSION
- Version Label: nr-determinant-balance-v1

The hypothesis was selected AFTER the previous observed determinant growth;
this protocol fixes how it will be measured, not a retroactive preregistration
of the original evolution. Keep every old threshold, equation and receipt.

## Inputs and measurements

Use all 58 initial/accepted states from the completed six-case nonlinear
dual-diagnostic run, SHA256
31e78ece7f718bad5ef0453844407a9029a4a61ef2bcf791ba194e37007c2233,
and require its independent audit
6e0f314ae9082d620a93ef324e01afec79c9aadc8e4a3de4769cd99c4378bf09.
Use the recorded N9/13/17, six-case ordering and times, to T=1/32M.
The source/binary identity and green 1708-test regression must match.

For each state, obtain the UNCHANGED production volume metric RHS, without
time advancement, using its recorded gauge/config/profile. The SAT does not
directly modify h (slots 0..5), as required by the frozen nonlinear driver.
This does not mean SAT has no indirect effect on D or later h.

With ell=log(computed FP64 det(h)), calculate:

    observed_rhs = h^ij hdot_ij
    transport = beta^k d_k ell
    reduction_forcing = 2 beta^k h^ij (D_kij - d_k h_ij/2)
    chain_rule = beta^k (h^ij d_k h_ij - d_k ell)
    damping = -3 tau_inverse (det(h)-1)
    predicted_rhs = sum of the four terms.

Use the production SBP D1 callback once, then independently transcribe all
four terms from canonical slots with the retained dense SBP matrices and
explicit contractions. Require per-term maximum difference <=2e-14 and
observed_rhs-predicted_rhs maximum <=2e-14 at EVERY saved point. Save the
eight scalar fields, all regional RMS values and pointwise residual maxima.
Use whole/central-box/face/edge/corner regions from the established contract.
Keep the signed fields; never replace them with absolute values before sums.
Inputs must remain bytewise unchanged.

## Time budget, not a second time integrator

For each case separately integrate observed_rhs and the four contributions
with composite trapezoid on its accepted states. Independently recompute
these integrals using an explicit interval loop. Require agreement <=2e-14.
Compare the observed endpoint ell change with the integrated RHS; retain the
quadrature residual explicitly. Save endpoint change, four integrated terms,
integrated RHS, quadrature residual and signed balance closure (eight fields).
The signed closure is independent of the endpoint trapezoid error because
it compares the direct RHS contraction with the four-term decomposition.
Require signed closure max <=2e-14, not small quadrature residual by fiat.

For a resolved whole-domain endpoint change (>2e-14 RMS), report each signed
projection <Delta ell,I_term>_H / ||Delta ell||_H^2, including the quadrature
residual. Values can be negative or exceed one: they are not independent
causal percentages. Below that floor report UNRESOLVED, not a ratio or pass.

For the three N13 temporal cases, record same-grid differences between coarse
and medium integrals and between medium and fine, for EACH integrand and
for the quadrature residual. Report an observed order only if both difference
norms exceed 2e-14. Do not call it RK4 solution convergence or gate admission.
No minimum order is imposed on this descriptive quadrature comparison.

This does not reconstruct intermediate RK fields, prove long-time stability,
prove that one term is the unique root cause, or predict safe extrapolation.
No threshold fitting to these results, parameter sweep or new evolution.

## Tests, provenance and resources

Before running: analytic constant and variable metric controls, nonzero
chain-rule defect, signed cancellation, exact/polynomial quadrature, corrupt
records and failure/resource tests. Snapshot all inherited source identities
plus the two determinant-analysis predecessor files and five new files
(this protocol, diagnostic module/test, runner/test). Verify all saved input
artifacts and all before/after source, test, receipt and native hashes.
Retain failed partial cases; no output overwrite or automatic retry.

One independent-process exact replay is permitted after successful completion;
all scientific JSON excluding root seconds and every output array must match.
The algebraic limits only certify this analysis, not a physical solution.

Windows-native D:/python/python.exe -B, one BLAS/OpenMP thread, E-drive
TEMP/TMP, new direct child of tmp/nr-shadow-evidence. Per process: 180s
absolute cooperative deadline, 32MiB output including source snapshots,
8MiB reporting reserve. Checks before/after each state and I/O. Keep
C>=3GiB and E>=4GiB+32MiB. No cleanup, installation, art changes, native
replacement, live switch or scientific payload writeback.
