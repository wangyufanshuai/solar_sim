# Offsurface Theta/Z feedback and instantaneous43 assembly: preregistration

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns; Exa Search
- Origin Mode: bounded deterministic reference controls
- Origin Date: 2026-10-11
- Verification Status: PLANNED BEFORE EXECUTION
- Version Label: nr-offsurface-theta-z-feedback-v1

## Scope and formulas

Freeze all475 qualified sources. Add explicit Theta/Z forcing from the33
reduction defects and the trace/determinant defects. Use actual metric
derivatives to define physical Z; formal FO Z need not equal it. Keep current
gauge and tau=1,kappa1=.1,kappa2=0; no projection, new solver or evolution.

Write c=tr_h(a), rD=D-.5*dh, rB=B-dbeta, rA=A-dlnalpha, rP=P-dlnphi.
The formal connection defect is h^-1*(rD_ikj+rD_jki-rD_kij); it determines
formalZ-physicalZ. Theta forcing splits into formal curvature/divergence,
alpha*(-2*K*c/3-c*c/2+Theta*c), and the true/formal lapse-gradient difference.

For GammaHat, derive the physical baseline using the covariant variation of
the actual contracted conformal connection. The trace correction is
alpha*((10/3)*h^-1*dc-2*c*h^-1*(dlnphi+dlnalpha/3)+(2/3)*c*GammaHat).
Six Gamma forcing groups retain trace, auxiliary ordering, shift reduction,
connection/conformal reduction, lapse reduction and formal-Z terms. Convert
them to Z and add delta(h_t)*h^-1*Z minus .5*h*D(Gamma_actual)[delta(h_t)].
The latter uses covariant differentiation, not coordinate product rules.

Compare with qualified full58 pointwise FO rates and independently differentiate
the actual Z definition by raw coordinate product rules. Assemble all43
instantaneous rates from existing H/M and reduction/algebraic references plus
the new Theta/Z paths. This is NOT proof of a closed43-variable spatial PDE,
symmetrizer, CPBC, stability, constraint convergence or scientific admission.

## Fixed cases and gates

Reuse all126 prior cubic manufactured inputs unchanged. Add6 cases: each of
three points with nonunit, anisotropic curved h and traceful a, with either
consistent auxiliary definitions or combined auxiliary errors. All defining
fields are explicitly cubic polynomials; no unknown derivatives are padded.
Expected132 cases, ten arrays each, all finite FP64, absolute2e-12 with rtol0.
Clean original cases require zero correction within2e-12. Every saved input
and array must replay exactly; all43 rates and three geometric bridges agree.

Expected186 new tests:132 cases;3 covariant/raw connection variation;3 analytic
conformal variation;3 analytic pure-trace cases;33 omission controls (each11
forcing group at each new mixed point, discrepancy>1e-8);6 bad input;4 bad
evidence;1 coverage/independence;1 invalid fixture. Pure trace h=I,a=c(x)I/3,
all other dynamic fields zero fixes Z_feedback=5*dc/3 and Theta_feedback=-c^2/2
at alpha=1. No post-result adjustment of fixtures or thresholds, skips/xfails
or statistical inference. Regression: all160 previous offsurface controls.

## Resources and execution

Windows Python -B, no native calls; source snapshots<=8MiB as explicitly
authorized. Controls64MiB/600sec,2MiB finalization, C>=3GiB and E>=4GiB+32MiB
plus complete prospective allocation. All new temporary/evidence outputs in E.
Run scripts/run-nr-k3-theta-z-feedback-controls.py --output-directory PATH
once in a fresh direct child of tmp/nr-shadow-evidence. Preserve all failure
files; stop owned work on the original resource guard; no automatic retry.
No art/live/writeback, N9 batch, install, cleanup or historical regrading.

## Formula sources

Exa fetched two primary papers (not a broad new literature survey):
[Dumbser et al.](https://ar5iv.labs.arxiv.org/html/1707.09910), II.2, Eq12g/h,
for auxiliary/ordering and Theta/GammaHat; [Alic et al.](https://ar5iv.labs.arxiv.org/html/1106.2254),
Eq8/9, for physical Theta/Z. The offsurface correction is derived here and
must pass the above controls; citations are not numerical validation.
