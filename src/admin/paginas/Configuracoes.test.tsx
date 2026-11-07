import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { apiLogada, renderizarAdmin } from '../test/renderizarAdmin';

async function abrir() {
  const api = await apiLogada();
  const salvar = vi.spyOn(api, 'salvarConfiguracoes');
  renderizarAdmin('/admin/configuracoes', api);
  await screen.findByRole('heading', { level: 1, name: 'Ajustes' });
  return { api, salvar };
}

describe('ajustes', () => {
  it('WhatsApp sem 55 mostra erro e não salva', async () => {
    const { salvar } = await abrir();
    const campo = screen.getByLabelText('WhatsApp dos pedidos');
    await userEvent.clear(campo);
    await userEvent.type(campo, '48 99999-9999');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(await screen.findByText('Use só números, com 55 e DDD.')).toBeInTheDocument();
    expect(campo).toHaveAttribute('aria-invalid', 'true');
    expect(salvar).not.toHaveBeenCalled();
  });

  it('salva o WhatsApp só com dígitos e os outros campos', async () => {
    const { api, salvar } = await abrir();
    const campo = screen.getByLabelText('WhatsApp dos pedidos');
    await userEvent.clear(campo);
    await userEvent.type(campo, '+55 48 98888-7777');
    const entrega = screen.getByLabelText('Texto de entrega');
    await userEvent.clear(entrega);
    await userEvent.type(entrega, 'Entrega em Capivari');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(await screen.findByText('Salvo.')).toBeInTheDocument();
    expect(salvar).toHaveBeenCalledWith(expect.objectContaining({ whatsappNumero: '5548988887777', textoEntrega: 'Entrega em Capivari' }));
    expect((await api.carregar()).configuracoes.whatsappNumero).toBe('5548988887777');
  });

  it('sair volta para a entrada', async () => {
    await abrir();
    await userEvent.click(screen.getByRole('button', { name: 'Sair' }));
    await waitFor(() => expect(screen.getByTestId('caminho')).toHaveTextContent('/admin/entrar'));
  });

  it('sessão vencida ao salvar volta para a entrada com aviso', async () => {
    const { api } = await abrir();
    api.expirarSessao();
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(await screen.findByText('Sua sessão expirou. Entre de novo.')).toBeInTheDocument();
  });
});
