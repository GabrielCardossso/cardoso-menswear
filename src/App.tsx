import { BrowserRouter, Route, Routes } from 'react-router';
import Layout from './components/Layout';
import Inicio from './pages/Inicio';
import NaoEncontrado from './pages/NaoEncontrado';
import { CategoriaProvisoria, KitProvisorio, PecaProvisoria } from './pages/Provisorias';
import { SacolaProvider } from './sacola/SacolaContext';
import { fonteLocal } from './vitrine/fonteLocal';
import { VitrineProvider } from './vitrine/VitrineContext';

export function Rotas() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Inicio />} />
        <Route path="c/:slug" element={<CategoriaProvisoria />} />
        <Route path="k/:slug" element={<KitProvisorio />} />
        <Route path="*" element={<NaoEncontrado />} />
      </Route>
      <Route element={<Layout comCabecalho={false} />}>
        <Route path="p/:slug" element={<PecaProvisoria />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <VitrineProvider fonte={fonteLocal}>
        <SacolaProvider>
          <Rotas />
        </SacolaProvider>
      </VitrineProvider>
    </BrowserRouter>
  );
}
