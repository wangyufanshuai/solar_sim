// Test-only, separate executable. Do not edit or replace the frozen RHS.
// This TU does NOT include fo_principal.hpp or call its assembly/root routines.
#include "coefficients.hpp"
#define main nr_frozen_shadow_application_main
#include "../nr_k2_fo_ccz4_shadow.cpp"
#undef main

namespace {
nr_native::Matrix probe(const nr_principal::Coefficients& c, int order,double epsilon) {
  nr_principal::require((order==2 || order==4) && std::isfinite(epsilon)
                        && epsilon>=1.e-6 && epsilon<=1.e-4, "bounded RHS probe parameters required");
  constexpr std::size_t n=5, cells=n*n*n;
  constexpr double dx=1./double(n);
  const std::size_t center=index3(2,2,2,n);
  const std::array<std::size_t,3> strides{n*n,n,1};
  State base(n,static_cast<std::size_t>(order));
  base.gauge_profile_code=1;
  base.shift_scale=3.;
  base.ordering_scale=.2;
  base.tau_inverse=1.;
  base.solver_mode_code=1;
  for (std::size_t flat=0; flat<cells; ++flat) {
    for (int i=0; i<3; ++i)
      for (int j=i; j<3; ++j) base.q[h_slot(i,j)][flat]=c.h[static_cast<std::size_t>(3*i+j)];
    base.q[LnAlpha][flat]=std::log(c.alpha);
    base.q[LnPhi][flat]=.5*std::log(c.chi);
    for (std::size_t i=0; i<3; ++i) base.q[Beta0+i][flat]=c.beta[i];
  }
  validate_dynamic_state(base);
  nr_native::Matrix matrix(58*58,0.);
  for (std::size_t column=0; column<58; ++column) {
    std::array<double,58> plus{};
    for (int sign:{1,-1}) {
      State state=base;
      for (std::size_t flat=0; flat<cells; ++flat) {
        const auto coordinate=static_cast<int>((flat/strides[static_cast<std::size_t>(c.axis)])%n);
        state.q[column][flat]+=double(sign)*epsilon*double(coordinate-2)*dx;
      }
      validate_dynamic_state(state);
      const auto rhs=fo_rhs(state);
      for (std::size_t row=0; row<58; ++row) {
        nr_principal::require(std::isfinite(rhs.q[row][center]), "nonfinite actual RHS probe");
        if (sign==1) plus[row]=rhs.q[row][center];
        else matrix[58*row+column]=(plus[row]-rhs.q[row][center])/(2.*epsilon);
      }
    }
  }
  nr_principal::require(nr_native::finite(matrix), "nonfinite actual RHS principal matrix");
  return matrix;
}
} // namespace

int main(int argc,char** argv) {
  try {
    nr_principal::require(argc==6 && std::string(argv[1])=="--lapack"
                          && std::string(argv[3])=="--rhs-probe",
                          "usage: executable --lapack ABSOLUTE_DLL --rhs-probe ORDER EPSILON");
    nr_principal::classic_io();
    std::size_t consumed=0;
    const int order=std::stoi(argv[4],&consumed);
    nr_principal::require(consumed==std::strlen(argv[4]), "invalid stencil order");
    const double epsilon=std::stod(argv[5],&consumed);
    nr_principal::require(consumed==std::strlen(argv[5]), "invalid probe amplitude");
    const nr_native::Lapack lapack{std::filesystem::path(argv[2])};
    const auto c=nr_principal::read_input(lapack);
    const auto matrix=probe(c,order,epsilon);
    std::cout << "{\"schema\":\"nr-native-actual-rhs-principal-probe-v1\",\"component_only\":true,"
              << "\"native_principal_assembly\":false,\"actual_frozen_rhs_probe\":true,"
              << "\"evolution_backend\":false,\"physical_gate\":false,\"scientificPayloadWriteback\":false,"
              << "\"axis\":" << c.axis << ",\"spatial_order\":" << order << ",\"epsilon\":" << epsilon
              << ",\"principal\":";
    nr_principal::json_array(matrix);
    std::cout << "}\n";
    return 0;
  } catch (const std::exception& error) {
    std::cerr << "native RHS probe rejected: " << error.what() << '\n';
    return 1;
  }
}
