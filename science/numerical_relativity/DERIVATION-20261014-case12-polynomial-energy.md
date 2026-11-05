# Fixed-case12 direction energy: full matrix and Gram certificate

## Material Passport

Origin Skill: academic-research-suite / experiment-agent (continuation of
the existing source-bound workflow). Artifact: mathematical derivation.
Date: 2026-10-14, Asia/Shanghai. Version: case12_polynomial_energy_v1.
Verification Status: UNEXECUTED candidate at creation; source review and
algebraic derivation only. No actual polynomial construction, scientific
import, experiment or test was run to prepare this document. AI-assisted
work; not external expert review or proof-assistant certification. A
separate owned-run terminal supplies any execution result.

## 1. Accepted inputs and the intended theorem

The compression parent is
`tmp/nr-shadow-evidence/nr-k3-case12-polynomial-compression-controls-v1-20261014/`.
Its gate SHA-256 is
`04e3db7e90ff93ce0c9ba24f81a0cc3d7f3490e80a21b5930b97b95d7edd2fda`;
its worker-result SHA-256 is
`fd52af65137038fc8e3910c83a3312bfbb9014be67d9c58d5b412180d7fb50b6`.
Its complete exact division certificate establishes the fourteen quotient
matrices Nbar_O,Nbar_0,...,Nbar_6 and Mbar_1,...,Mbar_6. Preserve the parent
and all older failures. No principal K, section, closure, spectral chain,
projector/action construction or compression is rerun.

The accepted X and Pt matrices require a separate, explicit ancestor
binding to the projector parent gate
`a1ca636503cca3f3b94107e44d010adebc33b0497c61e73e3f47343bdca157e1`.
They are at that parent's `parent-inputs/X.json` and
`parent-inputs/parent-inputs/Pt.json`. They were not copied into the
compression parent's mathematical inputs; do not claim otherwise.

For fixed case12 and real v=(x,y,z)!=0, use

    r=v^T v, g=v^T h^-1 v, g >= m r > 0, m=5/6,
    Dbar=r g^3, etabar=r g^2, taubar=r^3 g^6,
    (O,E0,E1,...,E6)=(Nbar_O,Nbar_0,...,Nbar_6)/Dbar,
    L Ej=Mbar_j/etabar, L=X/r, P=Pt/r.

The eight components retain ranks 11,12,8,4,8,0,0,0. The six paired
branches retain their original order and constants

    c=(2601/100000,2601/50000,2601/5000,153/125,459/250,306/125),
    sj=cj g.

Those ranks and spectral identities are accepted prerequisites, not new
eigenvalue measurements. O and E0 remain separate. All three absent paired
branches have explicit zero Nbar and Mbar matrices.

This unit seeks the complete original energy, symmetry and symmetrization
residuals, original Gram lower-bound identity, an explicit rational upper
bound, and the smooth nonzero-direction domain. Only their combined
success can qualify a direction-uniform energy for the registered fixed
43-dimensional constraint-quotient principal family. It does not address
the full 58-state system or its low-order/zero-frequency evolution.

## 2. Original metric, weights and energy numerator

Bind `scripts/nr_constraint_laurent_energy.py:paired_energy`, file SHA-256
`4d73a28131a43c831488438cffaafaf056463d38a6477f316dbad036ae7eab4b`,
and the original SCALED_ROWS=(0,1,2,3,41). Define a diagonal polynomial
matrix Gt whose entries are 1 on SCALED_ROWS and r elsewhere. Then G=Gt/r
is positive for r>0, and G=Gt=I43 when r=1. The eight weights remain

    (wO,w0,w1,...,w6)=(1,1,1/2,...,1/2), sum_i 1/wi=14.

For all eight components and six paired actions form the actual Gram
matrices Ki=Nbar_i^T Gt Nbar_i and Tj=Mbar_j^T Gt Mbar_j, and construct

    Hbar=sum_i wi Ki + sum(j=1..6) [g/(2cj)] Tj,
    H=Hbar/taubar.

This is the original formula

    H=sum_i wi Ei^T G Ei + sum_j (LEj)^T G (LEj)/(2sj).

