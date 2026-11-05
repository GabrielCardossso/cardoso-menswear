import { useParams } from 'react-router';
import { buscarKit } from '../vitrine/consultas';
import { useVitrinePronta } from '../vitrine/VitrineContext';
import NaoEncontrado from './NaoEncontrado';

/*
 * Páginas provisórias da Task 8: já tratam o "não encontrada".
 * A Task 11 troca pela página de verdade.
 */

export function KitProvisorio() {
  const { slug = '' } = useParams();
  const kit = buscarKit(useVitrinePronta().vitrine, slug);
  return kit ? <main className="px-4"><h1 className="font-titulo text-3xl uppercase">{kit.titulo}</h1></main> : <NaoEncontrado />;
}
