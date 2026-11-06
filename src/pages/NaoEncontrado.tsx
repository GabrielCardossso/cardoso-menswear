import { Link } from 'react-router';

export default function NaoEncontrado() {
  return (
    <main className="grid gap-5 px-4 py-16 text-center">
      <h1 className="font-titulo text-3xl uppercase">Não encontramos esta página</h1>
      <p className="text-carpete">A peça ou o kit pode ter saído da loja.</p>
      <Link
        to="/"
        className="mx-auto flex min-h-11 items-center bg-branco px-5 font-rotulo text-sm font-semibold tracking-[0.12em] text-preto uppercase"
      >
        Voltar ao início
      </Link>
    </main>
  );
}
