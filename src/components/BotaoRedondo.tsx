import type { ReactNode } from 'react';

/** Botão redondo escuro sobre a foto: círculo visível de 36 px, área de toque de 44 px. */
export default function BotaoRedondo({ rotulo, onClick, children, className = '' }: {
  rotulo: string;
  onClick(): void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button type="button" aria-label={rotulo} onClick={onClick} className={`grid size-11 place-items-center ${className}`}>
      <span className="grid size-9 place-items-center rounded-full bg-[rgba(10,10,10,.62)] text-branco">{children}</span>
    </button>
  );
}

export function SetaVoltar() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="size-5" aria-hidden="true">
      <path d="M15 5l-7 7 7 7" />
    </svg>
  );
}
