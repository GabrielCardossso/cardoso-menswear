import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { apiLogada, renderizarAdmin } from '../test/renderizarAdmin';

const itens = () => within(screen.getByRole('list', { name: 'Categorias' })).getAllByRole('listitem');

async function abrir() {
  const api = await apiLogada();
  renderizarAdmin('/admin/categorias', api);
  await screen.findByRole('heading', { level: 1, name: 'Categorias' });
  return api;
}

describe('categorias', () => {
  it('lista na ordem, com quantidade de peças', async () => {
    await abrir();
    expect(itens().map((li) => within(li).getByRole('heading').textContent)).toEqual(['Camisetas', 'Polos', 'Bermudas', 'Calças', 'Tênis']);
    expect(itens()[0]).toHaveTextContent('5 peças');
    expect(itens()[4]).toHaveTextContent('0 peças');
  });

  it('renomear chama salvarCategoria', async () => {
    const api = await abrir();
    const salvar = vi.spyOn(api, 'salvarCategoria');
    await userEvent.click(screen.getByRole('button', { name: 'Editar Polos' }));
    const nome = screen.getByLabelText('Nome');
    await userEvent.clear(nome);
    await userEvent.type(nome, 'Polos e camisas');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    await waitFor(() => expect(salvar).toHaveBeenCalledWith('c-polos', { nome: 'Polos e camisas', grade: ['P', 'M', 'G', 'GG', 'XG'], visivel: true }));
    expect(await screen.findByRole('heading', { name: 'Polos e camisas' })).toBeInTheDocument();
  });

  it('tirar tamanho ligado em peça pede confirmação citando o tamanho', async () => {
    const api = await abrir();
    const salvar = vi.spyOn(api, 'salvarCategoria');
    await userEvent.click(screen.getByRole('button', { name: 'Editar Polos' }));
    const grade = screen.getByLabelText('Tamanhos');
    await userEvent.clear(grade);
    await userEvent.type(grade, 'M G GG XG');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    const dialogo = screen.getByRole('dialog', { name: 'Mudar os tamanhos?' });
    expect(dialogo).toHaveTextContent('As peças desta categoria vão perder os tamanhos P. Continuar?');
    expect(salvar).not.toHaveBeenCalled();
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Mudar tamanhos' }));
    await waitFor(() => expect(salvar).toHaveBeenCalledWith('c-polos', expect.objectContaining({ grade: ['M', 'G', 'GG', 'XG'] })));
  });

  it('categoria com peças não é excluída', async () => {
    const api = await abrir();
    const excluir = vi.spyOn(api, 'excluirCategoria');
    await userEvent.click(screen.getByRole('button', { name: 'Editar Camisetas' }));
    await userEvent.click(screen.getByRole('button', { name: 'Excluir' }));
    expect(screen.getByText('Esta categoria tem peças. Esconda em vez de excluir.')).toBeInTheDocument();
    expect(excluir).not.toHaveBeenCalled();
  });

  it('criar categoria nova aparece no fim; excluir sem peças com confirmação', async () => {
    const api = await abrir();
    await userEvent.type(screen.getByLabelText('Nome da nova categoria'), 'Bonés');
    await userEvent.type(screen.getByLabelText('Tamanhos da nova categoria'), 'U');
    await userEvent.click(screen.getByRole('button', { name: 'Criar categoria' }));
    await waitFor(() => expect(itens()).toHaveLength(6));
    expect(within(itens()[5]).getByRole('heading')).toHaveTextContent('Bonés');
    await userEvent.click(screen.getByRole('button', { name: 'Editar Bonés' }));
    await userEvent.click(screen.getByRole('button', { name: 'Excluir' }));
    await userEvent.click(within(screen.getByRole('dialog', { name: 'Excluir categoria?' })).getByRole('button', { name: 'Excluir categoria' }));
    await waitFor(() => expect(itens()).toHaveLength(5));
    expect((await api.carregar()).categorias.map((c) => c.nome)).not.toContain('Bonés');
  });

  it('descer e esconder', async () => {
    const api = await abrir();
    const ordenar = vi.spyOn(api, 'ordenarCategorias');
    const salvar = vi.spyOn(api, 'salvarCategoria');
    await userEvent.click(screen.getByRole('button', { name: 'Descer Camisetas' }));
    await waitFor(() => expect(ordenar).toHaveBeenCalledWith(['c-polos', 'c-camisetas', 'c-bermudas', 'c-calcas', 'c-tenis']));
    await userEvent.click(within(itens()[4]).getByRole('switch', { name: 'Visível' }));
    await waitFor(() => expect(salvar).toHaveBeenCalledWith('c-tenis', expect.objectContaining({ visivel: false })));
  });

  it('nome vazio ou sem tamanhos não cria', async () => {
    const api = await abrir();
    const criar = vi.spyOn(api, 'criarCategoria');
    await userEvent.click(screen.getByRole('button', { name: 'Criar categoria' }));
    expect(screen.getByText('Escreva o nome da categoria.')).toBeInTheDocument();
    expect(screen.getByText('Coloque ao menos um tamanho.')).toBeInTheDocument();
    expect(criar).not.toHaveBeenCalled();
  });

  it('falha ao mudar a grade aparece dentro da janela de confirmação', async () => {
    const api = await abrir();
    vi.spyOn(api, 'salvarCategoria').mockRejectedValue(new Error('rede'));
    await userEvent.click(screen.getByRole('button', { name: 'Editar Polos' }));
    const grade = screen.getByLabelText('Tamanhos');
    await userEvent.clear(grade);
    await userEvent.type(grade, 'M G');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    const dialogo = screen.getByRole('dialog', { name: 'Mudar os tamanhos?' });
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Mudar tamanhos' }));
    expect(await within(dialogo).findByText('Não foi possível salvar. Confira a internet e tente de novo.')).toBeInTheDocument();
  });
});
