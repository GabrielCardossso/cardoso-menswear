import { NavLink } from 'react-router';

const ITENS = [
  { para: '/admin', nome: 'Início', fim: true },
  { para: '/admin/pecas', nome: 'Peças' },
  { para: '/admin/kits', nome: 'Kits' },
  { para: '/admin/categorias', nome: 'Categorias' },
  { para: '/admin/configuracoes', nome: 'Ajustes' },
];

/** No celular, barra fixa embaixo; no desktop, coluna à esquerda. */
export default function BarraAdmin() {
  return (
    <nav
      aria-label="Painel"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-linha bg-preto/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:static md:border-t-0 md:border-r md:bg-transparent md:pb-0"
    >
      <ul className="grid grid-cols-5 md:sticky md:top-0 md:flex md:flex-col md:gap-1 md:p-4">
        {ITENS.map((i) => (
          <li key={i.para}>
            <NavLink
              to={i.para}
              end={i.fim}
              className={({ isActive }) =>
                `flex min-h-14 items-center justify-center px-1 font-rotulo text-[11px] tracking-[0.08em] uppercase md:min-h-11 md:justify-start md:rounded-[3px] md:px-3 md:text-sm ${
                  isActive ? 'text-branco md:bg-branco md:text-preto' : 'text-carpete hover:text-branco'
                }`
              }
            >
              {i.nome}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
