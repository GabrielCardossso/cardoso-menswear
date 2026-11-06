import { useState, type ChangeEvent } from 'react';
import { useAdmin } from '../AdminContext';
import { reduzirFoto } from '../servicos/reduzirFoto';
import type { FotoPeca, PecaAdmin } from '../tipos';
import Confirmar from './Confirmar';

const MAX_FOTOS = 6;

type Props = {
  peca: PecaAdmin;
  /** Injetável nos testes (jsdom não tem canvas). */
  reduzir?: (arquivo: Blob) => Promise<Blob>;
};

const botaoFoto =
  'grid size-11 place-items-center rounded-[3px] border border-linha bg-preto/80 font-rotulo text-base disabled:opacity-30 hover:border-branco';

/** Até 6 fotos por peça; a primeira é a capa. Reduz no navegador antes de enviar (1600 px, WebP). */
export default function FotosPeca({ peca, reduzir = reduzirFoto }: Props) {
  const { api, recarregar, tratarErro } = useAdmin();
  const [progresso, setProgresso] = useState('');
  const [avisos, setAvisos] = useState<string[]>([]);
  const [ocupado, setOcupado] = useState(false);
  const [removendo, setRemovendo] = useState<FotoPeca | null>(null);
  const fotos = peca.fotos;

  async function trabalhar(acao: () => Promise<void>) {
    setOcupado(true);
    try {
      await acao();
    } catch (e) {
      const msg = tratarErro(e);
      if (msg) setAvisos((a) => [...a, msg]);
    } finally {
      setProgresso('');
      setOcupado(false);
      await recarregar();
    }
  }

  function escolher(e: ChangeEvent<HTMLInputElement>) {
    const escolhidos = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (escolhidos.length === 0) return;
    const vagas = MAX_FOTOS - fotos.length;
    const enviar = escolhidos.slice(0, vagas);
    const novos: string[] = escolhidos.length > vagas ? ['Máximo de 6 fotos.'] : [];
    setAvisos(novos);
    void trabalhar(async () => {
      for (const [i, arquivo] of enviar.entries()) {
        setProgresso(`Enviando ${i + 1} de ${enviar.length}…`);
        let reduzida: Blob;
        try {
          reduzida = await reduzir(arquivo);
        } catch {
          setAvisos((a) => (a.includes('Não foi possível ler esta foto.') ? a : [...a, 'Não foi possível ler esta foto.']));
          continue;
        }
        await api.enviarFotoPeca(peca.id, reduzida);
      }
    });
  }

  function mover(de: number, para: number) {
    const ids = fotos.map((f) => f.id);
    [ids[de], ids[para]] = [ids[para], ids[de]];
    void trabalhar(() => api.ordenarFotosPeca(peca.id, ids));
  }

  return (
    <div className="grid gap-3">
      {fotos.length === 0 ? (
        <p className="text-sm text-carpete">Sem fotos ainda.</p>
      ) : (
        <ul aria-label="Fotos da peça" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {fotos.map((f, i) => (
            <li key={f.id} className="relative">
              <img src={api.urlDaFoto(f.path)} alt={`Foto ${i + 1} de ${peca.nome}`} className="aspect-[4/5] w-full rounded-[3px] object-cover" />
              {i === 0 && (
                <span className="absolute top-1.5 left-1.5 rounded-[3px] bg-branco px-2 py-0.5 font-rotulo text-[11px] text-preto uppercase">Capa</span>
              )}
              <div className="absolute inset-x-1.5 bottom-1.5 flex justify-between gap-1">
                <button type="button" aria-label={`Subir foto ${i + 1}`} disabled={ocupado || i === 0} onClick={() => mover(i, i - 1)} className={botaoFoto}>
                  ←
                </button>
                <button type="button" aria-label={`Remover foto ${i + 1}`} disabled={ocupado} onClick={() => setRemovendo(f)} className={botaoFoto}>
                  ×
                </button>
                <button
                  type="button"
                  aria-label={`Descer foto ${i + 1}`}
                  disabled={ocupado || i === fotos.length - 1}
                  onClick={() => mover(i, i + 1)}
                  className={botaoFoto}
                >
                  →
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {fotos.length < MAX_FOTOS && (
        <label
          className={`inline-flex min-h-11 w-fit items-center rounded-[3px] border border-linha px-4 font-rotulo text-sm font-semibold tracking-[0.08em] uppercase hover:border-branco ${
            ocupado ? 'pointer-events-none opacity-50' : ''
          }`}
        >
          Adicionar fotos
          <input type="file" accept="image/*" multiple disabled={ocupado} onChange={escolher} className="sr-only" />
        </label>
      )}
      <p className="text-sm text-carpete">Até 6 fotos. A primeira é a capa no site.</p>
      {progresso && <p role="status">{progresso}</p>}
      {avisos.map((a) => (
        <p key={a} role="alert" className="text-sm">
          {a}
        </p>
      ))}

      {removendo && (
        <Confirmar
          titulo="Remover foto?"
          texto="A foto é apagada e não dá para desfazer."
          confirmar="Remover foto"
          ocupado={ocupado}
          onCancelar={() => setRemovendo(null)}
          onConfirmar={() =>
            void trabalhar(async () => {
              await api.excluirFotoPeca(removendo);
              setRemovendo(null);
            })
          }
        />
      )}
    </div>
  );
}
