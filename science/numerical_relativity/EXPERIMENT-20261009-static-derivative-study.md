# Static derivative composition and candidate D2 study

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns
- Origin Mode: prospective deterministic operator/analytic-geometry experiment
- Origin Date: 2026-10-09
- Verification Status: PROSPECTIVE; NO PHYSICAL ADMISSION
- Version Label: nr-static-derivative-study-v1

## Question and scope

The completed nonlinear refinement study failed the frozen H>=1.5 orders.
Its explicitly post-hoc separation found nearly the same initial H orders.
Investigate whether composing first derivatives accounts for this initial
error. Do not rerun, regrade or alter that experiment, its diagnostic, volume,
gauge, SAT, thresholds or saved artifacts. No time evolution is performed.

Add a separate constant-coefficient narrow-stencil SBP D2(4,2) candidate,
with the SAME diagonal norm as D1(4,2). It is not a variable-coefficient,
fully-compatible (boundary S=D1), Einstein boundary or evolution operator.
The boundary S has third-order coefficients (-11/6,3,-3/2,1/3)/h.
Test the bilinear identity H D2=-M+B S, symmetry of M, and positive
semidefiniteness of M and M-D1^T H D1 on the declared test grids.
Finite-matrix tests do not prove stability of a nonlinear Einstein system.

## Mathematical controls

Use exact rational arithmetic on N=17,33 for cubic data j^3 to compute
D1(D1 j^3)-6j. The error is supported on the first/last six rows, not just
the boundary nodes. Report the left six coefficients and exact squared
weighted RMS divided by h^3, on [0,2]. Equality of this constant across
grids is the specific cubic h^(3/2) norm-law check, not a PDE convergence law.
Verify D2 is exact through polynomial degree 3 on all rows and through
degree 5 in its interior. Test nonzero derivatives, orientation and norm
compatibility; constant/zero-curvature tests alone are insufficient.

## Frozen static matrix

N=9,13,17,25,33,49,65, domain [1,3]^3, FP64, G=c=M=1.

- Schwarzschild: psi=1+1/(2r), exact Laplacian=0, exact scalar curvature=0.
- Nonzero-curvature control:
  psi=1+0.05*(sin(x)+cos(2y)+0.5*sin(3z)); use its analytic first/second
  derivatives and R_exact=-8*psi^(-5)*Laplacian(psi).

For gamma_ij=f*delta_ij, f=psi^4, define b_num_i=D1_i f/(2f) and
b_exact_i=2*partial_i psi/psi. The discrete general tensor Ricci contraction
reduces algebraically to R_old=(-4*sum(D1_i b_num_i)-2*sum(b_num_i^2))/f.
Reproduce the saved N9/13/17 static initial H fields with this scalar
reduction and the unchanged independent tensor transcription, max error
<=2e-11. This is a conformally-flat static identity, not a general tensor
replacement. Hash saved arrays before use.

Report these signed fields without using them to change old admission:

- old_error=R_old-R_exact;
- analytic_connection_error=(-4*sum(D1_i b_exact_i)-2*sum(b_exact_i^2))/f-R_exact;
- differentiated_first_error=-4*sum(D1_i(b_num_i-b_exact_i))/f;
- quadratic_first_error=-2*sum(2*b_exact_i*(b_num_i-b_exact_i)+(b_num_i-b_exact_i)^2)/f;
- candidate_D2_error=-8*psi^(-5)*sum(D2_i psi)-R_exact.

The first error equals the sum of the following three contribution fields;
require maximum absolute identity defect <=2e-11. Report all their norms
and squared-error shares. Similar scalar norms alone do not establish cause.

Regions: whole domain; union of the first/last six grid rows on any axis
(the composite-stencil band); its disjoint complement; fixed physical box
[1.75,2.25]^3. Empty regions are null, never zero or passing. The fixed box
contains only unaffected composite-stencil rows for N>=17, not for N9/13.
Report regional weighted RMS, max error, and contribution to the whole-domain
squared norm. Use SBP tensor weights, no clipping or removal of boundary data.

Also run 1D exp(x), x in [1,3], on the same grids: D1 error, D1(D1) error,
and D2 error. Record all adjacent orders and a fixed N33→65 comparison;
errors <=2e-13 are unresolved. Descriptive hypothesis checks on N33→65:
D1(D1) exp whole order in [1.3,1.7]; candidate D2 whole order >=2.2 and
fixed-box order >=3.5 for BOTH 3D families. These test this static diagnostic
candidate only, not the old H threshold or the evolution solver.

## Sources, execution and closure

The table is cross-checked against the author-maintained GitHub file
https://github.com/ranocha/SummationByPartsOperators.jl/blob/main/src/SBP_coefficients/MattssonNordstr%C3%B6m2004.jl
blob 793d768b0bb39df2339c63901a7eb300ddbbc779, second_derivative_coefficients,
order=4, lines 283--324. Preserve attribution and MIT terms in the new module.
The publisher corrigendum https://doi.org/10.1016/j.jcp.2017.09.051 corrects
sixth-order Q coefficients; it does not describe a correction to this D2(4,2)
table. Do not transfer parabolic stability results to the nonlinear system.

Require new unit tests before the study. Verify all 285 inherited current
source keys and the old campaign/audit identities. Snapshot/hash the new
module, runner, tests and this protocol; recheck sources and artifacts after
execution. Preserve every failed test/report. One exact separate-process
static replay is permitted after successful completion; exclude timing only
when comparing scientific JSON and require array hashes to match.

Windows native D:/python/python.exe -B; single-thread BLAS/OpenMP; E-drive
TEMP/TMP and fresh direct evidence child. C>=3GiB, E>=4GiB+32MiB unchanged.
180-second absolute cooperative deadline and 64MiB output cap per run,
8MiB reserved for final/failure reporting. Check resources between cases and
before/after array writes. Retain partial/failure receipts, no automatic retry.
Entry: scripts/run-nr-k3-static-derivative-study.py --output-directory <fresh>
--test-report <green-new-tests.xml>. All physical/live/AMR/waveform/GPU flags
remain false; old refinement_screen_passed stays false.
