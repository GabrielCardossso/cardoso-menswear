import { useState, type ReactNode } from 'react';

/** Fotos deslizando de lado, com pontinhos de posição. `sobre` fica por cima (botões de voltar e sacola). */
export default function GaleriaFotos({ fotos, nome, sobre }: { fotos: string[]; nome: string; sobre?: ReactNode }) {
  const [atual, setAtual] = useState(0);
  return (
    <div className="relative bg-linha lg:overflow-hidden lg:rounded-[4px]">
      <ul
        aria-label={`Fotos de ${nome}`}
        className="flex aspect-[4/5] snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        onScroll={(e) => setAtual(Math.round(e.currentTarget.scrollLeft / Math.max(1, e.currentTarget.clientWidth)))}
      >
        {fotos.map((f, i) => (
          <li key={f + i} className="h-full w-full shrink-0 snap-center">
            <img src={f} alt={i === 0 ? nome : ''} className="size-full object-cover" />
          </li>
        ))}
      </ul>
      {fotos.length > 1 && (
        <div className="absolute bottom-2.5 left-1/2 flex -translate-x-1/2 gap-1" aria-hidden="true">
          {fotos.map((f, i) => (
            <span key={f + i} className={`size-[5px] rounded-full ${i === atual ? 'bg-white' : 'bg-white/50'}`} />
          ))}
        </div>
      )}
      {sobre}
    </div>
  );
}
