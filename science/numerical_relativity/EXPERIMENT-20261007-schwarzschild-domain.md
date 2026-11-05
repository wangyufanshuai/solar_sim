# Native Schwarzschild exterior domain v1 — prospective protocol

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns; Exa Search
- Origin Mode: implementation and bounded numerical validation, inline
- Date: 2026-10-07
- Verification Status: UNVERIFIED (freeze before campaign)
- Version: nr-k3-schwarzschild-domain-v1

## Question and limits

Does the independently evolved 58-variable CPU FO-CCZ4 implementation retain
the static isotropic Schwarzschild solution, converge in a common interior,
and reconstruct NONZERO vacuum curvature correctly? This is a native
nonperiodic-domain/curved-vacuum benchmark, NOT a full black-hole evolution.

G=c=M=1; coordinates in the positive cube [1,3]^3, entirely outside r=M/2.
psi=1+M/(2r), alpha=(1-M/(2r))/psi, chi=psi^-4, h=I,
K=a=Theta=GammaHat=beta=b=B=D=0 initially. A_i=M x_i/[r^3(1-(M/2r)^2)],
P_i=M x_i/(r^3 psi) are ANALYTIC derivatives, not reconstructed every step.
Advective 1+log and experimental f=3 alpha chi, mu=.2 chi; existing c=e=s=1,
kappa1=.1,kappa2=0,kappa3=1,eta=0; finite algebraic relaxation lambda=1.
This exact static zero-shift solution satisfies the selected gauge.

For FD2 AND FD4, freeze TWO whole outer node layers in all58 RHS at every
RK4 stage. The active interior uses centered, nonwrapping derivatives. No
projection, floors, dissipation, interior injection, auxiliary reconstruction,
AMR, or artificial time-dependent source. The physical location of the frozen
layers changes with N. Therefore compare the SAME125 points on [1.5,2.5]^3;
do not imply global-boundary convergence or well-posedness of arbitrary IBVPs.

v5 checkpoints bind scenario2, stencil, gauge, control, domain bounds, mass,
boundary id, two-layer policy and all58 fields. v1-v4 byte layouts unchanged.
Restore requires explicit matching domain/profile/control. Corrupted analytic
halos are rejected (absolute tolerance2e-14 for libm roundoff), not replaced.

## Frozen matrix and acceptance

1. MSVC2022/C++17/OpenMP fresh build; existing native topology/stencil tests,
   new exterior test, and a REAL four-worker OpenMP toolchain probe pass.
2. Old0.4.0 vs new0.5.0 periodic checkpoint bytes must be IDENTICAL for
   FD2/4 x lambda0/1,4 steps; manifests differ only in kernel_version.
3. Python/native FD2/4 at N9 for4 steps,dt1/256: all58 max absolute difference
   <=2e-12; independent A/P perturbations at center persist/evolve (same
   tolerance); fresh native initialization also compared independently.
4. Main six cases: FD2/4 x N17/25/33,dt1/256,T=1/16 then1/8 (16+16 steps).
   Record initial and each positive-time sample. Same physical125 points.
   Primary norms: all58 state error against static solution, independent ADM
   H/M, Ricci error, vacuum Weyl invariant error, Theta; record L2 and Linf.
   For state/H/M/Ricci/invariant at BOTH positive times require each adjacent
   L2 refinement order >=1.5(FD2) or3.0(FD4), with ratios24/16 and32/24.
   Absolute floor2e-12 for all: allbelow is bounded-null NOT measured order;
   mixed floor means unresolved/FAIL. No tolerance retuning after observation.
   Initial Ricci/invariant/H convergence separately reported; state/M null.
5. dt1/512 controls for FD2/4 at N33 toT1/8. Require all58 RMS difference
   fromdt1/256 <=5% of main N33 analytic-state error (denominatorfloor2e-12).
6. FD4/N17 direct32 steps1thread vs staged16+16 steps4threads: checkpoint AND
   manifest bytes equal. Halo bytes equal initial checkpoint in every output.
7. Refuse changed domain/mass, corrupt halo, periodic alias, unknown boundary
   id/layer count and truncated file; rejected calls must not emit output.

Independent diagnostics build gamma=h/chi and Kij=(a+hK/3)/chi, use actual
trace(g^-1 Kij), and polynomial-moment differentiation matrices. Never read
evolved GammaHat/A/B/D/P for ADM or curvature. Eij=TF(Rij+K Kij-Kik K^k_j),
Bij=TF(sym(epsilon_i^kl D_k K_lj)); compare8(Eij E^ij-Bij B^ij) against
48M^2/R_areal^6, R_areal=r psi^2. Off the vacuum constraint surface this is
a Weyl-reconstruction diagnostic proxy, not an exact 4D Kretschmann claim.
Also compare Rij=M/(r^3 psi^2)(delta_ij-3 n_i n_j), so zero curvature cannot
pass just by matching zero ADM constraints. No harmonic-gauge time oracle.

## Resources, provenance, stop conditions

Fresh output only; previous176-source receipt and all its snapshots retained.
Bind allowlisted changed sources, every new source, protocol, compiler,
binary and each resulting artifact to SHA-256. Source before/after equal.
Campaign<=900s after preflight, each native/build process<=180s; output<=384MiB
with32MiB reserve; Cfree>=4GiB+32MiB, Efree>=1GiB. No install or system edits.
Preserve partial outputs and receipt on any error; do not automatically retry.
Numerical failures finish the declared matrix and remain false; execution
errors terminate. No live/art/scientific payload/CUDA changes.

Run: `python -B scripts/run-nr-k3-schwarzschild-domain.py --output-directory C:/Users/86137/NRShadowEvidence/nr-k3-schwarzschild-domain-v1-20261007`

## Research grounding and differences

Exa: one targeted search, five candidate results, with FO-CCZ4 original paper
appearing twice. Primary paper fetched; unrelated scalar-boundary, generalized
formula and fCCZ4 spherical papers not treated as implementation evidence.
[Dumbser et al., PRD97,084053(2018), IV.4-IV.5](https://arxiv.org/html/1707.09910v3)
separates prescribed exact-boundary convergence in Cartesian Kerr-Schild
coordinates from long single-puncture evolution. Our ISOTROPIC exterior,
gauge, damping, finite differences and T=.125 differ: not a reproduction of
its Kerr-SchildT10 or punctureT1000 results or hyperbolicity proof.

GitHub primary header:
[GRChombo BoundaryConditions.hpp](https://github.com/GRTLCollaboration/GRChombo/blob/main/Source/GRChomboCore/BoundaryConditions.hpp),
blob57faf81e81cbaba5167fdfc89dcc09c5f8e3aace. Explicitly distinguishes
static/Sommerfeld/reflective/extrapolating conditions and RHS vs solution
enforcement. Consulted as design context; no source copied, no GRChombo run.
One initial guessed BoundaryConditions directory returned404; resolved through
Source/GRChomboCore directory listing. No remote changes.
