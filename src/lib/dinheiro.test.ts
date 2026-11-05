import { formatarReais, paraCentavos } from './dinheiro';

it('converte reais em centavos inteiros', () => {
  expect(paraCentavos(89.9)).toBe(8990);
  expect(paraCentavos(0.1 + 0.2)).toBe(30);
});

it('formata centavos em reais com espaço não separável', () => {
  expect(formatarReais(16980)).toBe('R$ 169,80');
  expect(formatarReais(0)).toBe('R$ 0,00');
});
