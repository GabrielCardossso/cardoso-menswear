type Props = {
  ligado: boolean;
  onMudar(ligado: boolean): void;
  rotulo: string;
  /** Texto ao lado (o rótulo continua sendo o nome acessível). */
  descricao?: string;
  desativado?: boolean;
};

/** Liga/desliga acessível (role="switch"). */
export default function Interruptor({ ligado, onMudar, rotulo, descricao, desativado }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={ligado}
      aria-label={rotulo}
      disabled={desativado}
      onClick={() => onMudar(!ligado)}
      className="flex min-h-11 items-center gap-3 text-left disabled:opacity-50"
    >
      <span
        aria-hidden="true"
        className={`relative h-7 w-12 shrink-0 rounded-full border transition-colors ${ligado ? 'border-branco bg-branco' : 'border-linha bg-transparent'}`}
      >
        <span
          className={`absolute top-1 h-[18px] w-[18px] rounded-full transition-[left] ${ligado ? 'left-[24px] bg-preto' : 'left-1 bg-carpete'}`}
        />
      </span>
      <span className="grid">
        <span className="font-rotulo text-sm tracking-[0.06em] uppercase">{rotulo}</span>
        {descricao && <span className="text-sm text-carpete">{descricao}</span>}
      </span>
    </button>
  );
}
