# Fixed-case12 actual volume formula: complete first-order source bridge

## Material Passport

Origin Skill: academic-research-suite / experiment-agent, continuing the
existing source-bound workflow. Artifact: mathematical derivation.
Date: 2026-10-15, Asia/Shanghai. Version: case12_actual_volume_linearization_v1.
Verification Status: UNEXECUTED candidate at creation. This preparation
uses source/receipt reading and paper reasoning only, without scientific
imports, polynomial calculations or tests. AI-assisted work; external
review and proof-assistant certification remain separate. Execution
results must be written separately without revising this frozen proposal.

## 1. Exact question and qualified targets

Let F be the real-formula interpretation of the actual continuum volume
RHS, expressed in the original independent 58-state chart and its spatial
first derivatives. At the fixed case12 background q0, this candidate asks
whether the complete first variation is

    F(q0,0)=0,
    dF(q0,0)[u,p]=J58 u+A_x p_x+A_y p_y+A_z p_z,
    x A_x+y A_y+z A_z=K58(x,y,z).

J58 and K58 are the previously accepted exact source and original shifted
principal matrices. The RHS sign convention is J58+i rho K58(n) on the
physical Fourier line; it is not the opposite sign from a PDE written
with its spatial operator on the left. No direction or frequency is
sampled to establish the displayed coefficient identities.

The immediate accepted parent is
`nr-k3-case12-uniform-frequency-growth-controls-v1-20261015`, with gate
`9b20396162fe62a9be2ef256c340c7d457a42e8578540ac9f4b7f6c9656f0d62`,
worker
`6f3a9e9b3604e3de290ef98c121d7b7eafe176eb9b96341f5472e500bda4cea3`
and independent replay
`d868a751f653a07eb390a6c23c3253023627e0ac45d7c17d56f23275d1c61ff1`.
Its full58 original-state L2 and physical43 weighted growth conclusions
concern the registered linear symbols; the present RHS bridge was not
part of that parent. Its success does not pre-establish this candidate.

The actual qualified J58 JSON SHA is
`19addd44143b8c3d3b9a1829e4848b8b4631bdfd3f8b9502f496ef7d94cbcc8b`;
the qualified K58 JSON SHA is
`e2e7a2976240b8fc0aea54c4621e9e56a29247f9b9c4185da38acac3089e0283`.
Bind their original accepted artifact paths and full ancestry, plus
`nr_constraint_full_symbol.py:source` and
`nr_profile_exact_coefficients.py:case12/principal_rates/matrix`.
The target uses geometric=False and retains shift. A differently labelled
formula or a same-named matrix is not a substitute if the comparison fails.

This is a falsifiable bridge. Nonzero F0 or residual coefficients must
be retained and must fail the corresponding qualification. The producer
must derive the actual nonlinear formula's variation; copying J/K or
substituting their simplified expressions would make the test circular.

## 2. Actual source boundary and state meaning

The actual call edge is

    NonlinearSBPCube.rhs
      -> SBPVolumeOperator.rhs
      -> _fo_ccz4_volume_rhs_3d
      -> _geometry, _sym_first, _sym_shift_gradient, _sym_metric_gradient.

The mathematical body is in `science/numerical_relativity/fo_ccz4_rhs.py`.
`fo_ccz4_sbp_volume.py:state_from_slots` supplies its original chart,
`fo_ccz4_principal_symbol.py:_rhs_components` supplies its 58-component
output packing, and `fo_ccz4.py` supplies the variable order and independent
auxiliary meaning. Bind the actual GaugeConfig, FOCCZ4Config, profile and
driver parameter construction, not only the largest RHS function.

The nonlinear driver also applies CFL checks, local characteristic SATs
on six faces, and RK4 elsewhere. The volume wrapper supplies a particular
SBP derivative in runtime. This candidate uses a continuum derivative
jet in the same volume formula. None of those spatial/time/boundary
algorithms is executed or qualified by this coefficient bridge.

The canonical slot order is

    h[6], ln(alpha), beta[3], ln(phi), Atilde[6], K, Theta,
    GammaHat[3], b[3], A[3], B[9], D[18], P[3].

Here phi=sqrt(chi), A_i denotes the independent lapse auxiliary,
B_k^i the shift auxiliary, D_kij the metric auxiliary with symmetric ij,
and P_i the conformal auxiliary. The six symmetric slots are ordered
(00,01,02,11,12,22). An off-diagonal perturbation changes both symmetric
array entries; its two contractions are not replaced by one.

All 58 perturbation slots and all their first spatial gradients remain
independent. Do not enforce determinant/trace tangency, definition
constraints, tr(D)=0, curl(D)=0 or curl(P)=0. Do not reconstruct A/B/D/P
from base derivatives. Such restrictions would remove precisely the
relaxation and ordering directions that this full58 bridge must check.

