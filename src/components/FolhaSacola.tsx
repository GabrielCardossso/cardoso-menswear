import { useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { formatarReais } from '../lib/dinheiro';
import { QTD_MAX, totalCentavos } from '../sacola/regras';
import { useSacola } from '../sacola/SacolaContext';
import { useVitrine } from '../vitrine/VitrineContext';

/** Sacola: painel que sobe do rodapé no celular e abre na lateral direita no desktop. */
export default function FolhaSacola() {
  const { sacola, aberta, fechar, alterar, remover } = useSacola();
  const estado = useVitrine();
  const fecharRef = useRef<HTMLButtonElement>(null);
  const quemAbriu = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!aberta) return;
    quemAbriu.current = document.activeElement as HTMLElement | null;
    fecharRef.current?.focus();
    const aoTeclar = (e: KeyboardEvent) => e.key === 'Escape' && fechar();
    document.addEventListener('keydown', aoTeclar);
    const rolagem = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', aoTeclar);
      document.body.style.overflow = rolagem;
      quemAbriu.current?.focus();
    };
  }, [aberta, fechar]);

  if (!aberta) return null;
  const vitrine = estado.estado === 'pronto' ? estado.vitrine : null;
  const fotoDe = (pecaId: string) => vitrine?.pecas.find((p) => p.id === pecaId)?.fotos[0];
  const lojaAberta = vitrine?.configuracoes.lojaAberta ?? true;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/70" onClick={fechar} aria-hidden="true" />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-sacola"
        className="absolute inset-x-0 bottom-0 flex max-h-[88dvh] flex-col rounded-t-[10px] border-t border-linha bg-preto lg:inset-y-0 lg:right-0 lg:left-auto lg:max-h-none lg:w-[420px] lg:rounded-none lg:border-t-0 lg:border-l"
      >
        <header className="flex items-center justify-between px-4 pt-3 pb-2">
          <h2 id="titulo-sacola" className="font-titulo text-2xl uppercase">Sacola</h2>
          <button ref={fecharRef} type="button" onClick={fechar} aria-label="Fechar" className="grid size-11 place-items-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="size-5" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </header>

        {sacola.itens.length === 0 ? (
          <div className="grid gap-4 px-4 pt-6 pb-[max(24px,env(safe-area-inset-bottom))] text-center">
            <p className="text-carpete">Sua sacola está vazia</p>
            <Link to="/kits" onClick={fechar} className="mx-auto flex min-h-11 items-center border border-branco px-5 font-rotulo text-sm font-semibold tracking-[0.12em] uppercase">
              Ver os kits
            </Link>
          </div>
        ) : (
          <>
            <ul className="grid flex-1 gap-3 overflow-y-auto px-4 py-2">
              {sacola.itens.map((i) => {
                const nome = `${i.nome} tam. ${i.tamanho}`;
                return (
                  <li key={i.pecaId + i.tamanho} aria-label={`${i.nome}, tam. ${i.tamanho}`} className="flex gap-3 border-b border-linha pb-3">
                    <div className="size-16 shrink-0 overflow-hidden rounded-[3px] bg-linha">
                      {fotoDe(i.pecaId) && <img src={fotoDe(i.pecaId)} alt="" className="size-full object-cover" />}
                    </div>
                    <div className="grid min-w-0 flex-1 gap-1">
                      <p className="text-sm leading-tight font-medium">{i.nome}</p>
                      <p className="font-rotulo text-xs tracking-[0.06em] text-carpete"><span>tam. {i.tamanho}</span> · <span>{formatarReais(i.precoUnitarioCentavos)} cada</span></p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center border border-linha">
                          <button type="button" aria-label={`Diminuir ${nome}`} disabled={i.quantidade <= 1} onClick={() => alterar(i.pecaId, i.tamanho, i.quantidade - 1)} className="size-9 disabled:text-apagado">−</button>
                          <span className="w-7 text-center font-rotulo text-sm font-semibold tabular-nums">{i.quantidade}</span>
                          <button type="button" aria-label={`Aumentar ${nome}`} disabled={i.quantidade >= QTD_MAX} onClick={() => alterar(i.pecaId, i.tamanho, i.quantidade + 1)} className="size-9 disabled:text-apagado">+</button>
                        </div>
                        <span className="font-rotulo text-sm font-semibold tabular-nums">{formatarReais(i.precoUnitarioCentavos * i.quantidade)}</span>
                      </div>
                      <button type="button" aria-label={`Remover ${nome}`} onClick={() => remover(i.pecaId, i.tamanho)} className="justify-self-start py-1 font-rotulo text-[11px] tracking-[0.12em] text-carpete uppercase underline-offset-4 hover:underline">
                        Remover
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
            <footer className="grid gap-3 border-t border-linha px-4 pt-3 pb-[max(16px,env(safe-area-inset-bottom))]">
              <p className="flex justify-between font-rotulo text-sm font-semibold tracking-[0.06em] uppercase">
                <span>Total das peças</span>
                <span className="tabular-nums">{formatarReais(totalCentavos(sacola))}</span>
              </p>
              {lojaAberta ? (
                <Link to="/finalizar" onClick={fechar} className="block bg-branco py-4 text-center font-rotulo text-sm font-semibold tracking-[0.12em] text-preto uppercase">
                  Finalizar pelo WhatsApp
                </Link>
              ) : (
                <p className="text-sm text-carpete">
                  Pedidos pausados no momento. Fale com a gente no Instagram.{' '}
                  <a href={vitrine?.configuracoes.instagramUrl} target="_blank" rel="noreferrer" className="text-branco underline underline-offset-4">Instagram</a>
                </p>
              )}
            </footer>
          </>
        )}
      </section>
    </div>
  );
}
