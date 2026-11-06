type Props = { quantidade: number };

/** Sacola em contorno (direção A), com o número de itens num selo no canto. */
export default function IconeSacola({ quantidade }: Props) {
  return (
    <span className="relative inline-block size-7 text-branco" aria-hidden="true">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.7}
        strokeLinejoin="round"
        strokeLinecap="round"
        className="block size-full"
      >
        <path d="M4.6 8.2h14.8l-1.3 12a1.6 1.6 0 0 1-1.6 1.4H7.5a1.6 1.6 0 0 1-1.6-1.4Z" />
        <path d="M8.8 10.6V6.8a3.2 3.2 0 0 1 6.4 0v3.8" />
      </svg>
      {quantidade > 0 && (
        <span className="absolute -top-1 -right-1.5 grid size-4 place-items-center rounded-full bg-branco font-rotulo text-[10px] leading-none font-bold text-preto shadow-[0_0_0_2px_var(--color-preto)]">
          {quantidade > 99 ? '99+' : quantidade}
        </span>
      )}
    </span>
  );
}

export function rotuloSacola(quantidade: number) {
  return `Sacola, ${quantidade} ${quantidade === 1 ? 'item' : 'itens'}`;
}
