## Material Passport

- Origin Skill: academic-research-suite / experiment-agent
- Origin Mode: derivation before the authorized v3 batch
- Origin Date: 2026-10-13 (Asia/Shanghai)
- Verification Status: UNVERIFIED before execution
- Version Label: case0-hermite-v3

## Scope and hypothesis

Only the original flat case 0, with the original43/58 systems, zero shift,
normal=(1,0,0), f=3, mu=1/5. No evolution, new background, general formulation
or full matrix campaign. Changing the interpolation algorithm is explicit;
no validation threshold, physical coefficient or saved input is changed.

The degree12 Lagrange polynomial matches values at prescribed nodes, but its
first derivative need not vanish there. For rounded matrices which do not
exactly obey the same annihilating polynomial, this can produce unwanted
intra-eigenspace response. We test degree25 Hermite cardinal polynomials
with zero first derivatives instead. Success is a hypothesis, not assumed.

## Formula and why it still responds to the actual input

For 13 distinct analytical nodes a_i, let

`L_i(z) = product_(j!=i) (z-a_j)/(a_i-a_j)` and
`d_i = sum_(j!=i) 1/(a_i-a_j) = L_i'(a_i)`.

Define

`H_i(z) = [1 - 2 d_i (z-a_i)] L_i(z)^2`.

Then H_i(a_j)=delta_ij and H_i'(a_j)=0. The cardinal basis follows the
[Hermite formula in Persson's Berkeley Math128A notes](https://persson.berkeley.edu/math128a/slides/ch3math128a.html).
For matrix functions, the role of interpolation on the spectrum is described
in [Higham and Lin, section3.1.2](https://eprints.maths.manchester.ac.uk/2067/1/paper.pdf).
These references support the mathematical construction, not our implementation
or scientific acceptance. Matrix-specific reasoning below is our inference.

At a diagonalizable exact matrix Q with these spectral nodes, H_i(Q) has
the same spectral projectors as L_i(Q). Their off-diagonal divided differences
are identical, while Hermite's within-eigenspace first derivative is zero.
Thus the method retains first-order response to changes coupling distinct
eigenspaces; it does not freeze all projectors when the input changes.
This local statement is not a uniform condition-number bound for arbitrary Q.

The implementation computes H_i(K) from EACH provided matrix K. For the43
system, use the supplied PDE complement P as the algebra's identity, start
L_i at P, and replace scalar factors by K-a_j P. Require original tolerance
compatibility P^2=P, KP=PK=K. The case-0 P is checked by existing full gates.
Every original perturbation K+/-spacing(K) enters this same constructor.
There is no fixed-projector substitution, eigensolver, clipping, fitted root,
post-hoc rank correction or adaptive selection of polynomial degree.

Off the exact spectrum, H_i(K) need not be an exact projector. In particular,
`sum a_i H_i(K)=K` is NOT a polynomial identity for arbitrary K. Therefore
reconstruction, action, idempotency, cross products, ranks and the full energy
and state-map checks remain independently enforced at original thresholds.
Zero derivative data is a constructor choice, not an assumption that the
rounded physical operator or all perturbations are exactly diagonalizable.

## Input-source separation

1. Rebuild the independent58 rational coefficient matrix by both frozen
   curvature routes in `nr_case0_exact_coefficients.py`. Compare all3364 saved
   entries, reproduce the previous coefficient witnesses exactly, and check
   the exact47 annihilator. Do not substitute this matrix into the candidate.
2. The nodes are built at Decimal50/70 from exact squared branches
   `(mu/4,mu/2,1,2,f,4*f/3)=(1/20,1/10,1,2,3,4)`. Check equality with the
   frozen rational-source branch set, root-square residuals and rounding back
   to the unchanged saved binary64 nodes. No eigenvalue fitting.
3. The actual matrices are converted by Decimal.from_float, intentionally
   retaining all original coefficient rounding. This is not described as
   recovering high-precision physical coefficients from floats.
4. The43 coefficients remain the frozen original reduction, not a newly
   independently derived rational43 theory. Their existing complete gates
   and43/58 state-map consistency are mandatory; do not overstate source audit.
5. Both positive and negative old spacing patterns must exactly match saved
   v2 perturbed inputs. Recompute all their projectors; retain failed v2 arrays.

## Evidence boundaries

Scalar Hermite identities, known synthetic projectors, full case0 gates,
exact replay,50/70 comparison and two end-to-end perturbations are separately
reported. Passing would only validate this candidate on this bounded screen.
It does not validate all66 cases, uniform hyperbolicity, constraints over time,
physical boundaries, black holes, AMR, waveform extraction or live admission.
