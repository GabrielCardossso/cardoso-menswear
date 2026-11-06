import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CHAVE } from '../sacola/persistencia';
import type { ItemDaSacola } from '../sacola/tipos';
import { fonteDe, renderizarApp } from '../test/renderizar';
import { vitrineDeTeste } from '../vitrine/vitrineDeTeste';

function comSacola(itens: ItemDaSacola[]) {
  localStorage.setItem(CHAVE, JSON.stringify({ itens, atualizadoEm: new Date().toISOString() }));
}
const camisa = (q: number): ItemDaSacola => ({ pecaId: 'a', nome: 'Camisa dry fit NK', tamanho: 'M', precoUnitarioCentavos: 8990, quantidade: q });
const bermuda: ItemDaSacola = { pecaId: 'b', nome: 'Bermuda NK', tamanho: 'G', precoUnitarioCentavos: 7990, quantidade: 1 };

async function abrirSacola() {
  await userEvent.click(await screen.findByRole('button', { name: /^Sacola, / }));
  return screen.getByRole('dialog', { name: 'Sacola' });
}

beforeEach(() => localStorage.clear());

it('vazia: convida a ver os kits e fecha ao ir', async () => {
  renderizarApp('/c/camisetas');
  const folha = await abrirSacola();
  expect(within(folha).getByText('Sua sacola está vazia')).toBeInTheDocument();
  await userEvent.click(within(folha).getByRole('link', { name: 'Ver os kits' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(await screen.findByRole('heading', { level: 1, name: 'Kits' })).toBeInTheDocument();
});

it('mostra cada linha com tamanho, preço, subtotal e o total das peças', async () => {
  comSacola([camisa(2), bermuda]);
  renderizarApp('/');
  const folha = await abrirSacola();
  const linha = within(folha).getByRole('listitem', { name: 'Camisa dry fit NK, tam. M' });
  expect(within(linha).getByText('R$ 89,90 cada')).toBeInTheDocument();
  expect(within(linha).getByText('R$ 179,80')).toBeInTheDocument();
  expect(within(folha).getByText('Total das peças').parentElement).toHaveTextContent('R$ 259,70');
});

it('− para em 1, + para em 10, e remover tira a linha', async () => {
  comSacola([camisa(1), { ...bermuda, quantidade: 10 }]);
  renderizarApp('/');
  const folha = await abrirSacola();
  expect(within(folha).getByRole('button', { name: 'Diminuir Camisa dry fit NK tam. M' })).toBeDisabled();
  expect(within(folha).getByRole('button', { name: 'Aumentar Bermuda NK tam. G' })).toBeDisabled();
  await userEvent.click(within(folha).getByRole('button', { name: 'Aumentar Camisa dry fit NK tam. M' }));
  expect(within(folha).getByRole('listitem', { name: 'Camisa dry fit NK, tam. M' })).toHaveTextContent('2');
  await userEvent.click(within(folha).getByRole('button', { name: 'Remover Bermuda NK tam. G' }));
  expect(within(folha).queryByRole('listitem', { name: 'Bermuda NK, tam. G' })).not.toBeInTheDocument();
});

it('finalizar leva a /finalizar', async () => {
  comSacola([camisa(1)]);
  renderizarApp('/');
  const folha = await abrirSacola();
  expect(within(folha).getByRole('link', { name: 'Finalizar pelo WhatsApp' })).toHaveAttribute('href', '/finalizar');
});

it('loja pausada troca o botão pelo aviso', async () => {
  comSacola([camisa(1)]);
  const v = vitrineDeTeste();
  v.configuracoes.lojaAberta = false;
  renderizarApp('/', fonteDe(v));
  const folha = await abrirSacola();
  expect(within(folha).queryByRole('link', { name: 'Finalizar pelo WhatsApp' })).not.toBeInTheDocument();
  expect(within(folha).getByText('Pedidos pausados no momento. Fale com a gente no Instagram.')).toBeInTheDocument();
  expect(within(folha).getByRole('link', { name: 'Instagram' })).toHaveAttribute('href', 'https://www.instagram.com/cardoso.menswear/');
});

it('Esc fecha e o foco volta para o botão da sacola', async () => {
  renderizarApp('/c/camisetas');
  await abrirSacola();
  await userEvent.keyboard('{Escape}');
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: /^Sacola, / })).toHaveFocus();
});

it('o botão Fechar fecha', async () => {
  renderizarApp('/c/camisetas');
  const folha = await abrirSacola();
  await userEvent.click(within(folha).getByRole('button', { name: 'Fechar' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
