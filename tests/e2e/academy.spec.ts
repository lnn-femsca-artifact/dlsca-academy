import { test, expect } from '@playwright/test';

test('首页加载，展示完整知识地图', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('从看不懂 AES');
  const nav = page.getByRole('navigation', { name: '课程导航' });
  if (await page.getByRole('button', { name: '打开导航' }).isVisible()) {
    await page.getByRole('button', { name: '打开导航' }).click();
  }
  await nav.getByRole('button', { name: /完整课程/ }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('完整知识地图');
  expect(errors).toEqual([]);
});

test('AES 演示计算真实 NIST 密文，并允许改变字节', async ({ page }) => {
  await page.goto('/');
  if (await page.getByRole('button', { name: '打开导航' }).isVisible()) {
    await page.getByRole('button', { name: '打开导航' }).click();
  }
  await page.getByRole('navigation', { name: '课程导航' }).getByRole('button', { name: /AES 逐步实验/ }).click();
  await expect(page.locator('.cipher-banner code')).toHaveText('69C4E0D86A7B0430D8CDB78070B4C55A');
  await expect(page.locator('.result-tile.tinted b')).toHaveText('63');
  await page.locator('.byte-inputs input').first().fill('2A');
  await expect(page.locator('.result-tile.tinted b')).toHaveText('7C');
  await page.locator('.step-pane').getByRole('button', { name: /下一步/ }).click();
  await expect(page.locator('.step-pane')).toBeVisible();
});

test('PoI 方法能切换，并标注为合成迹线', async ({ page }) => {
  await page.goto('/');
  if (await page.getByRole('button', { name: '打开导航' }).isVisible()) {
    await page.getByRole('button', { name: '打开导航' }).click();
  }
  await page.getByRole('navigation', { name: '课程导航' }).getByRole('button', { name: /Trace \/ PoI 实验/ }).click();
  await expect(page.locator('.disclaimer')).toContainText('实时合成');
  await page.getByRole('button', { name: 'TVLA', exact: true }).click();
  await expect(page.locator('.method-explainer')).toContainText('固定/随机');
  await page.getByRole('button', { name: 'NICV', exact: true }).click();
  await expect(page.locator('.method-explainer')).toContainText('NICV');
  await expect(page.locator('.stats-row strong').first()).toBeVisible();
});

test('攻击累积 256 候选，并清晰标注不是训练网络', async ({ page }) => {
  await page.goto('/');
  if (await page.getByRole('button', { name: '打开导航' }).isVisible()) {
    await page.getByRole('button', { name: '打开导航' }).click();
  }
  await page.getByRole('navigation', { name: '课程导航' }).getByRole('button', { name: /密钥恢复实验/ }).click();
  await expect(page.locator('.disclaimer')).toContainText('不是已经训练完成的深度神经网络');
  await page.getByRole('button', { name: /使用全部 220 条/ }).click();
  await expect(page.locator('.leader-row')).toHaveCount(6);
  await page.getByRole('button', { name: /揭示模拟器中的真实密钥/ }).click();
  await expect(page.locator('.answer-banner')).toContainText('0x2B');
  await page.getByRole('button', { name: 'HW · 9 类' }).click();
  await expect(page.locator('.attack-route.blue-route')).toContainText('9 类');
});

test('移动端导航与内容不会产生全局水平溢出', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes('mobile'), '只验证移动端');
  await page.goto('/');
  await expect(page.getByRole('button', { name: '打开导航' })).toBeVisible();
  await page.getByRole('button', { name: '打开导航' }).click();
  await expect(page.getByRole('navigation', { name: '课程导航' })).toBeVisible();
  await page.getByRole('navigation', { name: '课程导航' }).getByRole('button', { name: /AES 逐步实验/ }).click();
  await expect(page.locator('.cipher-banner code')).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(2);
});

