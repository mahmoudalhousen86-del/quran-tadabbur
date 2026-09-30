import { chromium } from 'playwright-core';

const browser = await chromium.launch({
  executablePath: '/usr/local/bin/google-chrome',
  headless: true,
  args: ['--no-sandbox', '--disable-gpu'],
});
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });

const title = await page.locator('h1').first().textContent();
console.log('Brand:', title);

const outBtns = page.locator('button', { hasText: 'انصراف' });
const outCount = await outBtns.count();
console.log('Checkout buttons:', outCount);

if (outCount > 0) {
  await outBtns.first().click();
  await page.waitForTimeout(500);
  const flash = await page.locator('.flash').count();
  console.log('Flash after checkout:', flash);
  if (flash) console.log('Flash text:', await page.locator('.flash').textContent());
}

await page.locator('button.nav-btn', { hasText: 'الرواتب' }).click();
await page.waitForTimeout(400);
console.log('Payroll heading:', await page.locator('h2').first().textContent());

const detailBtns = page.locator('button', { hasText: 'تفاصيل' });
console.log('Detail buttons:', await detailBtns.count());
if ((await detailBtns.count()) > 0) {
  await detailBtns.first().click();
  await page.waitForTimeout(400);
  const modal = await page.locator('.modal').count();
  console.log('Modal open:', modal);
  if (modal) console.log('Modal title:', await page.locator('.modal h3').textContent());
  await page.screenshot({ path: '/opt/cursor/artifacts/screenshots/payslip_modal.png' });
}

const nets = await page.locator('table tbody tr td strong').allTextContents();
console.log('Net samples:', nets.slice(0, 5));

await page.screenshot({ path: '/opt/cursor/artifacts/screenshots/payroll_fixed.png', fullPage: true });
await browser.close();
console.log('DONE');
