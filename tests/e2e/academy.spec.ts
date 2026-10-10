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
  await page.getByRole('button', { name: /下一步/ }).click();
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