## 3. Fixed background, profile and equilibrium obligation

Use

    alpha0=17/20, chi0=18/25, beta0=(3/100,-1/25,1/20),
    h0=L L^T, L=[[1,0,0],[3/25,1,0],[-2/25,3/50,1]],
    Atilde=K=Theta=GammaHat=b=A=B=D=P=0,
    all background spatial derivatives=0.

Since det(L)=1, h0 is positive definite with determinant 1. Preserve
the inherited exact metric/inverse and domain qualification. Positivity
holds on an open neighbourhood in the unconstrained symmetric state
chart, so first variations need not be confined to det(h)=1.

The registered actual parameter values are advective 1+log with
lapse_coefficient=2 and theta_coupling=2, shift_damping=0,
tau_inverse=1, kappa1=1/10, kappa2=0, kappa3=1,
cleaning_speed=1, shift_strength=1, c=1 and config.k0=0.
The active profile has shift_scale=3 and ordering_scale=1/5, hence

    f=3 alpha chi, mu=chi/5.

The profile is actually passed to the volume RHS; the unused constant
gauge.shift_coefficient and config.ordering_mu are not the active laws.
Keep the original profile product-rule term and all state dependence in
the interpreted body. Variations multiplied by zero background fields
may vanish through exact arithmetic, not by manually removing equations.

Paper inspection suggests all equilibrium terms vanish, including
determinant relaxation, because det(h0)=1. The formal certificate must
nevertheless evaluate and save every component of F0. If a constant
source survives, this fixed-equilibrium theorem fails even if some
Jacobian comparison happens to pass. Do not repair or project the state.

## 4. Centred exact chart and the square-zero jet algebra

The original chart contains exp(q6) and exp(2 q10). It is represented
about the exact background without evaluating floating logarithms:

    q6=ln(alpha0)+epsilon*u6,
    q10=(1/2)ln(chi0)+epsilon*u10,
    alpha=alpha0*(1+epsilon*u6) mod epsilon^2,
    chi=chi0*(1+2 epsilon*u10) mod epsilon^2.

Thus the numeric background logs need not be stored as rational values.
The equations use the positive base fields and their exact first chart
derivatives. This is an exact first-order identity, not an approximation
claim for finite-amplitude exponential evaluations. All other fields
use the original affine chart and symmetric slot replication.

For one complete variation use a square-zero algebra with 232 independent
first-order generators: 58 state generators and three sets of 58 gradient
generators. Each product of two generators is zero. Represent an element
as (a,d), with rational constant a and a sparse rational vector d. Then

    (a,d)+(b,e)=(a+b,d+e),
    (a,d)*(b,e)=(ab,a e+b d),
    (a,d)^-1=(a^-1,-d/a^2), when a!=0.

The coefficient of every generator is an actual directional derivative
of the represented real expression. Structural induction over the allowed
arithmetic establishes this statement; it is not a finite-difference
limit or a fit to 232 sampled perturbations. All 232 coefficients are
carried independently in the same algebraic execution.

The base h0 is positive definite, alpha0 lies strictly between 0 and 2,
and chi0 is positive. Matrix inversion and the retained rational and
exponential expressions are smooth on a neighbourhood of this base;
the fixed profile/configuration branches stay valid there. The theorem
is the derivative at this point, with arbitrary symmetric metric and
auxiliary variations, rather than a claim of nonlinear stability on
that neighbourhood. Exact determinant=1 is a property of the base,
not a tangency condition imposed on its perturbations.

For h0 invertible, matrix inverse and determinant obey

    (h0+dh)^-1=u0-u0*dh*u0,
    det(h0+dh)=det(h0)*(1+tr(u0*dh)), u0=h0^-1,

where dh is first order. These formulas require exact inverse/determinant
arithmetic and independent controls, including non-diagonal perturbations;
they are not permissions to replace a general expression by its target J.

The continuum derivative maps a state generator u_a to the corresponding
axis gradient generator p_(i,a) and sends rational constants to zero.
It must preserve generator identity through actual tensor slicing and
broadcasting. It cannot infer a derivative from the original array's
object id. Applying this callback to a surviving gradient generator is
an unregistered second spatial derivative and must raise an error. The
actual first-order body should not need such a request; silently dropping
it would mask a source/backend mismatch.

The three original symmetrization helpers must execute with this callback,
so their half factors, derivative/component axes and symmetric storage
are retained. Likewise the original output packing must produce all 58
rows. A hand-written subset or a reordered list is not an equivalent
certificate without its own complete source bridge.

## 5. Narrow real-formula interpretation and trusted adaptations

