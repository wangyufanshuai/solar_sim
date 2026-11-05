#include "checkpoint.hpp"

namespace {
using namespace nr_checkpoint;
std::string module_path(const wchar_t* name) {
  const auto handle=name?GetModuleHandleW(name):nullptr;
  require(!name || handle,"runtime not loaded");std::array<wchar_t,32768> path{};
  const auto size=GetModuleFileNameW(handle,path.data(),static_cast<DWORD>(path.size()));
  require(size>0 && size<path.size(),"module identity unavailable");return Path(path.data()).u8string();
}
int team(const std::string& text) {
  const auto n=integer(text);require(n==1 || n==2 || n==4,"qualified thread counts1,2,4 required");
  omp_set_dynamic(0);omp_set_num_threads(static_cast<int>(n));int actual=0;
#pragma omp parallel
  {
#pragma omp single
    actual=omp_get_num_threads();
  }
  require(actual==n,"OpenMP team mismatch");return actual;
}
std::map<std::string,std::string> options(int argc,char** argv) {
  require(argc==13 || argc==17,"six required flag/value pairs; optional fault/step pair");
  std::map<std::string,std::string> args;
  for(int i=1;i<argc;i+=2) require(args.emplace(argv[i],argv[i+1]).second,"duplicate CLI flag");
  for(const auto& item:args) require(item.first=="--lapack" || item.first=="--threads" || item.first=="--plan" || item.first=="--restart" || item.first=="--plan-sha" || item.first=="--output" || item.first=="--advance" || item.first=="--fault" || item.first=="--fault-step","unknown CLI flag");
  require(args.count("--lapack") && args.count("--threads") && args.count("--plan-sha") && args.count("--output") && args.count("--advance") && args.count("--plan")+args.count("--restart")==1,"explicit CLI contract required");
  require(args.count("--fault")==args.count("--fault-step"),"fault requires explicit step");return args;
}
void manifest(const Plan& plan,std::uint64_t step,std::uint64_t advanced,const Path& path,
              const std::string& plan_sha,const std::string& identity,const std::string& exe,
              const std::string& blas,const std::string& omp,int threads,const nr_sbp::Fields& q) {
  const auto raw=read_file(safe_path(path));
  std::cout<<"{\"schema_version\":\"nr-run-manifest-v1\",\"kernel_id\":"<<std::quoted(kernel_id)
    <<",\"kernel_version\":\"0.1.0\",\"formulation\":\"fo-ccz4-58-variable-shadow-contract\",\"status\":\"shadow\","
    <<"\"promotion\":\"blocked-pending-physical-validation\",\"units\":\"geometric-G=c=1\",\"coordinate_system\":\"cartesian-3d\","
    <<"\"gauge\":\"advective-1+log-gamma-driver\",\"boundary\":\"sbp42-analytic-target-sat\",\"grid\":{\"shape\":[";
  for(int a=0;a<3;++a){if(a)std::cout<<',';std::cout<<plan.grid.shape[a];}
  std::cout<<"],\"lower\":[";for(int a=0;a<3;++a){if(a)std::cout<<',';std::cout<<plan.grid.lower[a];}
  std::cout<<"],\"upper\":[";for(int a=0;a<3;++a){if(a)std::cout<<',';std::cout<<plan.grid.upper[a];}
  std::cout<<"],\"spacing\":[";for(int a=0;a<3;++a){if(a)std::cout<<',';std::cout<<plan.grid.spacing[a];}
  std::cout<<"],\"dt\":"<<plan.dt<<",\"interior_order\":4,\"boundary_order\":2},\"diagnostics\":{"
    <<"\"method_id\":"<<std::quoted(nr_rk4::method_id)<<",\"release_identity\":\"solar-sim-mainline-a\",\"checkpoint_version\":1,"
    <<"\"step\":"<<step<<",\"time\":"<<static_cast<double>(step)*plan.dt<<",\"plan_start\":"<<plan.start<<",\"plan_steps\":"<<plan.steps
    <<",\"steps_advanced\":"<<advanced<<",\"rhs_evaluations\":"<<4*advanced<<",\"checkpoint_path\":"<<std::quoted(path.u8string())
    <<",\"checkpoint_sha256\":"<<std::quoted(hex(digest(raw)))<<",\"plan_sha256\":"<<std::quoted(plan_sha)
    <<",\"state_sha256\":"<<std::quoted(hex(digest(state_bytes(q))))<<",\"binding_sha256\":"<<std::quoted(hex(digest(Bytes(identity.begin(),identity.end()))))
    <<",\"source_sha256\":"<<std::quoted(source_sha)<<",\"executable_sha256\":"<<std::quoted(exe)
    <<",\"blas_sha256\":"<<std::quoted(blas)<<",\"openmp_sha256\":"<<std::quoted(omp)
    <<",\"threads_observed\":"<<threads<<",\"openmp_version\":"<<_OPENMP<<",\"blas_threads\":1,\"variable_count\":58,\"variables\":[";
  for(std::size_t i=0;i<58;++i){if(i)std::cout<<',';std::cout<<std::quoted(nr_sbp::kVariableNames[i]);}
  std::cout<<"],\"native_checkpoint_supported\":true,\"component_only\":true,\"algebraic_projection\":false,"
    <<"\"auxiliaries_reconstructed\":false,\"automatic_timestep_change\":false,\"fallback\":false,\"physical_gate\":false,"
    <<"\"live_admission\":false,\"scientificPayloadWriteback\":false,\"universal_power_loss_durability\":false}}\n";
  require(bool(std::cout),"manifest output failed");
}
} // namespace

