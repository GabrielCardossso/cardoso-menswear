import { useRef, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { formatarReais } from '../../lib/dinheiro';
import { useDadosAdmin } from '../AdminContext';
import Botao from '../componentes/Botao';
import Campo, { CampoEscolha, CampoTexto } from '../componentes/Campo';
import Confirmar from '../componentes/Confirmar';
import FotosPeca from '../componentes/FotosPeca';
import Titulo, { classeLinkBotao } from '../componentes/Titulo';
import { gerarSlug, lerPreco, validarPeca } from '../regras';

/** Uma instância por peça: ao sair de "nova" para a peça criada, o formulário recomeça com os dados salvos. */
export default function PecaForm() {
  const { id } = useParams();
  return <Formulario key={id ?? 'nova'} id={id} />;
}

function Formulario({ id }: { id?: string }) {
  const { api, dados, recarregar, tratarErro } = useDadosAdmin();
  const navigate = useNavigate();
  const location = useLocation();
  const peca = id ? dados.pecas.find((p) => p.id === id) : undefined;

  const [nome, setNome] = useState(peca?.nome ?? '');
  const [preco, setPreco] = useState(peca ? (peca.precoCentavos / 100).toFixed(2).replace('.', ',') : '');
  const [categoriaId, setCategoriaId] = useState(peca?.categoriaId ?? '');
  const [descricao, setDescricao] = useState(peca?.descricao ?? '');
  const [tamanhos, setTamanhos] = useState<Record<string, boolean>>(peca?.tamanhos ?? {});
  const [erros, setErros] = useState<Record<string, string>>({});
  const [aviso, setAviso] = useState((location.state as { salvo?: boolean } | null)?.salvo ? 'Salvo.' : '');
  const [ocupado, setOcupado] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const gravando = useRef(false);

  if (id && !peca) {
    return (
      <main className="grid justify-items-start gap-3">
        <Titulo>Peça não encontrada</Titulo>
        <Link to="/admin/pecas" className={classeLinkBotao}>
          Voltar para peças
        </Link>
      </main>
    );
  }

  const categoria = dados.categorias.find((c) => c.id === categoriaId);
  const centavos = lerPreco(preco);
  const trocouCategoria = !!peca && categoriaId !== peca.categoriaId;
  const emKits = peca ? dados.kits.filter((k) => k.pecaIds.includes(peca.id)).length : 0;

  /** Corre uma gravação por vez (toque duplo no 4G lento não grava duas vezes). */
  async function gravar(acao: () => Promise<void>) {
    if (gravando.current) return;
    gravando.current = true;
    setOcupado(true);
    setAviso('');
    try {
      await acao();
    } catch (e) {
      setAviso(tratarErro(e));
    } finally {
      gravando.current = false;
      setOcupado(false);
    }
  }

  function mudarCategoria(novo: string) {
    setCategoriaId(novo);
    // O banco deixa a peça com a grade da categoria nova, toda desligada (gatilho da etapa 4).
    setTamanhos(peca && novo === peca.categoriaId ? peca.tamanhos : {});
  }

  function salvar(e: FormEvent) {
    e.preventDefault();
    const d = { nome, descricao, categoriaId, precoCentavos: centavos ?? 0, tamanhos };
    const encontrados = validarPeca(d);
    setErros(encontrados);
    if (Object.keys(encontrados).length > 0) return;
    void gravar(async () => {
      if (peca) {
        await api.salvarPeca(peca.id, d);
        await recarregar();
        setAviso('Salvo.');
      } else {
        const nova = await api.criarPeca(d);
        await recarregar();
        navigate(`/admin/pecas/${nova.id}`, { replace: true, state: { salvo: true } });
      }
    });
  }

  return (
    <main className="grid grid-cols-1 max-w-xl gap-5">
      <Link to="/admin/pecas" className="text-sm text-carpete hover:text-branco">
        ← Peças
      </Link>
      <Titulo>{peca ? 'Editar peça' : 'Nova peça'}</Titulo>
      {peca?.arquivada && (
        <p className="rounded-[3px] border border-linha p-3 text-sm">Arquivada: não aparece no site. Restaure para voltar a vender.</p>
      )}

      <form onSubmit={salvar} noValidate className="grid gap-4">
        <Campo rotulo="Nome" value={nome} onChange={(e) => setNome(e.target.value)} erro={erros.nome} maxLength={80} />
        <Campo
          rotulo="Preço"
          inputMode="decimal"
          placeholder="89,90"
          value={preco}
          onChange={(e) => setPreco(e.target.value)}
          erro={erros.preco}
          dica={centavos ? formatarReais(centavos) : 'Ex.: 89,90'}
        />
        <CampoEscolha rotulo="Categoria" value={categoriaId} onChange={(e) => mudarCategoria(e.target.value)} erro={erros.categoriaId}>
          <option value="">Escolha…</option>
          {[...dados.categorias]
            .sort((a, b) => a.ordem - b.ordem)
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
        </CampoEscolha>
        {trocouCategoria && <p className="text-sm">Os tamanhos vão ser os da nova categoria, todos desligados.</p>}

        {categoria && (
          <fieldset className="grid grid-cols-1 gap-2">
            <legend className="mb-1.5 font-rotulo text-xs tracking-[0.12em] text-carpete uppercase">Tamanhos disponíveis</legend>
            <div className="flex flex-wrap gap-1.5">
              {categoria.grade.map((t) => {
                const ligado = tamanhos[t] === true;
                return (
                  <button
                    key={t}
                    type="button"
                    aria-pressed={ligado}
                    aria-label={`Tamanho ${t}`}
                    onClick={() => setTamanhos((atual) => ({ ...atual, [t]: !ligado }))}
                    className={`grid h-11 min-w-11 place-items-center rounded-[3px] border px-2 font-rotulo text-sm font-semibold ${
                      ligado ? 'border-branco bg-branco text-preto' : 'border-linha text-carpete line-through hover:border-branco'
                    }`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
            <p className="text-sm text-carpete">Toque para ligar os tamanhos que você tem.</p>
          </fieldset>
        )}

        <CampoTexto rotulo="Descrição (opcional)" value={descricao} onChange={(e) => setDescricao(e.target.value)} />

        <p className="text-sm text-carpete">
          Endereço: /p/{peca ? peca.slug : gerarSlug(nome || 'nome-da-peca')}
          {!peca && ' (não muda depois de salvar)'}
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <Botao type="submit" variante="principal" ocupado={ocupado}>
            Salvar
          </Botao>
          {aviso && <p role="status">{aviso}</p>}
        </div>
      </form>

      <section aria-labelledby="t-fotos" className="grid gap-2 border-t border-linha pt-5">
        <h2 id="t-fotos" className="font-rotulo text-sm tracking-[0.12em] text-carpete uppercase">
          Fotos
        </h2>
        {peca ? <FotosPeca peca={peca} /> : <p className="text-sm text-carpete">Salve a peça para adicionar fotos.</p>}
      </section>

      {peca && (
        <section className="flex flex-wrap gap-2 border-t border-linha pt-5">
          <Botao
            disabled={ocupado}
            onClick={() =>
              void gravar(async () => {
                await api.arquivarPeca(peca.id, !peca.arquivada);
                await recarregar();
              })
            }
          >
            {peca.arquivada ? 'Restaurar' : 'Arquivar'}
          </Botao>
          {peca.arquivada && (
            <Botao variante="perigo" disabled={ocupado} onClick={() => setConfirmando(true)}>
              Excluir
            </Botao>
          )}
        </section>
      )}

      {confirmando && peca && (
        <Confirmar
          titulo="Excluir de vez?"
          texto={`"${peca.nome}" some do painel. As fotos também são apagadas.${emKits ? ` Ela sai de ${emKits} ${emKits === 1 ? 'kit' : 'kits'}.` : ''}`}
          confirmar="Excluir peça"
          ocupado={ocupado}
          onCancelar={() => setConfirmando(false)}
          onConfirmar={() =>
            void gravar(async () => {
              await api.excluirPeca(peca.id);
              setConfirmando(false);
              navigate('/admin/pecas', { replace: true });
              await recarregar();
            })
          }
        />
      )}
    </main>
  );
}
