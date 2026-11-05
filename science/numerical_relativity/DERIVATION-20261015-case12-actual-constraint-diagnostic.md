# Fixed-case12 actual constraint diagnostics: complete second-spatial-jet bridge

## Material Passport

Origin Skill: academic-research-suite / experiment-agent, existing workflow.
Artifact: source-bound mathematical derivation for one candidate.
Date: 2026-10-15, Asia/Shanghai.
Verification Status: **UNVERIFIED before execution**. This document uses source
reading and paper reasoning only; no mathematical evaluation, scientific
import or test has been run for its preparation. Implementation and control
identities are registered in the companion EXPERIMENT before the sole run.

## 1. Claim and fixed domain

The candidate connects actual continuum real-formula diagnostics to the
accepted physical43 symbol at fixed case12. It separately connects every
raw scalar of the nonlinear driver's metric diagnostics to the corresponding
physical rows and their symmetric duplicates. It does not establish finite
difference/SBP execution, binary64 agreement, nonlinear constraint evolution,
boundary stability or convergence.

The accepted actual-volume parent has gate SHA256
`ba5bff599828bf9185db40c72e6421c337fe89b60fab5acde4329f534b4502f0`.
The root task reports its completed terminal audits. Its actual RHS bridge
is inherited, not recomputed here. The coordinate parent has gate SHA256
`466bf5a2a13dadf05bda60b9cbbad4e60ce43f442bcb8fdda0cf61fb2a4dd708`.
The present claim additionally requires complete byte/qualification checks
for both parents and the exact saved C0/C1/C2 inputs.

Use the same constant background and logarithmic chart as the actual-volume
parent:

    alpha0=17/20, chi0=18/25, beta0=(3/100,-1/25,1/20),
    h0=L L^T, L=[[1,0,0],[3/25,1,0],[-2/25,3/50,1]],
    Atilde=K=Theta=GammaHat=b=A_i=B_k^i=D_kij=P_i=0.

Write h=h0 and u=h0^{-1} when no variation is indicated. The determinant is
one and h is positive definite. All background spatial derivatives vanish.
State slots are the original 58, including six independent symmetric metric
and Atilde components in order (00,01,02,11,12,22). Slots q6 and q10 are
ln(alpha) and ln(phi)=0.5 ln(chi), respectively. No determinant, trace,
definition or auxiliary curl constraint is imposed on any perturbation.

## 2. Actual functions and the continuum replacement boundary

The physical diagnostic source is
`fo_ccz4_relaxation_convergence.constraint_fields`, with its original
`require`, `symmetric`, `christoffel`, checkpoint `SYMMETRIC` ordering and
slots/header interface. Its H/M are computed from the actual physical
metric and extrinsic-curvature tensors. Its `Ghat` is the evolved connection
minus the genuine contracted Christoffel of h. The source computes all
definition, determinant, trace and Theta fields as well.

The original relaxation `derivative` implements centered FD2/FD4 through
FFT. Bind its source AST as the explicit replacement boundary, and bind
the calls to an exact continuum spatial derivative. Do not execute or
qualify the FFT/FD implementation under a continuum label.

The second source is the entire actual
`NonlinearSBPCube.metric_constraints` method, its `state` call and original
`state_from_slots` construction. Its local derivative reaches
`self.volume.axes[axis].derivative`. A registered carrier supplies the same
continuum derivative semantics there. The original driver's norm calculation,
SBP matrices, characteristic SAT, time integration and `.diagnostics`
aggregation are outside this claim.
The original `state` AST is bound as a reference, while a private driver
adapter calls the original adapted `state_from_slots` directly. It bypasses
the original `field` binary64 conversion; the original state/field bodies
are not claimed to have executed. This adapter is part of the trusted bridge.

The 69 entries in `_constraint_components` are a different ordering/curl
diagnostic and do not supply H/M/Z. They cannot replace this source chain.
No hand-coded target formula may replace the actual Christoffel, Ricci,
H/M or driver method during production or independent reconstruction.

## 3. The independent jet and its 580 columns

Work at first order in perturbation amplitude. Introduce 580 independent
generators, all pairwise products zero:

    e_a                  a=0..57                       58 states,
    e_(i,a)              i=0..2                       174 gradients,
    e_(ij,a), i<=j       ij=00,01,02,11,12,22         348 Hessians.

Indices are a, 58+58*i+a and 232+58*pair_index(ij)+a. The last generators
represent actual partial_i partial_j perturbations, not Taylor coefficients.
For every scalar output, its constant and these 580 rational coefficients
are extracted. All columns, including inactive auxiliary Hessians, remain.

The derivative is the linear derivation

    D_i c=0,
    D_i e_a=e_(i,a),
    D_i e_(j,a)=e_(min(i,j),max(i,j),a).

This is compatible with Leibniz because products of two amplitude generators
vanish. Hessian symmetry expresses commuting continuum derivatives of
smooth state fields. It does not enforce relations between independent FO
auxiliary states and derivatives of base states.
At the present constant background, all background spatial gradients and
Hessians vanish, so the first Fréchet variation commutes with both spatial
derivatives. Terms such as (D delta q)(D delta q) remain amplitude-second-order
and may be discarded. This argument does not apply as written to a general
nonuniform background or a nonlinear spatial Taylor algebra.

