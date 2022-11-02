const { test, expect } = require('@playwright/test');

const grades = Array(9).fill('').map((_, index) => index * 0.5);

function randomModuleCodes(prefix, count) {
  const arr = [];
  for (let i = 0; i < count; i++) {
    arr.push(`${prefix}${String(i + 1).padStart(4, '0')}`);
  }
  return arr;
}
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min) + min);
}
function generatePrefix(selection, count) {
  const prefixArray = [];
  for (let i = 0; i < count; i++) {
    prefixArray.push(selection[randomInt(0, selection.length)]);
  }
  return prefixArray.join('');
}

const numberOfModules = 4;
const alphabets = 'abcdefghijklmnopqrstuvwxyz'.split('');
const moduleCodes = randomModuleCodes(generatePrefix(alphabets, 2), numberOfModules);
const moduleCredits = moduleCodes.map(() => randomInt(2, 7));
const moduleGrades = Array(5).fill('').map(() => moduleCodes.map(() => grades[randomInt(0, grades.length)]));

async function fillModules(page) {
  await page.goto('/retrieve');
  for (let i = 0; i < moduleCodes.length; i++) {
    const module = moduleCodes[i];
    await page.locator('input[name=code]').fill(module);
    await page.locator('button[type=submit]').click();
  }
  const responses = await Promise.all([
    ...moduleCodes.map((module) => page.waitForResponse(`**/${module}`)),
    page.locator('#retrieve').click()
  ]);
  return responses;
}

test.describe("Calculate GPA", async function () {
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

  test("Should Retrieve Modules", async function ({ page }) {
    const responses = await fillModules(page);
    for (let i = 0; i < moduleCodes.length; i++) {
      const response = responses[i];
      await expect(response.ok()).toBeTruthy();
      const json = await response.json();
      await expect(json.module.code).toEqual(moduleCodes[i]);
      await expect(+json.module.credit).toEqual(moduleCredits[i]);
    }
  });

  test('Should be 4 for all A', async function ({ page }) {
    await fillModules(page);
    for (let i = 0; i < moduleCodes.length; i++) {
      page.locator(`tbody > tr:nth-of-type(${i + 1}) select`).selectOption('4');
    }
    await page.locator('#gpa button').click();
    await expect(+await page.locator('#gpa span').textContent()).toEqual(4);
  });

  test('Should be 0 for all F', async function ({ page }) {
    await fillModules(page);
    for (let i = 0; i < moduleCodes.length; i++) {
      page.locator(`tbody > tr:nth-of-type(${i + 1}) select`).selectOption('0');
    }
    await page.locator('#gpa button').click();
    await expect(+await page.locator('#gpa span').textContent()).toEqual(0);
  });

  test('Should compute correctly', async function ({ page }) {
    await fillModules(page);
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
    const responses = await fillModules(page);
    for (let i = 0; i < moduleCodes.length; i++) {
      const response = responses[i];
      await expect(response.ok()).toBeTruthy();
      const json = await response.json();
      await expect(json.module.code).toEqual(moduleCodes[i]);
      await expect(+json.module.credit).toEqual(moduleCredits[i] + 1);
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
    const responses = await fillModules(page);
    for (let i = 0; i < moduleCodes.length; i++) {
      const response = responses[i];
      await expect(response.status()).toEqual(404);
    }
  });
});
