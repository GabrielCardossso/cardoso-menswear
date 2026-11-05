import { conferirSacola } from './conferencia';
import { vitrineDeTeste } from '../vitrine/vitrineDeTeste';
import type { Sacola } from '../sacola/tipos';
import type { Vitrine } from '../vitrine/tipos';

const T = '2026-11-05T15:00:00Z';
const s: Sacola = {
  itens: [
    { pecaId: 'a', nome: 'Camisa dry fit NK', tamanho: 'M', precoUnitarioCentavos: 8990, quantidade: 1 },
    { pecaId: 'b', nome: 'Bermuda NK', tamanho: 'G', precoUnitarioCentavos: 7990, quantidade: 2 },
  ],
  atualizadoEm: '2026-11-05T10:00:00Z',
};

function com(mudar: (v: Vitrine) => void): Vitrine {
  const v = vitrineDeTeste();
  mudar(v);
  return v;
}

it('sem mudanças devolve a mesma sacola', () => {
  const r = conferirSacola(s, vitrineDeTeste(), T);
  expect(r.sacola).toBe(s);
  expect(r.mudancas).toEqual([]);
  expect(r.lojaAberta).toBe(true);
});

it('preço mudou: atualiza a linha e avisa', () => {
  const r = conferirSacola(s, com((v) => { v.pecas[0].precoCentavos = 9990; }), T);
  expect(r.mudancas).toEqual(['Camisa dry fit NK passou de R$ 89,90 para R$ 99,90']);
  expect(r.sacola.itens[0].precoUnitarioCentavos).toBe(9990);
  expect(r.sacola.atualizadoEm).toBe(T);
});

it('nome mudou junto com o preço: a linha fica com o nome novo e o aviso usa o nome antigo', () => {
  const r = conferirSacola(s, com((v) => { v.pecas[0].precoCentavos = 9990; v.pecas[0].nome = 'Camisa dry fit NK preta'; }), T);
  expect(r.mudancas[0]).toBe('Camisa dry fit NK passou de R$ 89,90 para R$ 99,90');
  expect(r.sacola.itens[0].nome).toBe('Camisa dry fit NK preta');
});

it('tamanho desligado: tira a linha e avisa', () => {
  const r = conferirSacola(s, com((v) => { v.pecas[1].tamanhos.G = false; }), T);
  expect(r.mudancas).toEqual(['Bermuda NK tam. G esgotou']);
  expect(r.sacola.itens.map((i) => i.pecaId)).toEqual(['a']);
});

it('tamanho saiu da grade: tira a linha e avisa', () => {
  const r = conferirSacola(s, com((v) => { v.categorias[0].grade = ['P', 'M']; }), T); // c2 = bermudas
  expect(r.mudancas).toEqual(['Bermuda NK tam. G esgotou']);
});

it('peça saiu da loja: tira a linha e avisa', () => {
  const r = conferirSacola(s, com((v) => { v.pecas = v.pecas.filter((p) => p.id !== 'a'); }), T);
  expect(r.mudancas).toEqual(['Camisa dry fit NK saiu da loja']);
  expect(r.sacola.itens.map((i) => i.pecaId)).toEqual(['b']);
});

it('várias mudanças, na ordem dos itens', () => {
  const r = conferirSacola(s, com((v) => {
    v.pecas = v.pecas.filter((p) => p.id !== 'a');
    v.pecas[0].precoCentavos = 8490;
  }), T);
  expect(r.mudancas).toEqual(['Camisa dry fit NK saiu da loja', 'Bermuda NK passou de R$ 79,90 para R$ 84,90']);
});

it('informa se a loja está pausada', () => {
  expect(conferirSacola(s, com((v) => { v.configuracoes.lojaAberta = false; }), T).lojaAberta).toBe(false);
});
