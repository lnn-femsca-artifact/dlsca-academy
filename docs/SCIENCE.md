# 数学、数据与科研严谨性审查说明

## 1. AES 与术语

AES 实现以 [NIST FIPS 197 (2023)](https://csrc.nist.gov/pubs/fips/197/final) 为准。此版本仅实现 AES-128 加密，状态矩阵按 `state[row+4*column]` 索引。明文/密钥 128 bit = 16 bytes；SBox 是 8-bit 可逆置换。加密结果对照 FIPS Appendix B 测试向量。

第一轮字节敏感值：`V_i = SBox(P_i,j XOR K_0,j)`。末轮（在正确处理 ShiftRows 位置关系前提下）可针对相应 SBox 输入构造 `InvSBox(C_i,j XOR K_10,j)`。末轮密钥是 128 bit；单个字节的 Rank 0 不等于完整主密钥恢复。

## 2. 合成 Trace 模型

`src/domain/leakage.ts` 提供确定性 PRNG（仅为教学复现实验，不用于安全随机数），按已知固定密钥 `0x2B`、公开明文字节计算 AES 第一轮 SBox 值。观测序列包括：

- 在采样点约 83 周围的 HW 相关高斯脉冲；
- 在采样点约 164 周围的 bit-specific 高斯脉冲；
- 在采样点约 224 周围与目标标签无关的活动；
- 随机高斯噪声、可调时间错位。

这些都是**人为设计的数学信号**，不是示波器测量，也不是从 ASCAD 得到的真实样本。

## 3. PoI 指标

在已知建模密钥的 **random 明文迹线**中，标签 Y 使用第一轮 `HW(SBox(P XOR K))`。对每个时间位置 t：

- `SNR(t) = Var(E[T_t|Y]) / E[Var(T_t|Y])]`，实现中按样本组均值和组内平方差估计。
- `NICV(t) = Var(E[T_t|Y]) / Var(T_t)`。
- `|corr(t)|` 为 HW 标签与采样值绝对 Pearson 相关系数，并非对未知密钥枚举的 CPA 成功报告。
- `TVLA(t)` 在 fixed plaintext 与 random plaintext 两组之间使用 Welch t 统计量的绝对值。它检测分组统计差异，不等同于目标 SBox 泄漏的位置标记或最佳攻击窗口。

为初学者简化了显著性、多重比较、置信区间以及类别稀疏性问题；高级版本应补充这些统计讨论，并增加独立验证集上的实际攻击评价。前端显示的 TVLA 标签不应暗示固定阈值即能自动确定 PoI。

## 4. 教学密钥恢复模型

`src/domain/attack.ts` 采用固定真实子密钥 `0x2B` 生成数据（只用于评价 Rank），每次随机改变明文字节。根据敏感中间值生成一个**一维、人工规定的似然观测**：`x = μ(V) + noise`。

ID 模式在 256 个候选类别上计算 `exp(-(x-μ(V))²/(2σ²))` 并归一化；HW 模式在 9 个 HW 类别上计算同类似然，并使用 binomial(8,1/2) 类别先验。它**不是经过训练的神经网络模型**。实际模型可以换成真实神经网络输出的类别概率，后续候选评分不需改变。

对每条公开明文 `P_i`、所有候选字节 `k∈[0,255]`，计算 `V_i(k)=SBox(P_i XOR k)`，取 `label(V_i(k))` 的预测概率，按 `S_n(k)=Σ_i log p_i[label(V_i(k))]` 累加。真实目标字节 **仅用于** `Rank_n = # { k : S_n(k)>S_n(K*) }`，不参与候选评分。该实验是概率评分流程的透明演示，不能报告为“训练了 CNN 并恢复未知真实设备密钥”。

严格的“预测概率就是密钥后验概率”需要额外先验、校准与独立性假设，这里不作保证。

## 5. 数据划分与评估

构建真实研究时应先固定 Profiling/Validation/Attack 的定义，不能在最终攻击数据上依照真实标签反复调整 PoI、模型超参数、特征标准化或阈值后再报告无偏攻击性能。重复随机攻击迹线顺序进行 GE/PGE 计算时必须记录随机种子、重复次数、rank 起点、是否对最后成功进行稳定性约束。

## 6. 外部参考

- [NIST AES FIPS 197](https://csrc.nist.gov/pubs/fips/197/final)
- [ANSSI-FR / ASCAD](https://github.com/ANSSI-FR/ASCAD) 及其 [固定密钥数据集说明](https://github.com/ANSSI-FR/ASCAD/blob/master/ATMEGA_AES_v1/ATM_AES_v1_fixed_key/Readme.md)

文档只转述标准概念和对实现的明确限定，实际应用请参阅原始论文与数据集文档。
