// Browser tests run against the files directly (file://), exactly as a visitor's browser would load them.
// Locally they use the installed Google Chrome; in CI, Playwright's bundled Chromium.
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
    testDir: './tests',
    testMatch: '*.spec.js',
    timeout: 30000,
    retries: process.env.CI ? 1 : 0,
    reporter: process.env.CI ? 'github' : 'list',
    // Kitchen (the Python backend) runs for the full-stack tests, on a throwaway database
    webServer: {
        command: (process.env.PYTHON || '.venv/bin/python') + ' -m uvicorn Kitchen.app:app --host 127.0.0.1 --port 8765',
        url: 'http://127.0.0.1:8765/api/health',
        env: { KITCHEN_TOKEN: 'e2e-password', KITCHEN_DB: require('path').join(require('os').tmpdir(), 'kitchen-e2e-' + Date.now() + '.db') },
        reuseExistingServer: false,
        timeout: 30000,
    },
    use: {
        channel: process.env.CI ? undefined : 'chrome',
        locale: 'es-ES',
    },
});
