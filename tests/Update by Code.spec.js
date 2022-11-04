const { test, expect } = require('@playwright/test');
const { fillModules, generateModuleCodeCreditGrades, testRetrievedModule } = require('../helper');
const { moduleCodes, moduleCredits, moduleGrades } = generateModuleCodeCreditGrades();

function isUpdateResponse(module) {
  return function (response) {
    return [`/modules`, `/${module}`].every((p) => response.request().url().includes(p)) && response.request().method() === "PUT";
  };
}

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
      page.waitForResponse(isUpdateResponse(module)),
      page.locator('button[type=submit]').click()
    ]);
    await expect(response.ok()).toBeTruthy();
  }
});

test("Should retrieve updated modules correctly", async function ({ page }) {
  await page.goto('/update');
  const updatedModuleCredit = [];
  for (let i = 0; i < moduleCodes.length; i++) {
    const module = moduleCodes[i];
    const newCredit = moduleCredits[i] + 1;
    await page.locator('input[name=code]').fill(module);
    await page.locator('input[name=credit]').fill(newCredit + '');
    const [response] = await Promise.all([
      page.waitForResponse(isUpdateResponse(module)),
      page.locator('button[type=submit]').click()
    ]);
    await expect(response.ok()).toBeTruthy();
    updatedModuleCredit[i] = newCredit;
  }

  await testRetrievedModule(page, moduleCodes, updatedModuleCredit);
});

test('Should fail update module not in system', async function ({ page }) {
  await page.goto('/update');
  const module = 'fsjfkjdslfjsdlfjsdljflsdj';
  await page.locator('input[name=code]').fill(module);
  await page.locator('input[name=credit]').fill('5');
  const [response] = await Promise.all([
    page.waitForResponse(isUpdateResponse(module)),
    page.locator('button[type=submit]').click()
  ]);
  await expect(response.ok()).toBeFalsy();
});