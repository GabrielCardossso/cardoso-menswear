import { expect, test, type Page } from '@playwright/test';

async function semRolagemLateral(page: Page, caminho: string) {
  await page.goto(caminho);
  await page.waitForLoadState('networkidle');
  const larguras = await page.evaluate(() => ({ pagina: document.documentElement.scrollWidth, janela: window.innerWidth }));
  expect(larguras.pagina, `rolagem lateral em ${caminho}`).toBeLessThanOrEqual(larguras.janela);
}

test('do início ao WhatsApp, com kit e peça avulsa', async ({ page }) => {
  await page.goto('/');

  // Kit: escolhe os tamanhos das duas peças e adiciona.
  await page.getByRole('region', { name: 'Sugestões de kit' }).getByRole('link').first().click();
  await expect(page.getByRole('heading', { level: 1, name: 'Dry fit NK + bermuda' })).toBeVisible();
  await page.getByRole('group', { name: 'Camisa dry fit NK preta' }).getByRole('button', { name: 'Tamanho G', exact: true }).click();
  await page.getByRole('group', { name: 'Bermuda dry fit NK preta' }).getByRole('button', { name: 'Tamanho M', exact: true }).click();
  await page.getByRole('button', { name: /Adicionar à sacola/ }).click();
  await expect(page.getByRole('dialog', { name: 'Sacola' })).toBeVisible();
  await page.getByRole('button', { name: 'Fechar' }).click();

  // Peça avulsa pelo "Chegou agora".
  await page.getByRole('button', { name: 'Voltar' }).click();
  await page.getByRole('region', { name: 'Chegou agora' }).getByRole('link', { name: /Camiseta EA7 branca/ }).click();
  await page.getByRole('button', { name: 'Tamanho G', exact: true }).click();
  await page.getByRole('button', { name: 'Adicionar à sacola' }).click();

  // Sacola com as três peças.
  const sacola = page.getByRole('dialog', { name: 'Sacola' });
  await expect(sacola.getByRole('listitem')).toHaveCount(3);
  await expect(sacola.getByText('Total das peças').locator('..')).toContainText('R$ 269,70');
  await sacola.getByRole('link', { name: 'Finalizar pelo WhatsApp' }).click();

  // Finalizar: o site sai para o wa.me; o teste segura essa saída e lê a mensagem.
  await page.getByLabel('Seu nome').fill('João');
  await page.getByRole('radio', { name: 'Motoboy (Capivari de Baixo e região)' }).check();
  await page.getByLabel('Bairro').fill('Centro');
  await page.route('https://wa.me/**', (rota) => rota.abort());
  const pedido = page.waitForRequest((r) => r.url().startsWith('https://wa.me/'));
  await page.getByRole('button', { name: 'Enviar pelo WhatsApp' }).click();
  const mensagem = new URL((await pedido).url()).searchParams.get('text')!;

  expect(mensagem).toContain('Olá! Fiz este pedido pelo site 🛍️');
  expect(mensagem).toContain('• 1x Camisa dry fit NK preta — tam. G — R$ 89,90');
  expect(mensagem).toContain('• 1x Bermuda dry fit NK preta — tam. M — R$ 79,90');
  expect(mensagem).toContain('• 1x Camiseta EA7 branca — tam. G — R$ 99,90');
  expect(mensagem).toContain('Total das peças: R$ 269,70');
  expect(mensagem).toContain('Motoboy — bairro Centro');

  // A sacola continua lá depois de recarregar.
  await page.goto('/');
  await page.reload();
  await expect(page.getByRole('button', { name: 'Sacola, 3 itens' })).toBeVisible();
});

test('nenhuma página rola para o lado no celular', async ({ page }) => {
  for (const caminho of ['/', '/c/camisetas', '/kits', '/p/camisa-dry-fit-nk-preta', '/k/dry-fit-nk-preta-e-bermuda']) {
    await semRolagemLateral(page, caminho);
  }
});
