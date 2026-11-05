import { useRef, useState } from 'react';
import { kitsDoInicio } from '../vitrine/consultas';
import { useVitrinePronta } from '../vitrine/VitrineContext';
import CartaoKit from './CartaoKit';

/** Kits do início: 1 por vez no celular (deslizando), 2 no tablet e 3 no desktop, com setas para o mouse. */
export default function CarrosselKits() {
  const { vitrine } = useVitrinePronta();
  const kits = kitsDoInicio(vitrine);
  const trilho = useRef<HTMLUListElement>(null);
  const [atual, setAtual] = useState(0);
  if (kits.length === 0) return null;

  const passo = () => trilho.current?.firstElementChild?.clientWidth ?? 0;
  const rolar = (sentido: 1 | -1) => trilho.current?.scrollBy?.({ left: sentido * (passo() + 12), behavior: 'smooth' });

  return (
    <section aria-label="Sugestões de kit" className="relative">
      <ul
        ref={trilho}
        className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:scroll-px-0 md:px-0 [&::-webkit-scrollbar]:hidden"
        onScroll={(e) => setAtual(Math.round(e.currentTarget.scrollLeft / Math.max(1, passo() + 12)))}
      >
        {kits.map((k) => (
          <li key={k.id} className="w-full shrink-0 snap-start md:w-[calc((100%-12px)/2)] lg:w-[calc((100%-24px)/3)]">
            <CartaoKit kit={k} />
          </li>
        ))}
      </ul>
      {kits.length > 1 && (
        <>
          <div className="flex justify-center gap-1 py-2 md:hidden" aria-hidden="true">
            {kits.map((k, i) => (
              <span key={k.id} className={`h-[5px] rounded-full ${i === atual ? 'w-3.5 bg-branco' : 'w-[5px] bg-[#444]'}`} />
            ))}
          </div>
          <div className="mt-3 hidden justify-end gap-2 md:flex">
            <BotaoSeta rotulo="Kits anteriores" onClick={() => rolar(-1)} d="M15 5l-7 7 7 7" />
            <BotaoSeta rotulo="Próximos kits" onClick={() => rolar(1)} d="M9 5l7 7-7 7" />
          </div>
        </>
      )}
    </section>
  );
}

function BotaoSeta({ rotulo, onClick, d }: { rotulo: string; onClick: () => void; d: string }) {
  return (
    <button
      type="button"
      aria-label={rotulo}
      onClick={onClick}
      className="grid size-11 place-items-center rounded-full border border-linha text-branco hover:border-branco"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="size-5" aria-hidden="true">
        <path d={d} />
      </svg>
    </button>
  );
}