int main(int argc,char** argv) {
  nr_rk4::Progress progress;std::string last;std::uint64_t accepted=0;
  try {
    nr_principal::classic_io();const auto args=options(argc,argv);
    const auto threads=team(args.at("--threads"));reserve(0);
    const auto directory=safe_path(Path(args.at("--output")),true);
    Handle directory_lock(CreateFileW(directory.c_str(),FILE_READ_ATTRIBUTES,FILE_SHARE_READ|FILE_SHARE_WRITE,nullptr,OPEN_EXISTING,FILE_FLAG_BACKUP_SEMANTICS|FILE_FLAG_OPEN_REPARSE_POINT,nullptr));
    const nr_native::Lapack lapack(Path(args.at("--lapack")));
    const auto blas_path=module_path(Path(args.at("--lapack")).filename().c_str());
    require(std::filesystem::equivalent(Path(args.at("--lapack")),Path(blas_path)),"loaded BLAS identity mismatch");
    const auto blas=hex(digest(read_file(Path(blas_path),64*1024*1024)));
    const auto omp=hex(digest(read_file(Path(module_path(L"vcomp140.dll")),64*1024*1024)));
    require(blas=="6547e9fb966e9773caee2755e91a8bf4d6f3a2f0eebf9646b0158f8675ea4ab5" && omp=="95d4ce4a6802d1e18b5e0e1722cc30ea72ca7e033f83828f05c0b7b993fe7cbf","unqualified numerical runtime");
    const auto exe=hex(digest(read_file(Path(module_path(nullptr)),64*1024*1024)));
    const auto identity=binding(exe,blas,omp),plan_sha=args.at("--plan-sha");require(is_sha(plan_sha),"lowercase origin plan SHA256 required");
    const bool restarting=args.count("--restart")!=0;
    const auto input_path=safe_path(Path(args.at(restarting?"--restart":"--plan")));
    const auto input=read_file(input_path);
    Checkpoint current;
    if(restarting) {
      require(input_path.extension()==L".nrck","only published .nrck checkpoints may restart");
      progress.phase="checkpoint-validate";current=decode(input,identity,plan_sha,lapack);
      last=input_path.u8string();accepted=current.step;
    } else {
      require(hex(digest(input))==plan_sha,"origin plan SHA256 mismatch");
      const auto p=parse_plan(input);current={input,p.start,p.initial};
    }
    const auto plan=parse_plan(current.plan);const auto advance=integer(args.at("--advance"));
    require(advance<=4 && (restarting || advance>=1) && advance<=plan.start+plan.steps-current.step,"requested advance outside original plan");
    require(std::isfinite(static_cast<double>(plan.start+plan.steps)*plan.dt),"finite endpoint time required");
    Fault injection;
    if(args.count("--fault")) {
      injection={args.at("--fault"),integer(args.at("--fault-step"))};
      require((injection.phase=="half-write" || injection.phase=="flushed" || injection.phase=="published") && injection.step>current.step && injection.step<=current.step+advance,"bounded explicit process-fault hook required");
    }
    const auto initial=current.step;
    while(current.step<initial+advance) {
      progress={current.step,2*current.step,0,"resource-preflight"};reserve(current.plan.size()+58*plan.grid.cells()*8+1024*1024);
      const auto target=filename(directory,current.step+1);
      require(!std::filesystem::exists(target) && !std::filesystem::exists(Path(target.wstring()+L".partial")),"existing checkpoint or partial; choose a fresh output directory");
      const auto offset=static_cast<std::size_t>(2*(current.step-plan.start));
      auto result=nr_rk4::step(lapack,plan.grid,current.q,current.step,plan.dt,
        {&plan.targets[offset],&plan.targets[offset+1],&plan.targets[offset+2]},progress);
      progress.phase="checkpoint-publish";
      publish(target,encode(identity,current.step+1,current.plan,result.endpoint),injection,current.step+1);
      current.q=std::move(result.endpoint);++current.step;accepted=current.step;last=target.u8string();
    }
    progress.phase="manifest";
    manifest(plan,current.step,advance,Path(last),plan_sha,identity,exe,blas,omp,threads,current.q);return 0;
  } catch(const std::exception& error) {
    std::cerr<<"{\"schema\":\"nr-native-checkpoint-error-v1\",\"status\":\"rejected\",\"attempted_step\":"<<progress.step
      <<",\"stage\":"<<progress.stage<<",\"boundary_tick\":"<<progress.tick<<",\"phase\":"<<std::quoted(progress.phase)
      <<",\"last_checkpoint\":"<<std::quoted(last)<<",\"accepted_step\":"<<accepted<<",\"error\":"<<std::quoted(error.what())
      <<",\"fallback\":false,\"scientificPayloadWriteback\":false}\n";return 1;
  }
}
