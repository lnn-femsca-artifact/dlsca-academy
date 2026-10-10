# v0.1 审查记录与当前证据

## 已完成的确定性验证

| 检查 | 方法 | 结果 |
|---|---|---|
| AES SBox | 256 种输出互不重复、0x00→0x63、0x01→0x7C、逆向查找 | 通过 |
| AES 加密 | NIST FIPS 197 Appendix B: P=001122...FF, K=000102...0F | 输出 `69C4E0D86A7B0430D8CDB78070B4C55A`，通过 |
| 第一轮 SubBytes | 同一 NIST 测试向量 | 输出 `63CAB7040953D051CD60E0E7BA70E18C`，通过 |
| 泄漏模拟可复现 | 固定 PRNG seed 生成两次相同样本 | 通过 |
| PoI 统计 | 4 种指标 256 个采样值都有限 | 通过 |
| 合成 HW 泄漏定位 | 噪声 0.4、无错位、random=256 | `|r|` 峰值在 84，距离注入中心 83 为 1，符合预期 |
| 候选评分 | ID 模式，噪声 0.5，220 条 Trace | 正确密钥排名 0，通过 |
| 候选评分 | HW 模式，噪声 0.7，220 条 Trace | 正确密钥排名 0，通过 |
| TypeScript 域逻辑 | `tsc --noEmit`，严格模式验证 domain/content 核心 | 通过 |
| TS/TSX 语法 | TypeScript Parser 对所有 TS/TSX 源文件做语法扫描 | 通过 |

上述计算使用 Node v22 自带实验性 TypeScript 去类型运行功能进行独立 smoke check；仓库还提供 Vitest 单元测试。

## 尚未完成的核查

- **完整 npm install / Vitest / Vite build：未完成。** 当前执行容器不能解析 `registry.npmjs.org`，依赖无法下载。GitHub Actions 有网络后应验证所有工作流。
- **实际浏览器 E2E / 截图：未完成。** 需要联网环境安装依赖后使用浏览器测试，避免将仅静态审阅误写为浏览器通过。
- **公开真实数据/训练过的深度学习模型：未接入。** 前端中明确告知合成和玩具似然的边界。
- **GitHub 远端提交：未完成。** GitHub 集成在当前会话具有只读能力，但在 `create_file` 与 `create_blob` 都返回 HTTP 403 `Resource not accessible by integration`。须修复安装和 contents write 授权后再通过 PR 提交。

## v0.1 合并前核查事项

- [ ] `npm install` 后提交 `package-lock.json`，将 CI 恢复为 `npm ci` 和 npm cache。
- [ ] 在 CI 上运行 `npm run test && npm run build`。
- [ ] 浏览器实际检查桌面和移动端导航、数据输入和图表显示。
- [ ] 概念文本经过至少一次独立学术审读和一组零基础试用者盲测。
- [ ] GitHub Pages 正式发布前确认仓库设置已启用 Pages → GitHub Actions。