Derivatives of Hessian generators are unsupported third-spatial-order
requests and must fail, even if an expression previously canceled or was
multiplied by zero. Preserve spatial-order provenance through arithmetic
and slicing. Array identity is not a substitute for coefficient identity.
Pure constants with no seed provenance stay at order−1 and may repeatedly
differentiate to zero; the rejection concerns seed-derived order2 paths.
The old 232-seed forward and reverse implementations have fixed classes,
indices and derivative restrictions; merely changing a count is insufficient.

This is a complete first variation in a second-spatial-order local jet.
It does not retain second-order amplitude products and cannot certify a
nonlinear diagnostic identity away from the background.

## 4. Exact centered chart and source interpretation

For the two logarithmic slots use, to first amplitude order,

    alpha=alpha0*(1+e_6),
    chi=chi0*(1+2*e_10).

This is the derivative of the actual exponential chart, not an exact finite
amplitude exponential. Background logarithms need not be represented as
irrational numeric approximations. The relaxation expression `exp(2*q[10])`
has its own exact adaptation; it is not covered merely by adapting the two
state constructor exponentials.

In the driver the registered `log(lapse)` and `0.5*log(chi)` occur under
spatial derivatives. Their centered forms retain delta(alpha)/alpha0 and
delta(chi)/(2*chi0); only the spatially constant background log is omitted.
The adapter must not globally define log as zero. The actual-volume parent
already saved the three wrong-chain gaps for omitted alpha0,chi0 and
factor2. Inherit that qualified evidence; the present execution records
the correct alpha/chi chain and registered log scope, while focused actual
exp/log path controls cover the new adapter. Do not claim that new execution
metadata repeats the three parent gaps or infer chart correctness merely
from this equilibrium diagnostic's sensitivity.

Decimal source spellings, including `.5`, are interpreted as exact rational
real constants. Constructor dtype/validation and array primitive adapters
are narrowly enumerated with original/adapted AST hashes and exact match
counts. Original validation, off-constraint symmetric packing and the
diagnostic bodies remain part of the executed source bridge.

The interpretation concerns source real arithmetic. It does not assert
bitwise or rounded Python/NumPy binary64 behavior. Object-array routing,
einsum/stack/trace/matmul, inverse/det and centered-chart handling are part
of the disclosed trusted implementation, not facts established by merely
matching a source filename.

## 5. Physical43 assembly and expected first variations

The row order is H; three M_i; Theta; three lower Z_i; three C_A;
nine C_B; eighteen symmetric C_D; three C_P; det(h)−1; tr_h(Atilde).
Their 0-based ranges are 0,1–3,4,5–7,8–10,11–19,20–37,38–40,41,42.

The actual relaxation field is contravariant

    Ghat^i = GammaHat^i − h^{jk} Gamma(h)^i_jk.

The registered output wrapper applies Z_i=h_ij Ghat^j/2 to full jet values
before coefficient extraction. Its background Ghat vanishes; the product
rule is nevertheless evaluated rather than replaced by an assumed rule.

Let a=delta(Atilde), k=delta(K), w=delta(q10), delta h be the symmetric
metric variation, and define d=tr_u(delta h), t=tr_u(a). From the actual
physical tensors,

    delta(gamma_ij)=(delta h_ij−2 h_ij w)/chi0,
    delta(K_ij)=(a_ij+h_ij k/3)/chi0,
    delta(K^i_j)=u^{i ell}a_ell j+(k/3)delta^i_j,
    delta(actual_trace)=t+k.

At this constant, zero-extrinsic-curvature background the expected physical
linearizations are

    delta H = chi0*(u^{ik}u^{j ell} D_i D_j delta h_k ell
                    −u^{ij}D_i D_j d+4u^{ij}D_i D_j w),
    delta M_i = u^{jk}D_j a_ki−D_i(t+2k/3),
    delta Z_i = (1/2)h_ij delta(GammaHat^j)
                −(1/2)*(u^{jk}D_j delta h_ki−(1/2)D_i d).

The quadratic K terms in H have zero first variation, but the actual trace
in M is essential. Replacing actual_trace by stored K drops D_i t. The
contracted-Christoffel identity

    h^{jk}Gamma(h)^i_jk = −D_j h^{ij}−(1/2)h^{ij}D_j ln(det h)

shows why an inverse-divergence shortcut drops a determinant-gradient term.
No det/trace projection may be used to make these formulas agree.

The remaining expected variations are Theta; A_i−D_i q6;
B_k^i−D_k beta^i; D_kij−D_k(delta h_ij)/2; P_i−D_i q10;
d; and t. These formulas explain the target. The formal gate still uses
the accepted complete C0/C1/C2 coefficients and actual source evaluation;
the paper derivation is not a substitute for a saved coefficient identity.

## 6. Full coefficient target and the mixed-Hessian convention

