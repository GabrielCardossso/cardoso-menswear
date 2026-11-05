import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import Cabecalho from './Cabecalho';

it('mostra a logo e a sacola com a quantidade', async () => {
  const abrir = vi.fn();
  render(<MemoryRouter><Cabecalho quantidade={2} onAbrirSacola={abrir} /></MemoryRouter>);
  expect(screen.getByRole('img', { name: 'Cardoso Menswear' })).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Sacola, 2 itens' }));
  expect(abrir).toHaveBeenCalledOnce();
});

it('usa o singular com 1 item', () => {
  render(<MemoryRouter><Cabecalho quantidade={1} onAbrirSacola={() => {}} /></MemoryRouter>);
  expect(screen.getByRole('button', { name: 'Sacola, 1 item' })).toBeInTheDocument();
});
