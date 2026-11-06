import { useState } from 'react';
import { Link } from 'react-router';
import { formatarReais } from '../../lib/dinheiro';
import { useDadosAdmin } from '../AdminContext';
import Titulo, { classeLinkPrincipal } from '../componentes/Titulo';
import { pecaEsgotada } from '../regras';
import type { DadosAdmin, PecaAdmin } from '../tipos';

type Situacao = 'a-venda' | 'esgotadas' | 'arquivadas';

const pilula = (ativa: boolean) =>
  `min-h-10 shrink-0 rounded-full border px-4 font-rotulo text-xs tracking-[0.1em] uppercase ${
    ativa ? 'border-branco bg-branco text-preto' : 'border-linha text-branco hover:border-branco'
  }`;

/** "M · G · GG" na ordem da grade, ou "Esgotada". */
export function resumoTamanhos(d: DadosAdmin, p: PecaAdmin): string {
  const grade = d.categorias.find((c) => c.id === p.categoriaId)?.grade ?? [];
  const ligados = grade.filter((t) => p.tamanhos[t]);
  return ligados.length ? ligados.join(' · ') : 'Esgotada';
}

export default function Pecas() {
  const { api, dados } = useDadosAdmin();
  const [categoria, setCategoria] = useState<string | null>(null);
  const [situacao, setSituacao] = useState<Situacao>('a-venda');

  const lista = dados.pecas
    .filter((p) => (situacao === 'arquivadas' ? p.arquivada : !p.arquivada))
    .filter((p) => situacao !== 'esgotadas' || pecaEsgotada(dados, p))
    .filter((p) => !categoria || p.categoriaId === categoria)
    .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));

  const alternar = (s: Situacao) => setSituacao((atual) => (atual === s ? 'a-venda' : s));

  return (
    <main className="grid gap-4">
      <Titulo
        acoes={
          <Link to="/admin/pecas/nova" className={classeLinkPrincipal}>
            Nova peça
          </Link>
        }
      >
        Peças
      </Titulo>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0" role="group" aria-label="Filtrar por categoria">
        <button type="button" aria-pressed={categoria === null} onClick={() => setCategoria(null)} className={pilula(categoria === null)}>
          Todas
        </button>
        {[...dados.categorias]
          .sort((a, b) => a.ordem - b.ordem)
          .map((c) => (
            <button key={c.id} type="button" aria-pressed={categoria === c.id} onClick={() => setCategoria(c.id)} className={pilula(categoria === c.id)}>
              {c.nome}
            </button>
          ))}
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por situação">
        <button type="button" aria-pressed={situacao === 'esgotadas'} onClick={() => alternar('esgotadas')} className={pilula(situacao === 'esgotadas')}>
          Esgotadas
        </button>
        <button type="button" aria-pressed={situacao === 'arquivadas'} onClick={() => alternar('arquivadas')} className={pilula(situacao === 'arquivadas')}>
          Arquivadas
        </button>
      </div>

      {lista.length === 0 ? (
        <p className="text-carpete">Nenhuma peça aqui.</p>
      ) : (
        <ul aria-label="Peças" className="divide-y divide-linha border-y border-linha">
          {lista.map((p) => {
            const capa = p.fotos[0];
            return (
              <li key={p.id}>
                <Link to={`/admin/pecas/${p.id}`} className="flex items-center gap-3 py-2 hover:bg-white/5">
                  {capa ? (
                    <img src={api.urlDaFoto(capa.path)} alt="" className="size-14 shrink-0 rounded-[3px] object-cover" />
                  ) : (
                    <span className="grid size-14 shrink-0 place-items-center rounded-[3px] border border-linha text-center font-rotulo text-[10px] text-carpete uppercase">
                      Sem foto
                    </span>
                  )}
                  <span className="grid min-w-0 flex-1">
                    <span className="truncate">{p.nome}</span>
                    <span className="text-sm text-carpete">
                      {formatarReais(p.precoCentavos)} · {p.arquivada ? 'Arquivada' : resumoTamanhos(dados, p)}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
