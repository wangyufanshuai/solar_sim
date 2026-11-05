# 共同初值时间加密：四区域约四阶，中心仍不可分辨

## Material Passport

- Origin Skill: academic-research-suite / experiment-agent; python-testing-patterns
- Origin Mode: prospective deterministic time-refinement and independent saved-state audit
- Origin Date: 2026-10-09
- Verification Status: EXACT REPLAY AND INDEPENDENT AUDIT PASSED; AGGREGATE UNRESOLVED
- Version Label: nr-common-time-refinement-v1

## 当前结论

首轮 N13、7/14/28 步三档均完成到同一 T=1/16M，共49步/196个RHS阶段。
全域、面、边、角均测得3.5–4.5范围内的观测时间阶数；中心较小差低于固定
2e-13下限，所以aggregate=`unresolved`，`temporal_screen_passed=false`。
首轮和独立进程回放均通过独立算术/诊断/时间范数审计；两次科学JSON除根耗时外
完全一致。完整计算和复现检查通过，不改变整体时间筛查仍未通过的结论。

这是同一新初值、单一网格、一个短时间窗的自收敛观察，不是普适四阶、
空间收敛、解析演化误差或物理黑洞准入。初值的一次映射改变了物理K_ij，
没有求解Einstein初值约束；旧失败轨迹仍然失败。

## 固定实验与代码变更

详见 [预注册合同](EXPERIMENT-20261009-common-time-refinement.md)。
dt=1/112、1/224、1/448，规范、RHS、SBP(4,2)、六面静态解析入射目标不变。
只使用`none`策略，初值之后不持续投影。最粗档实测最大CFL为
0.24286716376346607，仍低于原0.25上限；原det上限1e-10未变。

新增时间加密运行器、独立审计器及两组测试；直接复用被冻结的窗口
`prepare/run_case/guard`，不修改它们或其运行时全局变量。父回执与父产物
在运行前后都重新核验。方法数值失败不重试，资源/证据错误终止整批。

最终继承回归69个文件 **2042 passed / 38.31秒**。其中新定向40项通过，
独立审计专项17项通过；它们是2042的子集，不相加。四个新Python文件Ruff通过。
这是继承验证链的测试，不是仓库所有测试或2042个物理基准。

## 时间差与分类

误差是58槽SBP加权RMS的粗-中、中-细同终点差。区域定义沿用原全域、
中心盒、边界面、边和角；不同区域不能代替不同网格或独立物理样本。

| 区域 | 粗-中差 | 中-细差 | 较小差/固定下限 | 观测阶数 | 分类 |
| --- | ---: | ---: | ---: | ---: | --- |
| whole | 1.34736258824e-11 | 7.97659666503e-13 | 3.9883 | 4.07822 | passed |
| central_box | 1.37756675954e-12 | 8.51360486837e-14 | 0.42568 | null | unresolved |
| faces | 2.11813724301e-11 | 1.26498041244e-12 | 6.3249 | 4.06561 | passed |
| edges | 8.28894064551e-11 | 4.92062580176e-12 | 24.6031 | 4.07427 | passed |
| corners | 3.72429355849e-10 | 2.11920785291e-11 | 105.9604 | 4.13537 | passed |

中心区域没有因为粗-中差可分辨而报阶数；两项差都必须高于固定下限。
全域较小差仅为下限的约3.99倍，应保留分辨裕量有限的限制。
不把三个近似解的相互差当作对真实Einstein解的绝对误差。

## 约束与阶段合同

三档最终全域Hessian-H分别为9.201831366598727e-4、9.201831508953285e-4、
9.201831517364228e-4；M分别为1.6627324093509017e-4、1.6627324050655907e-4、
1.662732404827957e-4。时间加密没有消除约束残差；原H诊断、区域范数及初值仍并列保留。
本轮没有测量这些残差的空间收敛，也没有改判以前的Hamiltonian空间筛查失败。

