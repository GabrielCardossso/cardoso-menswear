import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { apiLogada, renderizarAdmin } from '../test/renderizarAdmin';

describe('visão geral', () => {
  it('mostra os números e a peça esgotada com atalho', async () => {
    renderizarAdmin('/admin', await apiLogada());
    await screen.findByRole('heading', { level: 1, name: 'Visão geral' });
    expect(screen.getByText('Peças à venda').parentElement).toHaveTextContent('12');
    expect(screen.getByText('Esgotadas').parentElement).toHaveTextContent('1');
    expect(screen.getByText('Kits com peça esgotada').parentElement).toHaveTextContent('0');
    const lista = screen.getByRole('list', { name: 'Peças esgotadas' });
    expect(within(lista).getByText('Camisa Mizuno preta')).toBeInTheDocument();
    expect(within(lista).getByRole('link', { name: 'Religar tamanhos de Camisa Mizuno preta' })).toHaveAttribute('href', '/admin/pecas/p12');
    expect(screen.getByRole('link', { name: 'Nova peça' })).toHaveAttribute('href', '/admin/pecas/nova');
    expect(screen.getByRole('link', { name: 'Novo kit' })).toHaveAttribute('href', '/admin/kits/novo');
  });

  it('pausar a loja grava na hora', async () => {
    const api = await apiLogada();
    const salvar = vi.spyOn(api, 'salvarConfiguracoes');
    renderizarAdmin('/admin', api);
    const loja = await screen.findByRole('switch', { name: 'Loja aberta' });
    expect(loja).toHaveAttribute('aria-checked', 'true');
    await userEvent.click(loja);
    await waitFor(() => expect(salvar).toHaveBeenCalledWith(expect.objectContaining({ lojaAberta: false })));
    expect(await screen.findByText(/Pausada/)).toBeInTheDocument();
    expect((await api.carregar()).configuracoes.lojaAberta).toBe(false);
  });
});
