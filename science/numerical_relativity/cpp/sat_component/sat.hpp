#pragma once
// Include the pinned ABI header first so NOMINMAX precedes all Windows headers.
#include "../fo_principal_component/fo_principal.hpp"
#include "../sbp_volume_component/volume.hpp"
#include <bcrypt.h>
#include <map>
#include <sstream>

namespace nr_sat {
using nr_sbp::Fields;
using nr_sbp::Grid;
using nr_sbp::Values;
using nr_sbp::require;
using Targets=std::array<Fields,6>;
using Cell=std::array<double,58>;

struct Face {
  std::size_t axis,side;
  std::array<std::size_t,2> tangent,shape;
  Face(const Grid& grid,std::size_t a,std::size_t s):axis(a),side(s),tangent{},shape{} {
    require(a<3 && s<2,"Cartesian face required");
    std::size_t j=0;
    for(std::size_t d=0;d<3;++d) if(d!=a) tangent[j++]=d;
    shape={grid.shape[tangent[0]],grid.shape[tangent[1]]};
  }
  std::size_t points()const {return shape[0]*shape[1];}
  std::size_t cell(const Grid& grid,std::size_t ij)const {
    require(ij<points(),"face index outside target");
    return (side==0?0:grid.shape[axis]-1)*grid.stride[axis]
      +(ij/shape[1])*grid.stride[tangent[0]]+(ij%shape[1])*grid.stride[tangent[1]];
  }
};

inline void validate_targets(const Grid& grid,const Targets& targets) {
  for(std::size_t a=0;a<3;++a) for(std::size_t s=0;s<2;++s) {
    const Face face(grid,a,s);
    for(const auto& field:targets[2*a+s]) {
      require(field.size()==face.points(),"six canonical58 face shapes required");
      require(nr_native::finite(field),"finite incoming targets required");
    }
  }
}

inline std::string coefficient_sha256(const Fields& q) {
  BCRYPT_ALG_HANDLE algorithm=nullptr;
  BCRYPT_HASH_HANDLE hash=nullptr;
  require(BCryptOpenAlgorithmProvider(&algorithm,BCRYPT_SHA256_ALGORITHM,nullptr,0)>=0,
          "SHA256 provider unavailable");
  try {
    require(BCryptCreateHash(algorithm,&hash,nullptr,0,nullptr,0,0)>=0,"SHA256 create failed");
    for(std::size_t v=0;v<11;++v) {
      const auto bytes=q[v].size()*sizeof(double);
      require(bytes<=0xffffffffULL,"coefficient hash length overflow");
      require(BCryptHashData(hash,reinterpret_cast<PUCHAR>(const_cast<double*>(q[v].data())),
                            static_cast<ULONG>(bytes),0)>=0,"SHA256 update failed");
    }
    std::array<unsigned char,32> digest{};
    require(BCryptFinishHash(hash,digest.data(),static_cast<ULONG>(digest.size()),0)>=0,"SHA256 finish failed");
    std::ostringstream out;
    out<<std::hex<<std::setfill('0');
    for(auto byte:digest) out<<std::setw(2)<<static_cast<unsigned int>(byte);
    BCryptDestroyHash(hash); BCryptCloseAlgorithmProvider(algorithm,0);
    return out.str();
  } catch(...) {
    if(hash) BCryptDestroyHash(hash);
    BCryptCloseAlgorithmProvider(algorithm,0);
    throw;
  }
}

struct StageReport {
  double cfl=0.,max_condition=0.,max_residual=0.,min_lapse=2.,min_chi=INFINITY,det_error=0.;
  std::array<double,3> speeds{};
  std::array<double,6> face_max{};
  std::size_t basis_builds=0;
  std::string coefficients_sha256;
};

inline StageReport stage_cfl(const nr_sbp::State& state,double dt) {
  require(std::isfinite(dt) && dt>0.,"positive finite dt required");
  StageReport report;
  for(std::size_t cell=0;cell<state.cells();++cell) {
    nr_sbp::Mat3 h{};
    for(int i=0;i<3;++i) for(int j=0;j<3;++j) nr_sbp::mat(h,i,j)=nr_sbp::h_at(state,cell,i,j);
    const auto inverse=nr_sbp::inverse(h);
    const double alpha=std::exp(state.q[6][cell]),chi=std::exp(2.*state.q[10][cell]);
    const double f=3.*alpha*chi,mu=.2*chi;
    report.min_lapse=std::min(report.min_lapse,alpha);
    report.min_chi=std::min(report.min_chi,chi);
    report.det_error=std::max(report.det_error,std::abs(nr_sbp::determinant(h)-1.));
    for(std::size_t a=0;a<3;++a) {
      const double hn=inverse[3*a+a];
      require(std::isfinite(hn) && hn>0.,"positive finite inverse normal metric required");
      const std::array<double,6> family{alpha*std::sqrt(chi*hn),std::sqrt(2.*alpha*chi*hn),
        std::sqrt(4.*f*hn/3.),alpha*std::sqrt(mu*hn/2.),std::sqrt(f*hn),.5*alpha*std::sqrt(mu*hn)};
      double intrinsic=0.;
      for(double value:family) {require(std::isfinite(value),"nonfinite CFL speed");intrinsic=std::max(intrinsic,value);}
      const double speed=std::abs(state.q[7+a][cell])+intrinsic;
      require(std::isfinite(speed),"nonfinite CFL advection");
      report.speeds[a]=std::max(report.speeds[a],speed);
    }
  }
  for(std::size_t a=0;a<3;++a) report.cfl+=report.speeds[a]/state.grid.spacing[a];
  report.cfl*=dt;
  require(std::isfinite(report.cfl) && report.cfl<=.25*(1.+1.e-14),"stage exceeds declared reference CFL cap");
  report.coefficients_sha256=coefficient_sha256(state.q);
  return report;
}

struct StageResult {Fields bulk,coupled;Targets penalties;StageReport report;};
// A bit-exact coefficient key: signed zero and tiny differences are NOT rounded.
using Key=std::array<unsigned char,1+11*sizeof(double)>;
inline Key key_for(const Cell& cell,std::size_t axis) {
  Key key{};key[0]=static_cast<unsigned char>(axis);
  std::memcpy(key.data()+1,cell.data(),11*sizeof(double));
  return key;
}

inline StageResult rhs(const nr_native::Lapack& lapack,const nr_sbp::State& state,
                       const Targets& targets,double dt) {
  validate_targets(state.grid,targets);
  StageResult out;
  out.report=stage_cfl(state,dt);
  out.bulk=nr_sbp::volume_rhs(state);
  out.coupled=out.bulk;
  // This cache is destroyed when THIS call returns; no mutable static state.
  std::map<Key,nr_native::Split> cache;
  for(std::size_t axis=0;axis<3;++axis) for(std::size_t side=0;side<2;++side) {
    const std::size_t index=2*axis+side;
    const Face face(state.grid,axis,side);
    auto& addition=out.penalties[index];
    for(auto& field:addition) field.assign(face.points(),0.);
    const double weight=state.grid.axis(axis).weight(side==0?0:state.grid.shape[axis]-1);
    for(std::size_t ij=0;ij<face.points();++ij) {
      const auto flat=face.cell(state.grid,ij);
      Cell cell{},jump{};
      for(std::size_t v=0;v<58;++v) {
        cell[v]=state.q[v][flat];jump[v]=cell[v]-targets[index][v][ij];
        require(std::isfinite(jump[v]),"nonfinite boundary jump");
      }
      const auto key=key_for(cell,axis);
      auto found=cache.find(key);
      if(found==cache.end()) {
        nr_native::Matrix h{cell[0],cell[1],cell[2],cell[1],cell[3],cell[4],cell[2],cell[4],cell[5]};
        const auto c=nr_principal::validate(lapack,std::move(h),std::exp(2.*cell[10]),std::exp(cell[6]),
                                          {cell[7],cell[8],cell[9]},static_cast<int>(axis));
        const auto principal=nr_principal::assemble(c);
        auto split=nr_native::split47(lapack,principal,nr_principal::centered_roots(c),cell[7+axis]);
        found=cache.emplace(key,std::move(split)).first;
      }
      const auto& split=found->second;
      out.report.max_condition=std::max(out.report.max_condition,split.condition);
      out.report.max_residual=std::max({out.report.max_residual,split.residual,split.symmetry});
      const auto& matrix=side==0?split.negative:split.positive;
      for(std::size_t i=11;i<58;++i) {
        double value=0.;
        for(std::size_t j=11;j<58;++j) value+=(side==0?matrix[58*i+j]:-matrix[58*i+j])*jump[j];
        value/=weight;
        require(std::isfinite(value),"nonfinite face penalty");
        addition[i][ij]=value;
        out.coupled[i][flat]+=value;
        out.report.face_max[index]=std::max(out.report.face_max[index],std::abs(value));
      }
    }
  }
  out.report.basis_builds=cache.size();
  nr_sbp::validate_fields(state.grid,out.coupled);
  for(std::size_t v=0;v<11;++v)
    require(std::memcmp(out.bulk[v].data(),out.coupled[v].data(),state.cells()*sizeof(double))==0,
            "SAT modified ODE equations");
  return out;
}
} // namespace nr_sat
