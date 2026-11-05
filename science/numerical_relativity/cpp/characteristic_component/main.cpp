#include "characteristic_split.hpp"
#include <iomanip>
#include <iostream>
#include <locale>
#include <sstream>

using namespace nr_native;

namespace {
void array_json(const Matrix& a) {
  require(finite(a), "nonfinite JSON output forbidden");
  std::cout << '[';
  for (std::size_t i=0; i<a.size(); ++i) {
    if (i) std::cout << ',';
    std::cout << a[i];
  }
  std::cout << ']';
}
void abi_control(const Lapack& lapack) {
  const Matrix a{3.,1.,0.,0.,4.,0.,0.,0.,0.};
  const auto svd=lapack.svd(a,3);
  require(max_difference(svd.values,{std::sqrt(18.),std::sqrt(8.),0.})<=1.e-13, "SVD analytic singular values differ");
  Matrix scaled=svd.u;
  for (std::size_t i=0; i<3; ++i)
    for (std::size_t j=0; j<3; ++j) scaled[3*i+j]*=svd.values[j];
  const double reconstruction=max_difference(multiply(scaled,svd.vt,3),a);
  require(reconstruction<=1.e-13, "SVD analytic reconstruction differs");
  const double solve_error=max_difference(lapack.inverse({4.,1.,2.,3.},2),{.3,-.1,-.2,.4});
  require(solve_error<=1.e-13, "analytic inverse differs");
  const auto eig=lapack.symmetric_eigenvalues({2.,1.,1.,2.},2);
  require(max_difference(eig,{1.,3.})<=1.e-13, "analytic symmetric eigenvalues differ");
  bool singular_rejected=false;
  try { lapack.inverse({1.,2.,2.,4.},2); }
  catch (const std::runtime_error&) { singular_rejected=true; }
  require(singular_rejected, "singular inverse accepted");
  std::cout << "{\"schema\":\"nr-native-lapack-abi-v1\",\"lapack_integer_bytes\":" << sizeof(LapackInt)
            << ",\"windows_long_bytes\":" << sizeof(long)
            << ",\"blas_threads\":1,\"config\":" << std::quoted(lapack.config())
            << ",\"svd_reconstruction_error\":" << reconstruction
            << ",\"inverse_error\":" << solve_error
            << ",\"singular_inverse_rejected\":true,\"scientificPayloadWriteback\":false}\n";
}
} // namespace

int main(int argc,char** argv) {
  try {
    require(argc==4 && std::string(argv[1])=="--lapack", "usage: executable --lapack ABSOLUTE_DLL --split|--self-test");
    const std::string mode=argv[3];
    require(mode=="--split" || mode=="--self-test", "unknown component mode");
    std::cout.imbue(std::locale::classic());
    std::cin.imbue(std::locale::classic());
    std::cout << std::setprecision(17);
    Lapack lapack{std::filesystem::path(argv[2])};
    if (mode=="--self-test") { abi_control(lapack); return 0; }
    std::string schema;
    int dimension=0, group_count=0;
    double advection=0.;
    require(bool(std::cin>>schema>>dimension>>advection>>group_count), "incomplete component header");
    require(schema=="nr-split-input-v1" && dimension==58 && group_count>0 && group_count<=47,
            "fixed58 component input required");
    std::vector<Root> groups;
    for (int i=0; i<group_count; ++i) {
      double value=0.; int count=0;
      require(bool(std::cin>>value>>count) && count>0 && count<=47, "invalid root input");
      groups.push_back({value,static_cast<std::size_t>(count)});
    }
    Matrix principal(58*58);
    for (double& value:principal) require(bool(std::cin>>value), "incomplete/nonfinite principal input");
    std::string extra;
    require(!(std::cin>>extra), "trailing input forbidden");
    const auto split=split47(lapack,principal,groups,advection);
    std::cout << "{\"schema\":\"nr-native-characteristic-component-v1\",\"component_only\":true,"
              << "\"native_einstein_symbol\":false,\"evolution_backend\":false,\"physical_gate\":false,"
              << "\"scientificPayloadWriteback\":false,\"condition\":" << split.condition
              << ",\"residual\":" << split.residual << ",\"symmetry_residual\":" << split.symmetry
              << ",\"minimum_energy_eigenvalue\":" << split.minimum_energy_eigenvalue
              << ",\"positive\":";
    array_json(split.positive);
    std::cout << ",\"negative\":";
    array_json(split.negative);
    std::cout << "}\n";
    return 0;
  } catch (const std::exception& error) {
    std::cerr << "native component rejected: " << error.what() << '\n';
    return 1;
  }
}
