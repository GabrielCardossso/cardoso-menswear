type Props = {
  grade: string[];
  disponiveis: string[];
  escolhido: string | null;
  onEscolher(tamanho: string): void;
};

/** Quadrados de tamanho: escolhido em branco; indisponível riscado e desabilitado. */
export default function GradeTamanhos({ grade, disponiveis, escolhido, onEscolher }: Props) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {grade.map((t) => {
        const livre = disponiveis.includes(t);
        const atual = t === escolhido;
        return (
          <button
            key={t}
            type="button"
            disabled={!livre}
            aria-pressed={livre ? atual : undefined}
            aria-label={livre ? `Tamanho ${t}` : `Tamanho ${t}, indisponível`}
            onClick={() => onEscolher(t)}
            className={`grid h-11 min-w-11 place-items-center rounded-[3px] border px-2 font-rotulo text-sm font-semibold ${
              atual
                ? 'border-branco bg-branco text-preto'
                : livre
                  ? 'border-linha text-branco hover:border-branco'
                  : 'border-linha/60 text-apagado line-through'
            }`}
          >
            {t}
          </button>
        );
      })}
    </div>
  );
}
