// Full stack: a customer orders in Apron, the order reaches the Kitchen server, and the kitchen moves it along.
const { test, expect } = require('@playwright/test');
const path = require('path');

const KITCHEN = 'http://127.0.0.1:8765';
const apron = 'file://' + path.resolve(__dirname, '..', 'Apron', 'index.html') + '?kitchen=' + KITCHEN;

test('an order placed in Apron shows up on the kitchen board', async ({ page, context }) => {
    await page.goto(apron);
    await page.fill('#restaurantNameInput', 'Sabor Criollo');
    await page.keyboard.press('Enter');
    await page.click('#add-1');
    await page.click('#add-3');
    await page.locator('#taxRatePct').pressSequentially('8.875');
    await page.locator('#customTip').pressSequentially('1250');
    await page.fill('#custName', 'Ana Pérez');
    await page.fill('#custPhone', '(555) 123-4567');
    await page.fill('#orderNote', 'Sin cebolla, por favor');
    await page.click('#confirmBtn');

    await expect(page.locator('#orderModal')).toHaveClass(/show/);
    await expect(page.locator('#etaText')).toContainText('cocina');
    await expect(page.locator('#modalTotal')).toHaveText('$1.293,53'); // the server's total matches Apron's
    const number = (await page.locator('#orderNumber').textContent()).trim();
    expect(number).toMatch(/^#10\d\d$/);

    const board = await context.newPage();
    await board.goto(KITCHEN);
    await board.fill('#password', 'wrong');
    await board.click('button[type=submit]');
    await expect(board.locator('#loginError')).toHaveText('Contraseña incorrecta.');
    await board.fill('#password', 'e2e-password');
    await board.click('button[type=submit]');

    const ticket = board.locator('.ticket', { hasText: number });
    await expect(ticket).toContainText('Ana Pérez');
    await expect(ticket).toContainText('Sin cebolla, por favor');
    await expect(board.locator('.column').nth(0)).toContainText(number);

    await ticket.locator('.advance').click();           // received → preparing
    await expect(board.locator('.column').nth(1)).toContainText(number);
    await board.locator('.ticket', { hasText: number }).locator('.advance').click(); // → ready
    await expect(board.locator('.column').nth(2)).toContainText(number);
});

test('Apron tells the customer when the kitchen is unreachable', async ({ page }) => {
    await page.goto('file://' + path.resolve(__dirname, '..', 'Apron', 'index.html') + '?kitchen=http://127.0.0.1:9');
    await page.fill('#restaurantNameInput', 'Test');
    await page.keyboard.press('Enter');
    await page.click('#add-2');
    await page.fill('#custName', 'Ana');
    await page.fill('#custPhone', '5551234567');
    await page.click('#confirmBtn');
    await expect(page.locator('#cartError')).toContainText('No pudimos enviar');
    await expect(page.locator('#orderModal')).not.toHaveClass(/show/);
});
