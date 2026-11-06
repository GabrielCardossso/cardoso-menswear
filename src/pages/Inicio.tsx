import { Link } from 'react-router';
import CarrosselKits from '../components/CarrosselKits';
import GradePecas from '../components/GradePecas';
import PilulasCategorias from '../components/PilulasCategorias';
import { chegouAgora, kitsDoInicio } from '../vitrine/consultas';
import { useVitrinePronta } from '../vitrine/VitrineContext';

export default function Inicio() {
  const { vitrine } = useVitrinePronta();
  const novas = chegouAgora(vitrine);
  const vazia = novas.length === 0 && kitsDoInicio(vitrine).length === 0;
  return (
    <main className="grid gap-3 px-4 md:gap-5 md:px-8">
      <PilulasCategorias />
      <CarrosselKits />
      {vazia && (
        <section aria-labelledby="vitrine-vazia" className="grid justify-items-center gap-3 py-16 text-center">
          <h2 id="vitrine-vazia" className="font-titulo text-2xl uppercase">Novidades chegando</h2>
          <p className="max-w-xs text-carpete">
            Estamos preparando a vitrine. Enquanto isso, veja as peças no nosso Instagram.
          </p>
          <a
            href={vitrine.configuracoes.instagramUrl}
            target="_blank"
            rel="noreferrer"
            className="flex min-h-11 items-center rounded-full border border-linha px-5 font-rotulo text-xs tracking-[0.12em] uppercase"
          >
            Ver no Instagram
          </a>
        </section>
      )}
      {novas.length > 0 && (
        <section aria-labelledby="chegou-agora" className="grid gap-2">
          <div className="flex items-baseline justify-between">
            <h2 id="chegou-agora" className="font-titulo text-lg uppercase">Chegou agora</h2>
            <Link to="/novidades" className="flex min-h-11 items-center font-rotulo text-[11px] tracking-[0.12em] text-carpete uppercase">
              Ver tudo
            </Link>
          </div>
          <GradePecas pecas={novas} rotulo="Chegou agora" />
        </section>
      )}
    </main>
  );
}
