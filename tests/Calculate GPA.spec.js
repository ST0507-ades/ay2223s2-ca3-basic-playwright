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

test('Should be 4 for all A', async function ({ page }) {
  await fillModules(page, moduleCodes);
  for (let i = 0; i < moduleCodes.length; i++) {
    page.locator(`tbody > tr:nth-of-type(${i + 1}) select`).selectOption('4');
  }
  await page.locator('#gpa button').click();
  await expect(+await page.locator('#gpa span').textContent()).toEqual(4);
});

test('Should be 0 for all F', async function ({ page }) {
  await fillModules(page, moduleCodes);
  for (let i = 0; i < moduleCodes.length; i++) {
    page.locator(`tbody > tr:nth-of-type(${i + 1}) select`).selectOption('0');
  }
  await page.locator('#gpa button').click();
  await expect(+await page.locator('#gpa span').textContent()).toEqual(0);
});

test('Should compute correctly', async function ({ page }) {
  await fillModules(page, moduleCodes);
  for (let i = 0; i < moduleGrades.length; i++) {
    const grades = moduleGrades[i];
    for (let j = 0; j < moduleCodes.length; j++) {
      const grade = grades[j];
      page.locator(`tbody > tr:nth-of-type(${j + 1}) select`).selectOption(grade + '');
    }
    const expected = grades.map((grade, index) => grade * moduleCredits[index]).reduce((total, current) => total + current, 0) / moduleCredits.reduce((total, current) => total + current, 0);
    await page.locator('#gpa button').click();
    await page.screenshot({ fullPage: true, path: 'screenshot.png' });
    await expect((+await page.locator('#gpa span').textContent()).toFixed(2)).toEqual(expected.toFixed(2));
  }
});