The accepted symbol is C(zeta,v)=C0+zeta C1(v)+zeta² C2(v), where
v=(x,y,z), C1 is homogeneous linear and C2 homogeneous quadratic.
Form a single target O in QQ^{43×580} by concatenating

    C0, [x]C1, [y]C1, [z]C1,
    [x²]C2, [xy]C2, [xz]C2, [y²]C2, [yz]C2, [z²]C2.

Decode and check the shape and complete homogeneous support of each parent.
All ten blocks contain every 43×58 slot; no direction is evaluated.

For independent Hessian h_xy=partial_x partial_y delta q, the coefficient
is the full [xy]C2, without division by2. Only a different convention using
both ordered Hessian slots would divide that total between xy and yx.
For example a local Taylor perturbation uses h_xy*x*y but h_xx*x²/2;
both corresponding second derivatives equal the named Hessian seed.
Axis-only evaluations cannot detect the mixed monomials and are excluded.

For each real source case save F0 and complete C, then R=C−O. In the
baseline gate F0 and R must be exactly zero. A true polynomial coefficient
identity implies agreement for every spatial covector, including zero;
it is stronger than checking finitely many directions.

## 7. Full driver49 and its two complete comparisons

Execute the actual driver method independently of the relaxation function.
Pack raw scalar rows in explicit order

    H, M[3], Theta, C_A[3], C_B[9], C_D[27], C_P[3], det_h, trace_a.

There are49 rows, with C_D retaining all three-by-three-by-three entries.
For each row save its background value and all580 derivatives. The
canonical correspondence keeps driver rows0..16, then the18 entries
17+9*k+3*i+j for k=0..2 and i<=j, then rows44..48. These40 rows correspond
exactly to physical43 rows0..4 and8..42.

Define driverAgreement(40×581) as their differences from baseline43,
with column0 the background value and columns1..580 the derivatives.
Define driverSymmetry(9×581) from
C_D[k,i,j]−C_D[k,j,i], k=0..2, (i,j)=01,02,12, using the same columns.
Both matrices and driverF0 must be exactly zero. This proves the complete
registered driver correspondence including redundant entries; it does not
add a Z diagnostic to an API that has no such field.

## 8. Genuine source mutations and non-circular acceptance

`momentum_trace_mutant` replaces precisely the actual relaxation assignment
to actual_trace by stored K=q17. This changes both the subtracted trace
derivative in M and the actual_trace² subexpression in H. At zero background
curvature the latter may have no first variation; complete H output and
the outside-target-row check must establish this rather than assume it.
Run the full source with all580 seeds, and save every F0/C/R entry.

`connection_target_mutant` replaces the actual contracted-Christoffel
target by −sum_j D_j h_inverse[i,j] through a registered exact AST
mutation. The full h/2 lowering wrapper and all other diagnostics remain.
Again run the full43 source and retain every coefficient and residual.

For a valid negative, at least one slot in its registered affected rows
(M:1..3, Z:5..7) must simultaneously change relative to baseline and have
a nonzero residual relative to the unchanged oracle. Preserve the actual
causal slot count. Changes outside those affected rows are a scope failure.
No theoretical delta matrix or prefilled nonzero pattern is accepted.
Independent reconstruction must execute the actual mutated sources too.

Baseline failure must not be hidden by these controls or prevent them from
being saved. The gate requires baseline, driver and negative conditions
together; any nonzero required residual fails after complete evidence is
saved when resources permit. Exceptions or hard deadlines preserve the
prefix and do not qualify a partial certificate.

## 9. What the two independent algorithms do and do not establish

The production forward jet and independent reverse differentiation must
both reproduce complete constants and580-column derivatives from the
actual source. Their scalar differentiation and inverse/determinant
algorithms should be distinct. Independently recover the ten target blocks,
driver mapping, all exact residuals and same-slot negative causality.

Shared source AST, array primitive routing, chart and packing remain a
common trusted base and must be explicitly listed. A matching pair of
derivative algorithms does not establish arbitrary Python semantics or
eliminate a common adapter error. Target coefficient extraction, mixed
Hessian controls, real chart controls and raw driver comparison reduce
specific risks without removing that limitation.

## 10. Restricted consequence and deferred claims

Only an executed and accepted complete certificate may qualify
`actual_constraint_continuum_real_formula_bridge_validated` and
`driver_metric_constraint_continuum_bridge_validated`. The broad legacy
`actual_constraint_diagnostic_bridge_proved` remains false because its name
does not specify the continuum, fixed-background and real-formula limits.

Together with the accepted actual-volume bridge and prior symbol closure,
the result can support a subsequent explicit composition of the fixed
background linearized constraint-propagation chain. This candidate does
not re-prove that closure or claim a nonlinear differential PDE theorem.
In particular `local_differential_constraint_pde_derived` remains false.

C0 retains its accepted rank39 structure; a new diagnostic identity does
not construct a full43 zero-frequency right inverse. Nonzero-frequency
Laurent transformations are not extended to zero. Full58 unweighted L2
and physical43 weighted growth remain distinct inherited results.
Uniform Euclidean growth for43, absence of derivative loss, variable
background energy, damping, SBP energy, physical boundary acceptance,
evolution, convergence and binary64 diagnostic execution remain unproved.
