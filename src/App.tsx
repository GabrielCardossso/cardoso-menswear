import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router';
import Layout from './components/Layout';
import Inicio from './pages/Inicio';
import NaoEncontrado from './pages/NaoEncontrado';
import Categoria, { Novidades } from './pages/Categoria';
import Finalizar from './pages/Finalizar';
import Kits from './pages/Kits';
import Peca from './pages/Peca';
import Kit from './pages/Kit';
import { SacolaProvider } from './sacola/SacolaContext';
import { escolherFonte } from './vitrine/escolherFonte';
import { VitrineProvider } from './vitrine/VitrineContext';

export function Rotas() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Inicio />} />
        <Route path="c/:slug" element={<Categoria />} />
        <Route path="kits" element={<Kits />} />
        <Route path="novidades" element={<Novidades />} />
        <Route path="finalizar" element={<Finalizar />} />
        <Route path="*" element={<NaoEncontrado />} />
      </Route>
      <Route element={<Layout cabecalho="desktop" />}>
        <Route path="p/:slug" element={<Peca />} />
        <Route path="k/:slug" element={<Kit />} />
      </Route>
    </Routes>
  );
}

// Criada uma vez: Supabase se houver ambiente; senão o JSON de exemplo (só fora do build de produção).
const fonte = escolherFonte(import.meta.env);

// O painel é baixado só em /admin, e fica fora da vitrine e da sacola.
const AdminApp = lazy(() => import('./admin/AdminApp'));

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/admin/*"
          element={
            <Suspense fallback={null}>
              <AdminApp />
            </Suspense>
          }
        />
        <Route
          path="*"
          element={
            <VitrineProvider fonte={fonte}>
              <SacolaProvider>
                <Rotas />
              </SacolaProvider>
            </VitrineProvider>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
