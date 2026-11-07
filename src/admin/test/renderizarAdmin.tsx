import { render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import AdminApp from '../AdminApp';
import { criarApiMemoria } from '../servicos/apiMemoria';
import type { ApiAdmin } from '../tipos';

/** Mostra o caminho atual, para os testes conferirem redirecionamentos. */
function Caminho() {
  const l = useLocation();
  return <output data-testid="caminho">{l.pathname + l.search}</output>;
}

/** Monta o painel em `caminho` com a API dada (por padrão, em memória e sem sessão). */
export function renderizarAdmin(caminho: string, api: ApiAdmin = criarApiMemoria(), extra?: ReactNode) {
  return render(
    <MemoryRouter initialEntries={[caminho]}>
      <Routes>
        <Route path="/admin/*" element={<AdminApp api={api} />} />
      </Routes>
      <Caminho />
      {extra}
    </MemoryRouter>,
  );
}

/** API em memória já com sessão. */
export async function apiLogada() {
  const api = criarApiMemoria();
  await api.entrar('gabriel@exemplo.test', 'qualquer');
  return api;
}
