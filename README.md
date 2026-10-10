# DLSCA Academy

**[在线学习 DLSCA Academy](https://lnn-femsca-artifact.github.io/dlsca-academy/)**

**从完全零基础开始，理解 AES、侧信道泄漏、PoI 选择与深度学习密钥恢复。**

DLSCA Academy 不是把论文公式放进网页的幻灯片。它是一套可扩展的**中文交互式教材 + 可验证实验**：按认知依赖顺序讲清每一步“是什么、为什么、怎么做、有哪些限制”，再让学习者亲自改变输入、观察真实计算结果。

> **基线版本 v0.1 · 第一批可运行教学闭环（非最终课程）**：已提供 12 章知识地图、9 篇初版正文及测验、AES-128 运算实验、合成泄漏与 PoI 方法比较、256 候选密钥概率评分实验。尚未接入公开真实 Trace 的深度学习训练工作台，不应把内置似然模拟器称为已训练的 DLSCA 神经网络。


## v0.2 · 从演示页到零基础的因果教学（新）

本阶段正视原版内容过于简略、只靠单项选择题检查“学会”的缺陷。**首页主入口现在是 17 站渐进式学习**，从加密为什么存在、bit/byte/XOR、AES 与 SBox 可逆，到 Trace、已知密钥建模、ID/HW/HD、PoI、模型训练损失、候选密钥和 Rank，保留贯穿全程的“已知/未知”面板。每站先展示故事与数字演示，再打开三层解释和错误反例，测验答对才能记录通过。

课程地图中 **12 章都已开放讲义**，每章包含三道独立解释原因的开放式题目、参考推导和反例，以及一项章末检查。取消课程目录中的无条件“标记已理解”。AES、PoI、Attack 实验分别提供初次操作引导；PoI 新增从两组采样数值推导 SNR 与 NICV 的练习。

本版本仍属于**引导式教材的工程化升级，而非已经验证的完整自学认证系统**。开放题质量没有自动评分；真实 CNN 训练/公开 ASCAD 实验尚待实现。详细可复核的教学质量与新手评估标准见 [docs/PEDAGOGY.md](docs/PEDAGOGY.md)。

## 目前可以做什么？

| 页面 | 用户操作 | 计算真实性和限制 |
|---|---|---|
| 完整课程 | 从 bit、XOR、AES、SCA、标签与 PoI 逐步阅读；答题；保存学习进度 | 12 章路线，9 篇初版正文；更深的进阶内容待扩写 |
| AES 逐步实验 | 输入 128-bit 明文与密钥，逐步执行 AES 10 轮；修改字节查看 SBox / HW / 逆运算 | 真实 AES-128 纯 TypeScript 实现，NIST 标准向量校验 |
| Trace / PoI | 调整噪声、错位和截取窗口；切换 SNR、NICV、Fixed/Random TVLA、Pearson 相关性 | **合成迹线**，使用已知标签计算的统计量；不是物理测量 |
| 密钥恢复 | 切换 ID/HW 模型、增加 Trace、查看各候选 log 评分和正确密钥 Rank | **高斯似然教学模型**，不含训练过的神经网络，真实候选评分与累积计算 |
| 概念自测 | 回答 6 个易错问题后展开解释 | 反向讲解练习，非正式认证 |

## 本地运行

需要 Node.js 20+、npm 和网络访问以获取 npm 依赖。

```bash
npm install
npm run dev
```

浏览器打开终端显示的本地地址（通常是 `http://localhost:5173`）。

```bash
npm run test
npm run build
```

当前仓库尚未生成 lockfile（运行环境无法联网安装依赖）；CI 暂使用 `npm install`。首次联网安装后应提交 lockfile 并将 CI 改成 `npm ci`。

GitHub Pages 部署采用 `GITHUB_PAGES=true npm run build`，见 `.github/workflows/deploy.yml`。仓库 Pages 需要设置 **Build and deployment → Source → GitHub Actions**。该环境若不支持 Pages 或 Actions，仍可使用 `npm run dev` 本地运行。

## 设计原则

1. **数学必须可检验**：AES、标签、评分、统计计算都能找到源码和测试；不能用写死的“攻击成功动画”冒充计算。
2. **严格区分真实与合成**：玩具高斯似然模拟器不是 DNN；合成 Trace 不是物理采集。
3. **严格区分建模与攻击**：攻击程序不能读取目标设备的真实密钥作为模型输入、PoI 监督标签或评分依据；模拟真值只供评估 Rank。
4. **初学者优先**：每个概念都说明“为什么需要”；优先提供可修改的字节示例，再过渡到抽象公式。
5. **科研严谨性**：TVLA 不自动识别 SBox；PoI 需要独立验证；单字节 Rank 0 不代表完整 AES-128 主密钥恢复。

## 目录结构

```text
src/
  content/         课程结构、章节讲义
  domain/          AES、合成泄漏、PoI 统计、候选密钥评分的纯函数与测试
  pages/           可交互教学页面
  components/      可复用图表
  App.tsx          导航、首页、课程学习与本地进度
  styles.css       响应式 UI 样式
docs/
  PRD.md           目标、用户故事、产品范围、验收标准
  CURRICULUM.md    知识依赖图、课程进度及教学验收
  SCIENCE.md       数学假设、边界、科研规范和引用
  ROADMAP.md       后续增量开发计划
  REVIEW.md        首批独立验证、待验证与远端权限阻碍
.github/workflows/  CI 与 GitHub Pages 部署
```

## 权威材料与参考

- NIST, [FIPS 197: Advanced Encryption Standard](https://csrc.nist.gov/pubs/fips/197/final)（2023 编辑更新，算法内容不变）
- ANSSI-FR, [ASCAD – Side Channels Analysis and Deep Learning](https://github.com/ANSSI-FR/ASCAD)
- ANSSI-FR, [ASCAD 固定密钥数据集说明](https://github.com/ANSSI-FR/ASCAD/blob/master/ATMEGA_AES_v1/ATM_AES_v1_fixed_key/Readme.md)

具体科研约定详见 [`docs/SCIENCE.md`](docs/SCIENCE.md)。

## 参与和审查

功能变更通过分支和 PR 审查，禁止用不真实数据声称在未知真实设备上完成了密钥恢复。请在 PR 中报告：改动的教学目标、计算/公式依据、测试命令、模拟与真实数据边界、可能的误解。

本仓库仅用于防御研究、密码学与授权环境下的侧信道分析教学。尊重目标设备所有者与本地法律法规。

## 补充：轮次索引正确性

`src/domain/intermediates.ts` 实现第一轮 SBox 输出和最后轮逆 SBox 输入，并显式提供 `lastRoundSourceIndex`，避免忽略 ShiftRows 导致的密文字节位置映射。参考 `src/domain/intermediates.test.ts`。

完整发布验收清单见 `docs/RELEASE-CHECKLIST.md`。
