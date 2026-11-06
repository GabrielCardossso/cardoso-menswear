import type { ItemDaSacola, Sacola } from './tipos';

export const QTD_MAX = 10;

const limitar = (q: number) => Math.min(QTD_MAX, Math.max(1, Math.trunc(q)));
const mesmaLinha = (i: ItemDaSacola, pecaId: string, tamanho: string) => i.pecaId === pecaId && i.tamanho === tamanho;

export function sacolaVazia(agora: string): Sacola {
  return { itens: [], atualizadoEm: agora };
}

/** Mesma peça e tamanho soma na linha existente (até QTD_MAX), mantendo o kitId dela. */
export function adicionarItens(s: Sacola, novos: ItemDaSacola[], agora: string): Sacola {
  const itens = s.itens.map((i) => ({ ...i }));
  for (const novo of novos) {
    const existente = itens.find((i) => mesmaLinha(i, novo.pecaId, novo.tamanho));
    if (existente) existente.quantidade = limitar(existente.quantidade + novo.quantidade);
    else itens.push({ ...novo, quantidade: limitar(novo.quantidade) });
  }
  return { itens, atualizadoEm: agora };
}

export function alterarQuantidade(s: Sacola, pecaId: string, tamanho: string, quantidade: number, agora: string): Sacola {
  return {
    itens: s.itens.map((i) => (mesmaLinha(i, pecaId, tamanho) ? { ...i, quantidade: limitar(quantidade) } : i)),
    atualizadoEm: agora,
  };
}

export function removerItem(s: Sacola, pecaId: string, tamanho: string, agora: string): Sacola {
  return { itens: s.itens.filter((i) => !mesmaLinha(i, pecaId, tamanho)), atualizadoEm: agora };
}

export function totalCentavos(s: Sacola): number {
  return s.itens.reduce((soma, i) => soma + i.precoUnitarioCentavos * i.quantidade, 0);
}

export function quantidadeDeItens(s: Sacola): number {
  return s.itens.reduce((soma, i) => soma + i.quantidade, 0);
}
