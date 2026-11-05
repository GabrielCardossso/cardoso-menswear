import { Link } from 'react-router';
import logo from '../assets/cardoso-nome-branco.svg';
import IconeSacola, { rotuloSacola } from './IconeSacola';

type Props = { quantidade: number; onAbrirSacola: () => void };

export default function Cabecalho({ quantidade, onAbrirSacola }: Props) {
  return (
    <header className="flex items-center justify-between px-4 md:px-8 pt-[max(12px,env(safe-area-inset-top))] pb-2">
      <Link to="/" className="flex">
        <img src={logo} alt="Cardoso Menswear" className="h-[30px] w-auto" />
      </Link>
      <button
        type="button"
        onClick={onAbrirSacola}
        aria-label={rotuloSacola(quantidade)}
        className="grid size-11 place-items-center"
      >
        <IconeSacola quantidade={quantidade} />
      </button>
    </header>
  );
}

