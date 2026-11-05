#pragma once
// A pinned, local Windows LAPACKE ABI adapter, not an Einstein solver.
#define NOMINMAX
#include <windows.h>
#include <algorithm>
#include <cmath>
#include <cstdint>
#include <cstring>
#include <filesystem>
#include <stdexcept>
#include <string>
#include <vector>

namespace nr_native {
using Matrix = std::vector<double>;
using LapackInt = std::int64_t; // Windows long is NOT the ILP64 integer.
static_assert(sizeof(LapackInt) == 8 && sizeof(double) == 8 && sizeof(void*) == 8);

inline void require(bool valid, const char* message) {
  if (!valid) throw std::runtime_error(message);
}
inline bool finite(const Matrix& a) {
  return std::all_of(a.begin(), a.end(), [](double x) { return std::isfinite(x); });
}
inline void check_square(const Matrix& a, std::size_t n) {
  require(n > 0 && n <= 64 && a.size() == n*n && finite(a), "finite square matrix of order 1..64 required");
}
inline Matrix eye(std::size_t n) {
  Matrix out(n*n, 0.);
  for (std::size_t i=0; i<n; ++i) out[i*n+i]=1.;
  return out;
}
inline Matrix transpose(const Matrix& a, std::size_t n) {
  check_square(a, n);
  Matrix out(n*n);
  for (std::size_t i=0; i<n; ++i)
    for (std::size_t j=0; j<n; ++j) out[i*n+j]=a[j*n+i];
  return out;
}
inline Matrix multiply(const Matrix& a, const Matrix& b, std::size_t n) {
  check_square(a, n); check_square(b, n);
  Matrix out(n*n, 0.);
  for (std::size_t i=0; i<n; ++i)
    for (std::size_t j=0; j<n; ++j)
      for (std::size_t k=0; k<n; ++k) out[i*n+j]+=a[i*n+k]*b[k*n+j];
  require(finite(out), "nonfinite matrix product");
  return out;
}
inline double inf_norm(const Matrix& a, std::size_t n) {
  check_square(a, n);
  double out=0.;
  for (std::size_t i=0; i<n; ++i) {
    double sum=0.;
    for (std::size_t j=0; j<n; ++j) sum+=std::abs(a[i*n+j]);
    require(std::isfinite(sum), "nonfinite matrix norm");
    out=std::max(out, sum);
  }
  return out;
}
inline double max_difference(const Matrix& a, const Matrix& b) {
  require(a.size()==b.size() && finite(a) && finite(b), "finite equal-sized arrays required");
  double out=0.;
  for (std::size_t i=0; i<a.size(); ++i) out=std::max(out, std::abs(a[i]-b[i]));
  require(std::isfinite(out), "nonfinite matrix difference");
  return out;
}

struct SVD { Matrix u, values, vt; };
class Lapack {
  using SvdFn = LapackInt (__cdecl *)(int,char,LapackInt,LapackInt,double*,LapackInt,double*,double*,LapackInt,double*,LapackInt);
  using SolveFn = LapackInt (__cdecl *)(int,LapackInt,LapackInt,double*,LapackInt,LapackInt*,double*,LapackInt);
  using EigenFn = LapackInt (__cdecl *)(int,char,char,LapackInt,double*,LapackInt,double*);
  using ConfigFn = const char* (__cdecl *)();
  using SetThreadsFn = void (__cdecl *)(int);
  using GetThreadsFn = int (__cdecl *)();
  HMODULE handle_=nullptr;
  SvdFn svd_=nullptr;
  SolveFn solve_=nullptr;
  EigenFn eigen_=nullptr;
  std::string config_;
  template<class Fn> Fn symbol(const char* name) {
    FARPROC raw=GetProcAddress(handle_, name);
    require(raw!=nullptr, "required scipy ILP64 LAPACKE symbol missing");
    static_assert(sizeof(Fn)==sizeof(raw));
    Fn function;
    std::memcpy(&function, &raw, sizeof(function));
    return function;
  }
public:
  explicit Lapack(const std::filesystem::path& path) {
    require(path.is_absolute() && std::filesystem::is_regular_file(path), "explicit existing absolute LAPACK DLL path required");
    handle_=LoadLibraryExW(path.c_str(), nullptr, LOAD_LIBRARY_SEARCH_DLL_LOAD_DIR|LOAD_LIBRARY_SEARCH_SYSTEM32);
    require(handle_!=nullptr, "cannot load explicit LAPACK DLL");
    try {
      const char* config=symbol<ConfigFn>("scipy_openblas_get_config64_")();
      require(config!=nullptr, "missing OpenBLAS configuration");
      config_=config;
      require(config_.find("USE64BITINT")!=std::string::npos, "OpenBLAS must declare 64-bit integers");
      svd_=symbol<SvdFn>("scipy_LAPACKE_dgesdd64_");
      solve_=symbol<SolveFn>("scipy_LAPACKE_dgesv64_");
      eigen_=symbol<EigenFn>("scipy_LAPACKE_dsyev64_");
      symbol<SetThreadsFn>("scipy_openblas_set_num_threads64_")(1);
      require(symbol<GetThreadsFn>("scipy_openblas_get_num_threads64_")()==1, "single-threaded BLAS required");
    } catch (...) { FreeLibrary(handle_); handle_=nullptr; throw; }
  }
  Lapack(const Lapack&)=delete;
  Lapack& operator=(const Lapack&)=delete;
  ~Lapack() { if (handle_) FreeLibrary(handle_); }
  const std::string& config() const { return config_; }
  SVD svd(const Matrix& input, std::size_t n) const {
    check_square(input, n);
    Matrix a=input;
    SVD out{Matrix(n*n),Matrix(n),Matrix(n*n)};
    const auto size=static_cast<LapackInt>(n);
    const auto info=svd_(101,'A',size,size,a.data(),size,out.values.data(),out.u.data(),size,out.vt.data(),size);
    require(info==0 && finite(out.u) && finite(out.vt) && finite(out.values), "LAPACKE dgesdd failed");
    for (std::size_t i=0; i<n; ++i)
      require(out.values[i]>=0. && (i==0 || out.values[i-1]>=out.values[i]), "invalid singular value ordering");
    return out;
  }
  Matrix inverse(const Matrix& input, std::size_t n) const {
    check_square(input, n);
    Matrix a=input, out=eye(n);
    std::vector<LapackInt> pivots(n);
    const auto size=static_cast<LapackInt>(n);
    const auto info=solve_(101,size,size,a.data(),size,pivots.data(),out.data(),size);
    require(info==0 && finite(out), "LAPACKE dgesv failed; no pseudoinverse permitted");
    require(max_difference(multiply(input,out,n),eye(n))<=2.e-11, "inverse residual exceeds contract");
    return out;
  }
  Matrix symmetric_eigenvalues(const Matrix& input, std::size_t n) const {
    check_square(input, n);
    require(max_difference(input,transpose(input,n))<=1.e-13*std::max(1.,inf_norm(input,n)), "symmetric matrix required");
    Matrix a=input, out(n);
    const auto size=static_cast<LapackInt>(n);
    const auto info=eigen_(101,'N','L',size,a.data(),size,out.data());
    require(info==0 && finite(out) && std::is_sorted(out.begin(),out.end()), "LAPACKE dsyev failed");
    return out;
  }
};
} // namespace nr_native
