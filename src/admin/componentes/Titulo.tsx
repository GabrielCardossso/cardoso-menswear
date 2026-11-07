import type { ReactNode } from 'react';

/** Título da página do painel, com ações opcionais à direita. */
export default function Titulo({ children, acoes }: { children: ReactNode; acoes?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <h1 className="font-titulo text-3xl leading-none uppercase md:text-4xl">{children}</h1>
      {acoes && <div className="flex flex-wrap gap-2">{acoes}</div>}
    </div>
  );
}

/** Link com cara de botão (navegação dentro do painel). */
export const classeLinkBotao =
  'inline-flex min-h-11 items-center justify-center rounded-[3px] border border-linha px-4 font-rotulo text-sm font-semibold tracking-[0.08em] uppercase hover:border-branco';
export const classeLinkPrincipal =
  'inline-flex min-h-11 items-center justify-center rounded-[3px] bg-branco px-4 font-rotulo text-sm font-semibold tracking-[0.08em] text-preto uppercase';
