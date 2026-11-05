# Derivative-aware, full43 longitudinal constraint reduction

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns; Exa Search
- Origin Mode: bounded algebraic implementation and state-map controls
- Origin Date: 2026-10-12
- Verification Status: PLANNED BEFORE EXECUTION
- Version Label: nr-longitudinal-constraint-reduction-v1

## Fixed construction, before numerical execution

Keep all43 constraints, the physical/formal bridge, frozen equations and all
historical counterexamples. For k=rho*n, ||n||=1, z=i*rho, first apply the
qualified triangular physical-to-formal map T(z). Then apply W(z):

- divide formal H and all three M by z;
- leave Theta, formal Z and algebraic trace c unchanged;
- on the derivative index of each definition error rA/rB/rD/rP, use
  Q(z)=Pi_perp+Pi_parallel/z, with Pi_parallel=n*n^T;
- replace the determinant row with d_star=z*d+2*n^k*h^ij*rD_kij.

The last row is exactly2*n^k*h^ij*D_aux_kij on the full state, because
rD_kij=D_aux_kij-(z/2)*n_k*delta_h_ij and d=h^ij*delta_h_ij. Merely scaling d
would leave a redundant leading metric row. The inverse is explicit: multiply
H/M by z, use Q^-1=Pi_perp+z*Pi_parallel, and recover
d=d_star/z-2*n^k*h^ij*(normalized_rD)_kij, then apply T^-1.
No pseudoinverse, rank completion, eigenvector fitting or division by beta.n.

U=W*T, V=T^-1*W^-1 must obey UV=VU=I. Preserve every Laurent coefficient:
U powers[-1,1], V[-1,2], U*B*V[-2,5], U*C_physical[-1,3]. Do not truncate
nonzero coefficients to manufacture a first-order result. Test whether all
generator powers above one vanish and all state-map positive powers vanish.
If not, the candidate is rejected and all outputs retained without retry.

For the leading state map D0 and principal coefficient A, verify
A*D0=D0*L1, where L1 is independently obtained from the qualified full58
Taylor equations, not solved from constraints. Require rank43 for D0 and the
finite-frequency maps at unchanged relative cutoffs1e-9,1e-10,1e-11.
This finite check is NOT a uniform rank or strong-hyperbolicity theorem.

Analytic rA prediction: A_rA,rA=(beta.n)*Pi_perp; all other entries in those
three principal rows vanish. The old longitudinal forcing is retained at
order zero as -n*beta^T*Pi_perp and -2*n*c. At beta.n=0 this removes the
previous rA Jordan principal block without deleting its lower-order coupling.
Also check n-cross-r_new=n-cross-r_old for all11 auxiliary tensor columns;
transverse reduction errors must not be silently set to zero.

## Coverage and criteria

Use unchanged three flat seeds and nine directions per seed from the previous
order controls (including tangent and nearby shift directions),27 cases.
Use rho=1/2,1,2,4,8; zero is explicitly rejected. All direct wave components
remain within8. No changed gauge, damping, background or physical threshold.

Unchanged2e-12 absolute bounds: projector identities, UV/VU, forbidden powers,
principal reality, analytic rA principal/lower rows, curl preservation and
determinant-to-auxiliary-trace identity. Unchanged2e-12 normalized bounds:
complete Laurent reconstruction, full intertwining and leading intertwining.
All finite/saved arrays must have exact prescribed shapes and double types.

52 controls:27 full cases,3 Cartesian analytic projectors,2 tangent-shift
obstruction removals,6 corrupted/omitted-coefficient controls,12 bad inputs,
1 forbidden-fitting dependency check,1 coverage/scope check. Regress the93
previous order controls, including their unchanged rejection witnesses.
Require zero test failures/errors/skips; stop on any failure, no automatic retry.
Persist9 arrays per case, observations, per-case exact replay receipts, XML/logs,
source snapshot and terminal. Exact replay27 cases before publication; a
separate post-terminal file/hash inspection is not another numerical experiment.

## Runtime and immutable ancestry

Entry: D:/python/python.exe -B scripts/run-nr-k3-longitudinal-controls.py
--output-directory tmp/nr-shadow-evidence/nr-k3-longitudinal-controls-v1-20261012

Fresh direct evidence child only. Keep64MiB/600sec,2MiB finalization,
C>=3GiB, E>=4GiB+32MiB plus prospective64MiB, and the authorized8MiB source
snapshot. Single BLAS/OpenMP/MKL thread, E TEMP/TMP, no bytecode or installs.
Monitor owned child and budget. Parent gateSHA
b0baa81718d8faad6af9a7784dd58dda42a1f008608ef89db9eb6287908f8045;
496 unchanged sources plus five new sources=501. Old physical/formal conversion,
old rejected norms and old receipts are never edited or regraded.

No evolution, N9/N13, native/GPU execution, art/live change or scientific writeback.
Only the bounded longitudinal-order/state-map control flag may become true.
Uniform hyperbolicity, energy, CPBC, nonlinear stability and convergence remain
unqualified regardless of this software-control outcome.

## Source boundary

Exa fetched [Gundlach and Martin-Garcia, gr-qc/0402079](https://ar5iv.labs.arxiv.org/html/gr-qc/0402079),
section VI.3: Fourier order rescaling and longitudinal/transverse decomposition.
That paper's toy-model reductions do not certify our full43 off-definition
system. In particular, we retain transverse auxiliary errors, not impose the
paper's on-definition substitutions. U, V and the trace compensation above are
derived from this project's frozen equations.
