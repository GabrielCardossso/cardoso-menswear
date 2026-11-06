import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { formatarReais } from '../../lib/dinheiro';
import { useDadosAdmin } from '../AdminContext';
import Botao from '../componentes/Botao';
import Campo, { CampoTexto } from '../componentes/Campo';
import Confirmar from '../componentes/Confirmar';
import Interruptor from '../componentes/Interruptor';
import Titulo, { classeLinkBotao } from '../componentes/Titulo';
import { pecaEsgotada, validarKit } from '../regras';
import { reduzirFoto } from '../servicos/reduzirFoto';

const MAX_PECAS = 4;
const semAcento = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const seta = 'grid size-11 shrink-0 place-items-center rounded-[3px] border border-linha disabled:opacity-30 hover:border-branco';

/** Uma instância por kit (ao sair de "novo" para o kit criado, recomeça com os dados salvos). */
export default function KitForm() {
  const { id } = useParams();
  return <Formulario key={id ?? 'novo'} id={id} />;
}

function Formulario({ id }: { id?: string }) {
  const { api, dados, recarregar, tratarErro } = useDadosAdmin();
  const navigate = useNavigate();
  const location = useLocation();
  const kit = id ? dados.kits.find((k) => k.id === id) : undefined;

  const [titulo, setTitulo] = useState(kit?.titulo ?? '');
  const [descricao, setDescricao] = useState(kit?.descricao ?? '');
  const [pecaIds, setPecaIds] = useState<string[]>(kit?.pecaIds ?? []);
  const [busca, setBusca] = useState('');
  const [erros, setErros] = useState<Record<string, string>>({});
  const [aviso, setAviso] = useState((location.state as { salvo?: boolean } | null)?.salvo ? 'Salvo.' : '');
  const [ocupado, setOcupado] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const gravando = useRef(false);

  if (id && !kit) {
    return (
      <main className="grid justify-items-start gap-3">
        <Titulo>Kit não encontrado</Titulo>
        <Link to="/admin/kits" className={classeLinkBotao}>
          Voltar para kits
        </Link>
      </main>
    );
  }

  const pecaPorId = (pid: string) => dados.pecas.find((p) => p.id === pid);
  const total = pecaIds
    .map(pecaPorId)
    .filter((p) => p && !p.arquivada && !pecaEsgotada(dados, p))
    .reduce((soma, p) => soma + p!.precoCentavos, 0);
  const cheio = pecaIds.length >= MAX_PECAS;
  const termo = semAcento(busca.trim());
  const palavras = termo.split(/\s+/).filter(Boolean);
  const resultados = termo
    ? dados.pecas.filter((p) => !p.arquivada && !pecaIds.includes(p.id) && palavras.every((w) => semAcento(p.nome).includes(w))).slice(0, 8)
    : [];

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

  function mover(de: number, para: number) {
    setPecaIds((atual) => {
      const n = [...atual];
      [n[de], n[para]] = [n[para], n[de]];
      return n;
    });
  }

  function salvar(e: FormEvent) {
    e.preventDefault();
    const d = { titulo, descricao, pecaIds };
    const encontrados = validarKit(d);
    setErros(encontrados);
    if (Object.keys(encontrados).length > 0) return;
    void gravar(async () => {
      if (kit) {
        await api.salvarKit(kit.id, d);
        await recarregar();
        setAviso('Salvo.');
      } else {
        const novo = await api.criarKit(d);
        await recarregar();
        navigate(`/admin/kits/${novo.id}`, { replace: true, state: { salvo: true } });
      }
    });
  }

  function escolherFoto(e: ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    e.target.value = '';
    if (!arquivo || !kit) return;
    void gravar(async () => {
      let foto: Blob;
      try {
        foto = await reduzirFoto(arquivo);
      } catch {
        setAviso('Não foi possível ler esta foto.');
        return;
      }
      await api.enviarFotoKit(kit.id, foto);
      await recarregar();
    });
  }

  const capa = kit?.fotoPath ?? (pecaIds[0] ? pecaPorId(pecaIds[0])?.fotos[0]?.path : undefined);

  return (
    <main className="grid grid-cols-1 max-w-xl gap-5">
      <Link to="/admin/kits" className="text-sm text-carpete hover:text-branco">
        ← Kits
      </Link>
      <Titulo>{kit ? 'Editar kit' : 'Novo kit'}</Titulo>

      {kit && (
        <section className="rounded-[3px] border border-linha p-4">
          <Interruptor
            rotulo="Publicado"
            ligado={kit.publicado}
            desativado={ocupado || Object.keys(validarKit({ titulo, descricao, pecaIds })).length > 0}
            descricao={kit.publicado ? 'Aparece no carrossel do site.' : 'Oculto: não aparece no site.'}
            onMudar={(v) =>
              void gravar(async () => {
                await api.publicarKit(kit.id, v);
                await recarregar();
              })
            }
          />
        </section>
      )}

      <form onSubmit={salvar} noValidate className="grid gap-4">
        <Campo rotulo="Título" value={titulo} onChange={(e) => setTitulo(e.target.value)} erro={erros.titulo} maxLength={80} />
        <CampoTexto rotulo="Descrição (opcional)" value={descricao} onChange={(e) => setDescricao(e.target.value)} />

        <fieldset className="grid grid-cols-1 gap-3">
          <legend className="mb-1.5 font-rotulo text-xs tracking-[0.12em] text-carpete uppercase">Peças (de 2 a 4)</legend>
          {pecaIds.length > 0 && (
            <ol aria-label="Peças do kit" className="divide-y divide-linha border-y border-linha">
              {pecaIds.map((pid, i) => {
                const p = pecaPorId(pid);
                const nome = p?.nome ?? 'Peça excluída';
                return (
                  <li key={pid} className="flex items-center gap-2 py-2">
                    <span className="min-w-0 flex-1 truncate">
                      {nome}
                      {p && <span className="text-sm text-carpete"> · {formatarReais(p.precoCentavos)}</span>}
                    </span>
                    <button type="button" aria-label={`Subir ${nome}`} disabled={i === 0} onClick={() => mover(i, i - 1)} className={seta}>
                      ↑
                    </button>
                    <button type="button" aria-label={`Descer ${nome}`} disabled={i === pecaIds.length - 1} onClick={() => mover(i, i + 1)} className={seta}>
                      ↓
                    </button>
                    <button type="button" aria-label={`Tirar ${nome}`} onClick={() => setPecaIds((a) => a.filter((x) => x !== pid))} className={seta}>
                      ×
                    </button>
                  </li>
                );
              })}
            </ol>
          )}
          {erros.pecas && <p className="text-sm">{erros.pecas}</p>}
          <p className="text-sm text-carpete">Total: {formatarReais(total)}</p>

          <Campo rotulo="Buscar peça" type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Ex.: bermuda" />
          {cheio && <p className="text-sm">O kit já tem 4 peças.</p>}
          {resultados.length > 0 && (
            <ul aria-label="Resultados" className="grid gap-1">
              {resultados.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-2">
                  <span className="min-w-0 truncate">{p.nome}</span>
                  <Botao
                    aria-label={`Adicionar ${p.nome}`}
                    disabled={cheio}
                    onClick={() => {
                      setPecaIds((a) => [...a, p.id]);
                      setBusca('');
                    }}
                  >
                    Adicionar
                  </Botao>
                </li>
              ))}
            </ul>
          )}
          {termo && resultados.length === 0 && <p className="text-sm text-carpete">Nenhuma peça com esse nome.</p>}
        </fieldset>

        <div className="flex flex-wrap items-center gap-3">
          <Botao type="submit" variante="principal" ocupado={ocupado}>
            Salvar
          </Botao>
          {aviso && <p role="status">{aviso}</p>}
        </div>
      </form>

      <section aria-labelledby="t-foto" className="grid gap-2 border-t border-linha pt-5">
        <h2 id="t-foto" className="font-rotulo text-sm tracking-[0.12em] text-carpete uppercase">
          Foto do kit
        </h2>
        {capa && <img src={api.urlDaFoto(capa)} alt="" className="aspect-[4/5] w-40 rounded-[3px] object-cover" />}
        <p className="text-sm text-carpete">
          {kit?.fotoPath ? 'Foto própria do kit.' : 'Sem foto própria: o site usa a capa da primeira peça.'}
        </p>
        {kit ? (
          <div className="flex flex-wrap gap-2">
            <label className={`${classeLinkBotao} ${ocupado ? 'pointer-events-none opacity-50' : ''}`}>
              {kit.fotoPath ? 'Trocar foto' : 'Escolher foto'}
              <input type="file" accept="image/*" disabled={ocupado} onChange={escolherFoto} className="sr-only" />
            </label>
            {kit.fotoPath && (
              <Botao
                disabled={ocupado}
                onClick={() =>
                  void gravar(async () => {
                    await api.removerFotoKit(kit.id);
                    await recarregar();
                  })
                }
              >
                Remover foto
              </Botao>
            )}
          </div>
        ) : (
          <p className="text-sm text-carpete">Salve o kit para escolher uma foto.</p>
        )}
      </section>

      {kit && (
        <section className="border-t border-linha pt-5">
          <Botao variante="perigo" disabled={ocupado} onClick={() => setConfirmando(true)}>
            Excluir kit
          </Botao>
        </section>
      )}

      {confirmando && kit && (
        <Confirmar
          titulo="Excluir kit?"
          texto={`"${kit.titulo}" sai do site. As peças continuam cadastradas.`}
          confirmar="Excluir kit"
          ocupado={ocupado}
          onCancelar={() => setConfirmando(false)}
          onConfirmar={() =>
            void gravar(async () => {
              await api.excluirKit(kit.id);
              setConfirmando(false);
              navigate('/admin/kits', { replace: true });
              await recarregar();
            })
          }
        />
      )}
    </main>
  );
}
