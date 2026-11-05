# 瞬时平衡审计：剩余负例独立补验协议

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns
- Origin Mode: preserve stopped experiment; complete unexecuted controls
- Origin Date: 2026-10-07
- Verification Status: PREDECLARED
- Version Label: lapse_balance_completion_v1

## 保留的失败与修订范围

原审计收据SHA `68884a3e941f6acd37167af6669e30357d59b93a6c5397e5c91c022a03db18a1`
保持completed=false、audit_passed=false。336条命令全退出0；330个状态平衡、
Python/C++和4个串行重放均已完成。之后Python构造解析负例时错误保留了动态
profile，被checkpoint编码器拒绝；6个原生负例尚未运行。原空的
negative-analytic.bin、源码、二进制、日志和所有数据均保留，不覆盖。

本协议只修正负例输入构造：解析模式明确无profile，FD2使用v1、FD4使用v3。
先在内存完整编码并通过严格解码，再创建新文件，避免构造异常留下空输出。
此修正不改数值方程、旧160份源码、任何阈值或原生检查器。

## 冻结补验

- 先核验原失败收据及1247个产物、160旧源码、绑定probe二进制，以及更早
  62例总门禁为false的原始收据。新增补验runner和测试，共162源码冻结快照。
- 只读重新计算原330个状态的Python RHS、两侧平衡与门禁，逐项匹配原记录；
  原native RHS由SHA绑定，不重算330条原生命令。4组完整字节重放再检查。
- 额外2个原生正例：FD2/FD4、seed20261007独立输入，再读一次原状态并与
  原RHS逐字节相同，确认此刻二进制可用。
- 在新目录执行6个原先未执行的负例：已存在输出、合法解析checkpoint、
  截断动态checkpoint、未知选项、重复选项、线程数2。要求退出2、错误原因
  对应，原输出不变且无新RHS输出。

新runner共8条命令（2正例+6预期拒绝）。旧336条仍属旧运行，不重复计数；
完整证据链为旧336+新8，不能称为一次连续342条成功执行。

新目录：`C:/Users/86137/NRShadowEvidence/nr-k3-lapse-balance-completion-v1-20261007`。
保持总30分钟/每原生命令180秒、192MiB输出与8MiB预留、C≥4GiB/E≥1GiB。
不安装、不修改PATH、不重编译、不改旧协议或收据；首次异常停止，留失败。
本次通过只确认330状态的瞬时恒等式/跨后端与检查器边界，不证明新时间演化、
完整约束传播、physical、strong hyperbolicity、黑洞、CPBC、AMR、CUDA、长期
稳定性或live；所有这些标记及scientificPayloadWriteback继续false。
