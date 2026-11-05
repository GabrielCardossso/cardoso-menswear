import { Link } from 'react-router';
import { useVitrinePronta } from '../vitrine/VitrineContext';

/** "Kits" primeiro, depois as categorias por ordem. `ativa` é o slug da categoria ou "kits". */
export default function PilulasCategorias({ ativa }: { ativa?: string }) {
  const { vitrine } = useVitrinePronta();
  const itens = [
    { chave: 'kits', nome: 'Kits', para: '/kits' },
    ...[...vitrine.categorias].sort((a, b) => a.ordem - b.ordem).map((c) => ({ chave: c.slug, nome: c.nome, para: `/c/${c.slug}` })),
  ];
  return (
    <nav aria-label="Categorias" className="-mx-4 overflow-x-auto px-4 pb-1 md:-mx-8 md:px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <ul className="flex gap-1.5">
        {itens.map((i) => {
          const atual = i.chave === ativa;
          return (
            <li key={i.chave} className="shrink-0">
              <Link
                to={i.para}
                aria-current={atual ? 'page' : undefined}
                className={`flex min-h-11 items-center rounded-full border px-3.5 font-rotulo text-xs font-medium tracking-[0.08em] uppercase ${
                  atual ? 'border-branco bg-branco text-preto' : 'border-linha text-branco/80'
                }`}
              >
                {i.nome}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