7/14/28步档的raw det最大误差分别为4.980682533073377e-12、
1.2381207170619746e-12、3.084199562408685e-13，均在原合同内。
最大特征残差1.4500368651896048e-13，最大基条件数约24.20。

## 独立检查及复现边界

两次运行各52条初始/接受点记录（每次共享T=0记录3次，49条步末记录）均独立重建H/M等诊断，
最大差异3.6366742950377784e-14；全部保存的raw RK组合逐字节匹配。
独立审计使用显式SBP边界权重、索引定义区域及独立求和重算时间差，
最大相对范数差2.888017761913239e-16，所有分类相同。
审计不重新执行生产RHS，不是独立Einstein求解器或跨C++后端验证。

两次运行各核验1026个产物，合计2052个；各338个源码键（336个不同文件）一致。
每次保留690个数组，目录含回执共1027个文件。初始记录重复出现不构成独立物理样本。
首轮/回放分别耗时1189.9744/1211.7561秒，各707873603字节（675.081MiB），
都在事前每批2400秒/768MiB上限内。最终审计自身不重算生产RHS。

| 证据 | SHA256 |
| --- | --- |
| 首轮回执 | `c86f57d76b656b19b73118204c210a1c217428de490463eec8f0f7aa50dc8c56` |
| 回放回执 | `1c4afb196ee5c882bcd9f28330ca18240dcd32c8b98ee3fef94b214a3cafa08e` |
| 最终双运行独立审计 | `508dada74add44933a90d24cd88f83f6e57b603ae92c5f9152ea055e0db50530` |
| 2042项继承回归XML | `1e3bf68f3dbe09ee559666f99aeb9a293284d35ecce1e00fca2f263e8e27e76f` |
| 40项定向测试XML | `0feb7897823164893dc89b94be2ef556dcebfc083e51efa5110ff37fe89a07fe` |
| 17项审计测试XML | `640313a5414009836dcc040035b172190f9c0f055ff08efd82437d906b0b26b6` |

旧失败探针回执SHA256仍为
`b0b37e728425ee9b47b3cdec828ff137003d14df07d28d1601b6edb108f9b6df`，
没有被本次共同初值试验覆盖、重启或改判。

主要证据路径（相对next-web）：

- `tmp/nr-shadow-evidence/nr-k3-common-time-refinement-v1-20261009/receipt.json`
- `tmp/nr-shadow-evidence/nr-k3-common-time-refinement-replay-v1-20261009/receipt.json`
- `tmp/nr-shadow-evidence/nr-k3-common-time-refinement-audit-v1-20261009.json`
- `tmp/nr-shadow-evidence/nr-k3-common-time-refinement-primary-audit-v1-20261009.json`
- `tmp/nr-common-time-regression-v2-20261009.xml`
- `tmp/nr-common-time-focused-v2-20261009.xml`
- `tmp/nr-common-time-audit-focused-v2-20261009.xml`

## 下一步

本轮回放和最终审计已完成。中心的时间误差可分辨性、单独的空间/区域
约束收敛及更长窗口仍是未关闭门槛。延长时间或改变初值/网格都必须另立前瞻合同，
记录它与本问题的关系及资源预算；不能降低原测量下限或把本次unresolved改为passed。
原生后端若用于扩大可算范围，也必须验证与这个具体方法的阶段/状态/诊断一致性，
不能沿用旧native分支的验收结论。

没有修改求解器方程、旧native、app、美术或live；所有物理、边界、AMR、黑洞、波形、
GPU准入仍false，`temporal_order_validated=false`，`scientificPayloadWriteback=false`。
C>=3GiB、E>=4GiB+32MiB的用户底线保持不变。最终审计后的只读磁盘快照：
C约8.09GiB、E约14.92GiB；这不是未来批次的空间保证，每批仍须重新检查。
总goal仍在推进，未完成。
