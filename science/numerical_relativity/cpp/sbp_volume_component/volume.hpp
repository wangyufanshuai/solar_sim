#pragma once
#include "sbp42.hpp"
#include <cstdint>
#include <string>
#include <utility>
#include <omp.h>

namespace nr_sbp {
constexpr std::size_t kVariableCount=58;
inline constexpr char frozen_equation_sha[]="6252ec9b2901f03e51081410a612b9b6ed9d1ddd3469663f8d8dd9663944e457";
#include "frozen_variables.inc.hpp"
[[noreturn]] inline void fail(const std::string& message) { throw std::runtime_error(message); }

inline Fields validate_physical_input(const Grid& grid,Fields q,double tau) {
  validate_fields(grid,q);
  require(std::isfinite(tau) && tau>=0., "finite nonnegative explicit tau_inverse required");
  for (std::size_t cell=0; cell<grid.cells(); ++cell) {
    const double a=q[H00][cell], b=q[H01][cell], c=q[H02][cell];
    const double d=q[H11][cell], e=q[H12][cell], f=q[H22][cell];
    // Match the frozen cofactor inverse's order and non-singularity threshold.
    const double det=a*(d*f-e*e)-b*(b*f-e*c)+c*(b*e-d*c);
    const double minor=a*d-b*b;
    require(std::isfinite(det) && det>=1.e-14 && std::isfinite(minor) && minor>0. && a>0.,
            "positive definite nonsingular metric required; no projection");
    const double alpha=std::exp(q[LnAlpha][cell]);
    const double chi=std::exp(2.*q[LnPhi][cell]);
    require(std::isnormal(alpha) && alpha>0. && alpha<2. && std::isnormal(chi) && chi>0.,
            "positive normal chi and0<lapse<2 required; no clipping");
    const double f_shift=3.*alpha*chi, mu=.2*chi;
    require(std::isfinite(f_shift) && f_shift>0. && std::isfinite(mu) && mu>0., "invalid state-dependent profile coefficient");
  }
  return q;
}

struct State {
  const Grid grid;
  const Fields q;
  const std::array<Fields,3> gradients;
  const double tau_inverse;
  static constexpr std::uint64_t gauge_profile_code=1;
  static constexpr double shift_scale=3.,ordering_scale=.2;
  State(Grid mesh,Fields fields,double tau)
    : grid(std::move(mesh)),q(validate_physical_input(grid,std::move(fields),tau)),
      gradients{differentiate(grid,q,0),differentiate(grid,q,1),differentiate(grid,q,2)},tau_inverse(tau) {}
  std::size_t cells() const { return grid.cells(); }
};

inline double d1(const State& state,std::size_t variable,std::size_t flat,int axis) {
  return state.gradients[static_cast<std::size_t>(axis)][variable][flat];
}

// Authenticated, unchanged equation helpers and coefficients. Only d1 is the
// new SBP policy; its precomputed arrays are validated outside the OpenMP loop.
#include "frozen_geometry.inc.hpp"
#include "frozen_constants.inc.hpp"
struct DynamicRHS {
  Fields q{};
  explicit DynamicRHS(std::size_t cells) { for (auto& component:q) component.assign(cells,0.); }
};
#include "frozen_rhs.inc.hpp"

inline Fields volume_rhs(const State& state) {
  auto result=fo_rhs(state).q;
  validate_fields(state.grid,result);
  return result;
}
} // namespace nr_sbp
