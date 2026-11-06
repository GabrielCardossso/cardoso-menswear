import { useParams } from 'react-router';
import GradePecas from '../components/GradePecas';
import PilulasCategorias from '../components/PilulasCategorias';
import { esgotadaNaVitrine, pecasDaCategoria } from '../vitrine/consultas';
import { useVitrinePronta } from '../vitrine/VitrineContext';
import NaoEncontrado from './NaoEncontrado';

function Titulo({ children }: { children: string }) {
  return <h1 className="font-titulo text-3xl leading-none uppercase md:text-4xl">{children}</h1>;
}

export default function Categoria() {
  const { slug = '' } = useParams();
  const { vitrine } = useVitrinePronta();
  const cat = vitrine.categorias.find((c) => c.slug === slug);
  const pecas = pecasDaCategoria(vitrine, slug);
  if (!cat || !pecas) return <NaoEncontrado />;
  return (
    <main className="grid gap-4 px-4 md:px-8">
      <PilulasCategorias ativa={cat.slug} />
      <Titulo>{cat.nome}</Titulo>
      {pecas.length > 0 ? <GradePecas pecas={pecas} /> : <p className="text-carpete">Nenhuma peça nesta categoria por enquanto.</p>}
    </main>
  );
}

/** Todas as peças, mais novas primeiro, esgotadas no fim ("Ver tudo" de "Chegou agora"). */
export function Novidades() {
  const { vitrine } = useVitrinePronta();
  const recentes = [...vitrine.pecas].sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
  const pecas = [...recentes.filter((p) => !esgotadaNaVitrine(vitrine, p)), ...recentes.filter((p) => esgotadaNaVitrine(vitrine, p))];
  return (
    <main className="grid gap-4 px-4 md:px-8">
      <PilulasCategorias />
      <Titulo>Novidades</Titulo>
      {pecas.length > 0 ? <GradePecas pecas={pecas} /> : <p className="text-carpete">Nenhuma peça disponível por enquanto.</p>}
    </main>
  );
}
