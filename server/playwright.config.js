// Config do Playwright. Vive em server/ (deps em server/node_modules), como o ESLint —
// sem package.json na raiz para não mudar a detecção de build da Vercel.
// Rode com:  cd server && npm run test:e2e
const { defineConfig, devices } = require('@playwright/test');

const PORT = 3990;

module.exports = defineConfig({
  testDir: './tests',
  outputDir: './test-results',
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'off',
  },
  // Playwright sobe o Express e espera o health responder antes dos testes
  webServer: {
    command: `PORT=${PORT} node server.js`,
    url: `http://localhost:${PORT}/api/health`,
    reuseExistingServer: true,
    timeout: 30000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
