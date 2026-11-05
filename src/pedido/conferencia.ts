import { formatarReais } from '../lib/dinheiro';
import type { ItemDaSacola, Sacola } from '../sacola/tipos';
import { categoriaDaPeca, tamanhosDisponiveis } from '../vitrine/consultas';
import type { Vitrine } from '../vitrine/tipos';

export type ResultadoConferencia = { sacola: Sacola; mudancas: string[]; lojaAberta: boolean };

/**
 * Confere a sacola contra a vitrine atual antes de enviar o pedido.
 * Peça que saiu ou tamanho esgotado sai da sacola; preço diferente é atualizado. Cada caso vira um aviso.
 */
export function conferirSacola(sacola: Sacola, vitrine: Vitrine, agora: string): ResultadoConferencia {
  const mudancas: string[] = [];
  const itens: ItemDaSacola[] = [];
  let mudou = false;

  for (const item of sacola.itens) {
    const peca = vitrine.pecas.find((p) => p.id === item.pecaId);
    const cat = peca && categoriaDaPeca(vitrine, peca);
    if (!peca || !cat) {
      mudancas.push(`${item.nome} saiu da loja`);
      mudou = true;
      continue;
    }
    if (!tamanhosDisponiveis(peca, cat).includes(item.tamanho)) {
      mudancas.push(`${item.nome} tam. ${item.tamanho} esgotou`);
      mudou = true;
      continue;
    }
    if (peca.precoCentavos !== item.precoUnitarioCentavos) {
      mudancas.push(
        `${item.nome} passou de ${formatarReais(item.precoUnitarioCentavos)} para ${formatarReais(peca.precoCentavos)}`,
      );
      itens.push({ ...item, nome: peca.nome, precoUnitarioCentavos: peca.precoCentavos });
      mudou = true;
      continue;
    }
    itens.push(item);
  }

  return {
    sacola: mudou ? { itens, atualizadoEm: agora } : sacola,
    mudancas,
    lojaAberta: vitrine.configuracoes.lojaAberta,
  };
}
