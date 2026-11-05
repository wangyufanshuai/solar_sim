#include "rk4.hpp"
#include <cstdio>
#include <fcntl.h>
#include <io.h>

namespace {
using nr_sbp::require;
struct Input {
  nr_sbp::Grid grid;
  std::uint64_t start;
  std::size_t steps;
  double dt;
  nr_sbp::Fields q;
  std::vector<nr_sat::Targets> targets;
};
std::string line() {
  std::array<char,513> bytes{};
  require(bool(std::cin.getline(bytes.data(),static_cast<std::streamsize>(bytes.size()))),"bounded complete text header required");
  return bytes.data();
}
std::uint64_t unsigned_integer(const std::string& text) {
  require(!text.empty() && std::all_of(text.begin(),text.end(),[](char c){return c>='0' && c<='9';}),
          "unsigned decimal integer required");
  std::size_t used=0;const auto value=std::stoull(text,&used);
  require(used==text.size(),"invalid decimal integer");return value;
}
void read_fields(nr_sbp::Fields& fields,std::size_t count) {
  for(auto& component:fields) {
    component.resize(count);
    require(bool(std::cin.read(reinterpret_cast<char*>(component.data()),static_cast<std::streamsize>(count*sizeof(double)))),
            "truncated canonical58 FP64 payload");
    require(nr_native::finite(component),"finite canonical58 FP64 payload required");
  }
}
Input read_input() {
  const std::uint16_t endian=1;
  require(*reinterpret_cast<const unsigned char*>(&endian)==1,"little-endian FP64 required");
  std::istringstream header(line());header.imbue(std::locale::classic());
  std::string schema,start_text,steps_text,extra;
  int variables=0;
  std::array<std::size_t,3> shape{};
  std::array<double,3> lower{},upper{};
  double dt=0.;
  require(bool(header>>schema>>variables>>shape[0]>>shape[1]>>shape[2]),"incomplete RK4 header");
  require(schema=="nr-native-rk4-input-v1" && variables==58,"explicit canonical58 RK4 schema required");
  for(auto& x:lower) require(bool(header>>x),"invalid lower coordinate");
  for(auto& x:upper) require(bool(header>>x),"invalid upper coordinate");
  require(bool(header>>start_text>>steps_text>>dt) && !(header>>extra),"explicit index/steps/dt without trailing header required");
  const auto start=unsigned_integer(start_text),steps=unsigned_integer(steps_text);
  require(steps>=1 && steps<=4 && start<=(1ULL<<52)-steps,"bounded1..4 steps and exact half-step indices required");
  require(std::isfinite(dt) && dt>0.,"finite positive dt required");
  Input input{nr_sbp::Grid(shape,lower,upper),start,static_cast<std::size_t>(steps),dt,{}, {}};
  read_fields(input.q,input.grid.cells());
  input.targets.resize(2*input.steps+1);
  for(std::size_t k=0;k<input.targets.size();++k) {
    std::istringstream label(line());label.imbue(std::locale::classic());
    std::string tag,tick;
    require(bool(label>>tag>>tick) && !(label>>extra) && tag=="face-targets-v1","explicit boundary target label required");
    require(unsigned_integer(tick)==2*start+k,"boundary half-step labels must be contiguous and exact");
    for(std::size_t a=0;a<3;++a) for(std::size_t s=0;s<2;++s)
      read_fields(input.targets[k][2*a+s],nr_sat::Face(input.grid,a,s).points());
  }
  char surplus=0;require(!std::cin.get(surplus),"trailing input forbidden");
  return input;
}
int threads(const std::string& text) {
  const auto count=unsigned_integer(text);require(count==1||count==2||count==4,"qualified thread counts1,2,4 required");
  omp_set_dynamic(0);omp_set_num_threads(static_cast<int>(count));
  int actual=0;
#pragma omp parallel
  {
#pragma omp single
    actual=omp_get_num_threads();
  }
  require(actual==count,"OpenMP team mismatch");return actual;
}
std::string loaded(const std::wstring& module) {
  const auto handle=GetModuleHandleW(module.c_str());require(handle!=nullptr,"required runtime not loaded");
  std::array<wchar_t,32768> path{};
  const auto count=GetModuleFileNameW(handle,path.data(),static_cast<DWORD>(path.size()));
  require(count>0 && count<path.size(),"runtime identity unavailable");
  return std::filesystem::path(path.data()).u8string();
}
void stage_report(const nr_rk4::Stage& stage,std::size_t index) {
  const auto& r=stage.report;
  std::cout<<"{\"stage\":"<<index+1<<",\"boundary_tick\":"<<stage.tick<<",\"cfl\":"<<r.cfl
    <<",\"coefficients_sha256\":"<<std::quoted(r.coefficients_sha256)<<",\"basis_builds\":"<<r.basis_builds
    <<",\"max_basis_condition\":"<<r.max_condition<<",\"max_characteristic_residual\":"<<r.max_residual
    <<",\"min_lapse\":"<<r.min_lapse<<",\"min_chi\":"<<r.min_chi<<",\"det_h_max_error\":"<<r.det_error
    <<",\"faces\":[";
  for(std::size_t f=0;f<6;++f) {if(f) std::cout<<',';
    std::cout<<"{\"axis\":"<<f/2<<",\"side\":"<<f%2<<",\"sat_max_abs\":"<<r.face_max[f]<<'}';}
  std::cout<<"]}";
}
void output(const Input& input,const std::vector<nr_rk4::Step>& trace,int team,
            const std::string& openmp,const std::string& blas,const std::string& config) {
  nr_sbp::Values packed;
  packed.reserve(input.steps*9*58*input.grid.cells());
  const auto append=[&](const nr_sbp::Fields& fields) {
    for(const auto& q:fields) packed.insert(packed.end(),q.begin(),q.end());
  };
  for(const auto& step:trace) {
    for(const auto& stage:step.stages) {append(stage.input);append(stage.rhs);}
    append(step.endpoint);
  }
  require(nr_native::finite(packed),"nonfinite trajectory output");
  std::cout<<"{\"schema\":\"nr-native-rk4-output-v1\",\"method_id\":"<<std::quoted(nr_rk4::method_id)
    <<",\"shape\":["<<input.grid.shape[0]<<','<<input.grid.shape[1]<<','<<input.grid.shape[2]
    <<"],\"lower\":["<<input.grid.lower[0]<<','<<input.grid.lower[1]<<','<<input.grid.lower[2]
    <<"],\"upper\":["<<input.grid.upper[0]<<','<<input.grid.upper[1]<<','<<input.grid.upper[2]
    <<"],\"start_step\":"<<input.start<<",\"steps\":"<<input.steps<<",\"dt\":"<<input.dt
    <<",\"threads_observed\":"<<team<<",\"openmp_version\":"<<_OPENMP<<",\"openmp_runtime\":"<<std::quoted(openmp)
    <<",\"blas_runtime\":"<<std::quoted(blas)<<",\"blas_config\":"<<std::quoted(config)<<",\"blas_threads\":1"
    <<",\"frozen_equation_sha256\":"<<std::quoted(nr_sbp::frozen_equation_sha)<<",\"values\":"<<packed.size()
    <<",\"encoding\":\"little-endian-float64\",\"payload_order\":\"per-step: q1,k1,q2,k2,q3,k3,q4,k4,endpoint; canonical58 slot-major\","
    <<"\"native_rk4_step_supported\":true,\"short_trajectory_supported\":true,\"component_only\":true,"
    <<"\"native_checkpoint_supported\":false,\"algebraic_projection\":false,\"auxiliaries_reconstructed\":false,"
    <<"\"automatic_timestep_change\":false,\"physical_gate\":false,\"scientificPayloadWriteback\":false,\"trace\":[";
  for(std::size_t i=0;i<trace.size();++i) {if(i) std::cout<<',';
    std::cout<<"{\"step\":"<<trace[i].index<<",\"stages\":[";
    for(std::size_t s=0;s<4;++s) {if(s) std::cout<<',';stage_report(trace[i].stages[s],s);}
    std::cout<<"]}";
  }
  std::cout<<"]}\n";
  std::cout.write(reinterpret_cast<const char*>(packed.data()),static_cast<std::streamsize>(packed.size()*sizeof(double)));
  require(bool(std::cout),"trajectory output stream failed");
}
} // namespace

