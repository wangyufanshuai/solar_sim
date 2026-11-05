# Direction-global right-section candidate for the leading constraint map

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns.
- Origin Date:2026-10-13.
- Verification Status: UNVERIFIED candidate implementation and hand derivation.
- Version Label: case12_direction_section_v1.
- No new import, unit test or numerical execution has validated these files.
- No external mathematical review; no global scientific admission.

## Why the previous fixed-ray result is not enough

The accepted lower-energy batch uses one background and v=(1,2,-1). Its exact
Gaussian right inverse proves full row rank at that ray. It does not establish
a smooth section or a uniform rank margin for all directions. Changing which
matrix columns serve as pivots is an implementation detail, not a proof that
the corresponding formula is regular over the full sphere.

This candidate constructs a58-by43 right section S(v) directly from the
definitions of the43 leading constraints. It never calls an inverse solver on
the43-by58 map. Only r=v.v, g=v^T h^-1 v and chi occur as directional/scalar
denominators. Positive-definite h, chi>0 and v!=0 make these denominators
positive. No division by v_x, v_y, v_z or a chosen tangent-frame component is
needed, including on coordinate axes.

This is a structural prerequisite for a direction-uniform energy analysis,
not a replacement for that analysis. The candidate does not modify the
accepted map or the physical evolution equations.

## Variables and the exact map being inverted

Use the58-state and43-constraint orderings already frozen in
`scripts/nr_constraint_exact_coefficients.py`. Write
c=(H,M_i,Theta,Z_i,rA_k,rB_k^i,rD_kij,rP_k,d,tau). Here d is the compensated
leading determinant coordinate, not a zero-frequency determinant inverse.
Let u=h^-1, w=u v, r=v.v, g=v.w, and Pi=I-v v^T/r.

The state q below is a representative in the rational principal-symbol
coordinates used by Dhat. It is NOT physical initial data or a nonlinear
state to write into the simulation. The principal leading equations are

    rA_k = Pi_k^l A_l - v_k ln(alpha),
    rB_k^i = Pi_k^l B_l^i - v_k beta^i,
    rD_kij = Pi_k^l D_lij - v_k h_ij(perturbation)/2,
    rP_k = Pi_k^l P_l - v_k ln(phi),
    H = chi [2 w^l u^ij (D_ilj-D_lij) + 4 w^k P_k],
    M_i = w^j a_ji - v_i(tau+2 K/3),
    Z_i = [h_ij Gamma^j-u^jl(2D_jil-D_ijl)]/2,
    d = 2 v^k u^ij D_kij,    tau = u^ij a_ij.

All repeated symmetric indices are summed as tensors, including both
off-diagonal terms. Storage uses only the six independent symmetric entries.
Base h denotes its perturbation slot only in the rD equation; the fixed
background metric in every contraction remains unchanged.

## Explicit construction and algebraic proof candidate

### 1. Definition defects

For each derivative group let t=(v.r_group)/r, component by component.
Set the base coordinate to -t, or -2t for the metric group, and initially
set the auxiliary group to Pi r_group. Then its output is
Pi(Pi r_group)+v t=r_group. Subsequent longitudinal additions v times any
coefficient do not change this output because Pi v=0.

### 2. Determinant and Hamiltonian

Add v_k d h_ij/(6r) to D_kij. Its determinant output is
2 r times tr_u(d h/(6r))=d, since tr_u(h)=3. The initial transverse D has
zero determinant output by v^T Pi=0.

Evaluate H_base from this D and the initial transverse P. Add v_k p to P_k,
where p=(H-H_base)/(4 chi g). This sets the Hamiltonian output to H while
leaving rP unchanged. This construction retains, rather than discards, the
Hamiltonian contribution of all transverse D and P defects.

### 3. Momentum and algebraic trace

Set K=-3 tau/2, m_i=M_i, b=w.m and t=(tau-b/g)/2. Choose

    a_ij = (v_i m_j+v_j m_i)/g - b v_i v_j/g^2
           + t (h_ij-v_i v_j/g).

Direct contraction gives w^j a_ji=m_i and u^ij a_ij=tau. The remaining
momentum term vanishes because tau+2K/3=0. This simultaneously matches all
three momentum coordinates and tau, without choosing a component of v.

### 4. Theta and Z

