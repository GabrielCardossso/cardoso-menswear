import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import BotaoRedondo, { SetaVoltar } from '../components/BotaoRedondo';
import GaleriaFotos from '../components/GaleriaFotos';
import GradeTamanhos from '../components/GradeTamanhos';
import IconeSacola, { rotuloSacola } from '../components/IconeSacola';
import { formatarReais } from '../lib/dinheiro';
import { QTD_MAX, quantidadeDeItens } from '../sacola/regras';
import { useSacola } from '../sacola/SacolaContext';
import { buscarPeca, categoriaDaPeca, kitsComPeca, tamanhosDisponiveis } from '../vitrine/consultas';
import { useVitrinePronta } from '../vitrine/VitrineContext';
import NaoEncontrado from './NaoEncontrado';

/** Voltar: página anterior do site, ou o início quando a peça foi aberta direto pelo link. */
export function useVoltar() {
  const navigate = useNavigate();
  const { key } = useLocation();
  return () => (key === 'default' ? navigate('/') : navigate(-1));
}

export default function Peca() {
  const { slug = '' } = useParams();
  const { vitrine } = useVitrinePronta();
  const { sacola, adicionar, abrir } = useSacola();
  const voltar = useVoltar();
  const [tamanho, setTamanho] = useState<string | null>(null);
  const [qtd, setQtd] = useState(1);
  const [pedirTamanho, setPedirTamanho] = useState(false);

  const peca = buscarPeca(vitrine, slug);
  const cat = peca && categoriaDaPeca(vitrine, peca);
  if (!peca || !cat) return <NaoEncontrado />;

  const disponiveis = tamanhosDisponiveis(peca, cat);
  const esgotada = disponiveis.length === 0;
  const kits = kitsComPeca(vitrine, peca.id);

  function adicionarNaSacola() {
    if (!peca || !tamanho) return setPedirTamanho(true);
    adicionar([{ pecaId: peca.id, nome: peca.nome, tamanho, precoUnitarioCentavos: peca.precoCentavos, quantidade: qtd }]);
    abrir();
  }

  return (
    <main className="lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-start lg:gap-10 lg:px-8">
      <div className="lg:sticky lg:top-4">
        <GaleriaFotos
          fotos={peca.fotos}
          nome={peca.nome}
          sobre={
            <div className="absolute inset-x-0 top-0 flex justify-between px-1.5 pt-[max(6px,env(safe-area-inset-top))]">
              <BotaoRedondo rotulo="Voltar" onClick={voltar}><SetaVoltar /></BotaoRedondo>
              <BotaoRedondo rotulo={rotuloSacola(quantidadeDeItens(sacola))} onClick={abrir} className="lg:hidden">
                <span className="scale-[0.8]"><IconeSacola quantidade={quantidadeDeItens(sacola)} /></span>
              </BotaoRedondo>
            </div>
          }
        />
      </div>

      <div className="grid gap-3 px-4 pt-3 pb-28 lg:px-0 lg:pt-0 lg:pb-0">
        <p className="font-rotulo text-[11px] font-medium tracking-[0.16em] text-carpete uppercase">{cat.nome}</p>
        <h1 className="font-titulo text-[28px] leading-none uppercase lg:text-5xl">{peca.nome}</h1>
        <p className="font-rotulo text-xl font-semibold tabular-nums">{formatarReais(peca.precoCentavos)}</p>
        {peca.descricao && <p className="text-[15px] text-branco/80">{peca.descricao}</p>}

        {!esgotada && (
          <>
            <GradeTamanhos
              grade={cat.grade}
              disponiveis={disponiveis}
              escolhido={tamanho}
              onEscolher={(t) => { setTamanho(t); setPedirTamanho(false); }}
            />
            {pedirTamanho && <p role="alert" className="font-rotulo text-sm tracking-[0.06em] uppercase">Escolha o tamanho</p>}
            <div className="flex items-center gap-3">
              <span className="font-rotulo text-xs tracking-[0.12em] text-carpete uppercase">Quantidade</span>
              <div className="flex items-center border border-linha">
                <button type="button" aria-label="Diminuir quantidade" disabled={qtd <= 1} onClick={() => setQtd((q) => q - 1)} className="size-11 text-lg disabled:text-apagado">−</button>
                <span className="w-8 text-center font-rotulo font-semibold tabular-nums" aria-live="polite">{qtd}</span>
                <button type="button" aria-label="Aumentar quantidade" disabled={qtd >= QTD_MAX} onClick={() => setQtd((q) => q + 1)} className="size-11 text-lg disabled:text-apagado">+</button>
              </div>
            </div>
          </>
        )}

        {kits.map((k) => (
          <Link key={k.id} to={`/k/${k.slug}`} className="text-sm text-carpete underline underline-offset-4">
            Faz parte do kit “{k.titulo}”
          </Link>
        ))}

        <div className="fixed inset-x-0 bottom-0 bg-preto/95 px-4 pt-3 pb-[max(14px,env(safe-area-inset-bottom))] lg:static lg:mt-2 lg:bg-transparent lg:p-0">
          <button
            type="button"
            disabled={esgotada}
            onClick={adicionarNaSacola}
            className="w-full bg-branco py-4 font-rotulo text-sm font-semibold tracking-[0.12em] text-preto uppercase disabled:bg-linha disabled:text-carpete"
          >
            {esgotada ? 'Esgotado' : 'Adicionar à sacola'}
          </button>
        </div>
      </div>
    </main>
  );
}
