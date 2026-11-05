#pragma once
#include "ilp64_lapack.hpp"

namespace nr_native {
struct Root { double value; std::size_t multiplicity; };
struct Split {
  Matrix positive, negative;
  double condition, residual, symmetry, minimum_energy_eigenvalue;
};

// The physical principal matrix and centered speed groups are INPUTS.
// This does not assemble the Einstein equations or validate their derivation.
inline Split split47(const Lapack& lapack, const Matrix& principal,
                     const std::vector<Root>& groups, double advection) {
  constexpr std::size_t n=47, full=58, ode=11;
  check_square(principal,full);
  require(std::isfinite(advection) && !groups.empty() && groups.size()<=n, "finite advection and 1..47 root groups required");
  for (std::size_t i=0; i<full; ++i)
    for (std::size_t j=0; j<full; ++j)
      if (i<ode || j<ode) require(principal[i*full+j]==0., "ODE/PDE coupling is forbidden");
  std::size_t count=0;
  double root_scale=1.;
  for (const auto& root:groups) {
    require(std::isfinite(root.value) && root.multiplicity>0 && root.multiplicity<=n-count, "invalid root multiplicity");
    count+=root.multiplicity;
    root_scale=std::max(root_scale,std::abs(root.value));
  }
  require(count==n, "root multiplicities must total47");
  for (std::size_t i=1; i<groups.size(); ++i)
    require(groups[i].value-groups[i-1].value>1.e-12*root_scale, "root groups must be sorted and already merged");
  Matrix pde(n*n), centered(n*n), basis(n*n), speeds;
  for (std::size_t i=0; i<n; ++i)
    for (std::size_t j=0; j<n; ++j) {
      pde[i*n+j]=principal[(i+ode)*full+j+ode];
      centered[i*n+j]=pde[i*n+j]-(i==j ? advection : 0.);
    }
  const double scale=std::max(1.,inf_norm(centered,n));
  std::size_t column=0;
  for (const auto& root:groups) {
    Matrix shifted=centered;
    for (std::size_t i=0; i<n; ++i) shifted[i*n+i]-=root.value;
    const auto svd=lapack.svd(shifted,n);
    for (double tolerance:{1.e-9,1.e-10,1.e-11}) {
      const auto nullity=static_cast<std::size_t>(std::count_if(svd.values.begin(),svd.values.end(),
        [&](double x) { return x<=tolerance*std::max(1.,svd.values[0]); }));
      require(nullity==root.multiplicity, "ambiguous/incomplete PDE eigenspace");
    }
    for (std::size_t j=0; j<root.multiplicity; ++j) {
      for (std::size_t i=0; i<n; ++i)
        basis[i*n+column+j]=svd.vt[(n-root.multiplicity+j)*n+i];
      speeds.push_back(root.value+advection);
    }
    column+=root.multiplicity;
  }
  require(finite(speeds), "nonfinite advected roots");
  const auto basis_svd=lapack.svd(basis,n);
  require(basis_svd.values.back()>0., "singular PDE eigenbasis");
  const double condition=basis_svd.values[0]/basis_svd.values.back();
  require(std::isfinite(condition) && condition<=1.e6, "ill-conditioned PDE eigenbasis");
  const auto inverse=lapack.inverse(basis,n);
  Matrix b_lambda=basis;
  for (std::size_t i=0; i<n; ++i)
    for (std::size_t j=0; j<n; ++j) b_lambda[i*n+j]*=speeds[j];
  const double residual=max_difference(multiply(pde,basis,n),b_lambda)/scale;
  const auto energy=multiply(transpose(inverse,n),inverse,n);
  const auto ha=multiply(energy,pde,n);
  const double symmetry=max_difference(ha,transpose(ha,n))/std::max(1.,inf_norm(ha,n));
  const double minimum=lapack.symmetric_eigenvalues(energy,n)[0];
  require(residual<=2.e-11 && symmetry<=2.e-11 && minimum>0., "local characteristic residual/energy algebra failed");
  Matrix plus_basis=basis, minus_basis=basis;
  for (std::size_t i=0; i<n; ++i)
    for (std::size_t j=0; j<n; ++j) {
      plus_basis[i*n+j]*=std::max(speeds[j],0.);
      minus_basis[i*n+j]*=std::min(speeds[j],0.);
    }
  const auto plus=multiply(plus_basis,inverse,n), minus=multiply(minus_basis,inverse,n);
  Matrix sum=plus;
  for (std::size_t i=0; i<n*n; ++i) sum[i]+=minus[i];
  require(max_difference(sum,pde)/scale<=2.e-11, "characteristic splitting failed");
  Split out{Matrix(full*full,0.),Matrix(full*full,0.),condition,residual,symmetry,minimum};
  for (std::size_t i=0; i<n; ++i)
    for (std::size_t j=0; j<n; ++j) {
      out.positive[(i+ode)*full+j+ode]=plus[i*n+j];
      out.negative[(i+ode)*full+j+ode]=minus[i*n+j];
    }
  return out;
}
} // namespace nr_native
