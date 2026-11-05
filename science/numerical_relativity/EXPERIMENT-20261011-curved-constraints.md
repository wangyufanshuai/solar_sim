# Curved physical H/M propagation: preregistered bounded controls

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns; Exa Search
- Origin Mode: deterministic reference implementation and controlled verification
- Origin Date: 2026-10-11
- Verification Status: PLANNED, BEFORE FIRST NUMERICAL EXECUTION
- Version Label: nr-curved-physical-constraint-propagation-v1

## Question and scope

Do time derivatives of H=R+K^2-Kij*K^ij and Mi=Dj(K^j_i)-DiK,
computed by independent product/connection rules, agree with the nonlinear
physical ADM/Z4 subsidiary equations on spatially varying curved jets?
This is an instantaneous physical definition-surface identity test, not an
evolution, off-definition FO-CCZ4 closure, physical CPBC or stability proof.
No fitted invariant rows, state projection, clipping, changed gauge or threshold.

Gamma/K/alpha/beta are smooth third-order analytic Taylor jets in three spatial
coordinates. Valid order is tracked and differentiation lowers it; missing
derivatives must raise, not become known zeros. Gamma_t is retained to order2,
Kij_t to order1. Gamma inverse, Christoffels, Ricci, lapse/shift gradients,
coefficient time derivatives and zero-order damping are not frozen.

Let Eij=alpha*(DiZj+DjZi-2Theta*Kij-kappa1*(1+kappa2)*Theta*gammaij).
The tested equations, covariant shift Lie derivative understood, are:

- H_t=beta.dH-2alpha*DiM^i-4M^i*di(alpha)+2alpha*K*H
  +2*(K*gamma^ij-K^ij)*Eij.
- Mi_t=Lie_beta(M)i-alpha/2*diH-H*di(alpha)+alpha*K*Mi
  +Dj(E^j_i)-Di(trE).
- Theta_t=beta.dTheta+alpha*(H/2+DiZ^i-Theta*K)-Z^i*di(alpha)
  -alpha*kappa1*(2+kappa2)*Theta.
- Zi_t=Lie_beta(Z)i+alpha*(Mi+diTheta-2K_i^j*Zj-kappa1*Zi)
  -Theta*di(alpha).

The extra E terms follow directly by varying only Kij in H/M. Z second
derivatives enter Mi_t. This is not a ready-made eight-state first-order
boundary system. Independently violated auxiliary/algebraic constraints and
the current FO ordering/relaxation couplings remain outside this representation.

## Cases and acceptance fixed before execution

22 cases: one Minkowski, three static isotropic Schwarzschild M=1 points,
and three manufactured curved jets times two signs of K/Theta/Z times three
constant damping settings (.1,0), (0,0), (.2,.25). The first setting is the
current candidate, the other two diagnostic controls only. Explicit fixtures
are immutable in this batch; they are not tuned after seeing discrepancies.

All direct-versus-subsidiary and existing-reference comparisons use absolute
2e-12, rtol=0, without changing previous science thresholds. Static cases must
have H/M, all gamma/K/Theta/Z rates and H/M rates below that bound. Manufactured
cases must have nonzero curvature/H/M/Theta/Z, lapse/shift gradients and third
metric derivatives, so a silent flat or frozen-coefficient substitution cannot
pass. Compare pointwise physical values/rates to the separately qualified
continuum_z4 reference and its complete58 rates to formal_fo_geometry; do not
call the production/native solver.

Controls cover normalized Taylor products/third derivatives, known-order
rejection, inverse products through order3, fractional scalar powers,
positive-metric/lapse/symmetry/finite checks, analytic homogeneous time
variation, and deliberate omission of lapse-gradient, covector shift,
Z4-adjustment or damping terms. A mutation must differ by >1e-8, not merely
cause a parser error. No xfail/skip, no stochastic significance inference.
Existing53 fixed-profile Python controls are the regression suite.

Persist all20x29 input coefficients, both H/M rates, all6 contributions,
pointwise comparisons and full58 reference pairs. Audit recomputes from saved
inputs and rejects changed metadata, incomplete cases, shape/dtype/nonfinite
data and stronger claim flags. Source closure is the unchanged qualified465
plus only this batch's declared new sources, <=4MiB.

## Resources and stopping

One fresh direct evidence directory; 64MiB total, 600 seconds, 2MiB finalization
headroom, C>=3GiB, E>=4GiB+32MiB with prospective allocation. Python/BLAS one
thread, no pycache/plugin autoload, temporary files on E. Stop the owned child
on original timeout/disk rules; preserve every attempt and no automatic retry.
No N9 full matrix, no new native call, no old science rerating, no installation,
art change, live admission or scientificPayloadWriteback.

## Sources verified before implementation

Exa queries returned5+5 candidates, not10 independent papers. Primary equations:
[Yoneda and Shinkai, ADM constraint propagation](https://arxiv.org/html/gr-qc/0103032),
sectionIII.1 equations8-11; and [Alic et al., conformal covariant Z4](https://ar5iv.labs.arxiv.org/html/1106.2254),
physical equations6-9. The former supplies the baseline ADM identities and the
latter the physical Z4 additions, not an admission proof for this repository.

GitHub read-only inspection of GRChombo Source/CCZ4/Constraints.impl.hpp,
blob4deb585c9d2781d0bfc2babd21ddeee84196a6e4, corroborates the diagnostic H/M
normalization only. Its chi_regularised floor is not copied here. No external
code copied, remote repository mutation or unpublished data upload.
