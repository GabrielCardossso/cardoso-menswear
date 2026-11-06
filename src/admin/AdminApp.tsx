import { useEffect, type ReactNode } from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router';
import { AdminProvider, useAdmin } from './AdminContext';
import BarraAdmin from './componentes/BarraAdmin';
import Botao from './componentes/Botao';
import Categorias from './paginas/Categorias';
import Configuracoes from './paginas/Configuracoes';
import Entrar from './paginas/Entrar';
import KitForm from './paginas/KitForm';
import Kits from './paginas/Kits';
import PecaForm from './paginas/PecaForm';
import Pecas from './paginas/Pecas';
import VisaoGeral from './paginas/VisaoGeral';
import { escolherApi } from './servicos/escolherApi';
import type { ApiAdmin } from './tipos';

let apiPadrao: ApiAdmin | null = null;
/** Criada só quando o painel abre: quem visita a vitrine nunca baixa nem cria o cliente do admin. */
function api() {
  return (apiPadrao ??= escolherApi(import.meta.env));
}

/** O painel não aparece em buscador. */
function useNaoIndexar() {
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex';
    document.head.appendChild(meta);
    const titulo = document.title;
    document.title = 'Painel · Cardoso Menswear';
    return () => {
      meta.remove();
      document.title = titulo;
    };
  }, []);
}

function Aviso({ children }: { children: ReactNode }) {
  return <main className="grid min-h-dvh place-items-center p-6 text-center text-carpete">{children}</main>;
}

/** Rotas com sessão: barra de navegação + página, com os dados já carregados. */
function Protegido() {
  const { sessao, dados, erroCarga, recarregar } = useAdmin();
  if (sessao === 'verificando') return <Aviso>Carregando…</Aviso>;
  if (sessao !== 'ativa') return <Navigate to="/admin/entrar" replace />;
  return (
    <div className="min-h-dvh md:grid md:grid-cols-[200px_1fr]">
      <BarraAdmin />
      <div className="min-w-0 px-4 pt-6 pb-24 md:px-8 md:pb-10">
        {dados ? (
          <Outlet />
        ) : erroCarga ? (
          <div className="grid justify-items-start gap-3">
            <p>Não foi possível carregar o painel.</p>
            <Botao onClick={() => void recarregar()}>Tentar de novo</Botao>
          </div>
        ) : (
          <p className="text-carpete">Carregando…</p>
        )}
      </div>
    </div>
  );
}

function RotasAdmin() {
  const { sessao } = useAdmin();
  useNaoIndexar();
  return (
    <Routes>
      <Route path="entrar" element={sessao === 'verificando' ? <Aviso>Carregando…</Aviso> : <Entrar />} />
      <Route element={<Protegido />}>
        <Route index element={<VisaoGeral />} />
        <Route path="pecas" element={<Pecas />} />
        <Route path="pecas/nova" element={<PecaForm />} />
        <Route path="pecas/:id" element={<PecaForm />} />
        <Route path="kits" element={<Kits />} />
        <Route path="kits/novo" element={<KitForm />} />
        <Route path="kits/:id" element={<KitForm />} />
        <Route path="categorias" element={<Categorias />} />
        <Route path="configuracoes" element={<Configuracoes />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>
    </Routes>
  );
}

/** `/admin/*`. A `api` só é passada nos testes. */
export default function AdminApp({ api: apiDada }: { api?: ApiAdmin }) {
  return (
    <AdminProvider api={apiDada ?? api()}>
      <RotasAdmin />
    </AdminProvider>
  );
}
