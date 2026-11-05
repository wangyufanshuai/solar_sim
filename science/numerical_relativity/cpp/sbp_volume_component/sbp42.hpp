#pragma once
#include <algorithm>
#include <array>
#include <cmath>
#include <cstddef>
#include <stdexcept>
#include <vector>

namespace nr_sbp {
inline void require(bool valid,const char* message) {
  if (!valid) throw std::runtime_error(message);
}
using Values=std::vector<double>;
using Fields=std::array<Values,58>;

struct Axis {
  std::size_t points;
  double spacing;
  Axis(std::size_t n,double dx) : points(n), spacing(dx) {
    require(n>=9 && n<=17 && std::isfinite(dx) && dx>0., "SBP axis requires9..17 nodes and positive finite spacing");
  }
  double weight(std::size_t i) const {
    require(i<points, "SBP weight index outside axis");
    constexpr double edge[]{17./48.,59./48.,43./48.,49./48.};
    const auto distance=std::min(i,points-1-i);
    return spacing*(distance<4 ? edge[distance] : 1.);
  }
  // Subtraction-paired rows preserve a constant exactly, including endpoints.
  double derivative(const Values& q,std::size_t flat,std::size_t stride,std::size_t i) const {
    require(i<points && stride>0 && flat<q.size(), "SBP derivative index outside field");
    constexpr double left[4][6]{
      {-24./17.,59./34.,-4./17.,-3./34.,0.,0.},
      {-1./2.,0.,1./2.,0.,0.,0.},
      {4./43.,-59./86.,0.,59./86.,-4./43.,0.},
      {3./98.,0.,-59./98.,0.,32./49.,-4./49.}
    };
    constexpr std::size_t sizes[]{4,3,5,6};
    double value=0.;
    if (i>=4 && i+4<points) {
      value=(q[flat-2*stride]-q[flat+2*stride]
             +8.*(q[flat+stride]-q[flat-stride]))/12.;
    } else {
      const bool right=i+4>=points;
      const auto row=right ? points-1-i : i;
      const auto start=flat-i*stride;
      for (std::size_t j=0; j<sizes[row]; ++j) {
        const auto neighbor=start+(right ? points-1-j : j)*stride;
        if (right) value-=left[row][j]*(q[neighbor]-q[flat]);
        else value+=left[row][j]*(q[neighbor]-q[flat]);
      }
    }
    value/=spacing;
    require(std::isfinite(value), "nonfinite SBP derivative");
    return value;
  }
  Values matrix() const {
    Values out(points*points,0.), basis(points,0.);
    for (std::size_t j=0; j<points; ++j) {
      std::fill(basis.begin(),basis.end(),0.);
      basis[j]=1.;
      for (std::size_t i=0; i<points; ++i) out[points*i+j]=derivative(basis,i,1,i);
    }
    return out;
  }
};

struct Grid {
  std::array<std::size_t,3> shape;
  std::array<double,3> lower,upper,spacing;
  std::array<std::size_t,3> stride;
  Grid(std::array<std::size_t,3> dimensions,std::array<double,3> lo,std::array<double,3> hi)
      : shape(dimensions),lower(lo),upper(hi),spacing{},stride{} {
    for (std::size_t axis=0; axis<3; ++axis) {
      require(shape[axis]>=9 && shape[axis]<=17, "bounded SBP volume shape9..17 required");
      require(std::isfinite(lo[axis]) && std::isfinite(hi[axis]) && hi[axis]>lo[axis], "finite increasing coordinate bounds required");
      spacing[axis]=(hi[axis]-lo[axis])/double(shape[axis]-1);
      require(std::isnormal(spacing[axis]) && spacing[axis]>0., "finite positive normal grid spacing required");
    }
    stride={shape[1]*shape[2],shape[2],1};
  }
  std::size_t cells() const { return shape[0]*shape[1]*shape[2]; }
  Axis axis(std::size_t i) const { require(i<3, "Cartesian axis required"); return Axis(shape[i],spacing[i]); }
};

inline void validate_fields(const Grid& grid,const Fields& q) {
  for (const auto& field:q) {
    require(field.size()==grid.cells(), "canonical58 volume field shape mismatch");
    for (double value:field) require(std::isfinite(value), "finite canonical58 volume fields required");
  }
}

inline Fields differentiate(const Grid& grid,const Fields& q,std::size_t direction) {
  validate_fields(grid,q);
  const auto axis=grid.axis(direction);
  Fields result;
  const auto stride=grid.stride[direction];
  for (std::size_t v=0; v<58; ++v) {
    result[v].resize(grid.cells());
    for (std::size_t flat=0; flat<grid.cells(); ++flat)
      result[v][flat]=axis.derivative(q[v],flat,stride,(flat/stride)%axis.points);
  }
  return result;
}
} // namespace nr_sbp