int main(int argc,char** argv) {
  nr_rk4::Progress progress;
  try {
    require(argc==7 && std::string(argv[1])=="--lapack" && std::string(argv[3])=="--mode"
            && std::string(argv[4])=="trajectory" && std::string(argv[5])=="--threads",
            "usage: executable --lapack ABSOLUTE_DLL --mode trajectory --threads1|2|4");
    const auto team=threads(argv[6]);
    require(_setmode(_fileno(stdin),_O_BINARY)!=-1 && _setmode(_fileno(stdout),_O_BINARY)!=-1,"binary pipe mode unavailable");
    nr_principal::classic_io();
    const std::filesystem::path path(argv[2]);
    const nr_native::Lapack lapack(path);
    const auto blas=loaded(path.filename().wstring()),openmp=loaded(L"vcomp140.dll");
    require(std::filesystem::equivalent(path,std::filesystem::path(blas)),"loaded LAPACK differs from requested path");
    const auto input=read_input();
    std::vector<nr_rk4::Step> trace;
    nr_sbp::Fields q=input.q;
    for(std::size_t s=0;s<input.steps;++s) {
      trace.push_back(nr_rk4::step(lapack,input.grid,q,input.start+s,input.dt,
                     {&input.targets[2*s],&input.targets[2*s+1],&input.targets[2*s+2]},progress));
      q=trace.back().endpoint;
    }
    progress.phase="output";
    output(input,trace,team,openmp,blas,lapack.config());
    return 0;
  } catch(const std::exception& error) {
    std::cerr<<"{\"schema\":\"nr-native-rk4-error-v1\",\"status\":\"rejected\",\"attempted_step\":"<<progress.step
      <<",\"stage\":"<<progress.stage<<",\"boundary_tick\":"<<progress.tick<<",\"phase\":"<<std::quoted(progress.phase)
      <<",\"error\":"<<std::quoted(error.what())<<",\"fallback\":false,\"scientificPayloadWriteback\":false}\n";
    return 1;
  }
}
