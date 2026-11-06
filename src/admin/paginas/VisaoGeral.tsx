import { useState } from 'react';
import { Link } from 'react-router';
import { useDadosAdmin } from '../AdminContext';
import Interruptor from '../componentes/Interruptor';
import Titulo, { classeLinkBotao, classeLinkPrincipal } from '../componentes/Titulo';
import { resumoGeral } from '../regras';

function Numero({ rotulo, valor }: { rotulo: string; valor: number }) {
  return (
    <div className="rounded-[3px] border border-linha p-4">
      <p className="font-rotulo text-xs tracking-[0.12em] text-carpete uppercase">{rotulo}</p>
      <p className="font-titulo text-3xl">{valor}</p>
    </div>
  );
}

export default function VisaoGeral() {
  const { api, dados, recarregar, tratarErro } = useDadosAdmin();
  const { pecasAtivas, esgotadas, kitsComEsgotada } = resumoGeral(dados);
  const [aberta, setAberta] = useState(dados.configuracoes.lojaAberta);
  const [gravando, setGravando] = useState(false);
  const [erro, setErro] = useState('');

  async function mudarLoja(ligada: boolean) {
    setErro('');
    setAberta(ligada);
    setGravando(true);
    try {
      await api.salvarConfiguracoes({ ...dados.configuracoes, lojaAberta: ligada });
      await recarregar();
    } catch (e) {
      setAberta(!ligada);
      setErro(tratarErro(e));
    } finally {
      setGravando(false);
    }
  }

  return (
    <main className="grid gap-6">
      <Titulo
        acoes={
          <>
            <Link to="/admin/pecas/nova" className={classeLinkPrincipal}>
              Nova peça
            </Link>
            <Link to="/admin/kits/novo" className={classeLinkBotao}>
              Novo kit
            </Link>
          </>
        }
      >
        Visão geral
      </Titulo>

      <section className="grid gap-2 rounded-[3px] border border-linha p-4">
        <Interruptor
          rotulo="Loja aberta"
          ligado={aberta}
          desativado={gravando}
          onMudar={(v) => void mudarLoja(v)}
          descricao={aberta ? 'Aberta: recebendo pedidos.' : 'Pausada: o site avisa que a loja não está recebendo pedidos.'}
        />
        {erro && <p role="alert" className="text-sm">{erro}</p>}
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Numero rotulo="Peças à venda" valor={pecasAtivas} />
        <Numero rotulo="Esgotadas" valor={esgotadas.length} />
        <Numero rotulo="Kits com peça esgotada" valor={kitsComEsgotada.length} />
      </section>

      {esgotadas.length > 0 && (
        <section aria-labelledby="t-esgotadas" className="grid gap-2">
          <h2 id="t-esgotadas" className="font-rotulo text-sm tracking-[0.12em] text-carpete uppercase">
            Peças esgotadas
          </h2>
          <ul aria-label="Peças esgotadas" className="divide-y divide-linha border-y border-linha">
            {esgotadas.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-2">
                <span className="min-w-0 truncate">{p.nome}</span>
                <Link to={`/admin/pecas/${p.id}`} aria-label={`Religar tamanhos de ${p.nome}`} className={`${classeLinkBotao} shrink-0`}>
                  Religar tamanhos
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {kitsComEsgotada.length > 0 && (
        <section aria-labelledby="t-kits" className="grid gap-2">
          <h2 id="t-kits" className="font-rotulo text-sm tracking-[0.12em] text-carpete uppercase">
            Kits afetados
          </h2>
          <ul aria-label="Kits com peça esgotada" className="divide-y divide-linha border-y border-linha">
            {kitsComEsgotada.map((k) => (
              <li key={k.id} className="py-2">
                <Link to={`/admin/kits/${k.id}`} className="flex min-h-11 items-center hover:underline">
                  {k.titulo}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
