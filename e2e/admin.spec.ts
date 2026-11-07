import { expect, test, type Page } from '@playwright/test';

// Build em modo e2e: o painel usa a API em memória. Não existe conta nem senha de verdade aqui.
async function entrar(page: Page) {
  await page.goto('/admin');
  await expect(page.getByRole('heading', { name: 'Painel Cardoso' })).toBeVisible();
  await page.getByLabel('E-mail').fill('gabriel@exemplo.test');
  await page.getByLabel('Senha').fill('qualquer-coisa');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Visão geral' })).toBeVisible();
}

test('cadastra uma peça pelo celular', async ({ page }) => {
  await entrar(page);
  await page.getByRole('link', { name: 'Nova peça' }).click();
  await page.getByLabel('Nome').fill('Polo teste');
  await page.getByLabel('Preço').fill('119,90');
  await page.getByLabel('Categoria').selectOption({ label: 'Polos' });
  await page.getByRole('button', { name: 'Tamanho M', exact: true }).click();
  await page.getByRole('button', { name: 'Salvar' }).click();
  await expect(page.getByText('Salvo.')).toBeVisible();
  await page.getByRole('navigation', { name: 'Painel' }).getByRole('link', { name: 'Peças' }).click();
  const linha = page.getByRole('list', { name: 'Peças' }).getByRole('listitem').filter({ hasText: 'Polo teste' });
  await expect(linha).toContainText('R$ 119,90');
  await expect(linha).toContainText('M');
});

test('nenhuma página do painel rola para o lado no celular', async ({ page }) => {
  await entrar(page);
  const paginas = [
    '/admin',
    '/admin/pecas',
    '/admin/pecas/nova',
    '/admin/pecas/p01',
    '/admin/kits',
    '/admin/kits/novo',
    '/admin/kits/k01',
    '/admin/categorias',
    '/admin/configuracoes',
  ];
  for (const caminho of paginas) {
    // Navega pelo app (a sessão em memória não sobrevive a recarregar a página).
    await page.evaluate((c) => {
      history.pushState({}, '', c);
      dispatchEvent(new PopStateEvent('popstate'));
    }, caminho);
    await expect(page.locator('h1')).toBeVisible();
    const larguras = await page.evaluate(() => ({ conteudo: document.documentElement.scrollWidth, tela: innerWidth }));
    expect(larguras.conteudo, caminho).toBeLessThanOrEqual(larguras.tela);
  }
});
