#pragma once
#include "../characteristic_component/characteristic_split.hpp"
#include <array>
#include <iomanip>
#include <iostream>
#include <locale>

namespace nr_principal {
using nr_native::Matrix;
using nr_native::require;

// Exactly the existing Cartesian, state-dependent shadow profile. No projection.
struct Coefficients {
  Matrix h, inverse;
  double chi, alpha, f, mu, determinant;
  std::array<double,3> beta;
  int axis;
};

inline Coefficients validate(const nr_native::Lapack& lapack, Matrix h,
                             double chi, double alpha,
                             const std::array<double,3>& beta, int axis) {
  nr_native::check_square(h,3);
  require(axis>=0 && axis<3, "Cartesian axis 0..2 required");
  require(std::isfinite(chi) && chi>0., "finite positive chi required");
  require(std::isfinite(alpha) && alpha>0. && alpha<2., "profile requires 0<lapse<2; no clipping");
  for (double value:beta) require(std::isfinite(value), "finite shift required");
  for (std::size_t i=0; i<3; ++i)
    for (std::size_t j=i+1; j<3; ++j) {
      require(std::abs(h[3*i+j]-h[3*j+i])<=1.e-13, "symmetric conformal metric required");
      const double value=0.5*h[3*i+j]+0.5*h[3*j+i];
      h[3*i+j]=h[3*j+i]=value;
    }
  require(lapack.symmetric_eigenvalues(h,3)[0]>0., "positive definite conformal metric required");
  const double determinant=h[0]*(h[4]*h[8]-h[5]*h[7])
                           -h[1]*(h[3]*h[8]-h[5]*h[6])
                           +h[2]*(h[3]*h[7]-h[4]*h[6]);
  require(std::isfinite(determinant) && std::abs(determinant-1.)<=1.e-10,
          "published speed contract requires det(h)=1; no rescaling");
  const double f=3.*alpha*chi, mu=0.2*chi;
  require(std::isfinite(f) && f>0. && std::isfinite(mu) && mu>0.,
          "finite positive profile coefficients required");
  return {h,lapack.inverse(h,3),chi,alpha,f,mu,determinant,beta,axis};
}

inline Coefficients read_input(const nr_native::Lapack& lapack) {
  std::string schema;
  int dimension=0, axis=-1;
  require(bool(std::cin>>schema>>dimension>>axis), "incomplete FO coefficient header");
  require(schema=="nr-fo-principal-input-v1" && dimension==58, "canonical58 coefficient input required");
  Matrix h(9);
  double chi=0., alpha=0.;
  std::array<double,3> beta{};
  for (double& value:h) require(bool(std::cin>>value), "incomplete/nonfinite metric input");
  require(bool(std::cin>>chi>>alpha), "incomplete/nonfinite scalar input");
  for (double& value:beta) require(bool(std::cin>>value), "incomplete/nonfinite shift input");
  std::string extra;
  require(!(std::cin>>extra), "trailing input forbidden");
  return validate(lapack,h,chi,alpha,beta,axis);
}

inline void json_array(const Matrix& values) {
  require(nr_native::finite(values), "nonfinite JSON output forbidden");
  std::cout << '[';
  for (std::size_t i=0; i<values.size(); ++i) {
    if (i) std::cout << ',';
    std::cout << values[i];
  }
  std::cout << ']';
}

inline void classic_io() {
  std::cout.imbue(std::locale::classic());
  std::cin.imbue(std::locale::classic());
  std::cout << std::setprecision(17);
}
} // namespace nr_principal
