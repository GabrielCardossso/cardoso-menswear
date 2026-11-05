import { Link } from 'react-router';
import CarrosselKits from '../components/CarrosselKits';
import CartaoPeca from '../components/CartaoPeca';
import PilulasCategorias from '../components/PilulasCategorias';
import { categoriaDaPeca, chegouAgora } from '../vitrine/consultas';
import { useVitrinePronta } from '../vitrine/VitrineContext';

export default function Inicio() {
  const { vitrine } = useVitrinePronta();
  const novas = chegouAgora(vitrine);
  return (
    <main className="grid gap-3 px-4">
      <PilulasCategorias />
      <CarrosselKits />
      {novas.length > 0 && (
        <section aria-labelledby="chegou-agora" className="grid gap-2">
          <div className="flex items-baseline justify-between">
            <h2 id="chegou-agora" className="font-titulo text-lg uppercase">Chegou agora</h2>
            <Link to="/novidades" className="flex min-h-11 items-center font-rotulo text-[11px] tracking-[0.12em] text-carpete uppercase">
              Ver tudo
            </Link>
          </div>
          <ul className="grid grid-cols-2 gap-x-2 gap-y-4 lg:grid-cols-4">
            {novas.map((p) => (
              <li key={p.id}><CartaoPeca peca={p} categoria={categoriaDaPeca(vitrine, p)} /></li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
