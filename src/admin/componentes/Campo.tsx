import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';

type Comum = { rotulo: string; erro?: string; dica?: ReactNode };

const caixa =
  'w-full rounded-[3px] border bg-transparent px-3 py-2.5 text-base text-branco placeholder:text-apagado focus:border-branco focus:outline-none';

function Moldura({ id, rotulo, erro, dica, children }: Comum & { id: string; children: ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="font-rotulo text-xs tracking-[0.12em] text-carpete uppercase">
        {rotulo}
      </label>
      {children}
      {dica && !erro && (
        <p id={`${id}-dica`} className="text-sm text-carpete">
          {dica}
        </p>
      )}
      {erro && (
        <p id={`${id}-erro`} className="text-sm text-branco">
          {erro}
        </p>
      )}
    </div>
  );
}

function aria(id: string, erro?: string, dica?: ReactNode) {
  return {
    'aria-invalid': erro ? true : undefined,
    'aria-describedby': erro ? `${id}-erro` : dica ? `${id}-dica` : undefined,
  } as const;
}

/** Campo de texto com rótulo visível e erro ligado ao campo. */
export default function Campo({ rotulo, erro, dica, className, ...props }: Comum & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <Moldura id={id} rotulo={rotulo} erro={erro} dica={dica}>
      <input id={id} {...aria(id, erro, dica)} {...props} className={`${caixa} min-h-11 ${erro ? 'border-branco' : 'border-linha'} ${className ?? ''}`} />
    </Moldura>
  );
}

export function CampoTexto({ rotulo, erro, dica, ...props }: Comum & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId();
  return (
    <Moldura id={id} rotulo={rotulo} erro={erro} dica={dica}>
      <textarea id={id} rows={3} {...aria(id, erro, dica)} {...props} className={`${caixa} ${erro ? 'border-branco' : 'border-linha'}`} />
    </Moldura>
  );
}

export function CampoEscolha({ rotulo, erro, dica, children, ...props }: Comum & SelectHTMLAttributes<HTMLSelectElement>) {
  const id = useId();
  return (
    <Moldura id={id} rotulo={rotulo} erro={erro} dica={dica}>
      <select id={id} {...aria(id, erro, dica)} {...props} className={`${caixa} min-h-11 bg-preto ${erro ? 'border-branco' : 'border-linha'}`}>
        {children}
      </select>
    </Moldura>
  );
}