Set the state Theta to c_Theta. With the D constructed above define
connection_i=u^jl(2D_jil-D_ijl), and set
Gamma^i=u^ij(2Z_j+connection_j). Then the Z output is exactly Z_i.
The driver b^i can remain zero; it does not enter Dhat.

Every construction step is linear in the target constraint vector. If the
translation into code is correct, applying the original Dhat returns every
component of c, so Dhat(v) S(v)=I43. This gives rank43 and a15-dimensional
kernel for nonzero v. The formulas are rational and smooth wherever
r,g,chi>0. This argument is a hand derivation, not a machine-checked
all-direction theorem; new executable validation and independent review
remain pending.

## Case12 directional denominator and branch margins

The fixed background metric is

    h = [[1, 3/25, -2/25],
         [3/25, 634/625, 63/1250],
         [-2/25, 63/1250, 101/100]].

Its inverse is

    u = [[1596881/1562500, -7827/62500, 109/1250],
         [-7827/62500, 2509/2500, -3/50],
         [109/1250, -3/50, 1]].

For Euclidean unit n, the symmetric-matrix row-sum norm bounds give

    ||h||_2 <= ||h||_infinity = 6/5,
    ||u||_2 <= ||u||_infinity = 964403/781250,
    5/6 <= n^T u n <= 964403/781250.

Thus g >= (5/6)r for any nonzero v. These are exact proposed bounds, not
eigenvalues fitted to sampled directions. For fixed chi=18/25, the section
denominators stay away from zero on the unit sphere.

The prescribed six squared intrinsic speeds have the form c_j (n^T u n),
with fixed positive coefficients

    c_j = [2601/100000, 2601/50000, 2601/5000,
           153/125, 459/250, 306/125].

The gap among ordered nodes(0,c_1,...,c_6), after multiplying by n^T u n,
is at least867/40000. This keeps the prescribed paired-projector denominators
nonzero uniformly in direction. It does NOT prove that these prescribed
speeds are the spectrum of the actual constraint quotient. It also is not
a gap between all shifted physical speeds: ODE/PDE speeds can coincide
because of beta.n. Their invariant projectors and action must be checked.

## Necessary remaining gates

Even Dhat S=I is insufficient for subsidiary closure. The candidate
A_c=Dhat K_v S is a true quotient only if

    Dhat K_v(I-S Dhat)=0,

on every direction. A right inverse alone does not imply this relation.
The proposed bounded batch tests it exactly at eight preregistered rays,
compares with a separately pivoted quotient and constructs exact paired
energies there. Those eight point checks can falsify this implementation;
they cannot prove the remaining all-direction identities.

A full direction-uniform certificate still needs:

1. An analytic tensor/covariance proof or complete polynomial-identity
   verification of quotient closure and prescribed spectral identities
   over the whole sphere, with explicit coordinate conventions.
2. Smooth projectors and energy plus a direction-independent upper bound,
   retaining the normalized lower floor I/14. Compactness cannot be invoked
   before continuity and the identities have actually been established.
3. Direction-uniform lower-order estimates, a justified norm equivalence,
   and a separate treatment of physical zero frequency(rank39).
4. Constraint-compatible boundary analysis, then discretization and physical
   convergence. None is licensed by eight green ray checks.

The accepted fixed-ray lower-energy receipt remains unchanged. Do not replace
its conservative4.87e6 high-frequency bound with any untested smaller value.

## Framework sources, not certificates for this code

[Sarbach and Tiglio, Section3.2.2, Definition4](https://arxiv.org/html/1203.6443v1)
requires a smoothly direction-dependent symmetrizer with uniform upper and
lower bounds for the variable-coefficient strong-hyperbolicity framework.
It distinguishes this from a direction-independent symmetrizer.

[Dumbser et al., AppendixA.2](https://arxiv.org/html/1707.09910v2) gives the
1+log/Gamma-driver characteristic branches and warns about gauge-dependent
degeneracies; their full FO-CCZ4 system is not presented as Friedrichs
symmetric hyperbolic. These results motivate the checks but do not prove
the project's43-constraint quotient, section or boundary conditions.

Only the public primary papers were consulted. No unpublished project data
was uploaded. The formulas and constants above are project-specific deductions
to be checked, not claims attributed to those papers.
