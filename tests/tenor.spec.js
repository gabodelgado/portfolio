// Tenor: loan math checked against the standard amortization formula.
const { test, expect } = require('@playwright/test');
const path = require('path');

const url = 'file://' + path.resolve(__dirname, '..', 'Tenor', 'index.html');

test('a 30-year mortgage matches the standard formula, and extra payments show the savings', async ({ page }) => {
    await page.goto(url);
    await page.click('.goal >> nth=0'); // home → suggests 30 years
    await expect(page.locator('#term')).toHaveValue('30');

    await page.locator('#amount').pressSequentially('200000');
    await page.locator('#rate').pressSequentially('6.5');
    await expect(page.locator('#amount')).toHaveValue('200.000');

    // 200.000 at 6,5 % over 360 months
    await expect(page.locator('#payment')).toHaveText('$1.264,14');
    await expect(page.locator('#totalInterest')).toHaveText('$255.088,98');
    await expect(page.locator('#totalPaid')).toHaveText('$455.088,98');

    // +200 a month: done in 250 payments instead of 360 (9 years 2 months sooner), 90.076,78 less interest
    await page.locator('#extra').pressSequentially('200');
    await expect(page.locator('#savings')).toContainText('9 años y 2 meses');
    await expect(page.locator('#savings')).toContainText('$90.076,78');
    await expect(page.locator('#totalInterest')).toHaveText('$165.012,20');

    await page.click('#viewMonthly');
    await expect(page.locator('#schedule tbody tr')).toHaveCount(250);

    await page.click('.lang-btn[data-lang="en"] >> nth=1');
    await expect(page.locator('#payment')).toHaveText('$1,264.14');
    await expect(page.locator('#savings')).toContainText('9 years and 2 months');

    await page.reload();
    await expect(page.locator('#payment')).toHaveText('$1,264.14');
});

test('a 0 % loan is just the amount split evenly', async ({ page }) => {
    await page.goto(url);
    await page.click('.goal >> nth=1'); // car → 5 years
    await page.locator('#amount').pressSequentially('12000');
    await page.locator('#rate').pressSequentially('0');
    await expect(page.locator('#payment')).toHaveText('$200,00');
    await expect(page.locator('#totalInterest')).toHaveText('$0,00');
});

test('downloads the schedule as CSV', async ({ page }) => {
    await page.goto(url);
    await page.click('.goal >> nth=3');
    await page.locator('#amount').pressSequentially('5000');
    await page.locator('#rate').pressSequentially('10');
    const download = page.waitForEvent('download');
    await page.click('.csv-btn');
    const file = await download;
    const text = require('fs').readFileSync(await file.path(), 'utf8');
    expect(text.trim().split('\n')).toHaveLength(1 + 36);
});
