import { useVitrinePronta } from '../vitrine/VitrineContext';

export default function Rodape() {
  const { configuracoes } = useVitrinePronta().vitrine;
  return (
    <footer className="mt-10 border-t border-linha px-4 md:px-8 pt-6 pb-[max(24px,env(safe-area-inset-bottom))] text-sm text-carpete">
      <p>{configuracoes.textoEntrega}</p>
      <ul className="mt-3 flex gap-5 font-rotulo text-xs tracking-[0.1em] text-branco uppercase">
        <li><a href={configuracoes.instagramUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center">Instagram</a></li>
        <li><a href={configuracoes.grupoWhatsappUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center">Grupo no WhatsApp</a></li>
      </ul>
    </footer>
  );
}
