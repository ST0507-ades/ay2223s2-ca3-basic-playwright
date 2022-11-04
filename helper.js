const { expect } = require('@playwright/test');
import { alphabets, defaultNumberOfModules, grades, isBulkRetrieve } from './commons';

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


function generateModuleCodeCreditGrades(numberOfModules = defaultNumberOfModules, prefixCharacters = alphabets) {
    const moduleCodes = randomModuleCodes(generatePrefix(prefixCharacters, 5), numberOfModules);
    const moduleCredits = moduleCodes.map(() => randomInt(2, 7));
    const moduleGrades = Array(5).fill('').map(() => moduleCodes.map(() => grades[randomInt(0, grades.length)]));
    return { moduleCodes, moduleCredits, moduleGrades };
}

async function fillModules(page, moduleCodes) {
    await page.goto('/retrieve');
    for (let i = 0; i < moduleCodes.length; i++) {
        const module = moduleCodes[i];
        await page.locator('input[name=code]').fill(module);
        await page.locator('button[type=submit]').click();
    }
    page.setDefaultTimeout(3000);

    let moduleFetchResponses;
    if (isBulkRetrieve) {
        moduleFetchResponses = [page.waitForResponse(function (response) {
            const url = new URL(response.request().url());
            const isBulkPath = url.pathname === "/modules/bulk";
            const isCorrectCodes = JSON.stringify(url.searchParams.get('codes').split(',').sort()) === JSON.stringify(moduleCodes.sort());
            return isBulkPath && isCorrectCodes;
        })];
    } else {
        moduleFetchResponses = moduleCodes.map((module) => page.waitForResponse(`**/${module}`));

    }

    const responses = await Promise.all([
        ...moduleFetchResponses,
        page.locator('#retrieve').click()
    ]);
    return responses;
}


async function testRetrievedModule(page, moduleCodes, moduleCredits) {
    const responses = await fillModules(page, moduleCodes);
    if (isBulkRetrieve) {
        const response = responses[0];
        const json = await response.json();
        for (let i = 0; i < moduleCodes.length; i++) {
            const code = moduleCodes[i];
            const row = json[code];
            expect(row).toBeTruthy();
            expect(row.code).toEqual(code);
            expect(+row.credit).toEqual(moduleCredits[i]);
        }
    } else {
        for (let i = 0; i < moduleCodes.length; i++) {
            const response = responses[i];
            await expect(response.ok()).toBeTruthy();
            const json = await response.json();
            await expect(json.module.code).toEqual(moduleCodes[i]);
            await expect(+json.module.credit).toEqual(moduleCredits[i]);
        }
    }
}

export { generateModuleCodeCreditGrades, fillModules, testRetrievedModule };