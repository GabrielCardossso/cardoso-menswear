import { useParams } from 'react-router';
import { buscarKit, buscarPeca } from '../vitrine/consultas';
import { useVitrinePronta } from '../vitrine/VitrineContext';
import NaoEncontrado from './NaoEncontrado';

/*
 * Páginas provisórias da Task 8: já tratam o "não encontrada".
 * As Tasks 9, 10 e 11 trocam cada uma pela página de verdade.
 */

export function CategoriaProvisoria() {
  const { slug = '' } = useParams();
  const { vitrine } = useVitrinePronta();
  const cat = vitrine.categorias.find((c) => c.slug === slug);
  return cat ? <main className="px-4"><h1 className="font-titulo text-3xl uppercase">{cat.nome}</h1></main> : <NaoEncontrado />;
}

export function PecaProvisoria() {
  const { slug = '' } = useParams();
  const peca = buscarPeca(useVitrinePronta().vitrine, slug);
  return peca ? <main className="px-4"><h1 className="font-titulo text-3xl uppercase">{peca.nome}</h1></main> : <NaoEncontrado />;
}

export function KitProvisorio() {
  const { slug = '' } = useParams();
  const kit = buscarKit(useVitrinePronta().vitrine, slug);
  return kit ? <main className="px-4"><h1 className="font-titulo text-3xl uppercase">{kit.titulo}</h1></main> : <NaoEncontrado />;
}
