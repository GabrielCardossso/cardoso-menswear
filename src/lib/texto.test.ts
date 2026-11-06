import { limparTexto, normalizarCep } from './texto';

describe('limparTexto', () => {
  it('colapsa espaços e quebras de linha', () => {
    expect(limparTexto('  posso\n\n pagar   no Pix? ', 300)).toBe('posso pagar no Pix?');
  });
  it('vira vazio quando só tem espaços', () => {
    expect(limparTexto('   \n ', 300)).toBe('');
  });
  it('corta sem partir emoji', () => {
    expect(limparTexto('👕'.repeat(5), 3)).toBe('👕👕👕');
  });
});

describe('normalizarCep', () => {
  it('aceita 8 dígitos com ou sem traço', () => {
    expect(normalizarCep('88745000')).toBe('88745-000');
    expect(normalizarCep(' 88745-000 ')).toBe('88745-000');
  });
  it('recusa o que não tem 8 dígitos', () => {
    expect(normalizarCep('8874500')).toBeNull();
    expect(normalizarCep('abcdefgh')).toBeNull();
  });
});
