import { Link } from 'react-router';
import { resumoKit } from '../lib/rotulos';
import { esgotadaNaVitrine, pecasDoKit, totalDoKit } from '../vitrine/consultas';
import type { Kit } from '../vitrine/tipos';
import { useVitrinePronta } from '../vitrine/VitrineContext';

/** Cartão de kit: foto, "Sugestão de kit", título e "N peças · R$ X" (só as disponíveis). */
export default function CartaoKit({ kit }: { kit: Kit }) {
  const { vitrine } = useVitrinePronta();
  const disponiveis = pecasDoKit(vitrine, kit).filter((p) => !esgotadaNaVitrine(vitrine, p)).length;
  return (
    <Link to={`/k/${kit.slug}`} className="relative block aspect-[4/4.4] overflow-hidden rounded-[4px] bg-linha">
      <img src={kit.foto} alt="" className="size-full object-cover" />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-3 pt-10 pb-3">
        <p className="font-rotulo text-[10px] font-medium tracking-[0.16em] text-[#BDBBB6] uppercase">Sugestão de kit</p>
        <h3 className="mt-1.5 font-titulo text-2xl leading-none uppercase">{kit.titulo}</h3>
        <p className="mt-1 text-sm tabular-nums">{resumoKit(disponiveis, totalDoKit(vitrine, kit))}</p>
      </div>
    </Link>
  );
}
