import { useState } from 'react';
import { Link, useParams } from 'react-router';
import BotaoRedondo, { SetaVoltar } from '../components/BotaoRedondo';
import GradeTamanhos from '../components/GradeTamanhos';
import { formatarReais } from '../lib/dinheiro';
import { useSacola } from '../sacola/SacolaContext';
import { buscarKit, categoriaDaPeca, pecasDoKit, tamanhosDisponiveis } from '../vitrine/consultas';
import type { Peca } from '../vitrine/tipos';
import { useVitrinePronta } from '../vitrine/VitrineContext';
import NaoEncontrado from './NaoEncontrado';
import { useVoltar } from './Peca';

type Escolha = { marcada: boolean; tamanho: string | null };

export default function Kit() {
  const { slug = '' } = useParams();
  const { vitrine } = useVitrinePronta();
  const { adicionar, abrir } = useSacola();
  const voltar = useVoltar();
  const kit = buscarKit(vitrine, slug);
  const pecas = kit ? pecasDoKit(vitrine, kit) : [];

  const disponiveisDe = (p: Peca) => {
    const cat = categoriaDaPeca(vitrine, p);
    return cat ? tamanhosDisponiveis(p, cat) : [];
  };
  const [escolhas, setEscolhas] = useState<Record<string, Escolha>>(() =>
    Object.fromEntries(pecas.map((p) => [p.id, { marcada: disponiveisDe(p).length > 0, tamanho: null }])),
  );
  if (!kit) return <NaoEncontrado />;

  const escolha = (id: string): Escolha => escolhas[id] ?? { marcada: false, tamanho: null };
  const mudar = (id: string, m: Partial<Escolha>) => setEscolhas((e) => ({ ...e, [id]: { ...escolha(id), ...m } }));
  const marcadas = pecas.filter((p) => escolha(p.id).marcada);
  const total = marcadas.reduce((s, p) => s + p.precoCentavos, 0);
  const pronto = marcadas.length > 0 && marcadas.every((p) => escolha(p.id).tamanho);

  function adicionarKit() {
    if (!kit || !pronto) return;
    adicionar(
      marcadas.map((p) => ({
        pecaId: p.id, nome: p.nome, tamanho: escolha(p.id).tamanho!, precoUnitarioCentavos: p.precoCentavos, quantidade: 1, kitId: kit.id,
      })),
    );
    abrir();
  }

  return (
    <main className="lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-start lg:gap-10 lg:px-8">
      <div className="relative bg-linha lg:sticky lg:top-4 lg:overflow-hidden lg:rounded-[4px]">
        <img src={kit.foto} alt={kit.titulo} className="aspect-[4/5] w-full object-cover" />
        <div className="absolute top-0 left-0 px-1.5 pt-[max(6px,env(safe-area-inset-top))] lg:hidden">
          <BotaoRedondo rotulo="Voltar" onClick={voltar}><SetaVoltar /></BotaoRedondo>
        </div>
      </div>

      <div className="grid gap-4 px-4 pt-4 pb-28 lg:px-0 lg:pt-0 lg:pb-0">
        <div className="grid gap-1.5">
          <p className="font-rotulo text-[11px] font-medium tracking-[0.16em] text-carpete uppercase">Sugestão de kit</p>
          <h1 className="font-titulo text-[28px] leading-none uppercase lg:text-5xl">{kit.titulo}</h1>
          {kit.descricao && <p className="text-[15px] text-branco/80">{kit.descricao}</p>}
        </div>

        <ul className="grid gap-3">
          {pecas.map((p) => {
            const livres = disponiveisDe(p);
            const esgotada = livres.length === 0;
            const e = escolha(p.id);
            const cat = categoriaDaPeca(vitrine, p);
            return (
              <li key={p.id}>
                <fieldset aria-label={p.nome} className={`grid gap-2.5 border border-linha p-3 ${e.marcada ? '' : 'opacity-60'}`}>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id={`levar-${p.id}`}
                      checked={e.marcada}
                      disabled={esgotada}
                      onChange={(ev) => mudar(p.id, { marcada: ev.target.checked })}
                      className="size-5 shrink-0 accent-branco"
                      aria-label={`Levar ${p.nome}`}
                    />
                    <img src={p.fotos[0]} alt="" className="size-12 shrink-0 rounded-[3px] object-cover" />
                    <div className="min-w-0 flex-1">
                      <Link to={`/p/${p.slug}`} className="block text-sm leading-tight font-medium hover:underline">{p.nome}</Link>
                      <p className="font-rotulo text-sm font-semibold tabular-nums">{formatarReais(p.precoCentavos)}</p>
                    </div>
                    {esgotada && <span className="font-rotulo text-[11px] tracking-[0.12em] text-carpete uppercase">Esgotado</span>}
                  </div>
                  {!esgotada && e.marcada && cat && (
                    <GradeTamanhos grade={cat.grade} disponiveis={livres} escolhido={e.tamanho} onEscolher={(t) => mudar(p.id, { tamanho: t })} />
                  )}
                </fieldset>
              </li>
            );
          })}
        </ul>

        <div className="fixed inset-x-0 bottom-0 bg-preto/95 px-4 pt-3 pb-[max(14px,env(safe-area-inset-bottom))] lg:static lg:bg-transparent lg:p-0">
          <button
            type="button"
            disabled={!pronto}
            onClick={adicionarKit}
            className="flex w-full justify-between bg-branco px-4 py-4 font-rotulo text-sm font-semibold tracking-[0.12em] text-preto uppercase disabled:bg-linha disabled:text-carpete"
          >
            <span>Adicionar à sacola</span>
            <span className="tabular-nums">{formatarReais(total)}</span>
          </button>
        </div>
      </div>
    </main>
  );
}
