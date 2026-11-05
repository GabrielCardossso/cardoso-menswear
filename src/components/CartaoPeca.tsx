import { Link } from 'react-router';
import { formatarReais } from '../lib/dinheiro';
import { tamanhosDisponiveis } from '../vitrine/consultas';
import type { Categoria, Peca } from '../vitrine/tipos';

export default function CartaoPeca({ peca, categoria }: { peca: Peca; categoria: Categoria | null }) {
  const tamanhos = categoria ? tamanhosDisponiveis(peca, categoria) : [];
  const esgotada = tamanhos.length === 0;
  return (
    <Link to={`/p/${peca.slug}`} className={`group block ${esgotada ? 'opacity-50' : ''}`}>
      <div className="aspect-[3/4] overflow-hidden rounded-[3px] bg-linha">
        <img src={peca.fotos[0]} alt="" loading="lazy" className="size-full object-cover" />
      </div>
      <p className="mt-1.5 text-[13px] leading-tight font-medium">{peca.nome}</p>
      <p className="font-rotulo text-[13px] font-semibold">{formatarReais(peca.precoCentavos)}</p>
      <p className="font-rotulo text-[11px] tracking-[0.06em] text-carpete uppercase">
        {esgotada ? 'Esgotado' : tamanhos.join(' · ')}
      </p>
    </Link>
  );
}
