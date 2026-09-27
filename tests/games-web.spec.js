// Tests for the browser versions of the Python games.
const { test, expect } = require('@playwright/test');
const path = require('path');

const url = (game) => 'file://' + path.resolve(__dirname, '..', game, 'web', 'index.html');

// The famous "world's hardest sudoku" by Arto Inkala
const INKALA = '800000000003600000070090200050007000000045700000100030001000068008500010090000400';

test.describe('Nine', () => {
    test('generates hard puzzles with 26 clues and exactly one solution', async ({ page }) => {
        await page.goto(url('Nine'));
        await page.click('[data-level="hard"]');
        const check = await page.evaluate(() => ({
            clues: puzzle.filter(Boolean).length,
            solutions: Sudoku.countSolutions(puzzle),
        }));
        expect(check.clues).toBeLessThanOrEqual(27);
        expect(check.solutions).toBe(1);
    });

    test('solves a puzzle typed in by hand', async ({ page }) => {
        await page.goto(url('Nine'));
        await page.click('#ownBtn');
        const cells = page.locator('.cell');
        for (let i = 0; i < 81; i++) {
            if (INKALA[i] !== '0') {
                await cells.nth(i).dispatchEvent('pointerdown');
                await page.keyboard.press(INKALA[i]);
            }
        }
        await page.keyboard.press('s');
        await page.keyboard.press(' '); // skip the animation
        await expect(page.locator('#message')).toHaveText('Resuelto por Nine en 13.810 pasos.');
        const solved = await page.evaluate(() => board.indexOf(0) === -1 && Sudoku.conflicts(board).size === 0);
        expect(solved).toBe(true);
    });

    test('flags repeated numbers', async ({ page }) => {
        await page.goto(url('Nine'));
        await page.click('#ownBtn');
        const cells = page.locator('.cell');
        await cells.nth(0).dispatchEvent('pointerdown');
        await page.keyboard.press('5');
        await cells.nth(1).dispatchEvent('pointerdown');
        await page.keyboard.press('5');
        await expect(cells.nth(0)).toHaveClass(/bad/);
        await page.keyboard.press('s');
        await expect(page.locator('#message')).toContainText('repetidos');
    });
});

test.describe('Keystroke', () => {
    test('scores words per minute from correct characters', async ({ page }) => {
        await page.clock.install();
        await page.goto(url('Keystroke'));
        await page.fill('#nameInput', 'Gabriel');
        await page.keyboard.press('Enter');
        await page.keyboard.press('ArrowLeft'); // 30 s → 15 s
        await page.keyboard.press('Enter');

        const target = await page.evaluate(() => test.target.slice(0, 75));
        await page.keyboard.type(target);
        await page.clock.runFor(16000);

        // 75 correct characters = 15 words in a quarter of a minute = 60 wpm
        await expect(page.locator('#resWpm')).toHaveText('60');
        await expect(page.locator('#resAcc')).toContainText('100,0 %');
    });
});

test.describe('Volley', () => {
    test('plays a full match to 7', async ({ page }) => {
        await page.goto(url('Volley'));
        await page.keyboard.press('Enter');
        const result = await page.evaluate(() => {
            for (let i = 0; i < 120 * 600 && state === 'play'; i++) {
                updatePlay(1 / 120);
                const d = ball.y + (Math.random() * 120 - 60) - (left.y + 48);
                if (Math.abs(d) > 8) movePaddle(left, d > 0 ? 1 : -1, 1 / 120, 420);
            }
            return { state: state, top: Math.max(scores[0], scores[1]) };
        });
        expect(result).toEqual({ state: 'over', top: 7 });
    });
});
