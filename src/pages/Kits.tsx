import CartaoKit from '../components/CartaoKit';
import PilulasCategorias from '../components/PilulasCategorias';
import { kitsDoInicio } from '../vitrine/consultas';
import { useVitrinePronta } from '../vitrine/VitrineContext';

export default function Kits() {
  const kits = kitsDoInicio(useVitrinePronta().vitrine);
  return (
    <main className="grid gap-4 px-4 md:px-8">
      <PilulasCategorias ativa="kits" />
      <h1 className="font-titulo text-3xl leading-none uppercase md:text-4xl">Kits</h1>
      {kits.length > 0 ? (
        <ul aria-label="Kits" className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {kits.map((k) => <li key={k.id}><CartaoKit kit={k} /></li>)}
        </ul>
      ) : (
        <p className="text-carpete">Nenhum kit disponível por enquanto.</p>
      )}
    </main>
  );
}
