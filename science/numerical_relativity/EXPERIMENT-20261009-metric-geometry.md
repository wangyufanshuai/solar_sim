# General metric-Hessian Ricci and parallel saved-state diagnostics

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns
- Origin Mode: prospective analytic geometry and saved-state comparison
- Origin Date: 2026-10-09
- Verification Status: PROSPECTIVE; NO EVOLUTION OR PHYSICAL ADMISSION
- Version Label: nr-metric-geometry-v1

Implement a separate physical-metric Ricci/ADM diagnostic. Use SBP D2(4,2)
for pure second derivatives and tensor-product D1(4,2) on distinct axes for
mixed derivatives. Differentiate the inverse metric by the chain rule,
not by applying D1 to an already differentiated connection. Retain the
old diagnostic, state arrays, nonlinear volume/gauge/SAT and every old gate.
Do not enforce trace-free A, project det(h), symmetrize Ricci, or repair data.

## Analytic contracts

Compute R_ij, R=g^ij R_ij, H=R+tr(K)^2-K^i_j K^j_i,
M_i=partial_j K^j_i-partial_i tr(K)+Gamma^j_jl K^l_i-Gamma^l_ji K^j_l.
The full physical trace is mandatory, including nonzero trace(A).

Use N17,25,33 on [1,3]^3 for each of the following three controls:

1. Schwarzschild: g=psi^4 I, psi=1+1/(2r), K=0. Use the analytic nonzero
   spatial Ricci tensor, not just R=0, as the oracle.
2. Flat nonlinear coordinates: X=x+0.17 sin(y+z), Y=y, Z=z; g=J^T J,
   K=0. R_ij=0 despite nonzero, spatially varying Christoffel symbols.
3. Skew anisotropic warped metric: in coordinates (u,v,w),
   ds^2=du^2+exp(2a u)dv^2+exp(2b u)dw^2, a=.2,b=-.15.
   (u,v,w)^T=L(x,y,z)^T with rows (1,.2,-.15),(.3,1,.1),(-.1,.25,1).
   Pull back diag(-(a^2+b^2),-a(a+b)exp(2a u),-b(a+b)exp(2b u))
   as the exact Ricci tensor; R=-2(a^2+b^2+ab).
   K_ij=c*g_ij, c=.02+.01x-.015y+.005z, so H=R+6c^2 and
   M=(-.02,.03,-.01). This is manufactured geometry, not a vacuum solution.

The warped control is intrinsically non-conformally-flat: in warped
coordinates the Cotton component C_vvu=-a*b*(a-b)*exp(2a u) is nonzero,
using C_ijk=nabla_k S_ij-nabla_j S_ik and S_ij=R_ij-R*g_ij/4.
Unit tests separately verify analytic metric jets and polynomial-coordinate
flatness, so the oracle is not only a second implementation of the same stencil.

## Frozen measurements and static gates

Use SBP tensor weights, component-averaged RMS over the whole domain and
the fixed physical box [1.75,2.25]^3. Keep all boundary nodes. For BOTH
adjacent grid pairs, require resolved errors (>2e-13), whole-domain Ricci
tensor and H orders >=2.2 and fixed-box orders >=3.5. Empty/unresolved
regions do not pass. Report raw errors, all orders and failed outcomes.
Require the nonzero manufactured M oracle max difference <=2e-11 and
Ricci antisymmetry <=2e-11 without projecting either diagnostic.
These are static geometry criteria, not evolution or old-gate replacements.

Also read all 12 initial/final state records from the retained nonlinear
refinement campaign. Verify their hashes, independently reconstruct old
metric H/M using the retained tensor transcription, and record old H,
new H and their signed difference. Require new/old M max difference <=2e-11.
Save new Ricci, H and M arrays and old H. Recompute and report the old and
new positive-time spatial orders; do NOT use new values to regrade the old
failed campaign or claim a new independent time-evolution experiment.

## Sources, tests and resources

Formula convention cross-check: SpECTRE Ricci.hpp,
https://github.com/sxs-collaboration/spectre/blob/develop/src/PointwiseFunctions/GeneralRelativity/Ricci.hpp
blob f18fe353dd3b50dc5a5e114630a8e3ee3f4e08e1. Only mathematical conventions
are used; no third-party solver is run and no cross-code agreement is claimed.

Require new unit/runner tests, verify inherited 293 source keys and retained
static-study primary/replay identities, and snapshot the five new files.
Recheck before/after hashes, keep failed receipts and do not overwrite output.
After successful completion permit one independent-process exact replay;
scientific JSON and arrays must match, excluding elapsed seconds only.

Windows-native D:/python/python.exe -B, one BLAS/OpenMP thread, E-drive
TEMP/TMP and fresh output directory in tmp/nr-shadow-evidence. Original
C>=3GiB and E>=4GiB+32MiB floors unchanged. Per run: 180 seconds absolute
cooperative deadline, 64MiB output including snapshots, 8MiB reporting
reserve. Resource checks between cases and before/after saved outputs.
No new time evolution, installs, cleanup, art/live changes or physical admission.
