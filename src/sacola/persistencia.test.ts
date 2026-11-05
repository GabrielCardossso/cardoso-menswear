import { CHAVE, EXPIRA_MS, lerSacola, salvarSacola } from './persistencia';
import type { Sacola } from './tipos';

const T0 = new Date('2026-11-05T10:00:00Z');
const sacola: Sacola = {
  itens: [{ pecaId: 'a', nome: 'Camisa', tamanho: 'M', precoUnitarioCentavos: 8990, quantidade: 2 }],
  atualizadoEm: T0.toISOString(),
};
const depois = (ms: number) => new Date(T0.getTime() + ms);

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

it('expira em 7 dias', () => {
  expect(EXPIRA_MS).toBe(7 * 24 * 60 * 60 * 1000);
});

it('devolve a sacola salva há menos de 7 dias', () => {
  salvarSacola(sacola);
  expect(lerSacola(depois(6 * 24 * 60 * 60 * 1000)).itens).toEqual(sacola.itens);
});

it('descarta a sacola parada há mais de 7 dias', () => {
  salvarSacola(sacola);
  expect(lerSacola(depois(EXPIRA_MS + 60_000)).itens).toEqual([]);
});

it('começa vazia com JSON corrompido', () => {
  localStorage.setItem(CHAVE, '{x');
  expect(lerSacola(T0).itens).toEqual([]);
});

it('começa vazia com formato diferente', () => {
  localStorage.setItem(CHAVE, JSON.stringify({ itens: [{ foo: 1 }], atualizadoEm: T0.toISOString() }));
  expect(lerSacola(T0).itens).toEqual([]);
  localStorage.setItem(CHAVE, JSON.stringify({ itens: [{ ...sacola.itens[0], quantidade: 11 }], atualizadoEm: T0.toISOString() }));
  expect(lerSacola(T0).itens).toEqual([]);
  localStorage.setItem(CHAVE, JSON.stringify({ itens: [], atualizadoEm: 'ontem' }));
  expect(lerSacola(T0).itens).toEqual([]);
});

it('funciona sem localStorage', () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('bloqueado'); });
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('bloqueado'); });
  expect(() => salvarSacola(sacola)).not.toThrow();
  expect(lerSacola(T0).itens).toEqual([]);
});
