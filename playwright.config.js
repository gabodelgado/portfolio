// Browser tests run against the files directly (file://), exactly as a visitor's browser would load them.
// Locally they use the installed Google Chrome; in CI, Playwright's bundled Chromium.
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
    testDir: './tests',
    testMatch: '*.spec.js',
    timeout: 30000,
    retries: process.env.CI ? 1 : 0,
    reporter: process.env.CI ? 'github' : 'list',
    use: {
        channel: process.env.CI ? undefined : 'chrome',
        locale: 'es-ES',
    },
});
