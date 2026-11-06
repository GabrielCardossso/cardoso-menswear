/** Mesmo formato que um dia será gravado como pedido (spec, seção "Sacola"). */
export type ItemDaSacola = {
  pecaId: string;
  nome: string;
  tamanho: string;
  /** Cópia do preço no momento em que entrou. */
  precoUnitarioCentavos: number;
  quantidade: number;
  /** De qual kit veio, se veio de um. */
  kitId?: string;
};

export type Sacola = { itens: ItemDaSacola[]; atualizadoEm: string };
