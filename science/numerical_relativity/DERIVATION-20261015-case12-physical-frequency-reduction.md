# Fixed-case12 physical frequency reduction and principal connection

## Material Passport

Origin Skill: academic-research-suite / experiment-agent, existing workflow.
Artifact: source-bound mathematical derivation. Date: 2026-10-15, Asia/Shanghai.
Version Label: case12_physical_frequency_reduction_v1.
Verification Status: UNVERIFIED candidate before its owned execution.
Only frozen sources and accepted records were read to write this document.
No scientific import, polynomial calculation or test was executed.
AI-assisted work; external mathematical review remains separate.

## Three distinct accepted inputs

The physical-closure-division parent supplies complete 43x43 polynomial
coefficients Q0,Q1,Q2, homogeneous in v=(x,y,z) of degrees 0,1,2, and

    Q(zeta)C(zeta)=C(zeta)(J58+zeta K58),
    Q(zeta)=Q0+zeta Q1+zeta^2 Q2.

The frequency indeterminate zeta is separate from the direction variable z.
J58 is the 58x58 algebraic source and K58 is the 58x58 original principal
matrix, including shift. They are not the 43-coordinate comparison target.

The coordinate-bridge parent supplies actual complete Laurent matrices
T,Ti and their scaled polynomial numerators

    t=rT,       u=rTi,       r=v^T v,
    T Ti=Ti T=I43,
    T C=D+zeta^-1 R.

Both t and u retain every power -1,0,1,2. Here u denotes the inverse-
transform numerator, not the inverse metric and not the older bridge
factor often called U. D is the accepted leading constraint map. The
polynomial-section ancestor supplies D S=I43 on real v!=0. These are
inherited, source-bound identities, not additional calculations in this
new batch.

The blocks parent supplies Ab, its saved `division_quotient.json`, with
the accepted principal constraint generator

    Khat43=Ab/r,       Khat43 D=D K58.

It retains the original shift and original rational directional coordinates.
Neither the intrinsic shift-subtracted operator nor J58 is substituted for
Khat43. The symbols J58,K58,Khat43 remain distinct throughout this proof.

The three parent gates, under `tmp/nr-shadow-evidence/`, are:

| Parent directory | Gate SHA256 |
|---|---|
| nr-k3-case12-physical-closure-division-controls-v1-20261015 | 7fb40ea60452cd0c81e932802dfb5a2295a1375f3eda85c0c1cd5fda51270fe6 |
| nr-k3-case12-physical-coordinate-bridge-controls-v1-20261015 | 466bf5a2a13dadf05bda60b9cbbad4e60ce43f442bcb8fdda0cf61fb2a4dd708 |
| nr-k3-case12-polynomial-blocks-controls-v1-20261014 | 426016d3bc774df001f10bbdab81475a1ad498ff6fbd43f76bd3d67d071e02c7 |

Each actual Q,t,u,Ab and scalar/domain input must be bound to its own
accepted artifact manifest, worker, independent replay and original source.
A successful unrelated gate cannot qualify these matrices.

## Domain and unique prescribed transformation

Keep the original case12 background and parameters, geometric=False
principal scope, chi=18/25, r=v^T v and g=v^T h^-1 v. The inherited fixed
positive metric gives g>=(5/6)r>0 for every real v!=0. Frequencies may be
complex but must be nonzero for T and Ti. The only new transformation is

    Ared(zeta)=T(zeta) Q(zeta) Ti(zeta),
    Z(zeta)=t(zeta) Q(zeta) u(zeta)=r^2 Ared(zeta).

The factor is r^2, because each transform numerator contributes one r.
There is no extra sigma, Delta, g or sqrt(r) in this denominator. Positivity
of r makes clearing r^2 reversible on the registered direction domain,
including coordinate axes and arbitrary nonzero rescalings of v.

All coefficients of Z belong to QQ[x,y,z]. Their coefficient identity is
an exact finite algebraic claim; no frequency fitting, eigenbasis, special
ray or asymptotic series is used. The construction does not change the
physical generator Q. For a frozen spatial Fourier mode T is time
independent, so the transformed evolution symbol is the displayed
similarity Ared. This alone does not compare the unweighted norms of the
physical and transformed constraints.

## Complete support and direction-degree ceilings

The exact supports are t:-1..2, Q:0..2, u:-1..2. Therefore Z has all nine
powers -2..6. Preserve every power, including endpoint coefficients expected
to be zero. Production and independent reconstruction must retain matrix
factor order even when they use different associations.

The accepted t coefficient degree caps are (2,3,4,5), and u caps are
(0,2,3,3), in power order -1,0,1,2. Each Q_j has degree j. For an output
power p, take the maximum of deg(t_a)+j+deg(u_b) over a+j+b=p:

| Frequency power p | -2 | -1 | 0 | 1 | 2 | 3 | 4 | 5 | 6 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Z_p storage cap | 2 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 10 |

These are per-coefficient conservative total-degree bounds. Different
coordinate blocks have different direction scalings, so this does not
assert that each entire Z_p is homogeneous. The full matrix statistics must
be derived from the saved coefficients during the future run.

Save nine complete 43x43 Z matrices and the complete 43x43 matrix

    leading_residual=Z_1-r Ab,

with degree cap 6. The ten main matrices contain 18,490 explicit slots.
Require Z_2,...,Z_6 and leading_residual all zero, covering six complete
matrices and 11,094 slots. Z_-2,Z_-1,Z_0 are retained actual low-order
coefficients; they are not zero targets. No successful subset of high
powers qualifies the complete reduction.