The action factor is g/(2cj), because
taubar/(2cj*g*r*etabar^2)=g/(2cj). Reusing the uncompressed factor
r^2 g/(2cj) would change the energy. Last-three zero action terms can be
handled as explicit zeros, but their original branch identities remain.

The producer may exploit a diagonal Gt to scale rows before Gram products,
or group rows with equal diagonal polynomial weights (here 1 and r), sum
their outer products first and apply that weight once per output entry.
It may reuse actual Ki/Tj in subsequent expressions. A stacked Gram call
does not reduce the underlying polynomial multiplication work by itself.
This batch must save the complete Hbar; a scalar spectral identity or a
direction sample is not a substitute.

## 3. Eight difference factors and a noncircular Cgram

For every component, including all three absent paired branches, define

    ai=Dbar/(14wi), Fi=Nbar_i-ai I43.

Save all eight full Fi. The polynomial Gram numerator is

    Cgram=sum_i wi Fi^T Gt Fi + sum(j=1..6) [g/(2cj)] Tj.

The producer may construct its individual difference terms by expansion

    Bi=Ki-ai(Nbar_i^T Gt+Gt Nbar_i)+ai^2 Gt,
    Cgram=sum_i wi Bi+sum_j [g/(2cj)] Tj.

This is direct bilinearity of Fi^T Gt Fi. It neither assumes projector
completeness nor uses the desired energy lower bound. The cross terms
require only diagonal row/column scaling. Do not set Cgram equal to
Hbar minus its expected lower-bound term; doing so would manufacture
the residual under test.

The independent Fraction route must verify the stored Fi against their
definitions and rebuild Cgram from the actual Fi^T Gt Fi products, rather
than copying the producer's expanded expression. This gives a separate
arithmetic route for the critical Gram identity.

The complete residual to save and require zero is

    Gram=Hbar-Dbar^2 Gt/14-Cgram.

The denominator is correct because taubar G/14=Dbar^2 Gt/14, and
Dbar^2=r^2 g^6. Dividing a zero residual by taubar yields

    H-G/14 = sum_i wi (Ei-I43/(14wi))^T G (Ei-I43/(14wi))
             + sum_j (LEj)^T G (LEj)/(2sj).

Every term on the right is nonnegative. Each absent paired projector has
Ei=0 but difference -I43/7, so contributes G/98. Removing those three
difference factors would break the original identity and 1/14 contract.

Once the full reconstructed identity passes, H>=G/14 for every real
v!=0; on the Euclidean unit sphere, H>=I43/14.

## 4. Genuine symmetry residuals, including failure paths

Save the complete polynomial matrices

    Hsym=Hbar-Hbar^T,
    HL=Hbar X-X^T Hbar,
    HP=Hbar Pt-Pt^T Hbar.

Their vanishing gives H=H^T, HL=L^T H and HP=P^T H after division by
the appropriate positive scalars. In the last sentence H and P denote
the rational energy and projector; the saved `HL` and `HP` names refer
to the polynomial residuals above.

A safe shared-product formula works even if symmetry fails. Put S=Hsym
and U=Hbar X. Since U^T=X^T Hbar^T,

    HL=U-U^T-X^T S.

Likewise with V=Hbar Pt,

    HP=V-V^T-Pt^T S.

The order of the correction is essential: -S X is generally wrong. When
all coefficients of S are zero, the correction is an explicit zero matrix
and the second product can be skipped. Otherwise compute the correction
in the same owned batch and budget. This is a preregistered branch of the
same general formula, not a repair, retry or conditional relabelling of
an incorrect residual. It preserves true HL/HP matrices on failure.

The independent route must reproduce the defining residuals or the proven
general identity without assuming symmetry. Small nonsymmetric,
noncommuting matrices must qualify the correction order; symmetric-only
controls cannot detect this error.

The registered quotient principal symbol is J=L+bP, with real b=beta.v.
Thus both accepted symmetrization identities give HJ=J^T H. This transfer
uses the original intrinsic/source bridge; it does not assert that the
full 58-state principal system has the same energy.

## 5. Complete products and degree ceilings

