import type { ComponentPropsWithRef } from 'react';

type Props = ComponentPropsWithRef<'button'> & {
  variante?: 'principal' | 'secundario' | 'perigo' | 'discreto';
  /** Enquanto grava: desativado e com o texto "Salvando…" (ou `textoOcupado`). */
  ocupado?: boolean;
  textoOcupado?: string;
};

const estilos = {
  principal: 'bg-branco text-preto hover:bg-white',
  secundario: 'border border-linha text-branco hover:border-branco',
  perigo: 'border border-linha text-branco hover:border-branco hover:bg-[#2a1414]',
  discreto: 'text-carpete hover:text-branco',
};

export default function Botao({ variante = 'secundario', ocupado, textoOcupado = 'Salvando…', disabled, children, className, type, ...props }: Props) {
  return (
    <button
      type={type ?? 'button'}
      disabled={disabled || ocupado}
      aria-busy={ocupado || undefined}
      {...props}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-[3px] px-4 font-rotulo text-sm font-semibold tracking-[0.08em] uppercase disabled:opacity-50 ${estilos[variante]} ${className ?? ''}`}
    >
      {ocupado ? textoOcupado : children}
    </button>
  );
}
