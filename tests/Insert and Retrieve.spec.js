const { test, expect } = require('@playwright/test');
const { generateModuleCodeCreditGrades, testRetrievedModule } = require('../helper');
const { moduleCodes, moduleCredits, moduleGrades } = generateModuleCodeCreditGrades();

test("Should add module", async function ({ page }) {
  await page.goto('/create');
  for (let i = 0; i < moduleCodes.length; i++) {
    const module = moduleCodes[i];
    await page.locator('input[name=code]').fill(module);
    await page.locator('input[name=name]').fill(module);
    await page.locator('input[name=credit]').fill(moduleCredits[i] + '');
    const [response] = await Promise.all([
      page.waitForResponse('**/modules'),
      page.locator('button[type=submit]').click()
    ]);
    await expect(response.ok()).toBeTruthy();
  }
});

test("Should Retrieve Inserted Modules", async function ({ page }) {
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
  await testRetrievedModule(page, moduleCodes, moduleCredits);
});