Bind the original function ASTs and the exact adaptation manifest. The
required real interpretation replaces decimal float literals with exact
rational constants from their source spelling, for example 0.1 by 1/10
and the arithmetic 2.0/3.0 by 2/3. Preserve booleans, indices, loop bounds
and control structure as such; bool must not be accepted as a coefficient
or seed index merely because Python treats it as an integer subtype.

Every tensor primitive used by the selected bodies must have an explicit
meaning: allocation, copy, slicing, assignment, broadcasting, contraction,
trace, transpose/swapaxes, inverse/determinant and packing. Unsupported
operations fail. Empty-array allocation must not silently hide an
unwritten result by substituting zero. Any assumption about checked
shapes or filled entries belongs in the implementation contract/tests.

The actual state/auxiliary/RHS constructors and validators perform
float64 conversions. In particular FOCCZ4RHS3D.__post_init__ converts
each output field. The implemented route retains the selected dataclass
constructors and their validation through the exact object-array backend;
it does not call the float64 path and recover lost derivatives. For
BSSNState3D only unused convenience methods are omitted; __post_init__
and its complete symmetric-field checks remain. Exact allclose compares
both each scalar value and its full seed coefficients in both backends.
The original state_from_slots body is retained with its two centred exp
adaptations, exact object-kind gate and formal carrier identity hash.
SBPVolumeOperator is a declared single-point shape/identity carrier for
this invocation. It neither executes nor validates a physical SBP grid.

Profile/constraint-control guards, finite/positivity checks and parameter
checks must be individually accounted for. Data-dependent control may
be interpreted only where its branch is established at the registered
background and remains valid in a suitable local neighbourhood, or where
it is a fixed configuration branch. The manifest must distinguish a
retained check, an independently revalidated premise and a removed
float-runtime-only conversion. No general AST rewriting is authorized.

The implemented manifest records decimal-token rationalization and
scalar float-cast replacement, the two exact centred chart nodes, one
input dtype-kind gate, one tau_inverse type-domain gate, one formal
carrier identity replacement and the listed omitted convenience methods.
It binds original and adapted ASTs and the node-by-node operation log.
The equation bodies, tensor indices, loop structure, original symmetry
helpers, profile product rules and 58-output packing are retained.
The frozen forward source bridge has 11 source files and 39 AST bindings:
127 decimal-token substitutions, two scalar-cast substitutions, one tau
exact-type gate, one exact-object input gate, two centred exp nodes, one
formal carrier hash and six unused BSSN convenience methods omitted.
The original nr3d._finite_array is also compiled through the exact array
backend; no separately transcribed finite-array helper supplies that gate.
Allocation uses an unwritten sentinel; determinant/inverse use exact
nonsingular-base arithmetic; finite/domain predicates reject inexact
objects and preserve the registered open base-domain conditions.

This bridge proves equality for a source-bound **real-formula model**.
It does not reproduce Python/NumPy binary64 semantics: decimal rounding,
exp/log implementations, contraction order, inverse/determinant rounding,
array coercion and a numerical derivative's arithmetic are separate.
Fraction(float_value) is not a valid substitute for the declared decimal
source interpretation. No bitwise identity or actual FP64 RHS execution
is claimed by exact first-order evaluation.

## 6. Geometry and source comparisons are not presumed

The real volume body uses the full Christoffel/Ricci/Z construction in
_geometry. The target principal_rates(...,geometric=False) uses a reduced
expression. At this constant background, paper index algebra suggests

    delta RZ_ij=-u0^(kl) partial_k D_lij
                 +partial_(i P_j)+h0_ij u0^(kl) partial_k P_l
                 +(h0_il partial_j GammaHat^l
                   +h0_jl partial_i GammaHat^l)/2.

The connection-derivative terms cancel against the linear covariant-Z
terms without imposing trace/curl constraints. This is an explanation
of the proposed identity, not a replacement for executing the actual
geometry AST and retaining its complete derivatives. Any discrepancy
must remain visible; choosing a different geometric label is not a fix.

Likewise the actual low-order source variation must include determinant
relaxation -tau_inverse*h0*tr(u0*dh), trace(Atilde) relaxation, the
tildeGamma(D) contribution inside GammaHat/b damping, and the original
lapse/shift/conformal-factor source terms. These expressions guide review
but are not a permitted way to fill the production Jacobian from the
accepted target. At zero dynamical fields many nonlinear products vanish
at first order through the jet product rule; their source remains bound.

## 7. Complete candidate and coefficient theorem

Extract and save F0 as 58x1 and four 58x58 matrices

    J_RHS=[state generators] F,
    A_x=[x-gradient generators] F,
    A_y=[y-gradient generators] F,
    A_z=[z-gradient generators] F.

