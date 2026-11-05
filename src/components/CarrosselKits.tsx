import { useState } from 'react';
import { Link } from 'react-router';
import { resumoKit } from '../lib/rotulos';
import { esgotadaNaVitrine, kitsDoInicio, pecasDoKit, totalDoKit } from '../vitrine/consultas';
import { useVitrinePronta } from '../vitrine/VitrineContext';

export default function CarrosselKits() {
  const { vitrine } = useVitrinePronta();
  const kits = kitsDoInicio(vitrine);
  const [atual, setAtual] = useState(0);
  if (kits.length === 0) return null;

  return (
    <section aria-label="Sugestões de kit">
      <ul
        className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        onScroll={(e) => {
          const el = e.currentTarget;
          setAtual(Math.round(el.scrollLeft / Math.max(1, el.firstElementChild?.clientWidth ?? 1)));
        }}
      >
        {kits.map((k) => {
          const disponiveis = pecasDoKit(vitrine, k).filter((p) => !esgotadaNaVitrine(vitrine, p)).length;
          return (
            <li key={k.id} className="w-full shrink-0 snap-center">
              <Link to={`/k/${k.slug}`} className="relative block aspect-[4/4.4] overflow-hidden rounded-[4px] bg-linha">
                <img src={k.foto} alt="" className="size-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-3 pt-10 pb-3">
                  <p className="font-rotulo text-[10px] font-medium tracking-[0.16em] text-[#BDBBB6] uppercase">Sugestão de kit</p>
                  <h3 className="mt-1.5 font-titulo text-2xl leading-none uppercase">{k.titulo}</h3>
                  <p className="mt-1 text-sm tabular-nums">{resumoKit(disponiveis, totalDoKit(vitrine, k))}</p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
      {kits.length > 1 && (
        <div className="flex justify-center gap-1 py-2" aria-hidden="true">
          {kits.map((k, i) => (
            <span key={k.id} className={`h-[5px] rounded-full ${i === atual ? 'w-3.5 bg-branco' : 'w-[5px] bg-[#444]'}`} />
          ))}
        </div>
      )}
    </section>
  );
}
