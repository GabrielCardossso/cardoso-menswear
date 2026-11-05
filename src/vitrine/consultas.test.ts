import {
  buscarKit, buscarPeca, categoriaDaPeca, chegouAgora, estaEsgotada, kitsComPeca, kitsDoInicio,
  pecasDaCategoria, pecasDoKit, tamanhosDisponiveis, totalDoKit,
} from './consultas';
import { catRoupa, kit, peca, vitrineDeTeste } from './vitrineDeTeste';

const v = vitrineDeTeste();

it('lista os tamanhos ligados na ordem da grade, ignorando os de fora', () => {
  const p = peca('x', { tamanhos: { XG: true, G: true, P: false, M: true, GG: false } });
  expect(tamanhosDisponiveis(p, catRoupa)).toEqual(['M', 'G']);
});

it('peça sem tamanho ligado está esgotada', () => {
  expect(estaEsgotada(peca('x', { tamanhos: { P: false } }), catRoupa)).toBe(true);
  expect(estaEsgotada(peca('x', { tamanhos: { XG: true } }), catRoupa)).toBe(true);
  expect(estaEsgotada(peca('x'), catRoupa)).toBe(false);
});

it('peças da categoria: null se não existe, esgotadas no fim, demais das mais novas para as mais velhas', () => {
  expect(pecasDaCategoria(v, 'nao-existe')).toBeNull();
  expect(pecasDaCategoria(v, 'camisetas')!.map((p) => p.id)).toEqual(['a', 'velha', 'esgotada']);
});

it('chegou agora: mais novas primeiro, sem esgotadas, limitado a n', () => {
  expect(chegouAgora(v).map((p) => p.id)).toEqual(['b', 'a', 'velha']);
  expect(chegouAgora(v, 2)).toHaveLength(2);
});

it('peças do kit na ordem do kit, ignorando ids que não existem', () => {
  expect(pecasDoKit(v, kit('k', ['b', 'sumiu', 'a'])).map((p) => p.id)).toEqual(['b', 'a']);
});

it('total do kit soma só as peças disponíveis', () => {
  expect(totalDoKit(v, buscarKit(v, 'k1')!)).toBe(8990);
  expect(totalDoKit(v, buscarKit(v, 'k2')!)).toBe(16980);
});

it('kits do início em ordem, sem os que têm tudo esgotado', () => {
  expect(kitsDoInicio(v).map((k) => k.id)).toEqual(['k1', 'k2']);
});

it('kits que contêm a peça', () => {
  expect(kitsComPeca(v, 'b').map((k) => k.id)).toEqual(['k2']);
});

it('busca por slug e categoria da peça', () => {
  expect(buscarPeca(v, 'a')!.nome).toBe('Camisa dry fit NK');
  expect(buscarPeca(v, 'nao-existe')).toBeNull();
  expect(buscarKit(v, 'nao-existe')).toBeNull();
  expect(categoriaDaPeca(v, buscarPeca(v, 'b')!)!.slug).toBe('bermudas');
});