Save the following fifteen complete 43-by-43 matrices:

    Gt,
    F_NO,F_N0,F_N1,F_N2,F_N3,F_N4,F_N5,F_N6,
    Hbar,Cgram,Hsym,HL,HP,Gram.

Their coverage is 15*1849=27735 slots. The four residuals Hsym/HL/HP/Gram
contain 7396 slots required to be zero. The eight Fi contain 14792 slots
and are not presumed zero. Ki/Tj may remain internal reusable products;
the complete final matrices and independently reconstructed Gram identity
must still be saved.

The accepted quotient bounds are deg Nbar<=9 and deg Mbar<=8. With
deg Gt<=2, deg g=2, deg Dbar=8, deg X<=4 and deg Pt<=2, caps are

    Gt:2; Fi:9;
    Hbar,Cgram,Hsym,Gram:20;
    HL:24; HP:22.

The correction products in the nonsymmetric failure branch obey the same
24/22 caps. Complete zero matrices retain explicit coordinates and the
canonical zero degree -1. Preserve all nonzero residual coefficients and
statistics before rejection; degree ceilings are not zero evidence.

## 6. Explicit rational coefficient bound and smoothness

For each saved Hbar entry h_ij(v)=sum_alpha h_ij,alpha v^alpha, compute

    Bij=sum_alpha |h_ij,alpha|,
    B_H=sum_ij Bij,
    C=B_H/(5/6)^6.

All coefficients and C are exact rationals; retain every Bij, the total,
and the canonical rational upper bound. No value of C is guessed before
the run. For a unit direction n, each |n_k|<=1, so |h_ij(n)|<=Bij. Hence

    ||Hbar(n)||_2 <= ||Hbar(n)||_F <= sum_ij |h_ij(n)| <= B_H.

On r=1, taubar=g^6 and g>=5/6. Therefore ||H(n)||_2<=C. After symmetry
and the Gram identity pass, this yields

    (1/14)I43 <= H(n) <= C I43, for all real n with n^T n=1.

Independently recompute Bij/B_H/C from the exact saved Hbar coefficients,
and require C>=1/14. A boolean asserting a bound, an eigenvalue sample,
or an upper bound taken from unrelated source bytes is insufficient.

The fixed metric/domain certificate ensures r>0 and g>=mr on real v!=0.
All numerator entries are real rational-coefficient polynomials; taubar,
r and the original source-bound denominators are positive there. Their
rational matrix functions are smooth throughout this domain, and in
particular on the compact unit sphere. This is an analytic consequence
of the bound source/domain identities, not a numerical smoothness test.

The complete positive, uniformly bounded smooth symmetrizer supplies the
usual direction-uniform strong-hyperbolicity criterion for this registered
fixed 43-dimensional principal family. For example, its norm bounds imply
an available diagonalizer condition-number bound whose square is at most
14C; no global smooth choice of eigenvectors is asserted. Do not promote
this conclusion until all source, matrix, Gram, bound and domain gates pass.

## 7. Actual negative and evidence boundary

Perturb the constructed Hbar at [0,1] by the constant 1. Save the complete
delta_Hbar and mutant_Hsym=(Hbar+delta_Hbar)-(Hbar+delta_Hbar)^T. Reconstruct
both independently and reject a nonzero mutant symmetry residual. If the
main Hsym is zero, the negative has exactly the off-diagonal +1/-1 pair.
If the main candidate fails, save the actual mutant result rather than
substituting its expected pattern. These two matrices add 3698 slots
beyond the main 27735.

All scientific calculations, controls, coefficient bounds and independent
replay belong to the owned worker. Finalization is restricted to saved
JSON/report identities, actual input-byte hashes, pure source/AST/parent
manifests, dependency/history/source inventories and process cleanup. No
matrix calculation is moved outside the 600-second/64-MiB envelope.

A complete pass is local exact evidence for the fixed-case12 43-dimensional
constraint-quotient principal family. General backgrounds, the complete
58-state main system and its kernel, low-order estimates, physical zero
frequency, nonlinear well-posedness, boundary conditions, convergence,
black-hole/AMR evolution, waveforms, performance, external reproduction,
live admission and scientific payload writeback retain separate gates.
