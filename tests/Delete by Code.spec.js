const { test, expect } = require('@playwright/test');
const { fillModules, generateModuleCodeCreditGrades } = require('../helper');
const { moduleCodes, moduleCredits, moduleGrades } = generateModuleCodeCreditGrades();

test.beforeEach(async function ({ page }) {
  await page.goto('/create');
  for (let i = 0; i < moduleCodes.length; i++) {
    const module = moduleCodes[i];
    await page.locator('input[name=code]').fill(module);
    await page.locator('input[name=name]').fill(module);
    await page.locator('input[name=credit]').fill(moduleCredits[i] + '');
    await Promise.all([
      page.waitForResponse('**/modules'),
      page.locator('button[type=submit]').click()
    ]);
  }
});

test('Should send delete to server correctly', async function ({ page }) {
  await page.goto('/delete');
  for (let i = 0; i < moduleCodes.length; i++) {
    const module = moduleCodes[i];
    await page.locator('input[name=code]').fill(module);
    const [response] = await Promise.all([
      page.waitForResponse(`**/modules/${module}`),
      page.locator('button[type=submit]').click()
    ]);
    await expect(response.ok()).toBeTruthy();
  }
});

test("Should fail to retrieve deleted modules", async function ({ page }) {
  await page.goto('/delete');
  for (let i = 0; i < moduleCodes.length; i++) {
    const module = moduleCodes[i];
    await page.locator('input[name=code]').fill(module);
    const [response] = await Promise.all([
      page.waitForResponse(`**/modules/${module}`),
      page.locator('button[type=submit]').click()
    ]);
    await expect(response.ok()).toBeTruthy();
  }

  const responses = await fillModules(page, moduleCodes);
  for (let i = 0; i < moduleCodes.length; i++) {
    const response = responses[i];
    await expect(response.status()).toEqual(404);
  }
});

test('Should fail to delete module not in system', async function ({ page }) {
  await page.goto('/delete');
  const module = 'slkdfjslkdfjlskdjf';
  await page.locator('input[name=code]').fill(module);
  const [response] = await Promise.all([
    page.waitForResponse(`**/modules/${module}`),
    page.locator('button[type=submit]').click()
  ]);
  await expect(response.ok()).toBeFalsy();
});
