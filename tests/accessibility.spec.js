// Accessibility: every page is checked against WCAG 2.1 A/AA with axe (the engine behind Lighthouse's audit),
// on its first screen and, where there is one, on the main screen after onboarding.
const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const path = require('path');

const file = (p) => 'file://' + path.resolve(__dirname, '..', p);

async function audit(page){
    // measure the settled page, not a button halfway through its color transition
    await page.addStyleTag({ content: '*, *::before, *::after { transition: none !important; animation: none !important; }' });
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    const summary = results.violations.map((v) => v.id + ': ' + v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(', '));
    expect(summary).toEqual([]);
}

const pages = [
    ['portfolio home', 'index.html', null],
    ['Apron', 'Apron/index.html', async (page) => { await page.fill('#restaurantNameInput', 'Test'); await page.keyboard.press('Enter'); }],
    ['Waypoint', 'Waypoint/index.html', async (page) => { await page.fill('#userNameInput', 'Test'); await page.keyboard.press('Enter'); }],
    ['Swap', 'Swap/index.html', async (page) => { await page.click('.welcome-btn'); }],
    ['Tenor', 'Tenor/index.html', async (page) => { await page.click('.goal'); }],
    ['Volley', 'Volley/web/index.html', null],
    ['Keystroke', 'Keystroke/web/index.html', async (page) => { await page.fill('#nameInput', 'Test'); await page.keyboard.press('Enter'); }],
    ['Nine', 'Nine/web/index.html', null],
];

for (const [name, p, next] of pages) {
    test(name + ' meets WCAG AA', async ({ page }) => {
        await page.route('**/open.er-api.com/**', (route) => route.abort()); // Swap works offline too
        await page.goto(file(p));
        await audit(page);
        if (next) {
            await next(page);
            await audit(page);
        }
    });
}

// Screens full of results, not just the first view
test('filled-in screens meet WCAG AA', async ({ page }) => {
    await page.goto(file('Tenor/index.html'));
    await page.click('.goal');
    await page.locator('#amount').pressSequentially('200000');
    await page.locator('#rate').pressSequentially('6.5');
    await page.locator('#extra').pressSequentially('200');
    await audit(page);

    await page.goto(file('Waypoint/index.html'));
    await page.fill('#userNameInput', 'Test');
    await page.keyboard.press('Enter');
    await page.locator('#hourlyRate').pressSequentially('30');
    await page.locator('#hoursPerWeek').pressSequentially('40');
    await page.locator('#savingsGoal').pressSequentially('5000');
    await page.click('.calc-btn');
    await audit(page);

    await page.goto(file('Apron/index.html'));
    await page.fill('#restaurantNameInput', 'Test');
    await page.keyboard.press('Enter');
    await page.click('#add-1');
    await page.fill('#custName', 'Ana');
    await page.fill('#custPhone', '5551234567');
    await page.click('#confirmBtn');
    await audit(page);
});

test('the Kitchen board meets WCAG AA', async ({ page, request }) => {
    await request.post('http://127.0.0.1:8765/api/orders', { data: {
        type: 'delivery', customer: { name: 'Ana', phone: '5551234567', address: 'Calle 8' },
        items: [{ id: 1, qty: 2 }], tax_rate_pct: 8.875, note: 'Sin cebolla',
    } });
    await page.goto('http://127.0.0.1:8765/');
    await audit(page);
    await page.fill('#password', 'e2e-password');
    await page.click('button[type=submit]');
    await page.locator('.ticket').first().waitFor();
    await audit(page);
});

test('Waypoint goal messages meet WCAG AA', async ({ page }) => {
    await page.goto(file('Waypoint/index.html'));
    await page.fill('#userNameInput', 'Test');
    await page.keyboard.press('Enter');
    await page.locator('#hourlyRate').pressSequentially('30');
    await page.locator('#hoursPerWeek').pressSequentially('40');
    await page.locator('#savingsGoal').pressSequentially('100000');
    const nextYear = new Date(); nextYear.setFullYear(nextYear.getFullYear() + 1);
    await page.fill('#goalDate', nextYear.toISOString().slice(0, 10));
    await page.click('.calc-btn');
    await expect(page.locator('#goalProgressText')).toHaveClass(/short/);
    await audit(page);
    await page.locator('#savingsGoal').fill('');
    await page.locator('#savingsGoal').pressSequentially('500');
    await expect(page.locator('#goalProgressText')).toHaveClass(/ontrack/);
    await audit(page);
    await page.locator('.expense-value').nth(0).pressSequentially('99999');
    await expect(page.locator('#savingsBox')).toHaveClass(/danger/);
    await audit(page);
});
