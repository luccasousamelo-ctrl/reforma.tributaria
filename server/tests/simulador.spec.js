// Testes funcionais (e2e) do simulador. Cada teste roda em contexto isolado
// (localStorage limpo), então a 1ª ação é sempre gratuita (value-first).
// Rode com:  cd server && npm run test:e2e
/* global showTab, calcPresumido, calcReal */
const { test, expect } = require('@playwright/test');

async function lazyTabelasProntas(page) {
  await page.waitForFunction(() => document.querySelectorAll('#cst-body tr').length > 1, { timeout: 10000 });
}

test.describe('Cálculos dos regimes', () => {
  test('Simples: 1ª simulação calcula e mostra resultado sem NaN', async ({ page }) => {
    await page.goto('/');
    await page.fill('#sn-faturamento', '50.000,00');
    await page.fill('#sn-rbt12', '600.000,00');
    await page.locator('#panel-simples .btn-simulate').click();
    const box = page.locator('#result-simples');
    await expect(box).toHaveClass(/show/);
    await expect(box).toContainText('R$');
    await expect(box).not.toContainText('NaN');
    // Features das ondas: CTA WhatsApp + nota de cenário 2033 + aria-live
    await expect(box.locator('.result-wa-cta')).toBeVisible();
    await expect(box.locator('.result-scenario-note')).toBeVisible();
    await expect(box).toHaveAttribute('aria-live', 'polite');
  });

  test('Simples: faturamento acima do teto (R$4,8M) bloqueia', async ({ page }) => {
    await page.goto('/');
    await page.fill('#sn-faturamento', '500.000,00');
    await page.fill('#sn-rbt12', '6.000.000,00');
    await page.locator('#panel-simples .btn-simulate').click();
    await expect(page.locator('#panel-simples')).toContainText(/excede o teto/i);
  });

  test('passo-zero: botão de exemplo pré-preenche e simula', async ({ page }) => {
    await page.goto('/');
    await page.locator('.btn-example').click();
    await expect(page.locator('#result-simples')).toHaveClass(/show/);
    await expect(page.locator('#sn-faturamento')).not.toHaveValue('');
  });

  test('Lucro Presumido calcula', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => { document.getElementById('lp-faturamento').value = '80.000,00'; calcPresumido(); });
    await expect(page.locator('#result-presumido')).toContainText('R$');
    await expect(page.locator('#result-presumido')).not.toContainText('NaN');
  });

  test('Lucro Real calcula', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => { document.getElementById('lr-faturamento').value = '120.000,00'; calcReal(); });
    await expect(page.locator('#result-real')).toContainText('R$');
    await expect(page.locator('#result-real')).not.toContainText('NaN');
    await expect(page.locator('#result-real')).toContainText(/Premissas do modelo/i);
  });
});

test.describe('Lead gate value-first', () => {
  test('2ª ação aciona o gate e ESC fecha + destrava scroll', async ({ page }) => {
    await page.goto('/');
    // 1ª ação (grátis)
    await page.fill('#sn-faturamento', '50.000,00');
    await page.fill('#sn-rbt12', '600.000,00');
    await page.locator('#panel-simples .btn-simulate').click();
    await expect(page.locator('#result-simples')).toHaveClass(/show/);
    // 2ª ação → gate
    await page.evaluate(() => { document.getElementById('lp-faturamento').value = '80.000,00'; calcPresumido(); });
    await expect(page.locator('#leadGateModal')).toBeVisible();
    await expect(page.locator('body')).toHaveCSS('overflow', 'hidden');
    await page.keyboard.press('Escape');
    await expect(page.locator('#leadGateModal')).toHaveCount(0);
    await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
  });
});

test.describe('Consulta CST/NBS (lazy-load)', () => {
  test('tabela CST popula e relatório abre como diálogo', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => showTab('cst'));
    await lazyTabelasProntas(page);
    await page.locator('#cst-body tr').first().click();
    const dialog = page.locator('.report-modal-overlay [role="dialog"]');
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('.report-modal-overlay')).toHaveCount(0);
  });

  test('busca NBS filtra resultados', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => showTab('nbs'));
    await page.locator('#nbs-search').fill('advocacia');
    await page.waitForTimeout(600);
    await expect(page.locator('#nbs-body tr').first()).toBeVisible();
  });
});

test.describe('Acessibilidade', () => {
  test('skip-link e landmark main presentes; campos % com inputmode decimal', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('a.skip-link[href="#conteudo"]')).toHaveCount(1);
    await expect(page.locator('main#conteudo')).toHaveCount(1);
    await expect(page.locator('#sn-pctB2B')).toHaveAttribute('inputmode', 'decimal');
  });
});
