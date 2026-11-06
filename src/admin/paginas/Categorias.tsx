import { useRef, useState, type FormEvent } from 'react';
import { useDadosAdmin } from '../AdminContext';
import Botao from '../componentes/Botao';
import Campo from '../componentes/Campo';
import Confirmar from '../componentes/Confirmar';
import Interruptor from '../componentes/Interruptor';
import Titulo from '../componentes/Titulo';
import { lerGrade, tamanhosPerdidos, validarCategoria } from '../regras';
import type { CategoriaAdmin, DadosCategoria } from '../tipos';

const seta = 'grid size-11 shrink-0 place-items-center rounded-[3px] border border-linha disabled:opacity-30 hover:border-branco';

function Quadrados({ grade }: { grade: string[] }) {
  return (
    <div className="flex flex-wrap gap-1" aria-hidden="true">
      {grade.map((t) => (
        <span key={t} className="grid h-8 min-w-8 place-items-center rounded-[3px] border border-linha px-1.5 font-rotulo text-xs">
          {t}
        </span>
      ))}
    </div>
  );
}

type Pergunta = { titulo: string; texto: string; confirmar: string; acao(): Promise<void> };

export default function Categorias() {
  const { api, dados, recarregar, tratarErro } = useDadosAdmin();
  const categorias = [...dados.categorias].sort((a, b) => a.ordem - b.ordem);
  const qtd = (id: string) => dados.pecas.filter((p) => p.categoriaId === id).length;

  const [editando, setEditando] = useState<string | null>(null);
  const [nome, setNome] = useState('');
  const [grade, setGrade] = useState('');
  const [erros, setErros] = useState<Record<string, string>>({});
  const [aviso, setAviso] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [pergunta, setPergunta] = useState<Pergunta | null>(null);
  const [novoNome, setNovoNome] = useState('');
  const [novaGrade, setNovaGrade] = useState('');
  const [errosNova, setErrosNova] = useState<Record<string, string>>({});
  const gravando = useRef(false);

  async function gravar(acao: () => Promise<void>) {
    if (gravando.current) return;
    gravando.current = true;
    setOcupado(true);
    setAviso('');
    try {
      await acao();
      await recarregar();
    } catch (e) {
      setAviso(tratarErro(e));
    } finally {
      gravando.current = false;
      setOcupado(false);
    }
  }

  function editar(c: CategoriaAdmin) {
    setEditando(c.id);
    setNome(c.nome);
    setGrade(c.grade.join(', '));
    setErros({});
    setAviso('');
  }

  function salvar(e: FormEvent, c: CategoriaAdmin) {
    e.preventDefault();
    const d: DadosCategoria = { nome: nome.trim(), grade: lerGrade(grade), visivel: c.visivel };
    const encontrados = validarCategoria(d);
    setErros(encontrados);
    if (Object.keys(encontrados).length > 0) return;
    const acao = async () => {
      await api.salvarCategoria(c.id, d);
      setEditando(null);
    };
    const perdidos = tamanhosPerdidos(
      c.grade,
      d.grade,
      dados.pecas.filter((p) => p.categoriaId === c.id),
    );
    if (perdidos.length > 0) {
      setPergunta({
        titulo: 'Mudar os tamanhos?',
        texto: `As peças desta categoria vão perder os tamanhos ${perdidos.join(', ')}. Continuar?`,
        confirmar: 'Mudar tamanhos',
        acao,
      });
    } else {
      void gravar(acao);
    }
  }

  function excluir(c: CategoriaAdmin) {
    if (qtd(c.id) > 0) {
      setAviso('Esta categoria tem peças. Esconda em vez de excluir.');
      return;
    }
    setPergunta({
      titulo: 'Excluir categoria?',
      texto: `"${c.nome}" sai do site e do painel.`,
      confirmar: 'Excluir categoria',
      acao: async () => {
        if ((await api.excluirCategoria(c.id)) === 'tem-pecas') {
          setAviso('Esta categoria tem peças. Esconda em vez de excluir.');
          return;
        }
        setEditando(null);
      },
    });
  }

  function mover(de: number, para: number) {
    const ids = categorias.map((c) => c.id);
    [ids[de], ids[para]] = [ids[para], ids[de]];
    void gravar(() => api.ordenarCategorias(ids));
  }

  function criar(e: FormEvent) {
    e.preventDefault();
    const d: DadosCategoria = { nome: novoNome.trim(), grade: lerGrade(novaGrade), visivel: true };
    const encontrados = validarCategoria(d);
    setErrosNova(encontrados);
    if (Object.keys(encontrados).length > 0) return;
    void gravar(async () => {
      await api.criarCategoria(d);
      setNovoNome('');
      setNovaGrade('');
    });
  }

  return (
    <main className="grid grid-cols-1 max-w-2xl gap-5">
      <Titulo>Categorias</Titulo>
      <p className="text-sm text-carpete">A ordem daqui é a das pílulas do site. Categoria escondida some do site com as peças dela.</p>
      {aviso && !pergunta && <p role="alert">{aviso}</p>}

      <ul aria-label="Categorias" className="divide-y divide-linha border-y border-linha">
        {categorias.map((c, i) => (
          <li key={c.id} className="grid gap-3 py-3">
            <div className="flex items-center gap-2">
              <div className="grid min-w-0 flex-1">
                <h2 className="truncate font-rotulo text-base tracking-[0.06em] uppercase">{c.nome}</h2>
                <span className="text-sm text-carpete">
                  {qtd(c.id)} {qtd(c.id) === 1 ? 'peça' : 'peças'}
                </span>
              </div>
              <button type="button" aria-label={`Subir ${c.nome}`} disabled={ocupado || i === 0} onClick={() => mover(i, i - 1)} className={seta}>
                ↑
              </button>
              <button
                type="button"
                aria-label={`Descer ${c.nome}`}
                disabled={ocupado || i === categorias.length - 1}
                onClick={() => mover(i, i + 1)}
                className={seta}
              >
                ↓
              </button>
            </div>
            <Quadrados grade={c.grade} />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Interruptor
                rotulo="Visível"
                ligado={c.visivel}
                desativado={ocupado}
                onMudar={(v) => void gravar(() => api.salvarCategoria(c.id, { nome: c.nome, grade: c.grade, visivel: v }))}
              />
              {editando !== c.id && (
                <Botao aria-label={`Editar ${c.nome}`} onClick={() => editar(c)}>
                  Editar
                </Botao>
              )}
            </div>

            {editando === c.id && (
              <form onSubmit={(e) => salvar(e, c)} noValidate className="grid gap-3 rounded-[3px] border border-linha p-3">
                <Campo rotulo="Nome" value={nome} onChange={(e) => setNome(e.target.value)} erro={erros.nome} />
                <Campo
                  rotulo="Tamanhos"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  erro={erros.grade}
                  dica="Separe por vírgula, na ordem. Ex.: P, M, G, GG, XG"
                />
                <Quadrados grade={lerGrade(grade)} />
                <div className="flex flex-wrap gap-2">
                  <Botao type="submit" variante="principal" ocupado={ocupado}>
                    Salvar
                  </Botao>
                  <Botao onClick={() => setEditando(null)} disabled={ocupado}>
                    Cancelar
                  </Botao>
                  <Botao variante="perigo" onClick={() => excluir(c)} disabled={ocupado}>
                    Excluir
                  </Botao>
                </div>
              </form>
            )}
          </li>
        ))}
      </ul>

      <form onSubmit={criar} noValidate className="grid gap-3 rounded-[3px] border border-linha p-4">
        <h2 className="font-rotulo text-sm tracking-[0.12em] text-carpete uppercase">Nova categoria</h2>
        <Campo rotulo="Nome da nova categoria" value={novoNome} onChange={(e) => setNovoNome(e.target.value)} erro={errosNova.nome} />
        <Campo
          rotulo="Tamanhos da nova categoria"
          value={novaGrade}
          onChange={(e) => setNovaGrade(e.target.value)}
          erro={errosNova.grade}
          dica="Ex.: P, M, G ou 38, 40, 42. Para tamanho único, U."
        />
        <Botao type="submit" variante="principal" ocupado={ocupado} className="justify-self-start">
          Criar categoria
        </Botao>
      </form>

      {pergunta && (
        <Confirmar
          titulo={pergunta.titulo}
          texto={pergunta.texto}
          confirmar={pergunta.confirmar}
          ocupado={ocupado}
          onCancelar={() => setPergunta(null)}
          onConfirmar={() =>
            void gravar(async () => {
              await pergunta.acao();
              setPergunta(null);
            })
          }
        />
      )}
    </main>
  );
}
