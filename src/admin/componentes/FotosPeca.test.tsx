import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { AdminProvider, useAdmin } from '../AdminContext';
import { apiLogada } from '../test/renderizarAdmin';
import type { ApiAdmin } from '../tipos';
import FotosPeca from './FotosPeca';

function Montar({ reduzir }: { reduzir: (b: Blob) => Promise<Blob> }) {
  const { dados } = useAdmin();
  if (!dados) return null;
  return <FotosPeca peca={dados.pecas.find((p) => p.id === 'p01')!} reduzir={reduzir} />;
}

function abrir(api: ApiAdmin, reduzir = vi.fn(async (b: Blob) => new Blob([b], { type: 'image/webp' }))) {
  render(
    <MemoryRouter>
      <AdminProvider api={api}>
        <Montar reduzir={reduzir} />
      </AdminProvider>
    </MemoryRouter>,
  );
  return reduzir;
}

const arquivo = (nome: string) => new File(['x'], nome, { type: 'image/jpeg' });
const fotos = () => within(screen.getByRole('list', { name: 'Fotos da peça' })).getAllByRole('listitem');

describe('fotos da peça', () => {
  it('envia as fotos escolhidas, reduzidas, e a primeira é a capa', async () => {
    const api = await apiLogada();
    const enviar = vi.spyOn(api, 'enviarFotoPeca');
    const reduzir = abrir(api);
    await screen.findByRole('list', { name: 'Fotos da peça' });
    await userEvent.upload(screen.getByLabelText('Adicionar fotos'), [arquivo('a.jpg'), arquivo('b.jpg')]);
    await waitFor(() => expect(fotos()).toHaveLength(3));
    expect(reduzir).toHaveBeenCalledTimes(2);
    expect(enviar).toHaveBeenCalledTimes(2);
    expect(enviar.mock.calls[0][1].type).toBe('image/webp');
    expect(within(fotos()[0]).getByText('Capa')).toBeInTheDocument();
  });

  it('com 5 fotos, enviar 3 manda só 1 e avisa o máximo', async () => {
    const api = await apiLogada();
    for (let i = 0; i < 4; i++) await api.enviarFotoPeca('p01', new Blob(['x']));
    const enviar = vi.spyOn(api, 'enviarFotoPeca');
    abrir(api);
    await waitFor(() => expect(fotos()).toHaveLength(5));
    await userEvent.upload(screen.getByLabelText('Adicionar fotos'), [arquivo('a.jpg'), arquivo('b.jpg'), arquivo('c.jpg')]);
    expect(await screen.findByText('Máximo de 6 fotos.')).toBeInTheDocument();
    await waitFor(() => expect(fotos()).toHaveLength(6));
    expect(enviar).toHaveBeenCalledTimes(1);
    expect(screen.queryByLabelText('Adicionar fotos')).not.toBeInTheDocument();
  });

  it('foto que o navegador não lê avisa e as outras seguem', async () => {
    const api = await apiLogada();
    const reduzir = vi
      .fn()
      .mockRejectedValueOnce(new Error('foto-ilegivel'))
      .mockImplementation(async () => new Blob(['x'], { type: 'image/webp' }));
    abrir(api, reduzir);
    await screen.findByRole('list', { name: 'Fotos da peça' });
    await userEvent.upload(screen.getByLabelText('Adicionar fotos'), [arquivo('a.heic'), arquivo('b.jpg')]);
    expect(await screen.findByText('Não foi possível ler esta foto.')).toBeInTheDocument();
    await waitFor(() => expect(fotos()).toHaveLength(2));
  });

  it('descer a primeira troca a ordem', async () => {
    const api = await apiLogada();
    const nova = await api.enviarFotoPeca('p01', new Blob(['x']));
    const ordenar = vi.spyOn(api, 'ordenarFotosPeca');
    abrir(api);
    await waitFor(() => expect(fotos()).toHaveLength(2));
    const primeira = (await api.carregar()).pecas.find((p) => p.id === 'p01')!.fotos[0].id;
    await userEvent.click(screen.getByRole('button', { name: 'Descer foto 1' }));
    await waitFor(() => expect(ordenar).toHaveBeenCalledWith('p01', [nova.id, primeira]));
  });

  it('remover pede confirmação', async () => {
    const api = await apiLogada();
    const excluir = vi.spyOn(api, 'excluirFotoPeca');
    abrir(api);
    await waitFor(() => expect(fotos()).toHaveLength(1));
    await userEvent.click(screen.getByRole('button', { name: 'Remover foto 1' }));
    const dialogo = screen.getByRole('dialog', { name: 'Remover foto?' });
    expect(excluir).not.toHaveBeenCalled();
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Remover foto' }));
    await waitFor(() => expect(excluir).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.queryByRole('list', { name: 'Fotos da peça' })).not.toBeInTheDocument());
    expect(screen.getByText('Sem fotos ainda.')).toBeInTheDocument();
  });
});
