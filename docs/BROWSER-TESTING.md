# 浏览器 E2E 验收

本项目除了 Vitest 的密码学/统计单元测试，还使用 Playwright 在**真实 Chromium 浏览器**中检查关键教学工作流。

覆盖：首页与课程、NIST AES 密文与字节变更、PoI 统计标签、ID/HW 密钥排名界面、窄屏菜单与水平溢出检查。桌面和 390px 手机视口分别执行。

运行方式：

```bash
npm install
npx playwright install chromium
npm run test:e2e
```

CI 将在 PR 和 main push 自动运行 `Browser E2E`。失败时保留浏览器截屏/trace 作为诊断资料。

注意：浏览器测试不能代替真实物理 Trace 采集、学术内容外部专家审查或零基础学生的可用性实验，也不能保证所有机型响应式均正确。
