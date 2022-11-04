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

const defaultNumberOfModules = 4;
const alphabets = 'abcdefghijklmnopqrstuvwxyz'.split('');

function generateModuleCodeCreditGrades(numberOfModules = defaultNumberOfModules) {
    const moduleCodes = randomModuleCodes(generatePrefix(alphabets, 5), numberOfModules);
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
    const responses = await Promise.all([
        ...moduleCodes.map((module) => page.waitForResponse(`**/${module}`)),
        page.locator('#retrieve').click()
    ]);
    return responses;
}

export { generateModuleCodeCreditGrades, fillModules };