import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CHAVE } from '../sacola/persistencia';
import { renderizarApp } from '../test/renderizar';

beforeEach(() => localStorage.clear());

const botao = () => screen.getByRole('button', { name: /Adicionar à sacola/ });
const grupo = (nome: string) => screen.getByRole('group', { name: nome });

async function escolher(peca: string, tamanho: string) {
  await userEvent.click(within(grupo(peca)).getByRole('button', { name: `Tamanho ${tamanho}` }));
}

it('começa com as peças marcadas, menos a esgotada', async () => {
  renderizarApp('/k/k1');
  expect(await screen.findByRole('heading', { level: 1, name: 'Kit k1' })).toBeInTheDocument();
  expect(within(grupo('Camisa dry fit NK')).getByRole('checkbox')).toBeChecked();
  const esgotada = within(grupo('Camisa Mizuno')).getByRole('checkbox');
  expect(esgotada).not.toBeChecked();
  expect(esgotada).toBeDisabled();
  expect(within(grupo('Camisa Mizuno')).getByText('Esgotado')).toBeInTheDocument();
});

it('só libera o botão quando toda peça marcada tem tamanho', async () => {
  renderizarApp('/k/k2');
  await screen.findByRole('heading', { level: 1, name: 'Dry fit NK + bermuda' });
  expect(botao()).toBeDisabled();
  await escolher('Camisa dry fit NK', 'M');
  expect(botao()).toBeDisabled();
  await escolher('Bermuda NK', 'G');
  expect(botao()).toBeEnabled();
});

it('o total muda ao desmarcar; sem nada marcado, o botão desliga', async () => {
  renderizarApp('/k/k2');
  await screen.findByRole('heading', { level: 1, name: 'Dry fit NK + bermuda' });
  expect(botao()).toHaveTextContent('R$ 169,80');
  await userEvent.click(within(grupo('Bermuda NK')).getByRole('checkbox'));
  expect(botao()).toHaveTextContent('R$ 89,90');
  await userEvent.click(within(grupo('Camisa dry fit NK')).getByRole('checkbox'));
  expect(botao()).toBeDisabled();
});

it('adiciona só as peças marcadas, com tamanho, quantidade 1 e o kit', async () => {
  renderizarApp('/k/k2');
  await screen.findByRole('heading', { level: 1, name: 'Dry fit NK + bermuda' });
  await escolher('Camisa dry fit NK', 'G');
  await userEvent.click(within(grupo('Bermuda NK')).getByRole('checkbox'));
  await userEvent.click(botao());
  expect(JSON.parse(localStorage.getItem(CHAVE)!).itens).toEqual([
    { pecaId: 'a', nome: 'Camisa dry fit NK', tamanho: 'G', precoUnitarioCentavos: 8990, quantidade: 1, kitId: 'k2' },
  ]);
});

it('kit com tudo esgotado abre travado', async () => {
  renderizarApp('/k/kit-todo-esgotado');
  await screen.findByRole('heading', { level: 1, name: 'Kit kit-todo-esgotado' });
  expect(within(grupo('Camisa Mizuno')).getByRole('checkbox')).toBeDisabled();
  expect(botao()).toBeDisabled();
});
