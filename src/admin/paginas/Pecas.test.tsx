import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { apiLogada, renderizarAdmin } from '../test/renderizarAdmin';
import type { PecaAdmin } from '../tipos';

const linhas = () => within(screen.getByRole('list', { name: 'Peças' })).getAllByRole('listitem');

describe('lista de peças', () => {
  it('mostra as peças à venda com preço e tamanhos; filtra esgotadas', async () => {
    renderizarAdmin('/admin/pecas', await apiLogada());
    await screen.findByRole('heading', { level: 1, name: 'Peças' });
    expect(linhas()).toHaveLength(12);
    const mizuno = linhas().find((li) => li.textContent?.includes('Camisa Mizuno preta'))!;
    expect(mizuno).toHaveTextContent('Esgotada');
    await userEvent.click(screen.getByRole('button', { name: 'Esgotadas' }));
    expect(linhas()).toHaveLength(1);
    expect(linhas()[0]).toHaveTextContent('Camisa Mizuno preta');
  });

  it('filtra por categoria', async () => {
    renderizarAdmin('/admin/pecas', await apiLogada());
    await userEvent.click(await screen.findByRole('button', { name: 'Calças' }));
    expect(linhas()).toHaveLength(1);
    expect(linhas()[0]).toHaveTextContent('Calça jogador preta');
  });
});

describe('formulário de peça', () => {
  async function preencher(nome: string, preco: string) {
    await userEvent.type(await screen.findByLabelText('Nome'), nome);
    await userEvent.type(screen.getByLabelText('Preço'), preco);
    await userEvent.selectOptions(screen.getByLabelText('Categoria'), 'Polos');
  }

  it('cria a peça e ela aparece na lista', async () => {
    const api = await apiLogada();
    renderizarAdmin('/admin/pecas/nova', api);
    await preencher('Polo teste', '119,90');
    expect(screen.getByText('R$ 119,90')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Tamanho M' }));
    await userEvent.click(screen.getByRole('button', { name: 'Tamanho G' }));
    expect(screen.getByRole('button', { name: 'Tamanho M' })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(await screen.findByText('Salvo.')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByTestId('caminho')).toHaveTextContent(/^\/admin\/pecas\/p-/));
    await userEvent.click(screen.getByRole('link', { name: 'Peças' }));
    const nova = (await screen.findAllByRole('listitem')).find((li) => li.textContent?.includes('Polo teste'))!;
    expect(nova).toHaveTextContent('R$ 119,90');
    expect(nova).toHaveTextContent('M · G');
  });

  it('preço inválido não chama a API', async () => {
    const api = await apiLogada();
    const criar = vi.spyOn(api, 'criarPeca');
    renderizarAdmin('/admin/pecas/nova', api);
    await preencher('Polo', 'abc');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(await screen.findByText('Preço inválido.')).toBeInTheDocument();
    expect(criar).not.toHaveBeenCalled();
  });

  it('toque duplo em Salvar com a rede lenta cria uma peça só', async () => {
    const api = await apiLogada();
    let soltar: (p: PecaAdmin) => void = () => undefined;
    const criar = vi.spyOn(api, 'criarPeca').mockImplementation(() => new Promise((ok) => (soltar = ok)));
    renderizarAdmin('/admin/pecas/nova', api);
    await preencher('Polo', '10');
    const salvar = screen.getByRole('button', { name: 'Salvar' });
    await userEvent.click(salvar);
    expect(screen.getByRole('button', { name: 'Salvando…' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Salvando…' }));
    expect(criar).toHaveBeenCalledTimes(1);
    soltar({ id: 'p-x', slug: 'polo', nome: 'Polo', descricao: '', categoriaId: 'c-polos', precoCentavos: 1000, arquivada: false, fotos: [], tamanhos: {}, criadoEm: '' });
  });

  it('arquivar tira da lista; excluir só na arquivada, com confirmação', async () => {
    const api = await apiLogada();
    renderizarAdmin('/admin/pecas/p11', api);
    expect(await screen.findByDisplayValue('Camiseta básica branca')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Excluir' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Arquivar' }));
    expect(await screen.findByRole('button', { name: 'Restaurar' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Excluir' }));
    const dialogo = screen.getByRole('dialog', { name: 'Excluir de vez?' });
    expect(dialogo).toHaveTextContent('As fotos também são apagadas.');
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Excluir peça' }));
    await waitFor(() => expect(screen.getByTestId('caminho')).toHaveTextContent(/^\/admin\/pecas$/));
    expect((await api.carregar()).pecas.find((p) => p.id === 'p11')).toBeUndefined();
  });

  it('peça arquivada só aparece no filtro Arquivadas', async () => {
    const api = await apiLogada();
    await api.arquivarPeca('p11', true);
    renderizarAdmin('/admin/pecas', api);
    await screen.findByRole('heading', { level: 1, name: 'Peças' });
    expect(linhas()).toHaveLength(11);
    await userEvent.click(screen.getByRole('button', { name: 'Arquivadas' }));
    expect(linhas()).toHaveLength(1);
    expect(linhas()[0]).toHaveTextContent('Camiseta básica branca');
  });

  it('trocar a categoria avisa que os tamanhos mudam', async () => {
    renderizarAdmin('/admin/pecas/p01', await apiLogada());
    await userEvent.selectOptions(await screen.findByLabelText('Categoria'), 'Calças');
    expect(screen.getByText('Os tamanhos vão ser os da nova categoria, todos desligados.')).toBeInTheDocument();
  });
});
