const { test, expect } = require('@playwright/test');
const path = require('path');

const SHOTS = path.join(__dirname, 'screenshots');
const VERIFIED = () => localStorage.setItem('simulador_lead', JSON.stringify({ verified: true }));

test.describe('Simulador Reforma Tributária — visual & fluxos', () => {

  test('desktop: home e simulador renderizam', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/');
    await expect(page).toHaveTitle(/Reforma/i);
    await page.screenshot({ path: path.join(SHOTS, '01-home-desktop.png') });

    await page.evaluate(VERIFIED);
    await page.reload();
    await page.locator('#simulador').scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(SHOTS, '02-simulador-desktop.png') });
  });

  test('value-first: 1a simulacao gratis, 2a aciona o gate', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // Aba Simples ativa por padrao — 1a acao (gratis)
    await page.fill('#sn-faturamento', '50.000,00');
    await page.fill('#sn-rbt12', '600.000,00');
    await page.locator('#panel-simples .btn-simulate').click();

    await expect(page.locator('#result-simples')).toBeVisible();
    await expect(page.locator('#leadGateModal')).toHaveCount(0); // sem gate ainda
    await page.locator('#result-simples').scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(SHOTS, '03-resultado-simples.png') });

    // 2a acao → gate contextual aparece
    await page.locator('#panel-simples .btn-simulate').click();
    await expect(page.locator('#leadGateModal')).toBeVisible();
    await expect(page.locator('#leadGateModal .lead-card')).toHaveAttribute('role', 'dialog');
    await page.waitForTimeout(500); // deixa a animacao slideUp assentar
    await page.screenshot({ path: path.join(SHOTS, '04-lead-gate-modal.png'), animations: 'disabled' });
  });

  test('mobile: tabela CST vira cards (rotulo:valor)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.evaluate(VERIFIED);
    await page.reload();

    await page.getByRole('tab', { name: /CST/i }).click();
    // No mobile o cabecalho some e cada celula ganha rotulo via data-label
    const theadDisplay = await page.locator('#cst-table thead').evaluate(el => getComputedStyle(el).display);
    expect(theadDisplay).toBe('none');
    await expect(page.locator('#cst-body td[data-label]').first()).toBeVisible();
    await page.locator('#cst-table').scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(SHOTS, '05-mobile-cst-cards.png') });
  });

  test('mobile: simulador com formulario empilhado', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.evaluate(VERIFIED);
    await page.reload();
    await page.locator('#simulador').scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(SHOTS, '06-mobile-simulador.png') });
  });
});
