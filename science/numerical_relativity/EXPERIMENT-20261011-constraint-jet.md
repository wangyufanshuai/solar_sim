# Independent constraint-jet propagation: preregistration

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns; Exa Search
- Origin Mode: bounded deterministic reference controls
- Origin Date: 2026-10-11
- Verification Status: PLANNED BEFORE EXECUTION
- Version Label: nr-independent-constraint-jet-rhs-v1

## Contract and formulas

Freeze479 qualified sources. Add a candidate differential RHS whose only inputs
are21 background coefficient fields with third-order spatial jets, physical
H/M with first-order jets, and the other39 constraints with second-order jets.
The latter are Theta/Z4, definitions33, determinant and trace. Missing orders
are rejected, never padded. Theta/GammaHat/auxiliary state values are NOT part
of the background input. Coefficients may vary spatially. Zero constraint jets
must give exactly zero rates even on a curved, traceful background.

Factor all formal-minus-actual geometric terms in the reduction defects. For
metric first/second derivative changes X/Y, expand inverse-gradient, connection,
connection-gradient and Ricci changes by product rules, keeping quadratic
cross terms. Formal Z and its formal gradient include both inverse-gradient
and symmetrized ordering changes; they are not derivatives of actual Z.

Write h,a,K,L,ell,beta,b for background fields, c=trace defect, d=det(h)-1,
rA/rB/rD/rP for definition defects, chi=exp(2ell), and B=a+K*h/3.
The physical metric correction is
V=chi^-1*(2*beta^k*(rD_k-rP_k*h)+h_ki*rB_j^k+h_kj*rB_i^k+(2*alpha*c/3-d)*h).
The extrinsic correction is
W=-delta(Hess alpha)+alpha*delta(Rij+DiZj+DjZi)+chi^-1*[
B_ki*rB_j^k+B_kj*rB_i^k+(2*K/3)*beta^k*rD_k-2*beta^k*rP_k*B
-alpha*c*a-alpha*K*c*h/9-(c+K*d/3)*h].
Use covariant D(H,M)[V,W] plus physical subsidiary terms driven by supplied
H/M/Theta/Z jets. Explicit Theta/Z forcing follows the preceding derived
constraint expressions, not a call to its complete-state correction routine.

Auxiliary rates use curls of supplied defects (true derivative curls cancel),
T=dc-2*a^ij*rD_kij, the original variable f=3*alpha*chi and mu=.2*chi, and
algebraic relaxation. Determinant rate is beta.dd+2*(1+d)*beta.h^-1:rD-3*(1+d)*d.
Trace rate is beta.T+[alpha*(K-2*Theta-2*c/3)+(d-3)]*c.
No new state evolution, projection, native solver, fit, envelope or SAT.

## Fixed verification

All132 preceding full-state fixtures are unchanged. Extract their actual
constraint jets ONLY in the comparison layer; compare all43 outputs with the
qualified raw-coordinate/reference assembly. Also compare V through second
spatial order, W and formal Ricci/Z through their needed known orders. Absolute
2e-12, rtol0; exact replay of all persisted inputs and arrays.

Expected231 tests:132 full cases;9 exact-zero controls;21 analytic flat
derivative controls (7 types,3 axes);9 second-derivative deletion controls;
3 background-input independence checks;8 malformed inputs;4 malformed evidence;
1 forbidden full-RHS/constraint-reextraction dependency check;43 independent
constraint-channel probes;1 fixed coverage check. Regression186 preceding
Theta/Z controls. No skip/xfail, post-result threshold changes or retries.

The21 analytic controls use h=I,alpha=chi=1,Kij=beta=0 and one nonzero jet.
Transverse second derivative of rB_i^i gives Hdot=-2; second derivative of c
gives Hdot=-4/3, of d gives Hdot=2; d_i H gives Mdot_i=-1/2; d_i M_i gives
Hdot=-2; d_i Theta gives Mdot_i=.2 and Zdot_i=1; transverse second derivative
of Z_i gives Mdot_i=1. All other rates vanish. These exercise the derivative
contract without reconstructing complete states to manufacture expected rates.

Full background-symbol matching and well-posedness are separate gates. The
older fixed-profile constraint rows use formal D/P for H and formal D for Z;
they must not be equated to the actual-derivative rows without an explicit
definition-constraint conversion. Existing historical results remain unchanged.

## Resource boundary and evidence

One fresh direct child of tmp/nr-shadow-evidence through
scripts/run-nr-k3-constraint-jet-controls.py --output-directory PATH.
Python -B, one BLAS/OpenMP thread, TEMP/TMP in E. Controls64MiB/600sec,
2MiB finalization, authorized source snapshot8MiB; C>=3GiB and
E>=4GiB+32MiB plus prospective budget. Stop only owned child at original
resource limits; preserve failure, no automatic retry or cleanup. No N9
matrix, new evolution, native/GPU call, live, art or scientific writeback.

## External basis and remaining gates

Exa directly reread [Dumbser et al.](https://ar5iv.labs.arxiv.org/html/1707.09910)
Eq12 auxiliary rates, Eq14-28 formal geometry and symmetrized derivatives.
The explicit defect factorization and independent-jet interface are derived
locally; source citations do not validate them. This batch validates a candidate
variable-coefficient constraint-jet operator on registered inputs, not global
hyperbolicity, a common symmetrizer, physical CPBC, nonlinear stability or
scientific convergence. All broader admission flags remain false.
