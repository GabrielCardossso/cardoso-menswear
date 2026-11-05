import {
  adicionarItens, alterarQuantidade, quantidadeDeItens, QTD_MAX, removerItem, sacolaVazia, totalCentavos,
} from './regras';
import type { ItemDaSacola } from './tipos';

const [T0, T1, T2, T3, T4] = ['2026-11-05T10:00:00Z', '2026-11-05T10:01:00Z', '2026-11-05T10:02:00Z', '2026-11-05T10:03:00Z', '2026-11-05T10:04:00Z'];

function item(pecaId: string, tamanho: string, preco: number, quantidade: number, kitId?: string): ItemDaSacola {
  return { pecaId, nome: `Peça ${pecaId}`, tamanho, precoUnitarioCentavos: preco, quantidade, ...(kitId ? { kitId } : {}) };
}

it('soma a mesma peça e tamanho na mesma linha, até o máximo de 10', () => {
  let s = adicionarItens(sacolaVazia(T0), [item('a', 'M', 8990, 7)], T1);
  s = adicionarItens(s, [item('a', 'M', 8990, 5)], T2);
  expect(QTD_MAX).toBe(10);
  expect(s.itens).toHaveLength(1);
  expect(s.itens[0].quantidade).toBe(10);
  expect(s.atualizadoEm).toBe(T2);
});

it('tamanho diferente vira outra linha; totais somam tudo', () => {
  let s = adicionarItens(sacolaVazia(T0), [item('a', 'M', 8990, 10)], T1);
  s = adicionarItens(s, [item('a', 'G', 8990, 1)], T3);
  expect(s.itens).toHaveLength(2);
  expect(totalCentavos(s)).toBe(8990 * 11);
  expect(quantidadeDeItens(s)).toBe(11);
});

it('mantém o kitId da linha que já existia', () => {
  let s = adicionarItens(sacolaVazia(T0), [item('a', 'M', 8990, 1, 'k1')], T1);
  s = adicionarItens(s, [item('a', 'M', 8990, 1)], T2);
  expect(s.itens[0].kitId).toBe('k1');
});

it('quantidade fica entre 1 e 10', () => {
  const s = adicionarItens(sacolaVazia(T0), [item('a', 'M', 8990, 2), item('a', 'G', 8990, 1)], T1);
  expect(alterarQuantidade(s, 'a', 'G', 0, T4).itens.find((i) => i.tamanho === 'G')!.quantidade).toBe(1);
  expect(alterarQuantidade(s, 'a', 'G', 99, T4).itens.find((i) => i.tamanho === 'G')!.quantidade).toBe(10);
  expect(alterarQuantidade(s, 'a', 'G', 3, T4).atualizadoEm).toBe(T4);
});

it('remove só a linha pedida', () => {
  const s = adicionarItens(sacolaVazia(T0), [item('a', 'M', 8990, 1), item('a', 'G', 8990, 1)], T1);
  const r = removerItem(s, 'a', 'M', T4);
  expect(r.itens.map((i) => i.tamanho)).toEqual(['G']);
  expect(r.atualizadoEm).toBe(T4);
});

it('não altera a sacola original', () => {
  const s = adicionarItens(sacolaVazia(T0), [item('a', 'M', 8990, 1)], T1);
  adicionarItens(s, [item('a', 'M', 8990, 1)], T2);
  expect(s.itens[0].quantidade).toBe(1);
});
