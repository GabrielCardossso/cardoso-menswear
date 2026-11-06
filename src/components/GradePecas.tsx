import { categoriaDaPeca } from '../vitrine/consultas';
import type { Peca } from '../vitrine/tipos';
import { useVitrinePronta } from '../vitrine/VitrineContext';
import CartaoPeca from './CartaoPeca';

/** Grade de peças: 2 colunas no celular, 3 no tablet, 4 no desktop. */
export default function GradePecas({ pecas, rotulo = 'Peças' }: { pecas: Peca[]; rotulo?: string }) {
  const { vitrine } = useVitrinePronta();
  return (
    <ul aria-label={rotulo} className="grid grid-cols-2 gap-x-2 gap-y-4 md:grid-cols-3 md:gap-x-4 lg:grid-cols-4">
      {pecas.map((p) => (
        <li key={p.id}><CartaoPeca peca={p} categoria={categoriaDaPeca(vitrine, p)} /></li>
      ))}
    </ul>
  );
}
