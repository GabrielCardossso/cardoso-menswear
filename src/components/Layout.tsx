import { Outlet } from 'react-router';
import { quantidadeDeItens } from '../sacola/regras';
import { useSacola } from '../sacola/SacolaContext';
import { useVitrine } from '../vitrine/VitrineContext';
import Cabecalho from './Cabecalho';
import Rodape from './Rodape';

/** Moldura das páginas: espera a vitrine, mostra cabeçalho (se pedido), conteúdo e rodapé. */
/** `cabecalho="desktop"`: no celular a página mostra seus próprios botões sobre a foto. */
export default function Layout({ cabecalho = 'sempre' }: { cabecalho?: 'sempre' | 'desktop' }) {
  const estado = useVitrine();
  const { sacola, abrir } = useSacola();

  return (
    <div className="mx-auto min-h-dvh max-w-[1200px]">
      <div className={cabecalho === 'desktop' ? 'hidden lg:block' : undefined}>
        <Cabecalho quantidade={quantidadeDeItens(sacola)} onAbrirSacola={abrir} />
      </div>
      {estado.estado === 'carregando' && <Esqueleto />}
      {estado.estado === 'erro' && (
        <main className="grid gap-4 px-4 py-16 text-center">
          <p>Não foi possível carregar a vitrine.</p>
          <button
            type="button"
            onClick={estado.tentarDeNovo}
            className="mx-auto min-h-11 bg-branco px-5 font-rotulo text-sm font-semibold tracking-[0.12em] text-preto uppercase"
          >
            Tentar de novo
          </button>
        </main>
      )}
      {estado.estado === 'pronto' && (
        <>
          <Outlet />
          <Rodape />
        </>
      )}
    </div>
  );
}

function Esqueleto() {
  return (
    <main aria-busy="true" aria-label="Carregando" className="grid gap-3 px-4 pt-2">
      <div className="flex gap-1.5">{[0, 1, 2].map((i) => <div key={i} className="h-11 w-24 rounded-full bg-linha/60" />)}</div>
      <div className="aspect-[4/4.4] rounded-[4px] bg-linha/60" />
      <div className="grid grid-cols-2 gap-2">{[0, 1].map((i) => <div key={i} className="aspect-[3/4] rounded-[3px] bg-linha/60" />)}</div>
    </main>
  );
}