Decode the accepted K58 as a complete homogeneous degree-one polynomial
matrix. Extract its x,y,z coefficients independently; do not evaluate
selected coordinate rays and label that an all-direction proof. Save
the four actual residuals

    R_J=J_RHS-J58,
    R_x=A_x-[x]K58, R_y=A_y-[y]K58, R_z=A_z-[z]K58.

These nine complete arrays contain 58+8*3364=26,970 slots. F0 and the
four residuals contain 58+4*3364=13,514 slots required to be exactly zero.
The four Jacobians themselves may be nonzero. Every array includes zero
slots and canonical rational entries with unique row-major coordinates.

Once the source interpretation, full exact differentiation and these
coefficient identities pass, linearity gives equality for every state
variation and arbitrary spatial gradients at this one background. Thus
the symbol agrees for all real v and, after Fourier substitution, for
all physical frequencies. It does not require nonzero v for the source
identity, and it does not evaluate a Laurent map at frequency zero.
The independent physical43 zero-frequency image remains dimension 39.

Any residual or F0 nonzero rejects this complete bridge. Its actual
coefficients, supports and values are an admissible scientific result,
not a reason to reselect the background, project the variables or alter
the fixed J/K. A partially matching row/block is not this qualification.

## 8. Complete real mutations and separate chart control

Run the same actual formula/jet for two registered parameter changes:

* kappa1=1/5 instead of 1/10, with all other values unchanged;
* ordering_scale=2/5 instead of 1/5, with all other values unchanged.

For each mutation save the same F0, four Jacobians and four residuals
against the original targets. Each has 26,970 slots; the three complete
cases total 80,910. Recompute actual profile/body expressions. Do not
fill an anticipated damping or curl difference, and do not keep only
the rows believed to be affected.

The source mutation must change the actual J relative to the unmutated
result and yield a nonzero residual at the same registered J slot. The
ordering mutation must change a principal coefficient and yield a
nonzero residual at that same registered axis/row/column slot. Two
unrelated nonzero entries in separate tables do not establish this
causality. Record the complete scans as causal_changed_residual_slots.
A baseline failure is retained in each changed result and cannot alone
count as mutation detection. Decisions follow the computed complete
arrays, without predetermined nonzero counts.

The log chart also needs its own small exact controls: differentiate the
centred alpha/chi chart and deliberately omit alpha0, chi0 or the factor
2. Retain the actual rational discrepancies. Such errors can disappear
from this zero-dynamical-background RHS Jacobian because their terms
multiply background zeros; they cannot be assumed to supply effective
case12 negative witnesses. Separate chart controls establish the chart
primitive, while the two full parameter changes exercise actual source
and principal dependence.

Each case__execution.chart.chain_rule_negative_controls stores the three
actually evaluated wrong chart coefficients, their corresponding correct
coefficients, actual_gap=correct-wrong and rejected. Both differentiation
backends generate and compare these records. The metadata explicitly
sets chain_rule_controls_are_case12_rhs_counterexamples=false: a detected
chart primitive error is not a claimed nonzero error in this full RHS.

## 9. Independent replay and resulting scope

The new actual Jacobians must be independently rebuilt with exact
arithmetic from the source-bound body/primitive semantics, then compared
against all saved main and mutant arrays and the accepted targets. Merely
recomputing R from a saved, unverified J_RHS/A family is insufficient.
Production uses a sparse forward first-order jet. Independent replay
uses a reverse-mode scalar differentiation graph, with separately
implemented determinant and inverse arithmetic. Both reconstruct all
three complete cases from the actual source; neither obtains its
Jacobian entries from the other. The actual source AST adaptation,
array routing, centred chart, output packing and saved codecs remain
shared trusted components. This is independent differentiation and
arithmetic, not an independent physical model or a second implementation
of the entire tensor runtime. Their source identities and precise
implementation boundary are fixed before the sole execution.

A complete pass establishes only the registered fixed-case12 continuum
volume real-formula linearization bridge. It permits transferring the
already qualified symbol-level estimates to that real-formula
linearization with their original norms and limits. It does not validate
the FP64 computation, a full nonlinear trajectory, an open family of
backgrounds, a common local energy, SBP semidiscrete stability, SAT/CPBC,
RK4 stability, convergence, black holes, AMR or waveform extraction.

Physical43 remains frequency weighted, with no no-loss plain-L2 claim;
the actual constraint diagnostic implementation still needs its own bridge
to the mathematical C43. Physical/live/scientificPayloadWriteback gates
and the original physical threshold remain separate. The full source
interpretation, exact backend, tensor/chart mapping, independent replay,
canonical serialization, parent proof and owned controller are part of
the trusted base, not themselves a formal proof-assistant theorem.
