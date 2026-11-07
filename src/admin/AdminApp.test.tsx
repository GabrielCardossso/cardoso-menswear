import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { AdminProvider, useAdmin } from './AdminContext';
import { criarApiMemoria } from './servicos/apiMemoria';
import { apiLogada, renderizarAdmin } from './test/renderizarAdmin';
import type { ApiAdmin } from './tipos';

describe('entrada no painel', () => {
  it('sem sessão, qualquer rota vai para a entrada', async () => {
    renderizarAdmin('/admin/pecas');
    expect(await screen.findByRole('heading', { name: 'Painel Cardoso' })).toBeInTheDocument();
    expect(screen.getByTestId('caminho')).toHaveTextContent('/admin/entrar');
    expect(screen.getByLabelText('E-mail')).toBeInTheDocument();
    expect(screen.getByLabelText('Senha')).toBeInTheDocument();
  });

  it('entrar leva à visão geral', async () => {
    renderizarAdmin('/admin/entrar');
    await userEvent.type(await screen.findByLabelText('E-mail'), 'gabriel@exemplo.test');
    await userEvent.type(screen.getByLabelText('Senha'), 'qualquer');
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Visão geral' })).toBeInTheDocument();
    expect(screen.getByTestId('caminho')).toHaveTextContent(/^\/admin$/);
  });

  it('e-mail ou senha errados', async () => {
    renderizarAdmin('/admin/entrar');
    await userEvent.type(await screen.findByLabelText('E-mail'), 'sem-arroba');
    await userEvent.type(screen.getByLabelText('Senha'), 'x');
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(await screen.findByText('E-mail ou senha incorretos.')).toBeInTheDocument();
  });

  it('conta sem acesso', async () => {
    renderizarAdmin('/admin/entrar');
    await userEvent.type(await screen.findByLabelText('E-mail'), 'sem-acesso@x.com');
    await userEvent.type(screen.getByLabelText('Senha'), 'x');
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(await screen.findByText('Esta conta não tem acesso ao painel.')).toBeInTheDocument();
  });

  it('com sessão, a entrada vai direto para a visão geral', async () => {
    renderizarAdmin('/admin/entrar', await apiLogada());
    expect(await screen.findByRole('heading', { level: 1, name: 'Visão geral' })).toBeInTheDocument();
  });

  it('Supabase não configurado', async () => {
    const api = { sessao: () => Promise.reject(new Error('supabase-nao-configurado')) } as unknown as ApiAdmin;
    renderizarAdmin('/admin', api);
    expect(await screen.findByText('Supabase não configurado.')).toBeInTheDocument();
  });
});

describe('estrutura', () => {
  it('a barra tem os 5 itens', async () => {
    renderizarAdmin('/admin', await apiLogada());
    const nav = await screen.findByRole('navigation', { name: 'Painel' });
    expect(within(nav).getAllByRole('link').map((l) => l.textContent)).toEqual(['Início', 'Peças', 'Kits', 'Categorias', 'Ajustes']);
  });

  it('marca o painel para não aparecer no Google', async () => {
    renderizarAdmin('/admin', await apiLogada());
    await screen.findByRole('heading', { level: 1, name: 'Visão geral' });
    expect(document.head.querySelector('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  });
});

describe('sessão expirada', () => {
  function Gravar() {
    const { api, dados, tratarErro } = useAdmin();
    return (
      <button type="button" onClick={() => api.salvarConfiguracoes(dados!.configuracoes).catch(tratarErro)}>
        Gravar
      </button>
    );
  }

  it('uma gravação com a sessão vencida volta para a entrada', async () => {
    // Provedor com um botão que grava, sem depender das telas das próximas tasks.
    const api = criarApiMemoria();
    await api.entrar('gabriel@exemplo.test', 'x');
    render(
      <MemoryRouter initialEntries={['/admin/x']}>
        <Routes>
          <Route path="/admin/entrar" element={<p>entrada</p>} />
          <Route
            path="/admin/*"
            element={
              <AdminProvider api={api}>
                <Gravar />
              </AdminProvider>
            }
          />
        </Routes>
      </MemoryRouter>,
    );
    const botao = await screen.findByRole('button', { name: 'Gravar' });
    await waitFor(() => expect(botao).toBeEnabled());
    api.expirarSessao();
    await userEvent.click(botao);
    expect(await screen.findByText('entrada')).toBeInTheDocument();
  });

  it('a entrada mostra o aviso de sessão expirada', async () => {
    renderizarAdmin('/admin/entrar?expirou=1');
    expect(await screen.findByText('Sua sessão expirou. Entre de novo.')).toBeInTheDocument();
  });
});
