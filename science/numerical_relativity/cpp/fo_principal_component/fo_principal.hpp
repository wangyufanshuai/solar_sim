#pragma once
#include "coefficients.hpp"

namespace nr_principal {
inline constexpr int symmetric_slot[3][3]={{0,1,2},{1,3,4},{2,4,5}};

// Direct contraction of the retained first-order derivatives, not a scaled
// flat-space matrix. Zero-order sources and algebraic damping are not in A(n).
// Convention q_t=A(n) d_n q+S; first11 canonical slots are local ODE variables.
inline Matrix assemble(const Coefficients& c) {
  Matrix out(58*58,0.);
  const auto H=[&](int i,int j) { return c.h[static_cast<std::size_t>(3*i+j)]; };
  const auto inv=[&](int i,int j) { return c.inverse[static_cast<std::size_t>(3*i+j)]; };
  const auto n=[&](int i) { return double(i==c.axis); };
  const double advection=c.beta[static_cast<std::size_t>(c.axis)];
  for (int column=11; column<58; ++column) {
    const auto unit=[&](int slot) { return double(column==slot); };
    const auto a=[&](int i,int j) { return unit(11+symmetric_slot[i][j]); };
    const auto avec=[&](int i) { return unit(25+i); };
    const auto b=[&](int k,int i) { return unit(28+3*k+i); };
    const auto d=[&](int k,int i,int j) { return unit(37+6*k+symmetric_slot[i][j]); };
    const auto p=[&](int i) { return unit(55+i); };
    const auto gamma=[&](int i) { return unit(19+i); };
    const auto sym_d=[&](int k,int l,int i,int j) { return .5*(n(k)*d(l,i,j)+n(l)*d(k,i,j)); };
    const auto sym_p=[&](int i,int j) { return .5*(n(i)*p(j)+n(j)*p(i)); };
    const auto sym_b=[&](int i,int k,int l) { return .5*(n(k)*b(l,i)+n(l)*b(k,i)); };
    const auto set=[&](int row,double value) { out[static_cast<std::size_t>(58*row+column)]=value; };
    double trace_a=0.;
    for (int i=0; i<3; ++i)
      for (int j=0; j<3; ++j) trace_a+=inv(i,j)*a(i,j);
    double connection[3][3][3][3]{};
    double physical[3][3][3][3]{};
    double contracted[3][3]{};
    for (int k=0; k<3; ++k)
      for (int u=0; u<3; ++u)
        for (int i=0; i<3; ++i)
          for (int j=0; j<3; ++j) {
            double gradient_p=0.;
            for (int l=0; l<3; ++l) {
              connection[k][u][i][j]+=inv(u,l)*(sym_d(k,i,l,j)+sym_d(k,j,l,i)-sym_d(k,l,i,j));
              gradient_p+=inv(u,l)*sym_p(k,l);
            }
            physical[k][u][i][j]=connection[k][u][i][j]
              -double(u==j)*sym_p(k,i)-double(u==i)*sym_p(k,j)+H(i,j)*gradient_p;
            contracted[k][u]+=inv(i,j)*connection[k][u][i][j];
          }
    double ricci_z[3][3]{}, hessian[3][3]{};
    double laplacian=0., scalar=0.;
    for (int i=0; i<3; ++i)
      for (int j=0; j<3; ++j) {
        for (int u=0; u<3; ++u)
          ricci_z[i][j]+=physical[u][u][i][j]-physical[j][u][i][u];
        double z=0.;
        for (int l=0; l<3; ++l)
          z+=H(j,l)*(n(i)*gamma(l)-contracted[i][l])
            +H(i,l)*(n(j)*gamma(l)-contracted[j][l]);
        ricci_z[i][j]+=.5*z;
        hessian[i][j]=.5*c.alpha*(n(i)*avec(j)+n(j)*avec(i));
        laplacian+=inv(i,j)*hessian[i][j];
        scalar+=inv(i,j)*ricci_z[i][j];
      }
    laplacian*=c.chi;
    scalar*=c.chi;
    for (int i=0; i<3; ++i)
      for (int j=i; j<3; ++j)
        set(11+symmetric_slot[i][j],c.chi*(-hessian[i][j]+c.alpha*ricci_z[i][j])
            -H(i,j)/3.*(-laplacian+c.alpha*scalar)+advection*a(i,j));
    set(17,-laplacian+c.alpha*scalar+advection*unit(17));
    set(18,.5*c.alpha*scalar+advection*unit(18));
    for (int i=0; i<3; ++i) {
      double raised_n=0., contracted_b=0., grad_div_b=0.;
      for (int k=0; k<3; ++k) {
        raised_n+=inv(i,k)*n(k);
        for (int l=0; l<3; ++l) {
          contracted_b+=inv(k,l)*sym_b(i,k,l);
          grad_div_b+=inv(i,k)*sym_b(l,k,l);
        }
      }
      const double nonadvective=c.alpha*raised_n*(-4./3.*unit(17)+2.*unit(18))
        +contracted_b+grad_div_b/3.+2.*c.alpha*raised_n*trace_a;
      set(19+i,nonadvective+advection*gamma(i));
      set(22+i,nonadvective+advection*unit(22+i));
    }
    for (int k=0; k<3; ++k) {
      set(25+k,-2.*n(k)*(unit(17)-2.*unit(18)+trace_a)+advection*avec(k));
      for (int i=0; i<3; ++i) {
        double curl_p=0., curl_d=0.;
        for (int j=0; j<3; ++j) {
          curl_p+=inv(i,j)*(n(k)*p(j)-n(j)*p(k));
          for (int a_index=0; a_index<3; ++a_index)
            for (int l=0; l<3; ++l)
              curl_d+=inv(i,j)*inv(a_index,l)*(n(k)*d(l,j,a_index)-n(l)*d(k,j,a_index));
        }
        set(28+3*k+i,c.f*n(k)*unit(22+i)+c.alpha*c.alpha*c.mu*(curl_p-curl_d)+advection*b(k,i));
      }
      double trace_b=0.;
      for (int l=0; l<3; ++l) trace_b+=sym_b(l,k,l);
      for (int i=0; i<3; ++i)
        for (int j=i; j<3; ++j) {
          double stretch=0.;
          for (int l=0; l<3; ++l)
            stretch+=H(l,i)*sym_b(l,k,j)+H(l,j)*sym_b(l,k,i);
          set(37+6*k+symmetric_slot[i][j],.5*stretch-H(i,j)/3.*trace_b
              +c.alpha*n(k)*(-a(i,j)+H(i,j)/3.*trace_a)+advection*d(k,i,j));
        }
      set(55+k,c.alpha/3.*n(k)*(unit(17)+trace_a)-trace_b/3.+advection*p(k));
    }
  }
  require(nr_native::finite(out), "nonfinite FO principal matrix");
  return out;
}

// Centered PDE families only. The11 ODE zeros never receive beta.n advection.
inline std::vector<nr_native::Root> centered_roots(const Coefficients& c) {
  const double hnn=c.inverse[static_cast<std::size_t>(3*c.axis+c.axis)];
  require(hnn>0. && std::isfinite(hnn), "positive inverse normal metric required");
  const std::array<nr_native::Root,6> pairs{{
    {c.alpha*std::sqrt(c.chi*hnn),6},
    {std::sqrt(2.*c.alpha*c.chi*hnn),1},
    {std::sqrt(4.*c.f*hnn/3.),1},
    {c.alpha*std::sqrt(c.mu*hnn/2.),2},
    {std::sqrt(c.f*hnn),2},
    {.5*c.alpha*std::sqrt(c.mu*hnn),4}
  }};
  std::vector<nr_native::Root> all{{0.,15}};
  double scale=1.;
  for (const auto& root:pairs) {
    require(std::isfinite(root.value), "nonfinite speed family");
    scale=std::max(scale,std::abs(root.value));
    all.push_back({-root.value,root.multiplicity});
    all.push_back(root);
  }
  std::stable_sort(all.begin(),all.end(),[](const auto& a,const auto& b) { return a.value<b.value; });
  std::vector<nr_native::Root> merged;
  for (const auto& root:all) {
    if (!merged.empty() && std::abs(root.value-merged.back().value)<=1.e-12*scale)
      merged.back().multiplicity+=root.multiplicity;
    else merged.push_back(root);
  }
  return merged;
}
} // namespace nr_principal
