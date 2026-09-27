// End-to-end tests for the three web apps, driven like a visitor would: typing, clicking, switching language.
const { test, expect } = require('@playwright/test');
const path = require('path');

const url = (app) => 'file://' + path.resolve(__dirname, '..', app, 'index.html');

test.describe('Apron', () => {
    test('builds an order with real tax and a typed tip, in both number formats', async ({ page }) => {
        await page.goto(url('Apron'));
        await page.fill('#restaurantNameInput', 'Sabor Criollo');
        await page.keyboard.press('Enter');
        await expect(page).toHaveTitle(/Sabor Criollo/);

        await page.click('#add-1'); // Pizza Margherita 14,99
        await page.click('#add-3'); // Salmón a la Parrilla 24,99
        await page.locator('#taxRatePct').pressSequentially('8.875');
        await page.locator('#customTip').pressSequentially('1250');

        // 39,98 + 8,875 % (3,55) + 1.250 tip = 1.293,53
        await expect(page.locator('#subtotal')).toHaveText('$39,98');
        await expect(page.locator('#tax')).toHaveText('$3,55');
        await expect(page.locator('#customTip')).toHaveValue('1.250');
        await expect(page.locator('#total')).toHaveText('$1.293,53');

        await page.click('#langEn');
        await expect(page.locator('#total')).toHaveText('$1,293.53');
        await expect(page.locator('#customTip')).toHaveValue('1,250');
        await expect(page.locator('#cartList')).toContainText('Margherita Pizza'); // cart survives the switch
    });

    test('asks for a real phone number before confirming', async ({ page }) => {
        await page.goto(url('Apron'));
        await page.fill('#restaurantNameInput', 'Test');
        await page.keyboard.press('Enter');
        await page.click('#add-2');
        await page.fill('#custName', 'Ana');
        await page.fill('#custPhone', '123');
        await page.click('#confirmBtn');
        await expect(page.locator('#phoneError')).toBeVisible();
        await expect(page.locator('#orderModal')).not.toHaveClass(/show/);

        await page.fill('#custPhone', '(555) 123-4567');
        await page.click('#confirmBtn');
        await expect(page.locator('#orderModal')).toHaveClass(/show/);
    });
});

test.describe('Waypoint', () => {
    test('calculates the plan and keeps it after a reload', async ({ page }) => {
        await page.goto(url('Waypoint'));
        await page.fill('#userNameInput', 'Gabriel');
        await page.keyboard.press('Enter');

        await page.locator('#hourlyRate').pressSequentially('45.5');
        await page.locator('#hoursPerWeek').pressSequentially('40');
        await page.locator('#taxRate').pressSequentially('22.5');
        const expenses = page.locator('.expense-value');
        await expenses.nth(0).pressSequentially('1850'); // rent
        await expenses.nth(3).pressSequentially('600');  // food
        await page.click('.calc-btn');

        // 45,50 × 40 h × 52 weeks = 94.640 a year; net = 94.640 / 12 × (1 − 22,5 %)
        await expect(page.locator('#annualVal')).toHaveText('$94.640');
        await expect(page.locator('#netVal')).toHaveText('$6.112,17');
        await expect(page.locator('#expenseVal')).toHaveText('$2.450,00');
        await expect(page.locator('#savingsVal')).toHaveText('$3.662,17');

        await page.reload();
        await expect(page.locator('#savingsVal')).toHaveText('$3.662,17');
        await expect(expenses.nth(0)).toHaveValue('1.850');
    });

    test('warns when expenses are bigger than income', async ({ page }) => {
        await page.goto(url('Waypoint'));
        await page.fill('#userNameInput', 'Test');
        await page.keyboard.press('Enter');
        await page.locator('#hourlyRate').pressSequentially('10');
        await page.locator('#hoursPerWeek').pressSequentially('10');
        await page.locator('.expense-value').nth(0).pressSequentially('5000');
        await page.click('.calc-btn');
        await expect(page.locator('#savingsVal')).toHaveText(/^-\$/);
        await expect(page.locator('.alert-box')).toBeVisible();
    });
});

test.describe('Swap', () => {
    const RATES = { result: 'success', time_last_update_unix: 1790000000, rates: { USD: 1, EUR: 0.9, JPY: 150, GBP: 0.8 } };

    test('converts with the rates the API returns, never invented ones', async ({ page }) => {
        await page.route('**/open.er-api.com/**', (route) => route.fulfill({ json: RATES }));
        await page.goto(url('Swap'));
        await page.click('.welcome-btn'); // home currency USD → sends USD, receives EUR

        await expect(page.locator('#finalResult')).toHaveText('€90,00'); // default 100 USD × 0,9
        await page.fill('#amount', '');
        await page.locator('#amount').pressSequentially('1234567.89');
        await expect(page.locator('#amount')).toHaveValue('1.234.567,89');
        await expect(page.locator('#finalResult')).toHaveText('€1.111.111,10');

        // yen has no decimals
        await page.click('#toDropdown .ccy-trigger');
        await page.locator('#toSearch').pressSequentially('yen');
        await page.keyboard.press('Enter');
        await page.fill('#amount', '');
        await page.locator('#amount').pressSequentially('1000');
        await expect(page.locator('#finalResult')).toHaveText('¥150.000');
    });

    test('says so when there are no rates instead of guessing', async ({ page }) => {
        await page.route('**/open.er-api.com/**', (route) => route.abort());
        await page.goto(url('Swap'));
        await page.click('.welcome-btn');
        await expect(page.locator('#finalResult')).toHaveText('—');
        await expect(page.locator('#rateInfo')).toContainText('⟳');
    });
});