## Why the leading target is Ab/r

Use the accepted closure and Ti T=I to obtain the Laurent identity

    Ared (T C) = T Q C = (T C)(J58+zeta K58).

Once all powers above one in Ared have actually vanished, the coefficient
of zeta^1 on the left is Ared_1 D. On the right it is D K58, because
T C=D+zeta^-1 R. Hence

    Ared_1 D=D K58.

Right multiplication by the accepted S gives Ared_1=D K58 S=Khat43=Ab/r.
The high-power-zero prerequisite matters: if Ared_2 were retained, its
product with zeta^-1 R could also contribute to frequency power 1. One
cannot assume the leading relation before that prerequisite passes.

Since Ared_1=Z_1/r^2, the correct cleared comparison is Z_1-r Ab=0.
Ab has inherited cap 4, so the target has cap 6. This explanatory chain does
not replace the registered direct complete residual and independent check.
No comparison with J58, intrinsic Khat43 or an extra 1/sqrt(r) is permitted.

## Genuine degree-preserving source-coefficient negative

Construct the actual changed polynomial coefficient

    bad_Q2=Q2+x^2 I43,
    bad_Q(zeta)=Q0+zeta Q1+zeta^2 bad_Q2.

The perturbation preserves degree 2 homogeneity, so the negative cannot be
rejected merely for malformed directional degree. Save bad_Q2 itself with
cap 2 and the complete nine coefficients of

    mutated_Z=t bad_Q u.

Use the same per-power degree caps as for Z. Production may compute the
actual product t*(zeta^2 x^2 I)*u and add it to the actual baseline Z;
independent replay directly multiplies t,bad_Q,u in its own association.
Neither route may replace a failed baseline by zero or paste a predicted
residual. Preserve every complete coefficient before evaluating rejection.

The accepted tu=r^2 I supplies the paper prediction

    mutated_Z-Z=zeta^2 x^2 r^2 I43.

This explains the control, but all required products still have to be
computed. Require the actual prescribed input change, an actual nonzero
coefficient above frequency order 1 in mutated_Z, and a nonzero change in
that high-order family relative to baseline. The monomial x^2 vanishes on the plane
x=0; therefore this is a nonzero-polynomial counterexample, not a claim
that every individual direction produces a nonzero mutation. The complete
coefficient test detects it without selecting a ray. A Q0+=I perturbation
would only alter the constant term and is unsuitable for this high-order
gate.

The ten negative matrices add 18,490 slots. The complete certificate has
20 matrices and 36,980 slots. Expected nonzero counts are not preset; exact
locations, coefficients and rejection decisions must come from the saved
candidate and independent replay. A mathematical baseline failure remains
failure even if the negative is rejected.

## Source binding and independent reconstruction

Reuse actual accepted Q0/Q1/Q2, all eight t/u coefficients, Ab and fixed
domain/scalars. The new producer composes the specified expression with
the unchanged exact polynomial/Laurent helpers. Bind the original
`nr_constraint_laurent_energy.reduction` source as the definition of this
coordinate operation; no old fixed-ray calculation substitutes for the new
all-direction products. Do not rebuild old coordinates, old division,
principal quotient, energy or their accepted proofs.

Independent standard-library reconstruction uses exact Fraction values
with the qualified integer convolution helper at SHA
`5b4f8e7510cd32064cef2266d6d1d472bb1bde2f842f0836b37bcc0c74ddef7f`.
It rebuilds the full transformed main/negative families and leading target
from actual archived bytes and compares every direction coefficient and
every matrix slot. Bind all parsed raw bytes, degree caps, statistics,
source identities and derived acceptance decisions. This is local exact
computational redundancy, not external scientific review.

## Energy, normalization and zero-frequency limits

A full pass would establish

    Ared(zeta)=zeta^-2 A_-2+zeta^-1 A_-1+A_0+zeta Khat43,
    A_p=Z_p/r^2,

with the original shift retained. It connects the leading term to the
already accepted 43-coordinate principal operator. It does not estimate
the norms of A_-2,A_-1,A_0 or prove a new full-frequency energy/growth bound.
The original fixed-ray `growth_bounds` guard cannot be removed on the
strength of this coefficient identity.

The physical radial-frequency substitution is zeta=i*rho/sqrt(r), rho>0. For
normal coordinates let S43 be diagonal, sqrt(r) on original
SCALED_ROWS=(0,1,2,3,41) and 1 elsewhere. The normalized principal operator is

    S43^-1 Khat43 S43/sqrt(r),

and the correspondingly pulled-back energy is S43^T H S43. The original
unscaled energy has lower bound G/14, with G diagonal 1/r on those five rows
and 1 on the others. Only at unit direction or in the correctly normalized
coordinates does this become I/14. No normalized energy is silently applied
to the untransformed physical constraint coordinates.

At zeta=0 neither T nor Ti is evaluated. Negative powers remain in the
retained low-order family, and no removable limit or uniform rho->0 bound
is proved. The original polynomial Q still exists at zero, where C0 has
rank39; its reachable-image treatment and absence of a full43 right inverse
remain separate. The actual nonlinear-RHS bridge, geometric=True or varying
background results, lower-order energy, damping, legal IBVP and numerical
convergence remain unproved by this batch. Physical/live/payload admission
and all prior scope restrictions remain unchanged.
