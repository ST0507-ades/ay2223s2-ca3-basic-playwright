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

test('Should send update to server correctly', async function ({ page }) {
  await page.goto('/update');
  for (let i = 0; i < moduleCodes.length; i++) {
    const module = moduleCodes[i];
    await page.locator('input[name=code]').fill(module);
    await page.locator('input[name=credit]').fill((moduleCredits[i] + 1) + '');
    const [response] = await Promise.all([
      page.waitForResponse(`**/modules/${module}`),
      page.locator('button[type=submit]').click()
    ]);
    await expect(response.ok()).toBeTruthy();
  }
});

test("Should retrieve updated modules correctly", async function ({ page }) {
  await page.goto('/update');
  for (let i = 0; i < moduleCodes.length; i++) {
    const module = moduleCodes[i];
    await page.locator('input[name=code]').fill(module);
    await page.locator('input[name=credit]').fill((moduleCredits[i] + 1) + '');
    const [response] = await Promise.all([
      page.waitForResponse(`**/modules/${module}`),
      page.locator('button[type=submit]').click()
    ]);
    await expect(response.ok()).toBeTruthy();
  }

  const responses = await fillModules(page, moduleCodes);
  for (let i = 0; i < moduleCodes.length; i++) {
    const response = responses[i];
    await expect(response.ok()).toBeTruthy();
    const json = await response.json();
    await expect(json.module.code).toEqual(moduleCodes[i]);
    await expect(+json.module.credit).toEqual(moduleCredits[i] + 1);
  }
});

test('Should fail update module not in system', async function ({ page }) {
  await page.goto('/update');
  const module = 'fsjfkjdslfjsdlfjsdljflsdj';
  await page.locator('input[name=code]').fill(module);
  await page.locator('input[name=credit]').fill('5');
  const [response] = await Promise.all([
    page.waitForResponse(`**/modules/${module}`),
    page.locator('button[type=submit]').click()
  ]);
  await expect(response.ok()).toBeFalsy();
});