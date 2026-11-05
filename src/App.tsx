import { BrowserRouter, Route, Routes } from 'react-router';
import Layout from './components/Layout';
import Inicio from './pages/Inicio';
import NaoEncontrado from './pages/NaoEncontrado';
import Categoria, { Novidades } from './pages/Categoria';
import Kits from './pages/Kits';
import Peca from './pages/Peca';
import Kit from './pages/Kit';
import { SacolaProvider } from './sacola/SacolaContext';
import { fonteLocal } from './vitrine/fonteLocal';
import { VitrineProvider } from './vitrine/VitrineContext';

export function Rotas() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Inicio />} />
        <Route path="c/:slug" element={<Categoria />} />
        <Route path="kits" element={<Kits />} />
        <Route path="novidades" element={<Novidades />} />
        <Route path="*" element={<NaoEncontrado />} />
      </Route>
      <Route element={<Layout cabecalho="desktop" />}>
        <Route path="p/:slug" element={<Peca />} />
        <Route path="k/:slug" element={<Kit />} />
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
