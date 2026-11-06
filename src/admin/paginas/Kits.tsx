import { useState } from 'react';
import { Link } from 'react-router';
import { useDadosAdmin } from '../AdminContext';
import Titulo, { classeLinkPrincipal } from '../componentes/Titulo';
import { resumoGeral } from '../regras';

const seta = 'grid size-11 shrink-0 place-items-center rounded-[3px] border border-linha disabled:opacity-30 hover:border-branco';

export default function Kits() {
  const { api, dados, recarregar, tratarErro } = useDadosAdmin();
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState('');
  const kits = [...dados.kits].sort((a, b) => a.ordem - b.ordem);
  const afetados = new Set(resumoGeral(dados).kitsComEsgotada.map((k) => k.id));

  async function mover(de: number, para: number) {
    const ids = kits.map((k) => k.id);
    [ids[de], ids[para]] = [ids[para], ids[de]];
    setOcupado(true);
    setAviso('');
    try {
      await api.ordenarKits(ids);
      await recarregar();
    } catch (e) {
      setAviso(tratarErro(e));
    } finally {
      setOcupado(false);
    }
  }

  return (
    <main className="grid grid-cols-1 gap-4">
      <Titulo
        acoes={
          <Link to="/admin/kits/novo" className={classeLinkPrincipal}>
            Novo kit
          </Link>
        }
      >
        Kits
      </Titulo>
      <p className="text-sm text-carpete">A ordem daqui é a do carrossel do site.</p>
      {aviso && <p role="alert">{aviso}</p>}
      {kits.length === 0 ? (
        <p className="text-carpete">Nenhum kit ainda.</p>
      ) : (
        <ul aria-label="Kits" className="divide-y divide-linha border-y border-linha">
          {kits.map((k, i) => (
            <li key={k.id} className="flex items-center gap-2 py-2">
              <Link to={`/admin/kits/${k.id}`} className="grid min-h-11 min-w-0 flex-1 content-center hover:underline">
                <span className="truncate">{k.titulo}</span>
                <span className="text-sm text-carpete">
                  {k.publicado ? 'Publicado' : 'Oculto'} · {k.pecaIds.length} {k.pecaIds.length === 1 ? 'peça' : 'peças'}
                  {afetados.has(k.id) && ' · Tem peça esgotada'}
                </span>
              </Link>
              <button type="button" aria-label={`Subir ${k.titulo}`} disabled={ocupado || i === 0} onClick={() => void mover(i, i - 1)} className={seta}>
                ↑
              </button>
              <button
                type="button"
                aria-label={`Descer ${k.titulo}`}
                disabled={ocupado || i === kits.length - 1}
                onClick={() => void mover(i, i + 1)}
                className={seta}
              >
                ↓
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
