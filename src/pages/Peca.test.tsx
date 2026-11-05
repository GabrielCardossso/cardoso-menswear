import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CHAVE } from '../sacola/persistencia';
import { renderizarApp } from '../test/renderizar';

beforeEach(() => localStorage.clear());

it('mostra categoria, nome, preço e descrição', async () => {
  renderizarApp('/p/b');
  expect(await screen.findByRole('heading', { level: 1, name: 'Bermuda NK' })).toBeInTheDocument();
  expect(screen.getByText('Bermudas')).toBeInTheDocument();
  expect(screen.getByText('R$ 79,90')).toBeInTheDocument();
});

it('voltar leva à página anterior', async () => {
  renderizarApp(['/c/camisetas', '/p/a']);
  await userEvent.click(await screen.findByRole('button', { name: 'Voltar' }));
  expect(await screen.findByRole('heading', { level: 1, name: 'Camisetas' })).toBeInTheDocument();
});

it('voltar leva ao início quando a peça foi aberta direto pelo link', async () => {
  renderizarApp('/p/a');
  await userEvent.click(await screen.findByRole('button', { name: 'Voltar' }));
  expect(await screen.findByRole('region', { name: 'Chegou agora' })).toBeInTheDocument();
});

it('tamanho indisponível fica desabilitado', async () => {
  renderizarApp('/p/a');
  expect(await screen.findByRole('button', { name: 'Tamanho P, indisponível' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Tamanho M' })).toBeEnabled();
});

it('sem tamanho escolhido pede o tamanho e não adiciona', async () => {
  renderizarApp('/p/a');
  await userEvent.click(await screen.findByRole('button', { name: 'Adicionar à sacola' }));
  expect(screen.getByText('Escolha o tamanho')).toBeInTheDocument();
  expect(localStorage.getItem(CHAVE) ?? '').not.toContain('"pecaId":"a"');
});

it('adiciona com o tamanho e a quantidade escolhidos', async () => {
  renderizarApp('/p/a');
  await userEvent.click(await screen.findByRole('button', { name: 'Tamanho M' }));
  await userEvent.click(screen.getByRole('button', { name: 'Aumentar quantidade' }));
  await userEvent.click(screen.getByRole('button', { name: 'Adicionar à sacola' }));
  expect(JSON.parse(localStorage.getItem(CHAVE)!).itens).toEqual([
    { pecaId: 'a', nome: 'Camisa dry fit NK', tamanho: 'M', precoUnitarioCentavos: 8990, quantidade: 2 },
  ]);
  expect(screen.getAllByRole('button', { name: 'Sacola, 2 itens' }).length).toBeGreaterThan(0);
});

it('mostra o kit de que a peça faz parte', async () => {
  renderizarApp('/p/b');
  const link = await screen.findByRole('link', { name: 'Faz parte do kit “Dry fit NK + bermuda”' });
  expect(link).toHaveAttribute('href', '/k/k2');
});

it('peça esgotada não pode ser adicionada', async () => {
  renderizarApp('/p/esgotada');
  expect(await screen.findByRole('button', { name: 'Esgotado' })).toBeDisabled();
});
