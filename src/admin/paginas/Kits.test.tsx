import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { apiLogada, renderizarAdmin } from '../test/renderizarAdmin';

const itens = () => within(screen.getByRole('list', { name: 'Kits' })).getAllByRole('listitem');

async function adicionar(busca: string, nome: string) {
  const campo = screen.getByLabelText('Buscar peça');
  await userEvent.clear(campo);
  await userEvent.type(campo, busca);
  await userEvent.click(screen.getByRole('button', { name: `Adicionar ${nome}` }));
}

describe('lista de kits', () => {
  it('na ordem do carrossel, com selo e subir', async () => {
    const api = await apiLogada();
    const ordenar = vi.spyOn(api, 'ordenarKits');
    renderizarAdmin('/admin/kits', api);
    await screen.findByRole('heading', { level: 1, name: 'Kits' });
    expect(itens()).toHaveLength(4);
    expect(itens()[0]).toHaveTextContent('Dry fit NK + bermuda');
    expect(itens()[0]).toHaveTextContent('Publicado');
    await userEvent.click(within(itens()[1]).getByRole('button', { name: /^Subir/ }));
    await waitFor(() => expect(ordenar).toHaveBeenCalledWith(['k02', 'k01', 'k03', 'k04']));
    await waitFor(() => expect(itens()[0]).toHaveTextContent('Dry fit branca + bermuda'));
  });
});

describe('formulário de kit', () => {
  it('com 1 peça não salva', async () => {
    const api = await apiLogada();
    const criar = vi.spyOn(api, 'criarKit');
    renderizarAdmin('/admin/kits/novo', api);
    await userEvent.type(await screen.findByLabelText('Título'), 'Kit teste');
    await adicionar('polo lc', 'Polo piquet LC preta');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(await screen.findByText('Escolha de 2 a 4 peças.')).toBeInTheDocument();
    expect(criar).not.toHaveBeenCalled();
  });

  it('busca sem acento, mostra o total e salva oculto', async () => {
    const api = await apiLogada();
    renderizarAdmin('/admin/kits/novo', api);
    await userEvent.type(await screen.findByLabelText('Título'), 'Kit teste');
    await adicionar('calca', 'Calça jogador preta');
    await adicionar('ea7', 'Camiseta EA7 branca');
    const escolhidas = within(screen.getByRole('list', { name: 'Peças do kit' })).getAllByRole('listitem');
    expect(escolhidas.map((li) => li.textContent)).toEqual([expect.stringContaining('Calça jogador preta'), expect.stringContaining('Camiseta EA7 branca')]);
    expect(screen.getByText('Total: R$ 249,80')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(await screen.findByText('Salvo.')).toBeInTheDocument();
    const kit = (await api.carregar()).kits.find((k) => k.titulo === 'Kit teste')!;
    expect(kit.publicado).toBe(false);
    expect(kit.pecaIds).toEqual(['p10', 'p09']);
    await userEvent.click(screen.getByRole('link', { name: 'Kits' }));
    expect(await screen.findByText('Kit teste')).toBeInTheDocument();
    expect(itens()[4]).toHaveTextContent('Oculto');
  });

  it('não deixa passar de 4 peças', async () => {
    renderizarAdmin('/admin/kits/novo', await apiLogada());
    await screen.findByLabelText('Título');
    await adicionar('calca', 'Calça jogador preta');
    await adicionar('ea7', 'Camiseta EA7 branca');
    await adicionar('tactel', 'Bermuda tactel preta');
    await adicionar('basica', 'Camiseta básica branca');
    await userEvent.type(screen.getByLabelText('Buscar peça'), '{selectall}polo lc');
    expect(screen.getByRole('button', { name: 'Adicionar Polo piquet LC preta' })).toBeDisabled();
    expect(screen.getByText('O kit já tem 4 peças.')).toBeInTheDocument();
  });

  it('publicar e ocultar', async () => {
    const api = await apiLogada();
    const publicar = vi.spyOn(api, 'publicarKit');
    renderizarAdmin('/admin/kits/k01', api);
    const chave = await screen.findByRole('switch', { name: 'Publicado' });
    expect(chave).toHaveAttribute('aria-checked', 'true');
    await userEvent.click(chave);
    await waitFor(() => expect(publicar).toHaveBeenCalledWith('k01', false));
    await waitFor(() => expect(screen.getByRole('switch', { name: 'Publicado' })).toHaveAttribute('aria-checked', 'false'));
  });

  it('tirar e reordenar peças; excluir com confirmação', async () => {
    const api = await apiLogada();
    renderizarAdmin('/admin/kits/k01', api);
    const lista = await screen.findByRole('list', { name: 'Peças do kit' });
    await userEvent.click(within(lista).getByRole('button', { name: 'Descer Camisa dry fit NK preta' }));
    expect(within(lista).getAllByRole('listitem')[0]).toHaveTextContent('Bermuda dry fit NK preta');
    await userEvent.click(screen.getByRole('button', { name: 'Excluir kit' }));
    const dialogo = screen.getByRole('dialog', { name: 'Excluir kit?' });
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Excluir kit' }));
    await waitFor(() => expect(screen.getByTestId('caminho')).toHaveTextContent(/^\/admin\/kits$/));
    expect((await api.carregar()).kits.map((k) => k.id)).not.toContain('k01');
  });
});
