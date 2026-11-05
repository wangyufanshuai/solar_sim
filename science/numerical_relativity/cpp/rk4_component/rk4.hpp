#pragma once
#include "../sat_component/sat.hpp"

namespace nr_rk4 {
using nr_sbp::Fields;
using nr_sbp::Grid;
using nr_sbp::require;
inline constexpr char method_id[]="nr-fo-ccz4-sbp42-analytic-sat-rk4-no-projection-v1";
struct Progress {
  std::uint64_t step=0,tick=0;
  std::size_t stage=0;
  const char* phase="input";
};
struct Stage {
  Fields input,rhs;
  nr_sat::StageReport report;
  std::uint64_t tick;
};
struct Step {
  std::uint64_t index;
  std::array<Stage,4> stages;
  Fields endpoint;
};

inline void validate_endpoint(const nr_native::Lapack& lapack,const Grid& grid,const Fields& q) {
  nr_sbp::validate_fields(grid,q);
  // State construction, not another RHS. Do NOT add det=1 or alpha<2 gates.
  for(std::size_t cell=0;cell<grid.cells();++cell) {
    const double alpha=std::exp(q[6][cell]),chi=std::exp(2.*q[10][cell]);
    require(std::isnormal(alpha) && alpha>0. && std::isnormal(chi) && chi>0.,
            "endpoint requires finite positive normal lapse/chi; no repair");
    const nr_native::Matrix h{q[0][cell],q[1][cell],q[2][cell],q[1][cell],q[3][cell],q[4][cell],
                              q[2][cell],q[4][cell],q[5][cell]};
    require(lapack.symmetric_eigenvalues(h,3)[0]>0.,"endpoint metric must be positive definite; no projection");
  }
}

inline Fields add(const Fields& base,const Fields& rhs,double scale) {
  Fields result=base;
  for(std::size_t v=0;v<58;++v) for(std::size_t i=0;i<base[v].size();++i)
    result[v][i]=base[v][i]+scale*rhs[v][i];
  return result;
}

inline Step step(const nr_native::Lapack& lapack,const Grid& grid,const Fields& q,
                 std::uint64_t index,double dt,const std::array<const nr_sat::Targets*,3>& boundary,
                 Progress& progress) {
  require(index<(1ULL<<52) && std::isfinite(dt) && dt>0.,"bounded step index and positive finite dt required");
  Step out{index,{}, {}};
  const std::array<std::size_t,4> offsets{0,1,1,2};
  for(std::size_t stage=0;stage<4;++stage) {
    progress={index,2*index+offsets[stage],stage+1,"stage-state"};
    auto& trace=out.stages[stage];
    trace.tick=progress.tick;
    if(stage==0) trace.input=q;
    else trace.input=add(q,out.stages[stage-1].rhs,stage==3?dt:.5*dt);
    const nr_sbp::State state(grid,trace.input,1.);
    progress.phase="stage-rhs";
    auto rhs=nr_sat::rhs(lapack,state,*boundary[offsets[stage]],dt);
    trace.rhs=std::move(rhs.coupled);
    trace.report=std::move(rhs.report);
  }
  progress={index,2*index+2,0,"endpoint"};
  out.endpoint=q;
  for(std::size_t v=0;v<58;++v) for(std::size_t i=0;i<grid.cells();++i) {
    const double total=((out.stages[0].rhs[v][i]+2.*out.stages[1].rhs[v][i])
                        +2.*out.stages[2].rhs[v][i])+out.stages[3].rhs[v][i];
    out.endpoint[v][i]=q[v][i]+(dt*total)/6.;
  }
  validate_endpoint(lapack,grid,out.endpoint);
  progress.phase="step-complete";
  return out;
}
} // namespace nr_rk4
