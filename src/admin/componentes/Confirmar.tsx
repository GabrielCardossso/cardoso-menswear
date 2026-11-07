import { useEffect, useId, useRef } from 'react';
import Botao from './Botao';

type Props = {
  titulo: string;
  texto: string;
  /** Verbo do botão, ex.: "Excluir peça". */
  confirmar: string;
  onConfirmar(): void;
  onCancelar(): void;
  ocupado?: boolean;
  /** Erro da última tentativa, mostrado dentro da janela (fora dela ficaria escondido pelo fundo). */
  erro?: string;
};

/** Pergunta de confirmação na própria tela (spec: exclusão definitiva com confirmação). */
export default function Confirmar({ titulo, texto, confirmar, onConfirmar, onCancelar, ocupado, erro }: Props) {
  const id = useId();
  const cancelar = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const anterior = document.activeElement as HTMLElement | null;
    cancelar.current?.focus();
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onCancelar();
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('keydown', esc);
      anterior?.focus?.();
    };
  }, [onCancelar]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-black/70 p-4 sm:place-items-center">
      <div role="dialog" aria-modal="true" aria-labelledby={`${id}-t`} aria-describedby={`${id}-d`} className="grid w-full max-w-sm gap-4 rounded-[4px] border border-linha bg-preto p-5">
        <h2 id={`${id}-t`} className="font-titulo text-xl uppercase">
          {titulo}
        </h2>
        <p id={`${id}-d`} className="text-carpete">
          {texto}
        </p>
        {erro && (
          <p role="alert" className="text-sm">
            {erro}
          </p>
        )}
        <div className="flex flex-wrap justify-end gap-2">
          <Botao ref={cancelar} onClick={onCancelar} disabled={ocupado}>
            Cancelar
          </Botao>
          <Botao variante="principal" onClick={onConfirmar} ocupado={ocupado} textoOcupado="Aguarde…">
            {confirmar}
          </Botao>
        </div>
      </div>
    </div>
  );
}
