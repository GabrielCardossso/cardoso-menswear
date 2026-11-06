import { screen, within } from '@testing-library/react';
import { renderizarApp } from '../test/renderizar';

beforeEach(() => localStorage.clear());

it('categoria: título, peças com a esgotada por último e pílula marcada', async () => {
  renderizarApp('/c/camisetas');
  expect(await screen.findByRole('heading', { level: 1, name: 'Camisetas' })).toBeInTheDocument();
  const itens = within(screen.getByRole('list', { name: 'Peças' })).getAllByRole('listitem');
  expect(itens.map((li) => within(li).getByRole('link').getAttribute('href'))).toEqual(['/p/a', '/p/velha', '/p/esgotada']);
  expect(within(itens[2]).getByText('Esgotado')).toBeInTheDocument();
  const nav = screen.getByRole('navigation', { name: 'Categorias' });
  expect(within(nav).getByRole('link', { name: 'Camisetas' })).toHaveAttribute('aria-current', 'page');
});

it('kits: lista os kits do início em grade', async () => {
  renderizarApp('/kits');
  expect(await screen.findByRole('heading', { level: 1, name: 'Kits' })).toBeInTheDocument();
  const links = within(screen.getByRole('list', { name: 'Kits' })).getAllByRole('link');
  expect(links.map((l) => l.getAttribute('href'))).toEqual(['/k/k1', '/k/k2']);
  expect(within(screen.getByRole('navigation', { name: 'Categorias' })).getByRole('link', { name: 'Kits' })).toHaveAttribute('aria-current', 'page');
});

it('novidades: todas as peças, mais novas primeiro, esgotadas no fim', async () => {
  renderizarApp('/novidades');
  expect(await screen.findByRole('heading', { level: 1, name: 'Novidades' })).toBeInTheDocument();
  const hrefs = within(screen.getByRole('list', { name: 'Peças' })).getAllByRole('link').map((l) => l.getAttribute('href'));
  expect(hrefs).toEqual(['/p/b', '/p/a', '/p/velha', '/p/esgotada']);
});