test('零基础引导：必须先看故事和为什么，答对问题才记录学习进度', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button',{name:/从零开始 · 17 站引导/}).click();
  await expect(page.getByRole('heading',{name:'有人把一封信放进了上锁的盒子'})).toBeVisible();
  await expect(page.locator('.journey-known')).toContainText('目标设备的密钥 K');
  await page.getByRole('button',{name:/明白，接着发生了什么/}).click();
  await page.getByRole('button',{name:/明白，接着发生了什么/}).click();
  await page.getByRole('button',{name:/逐层展开完整原因/}).click();
  await expect(page.locator('.journey-cause')).toHaveCount(3);
  await page.getByRole('button',{name:/AES 的加密算法/}).click();
  await expect(page.locator('.journey-feedback')).toContainText('算法按照公开标准');
  await expect(page.locator('.journey-progress')).toContainText('0 / 17');
  await page.locator('.journey-options').getByRole('button',{name:/目标设备的密钥 K/}).click();
  await expect(page.locator('.journey-feedback.good')).toContainText('正确');
  await expect(page.locator('.journey-progress')).toContainText('1 / 17');
  await page.getByRole('button',{name:/进入下一站/}).click();
  await expect(page.getByRole('heading',{name:'先不谈 AES：计算机只有 0 和 1'})).toBeVisible();
});

test('深度讲义：要求三次自由解释和测验，不再能无条件标记掌握', async ({ page }) => {
  await page.goto('/');
  if (await page.getByRole('button',{name:'打开导航'}).isVisible()) await page.getByRole('button',{name:'打开导航'}).click();
  await page.getByRole('navigation',{name:'课程导航'}).getByRole('button',{name:/完整课程/}).click();
  await page.locator('.course-row').filter({hasText:'CNN 与深度学习模型'}).locator('.course-heading').click();
  await page.locator('.course-row').filter({hasText:'CNN 与深度学习模型'}).getByRole('button',{name:/阅读完整讲义/}).click();
  await expect(page.getByRole('heading',{name:'CNN 与深度学习模型'})).toBeVisible();
  await expect(page.locator('.deep-section')).toHaveCount(3);
  await expect(page.getByRole('button',{name:/请先完成三道开放题并答对测验/})).toBeDisabled();
  const first=page.locator('.deep-section').first();
  await first.getByRole('button',{name:/这一段明白了/}).click();
  await first.getByRole('button',{name:/这一段明白了/}).click();
  await first.locator('textarea').fill('已知参考密钥时可以通过变化明文得到变化的中间值作为分类标签，而不能把固定密钥当成全部标签。');
  await first.getByRole('button',{name:/我已独立思考/}).click();
  await expect(first.locator('.deep-answer')).toContainText('推导');
  await expect(page.locator('.deep-station-summary')).toContainText('1 / 3');
});

test('PoI 原理实验：能够从分组数字推导 SNR 和 NICV', async ({ page }) => {
  await page.goto('/');
  if (await page.getByRole('button',{name:'打开导航'}).isVisible()) await page.getByRole('button',{name:'打开导航'}).click();
  await page.getByRole('navigation',{name:'课程导航'}).getByRole('button',{name:/Trace \/ PoI 实验/}).click();
  await expect(page.getByRole('heading',{name:'为什么最大波形不等于最佳 PoI？'})).toBeVisible();
  await page.locator('.poi-evidence .poi-choose').first().getByRole('button',{name:/#224/}).click();
  await page.locator('.poi-evidence').getByRole('button',{name:/展开 SNR 与 NICV/}).click();
  await expect(page.locator('.poi-derivation')).toContainText('组内');
  await expect(page.locator('.poi-derivation')).toContainText('NICV');
});

test('PoI 不止比较峰值：可运行选点与独立验证的对照表', async ({ page }) => {
  await page.goto('/');
  if (await page.getByRole('button',{name:'打开导航'}).isVisible()) await page.getByRole('button',{name:'打开导航'}).click();
  await page.getByRole('navigation',{name:'课程导航'}).getByRole('button',{name:/Trace \/ PoI 实验/}).click();
  await page.getByRole('button',{name:'开始独立窗口验证'}).click();
  await expect(page.locator('.poi-validation-table tbody tr')).toHaveCount(6);
  await expect(page.locator('.poi-validation-table')).toContainText('随机窗口基线');
  await expect(page.locator('.poi-validation-table')).toContainText('无关峰基线');
  await expect(page.locator('.poi-validation-warning')).toContainText('不是 CNN/LNN');
});
