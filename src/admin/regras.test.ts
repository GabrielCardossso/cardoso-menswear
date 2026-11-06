import {
  gerarSlug,
  lerGrade,
  lerPreco,
  medidasReduzidas,
  resumoGeral,
  slugLivre,
  tamanhosPerdidos,
  validarCategoria,
  validarKit,
  validarPeca,
  validarWhatsapp,
} from './regras';
import type { DadosAdmin, PecaAdmin } from './tipos';

const peca = (id: string, tamanhos: Record<string, boolean>, extra: Partial<PecaAdmin> = {}): PecaAdmin => ({
  id,
  slug: id,
  nome: `Peça ${id}`,
  descricao: '',
  categoriaId: 'c1',
  precoCentavos: 1000,
  arquivada: false,
  fotos: [],
  tamanhos,
  criadoEm: '2026-11-06T12:00:00Z',
  ...extra,
});

describe('gerarSlug e slugLivre', () => {
  it('tira acento, pontuação e espaços', () => {
    expect(gerarSlug('Calça Jogger Preta')).toBe('calca-jogger-preta');
    expect(gerarSlug('  Polo  LC — preta!! ')).toBe('polo-lc-preta');
    expect(gerarSlug('***')).toBe('peca');
  });
  it('acha o próximo livre', () => {
    expect(slugLivre('polo', new Set(['polo', 'polo-2']))).toBe('polo-3');
    expect(slugLivre('polo', new Set())).toBe('polo');
  });
});

describe('lerPreco', () => {
  it('aceita o jeito brasileiro', () => {
    expect(lerPreco('89,90')).toBe(8990);
    expect(lerPreco('R$ 89,90')).toBe(8990);
    expect(lerPreco('1.299,90')).toBe(129990);
    expect(lerPreco('89')).toBe(8900);
    expect(lerPreco('89.9')).toBe(8990);
  });
  it('recusa o que não é preço', () => {
    for (const x of ['', 'abc', '-5', '0,999', '89,9,0', '0', '0,00']) expect(lerPreco(x), x).toBeNull();
  });
});

describe('grade e tamanhos', () => {
  it('lê a grade', () => {
    expect(lerGrade('P, M,G  GG, M')).toEqual(['P', 'M', 'G', 'GG']);
    expect(lerGrade('  ')).toEqual([]);
  });
  it('avisa os tamanhos ligados que saem da grade', () => {
    const pecas = [peca('a', { P: true, M: false, G: true }), peca('b', { P: false, XG: true })];
    expect(tamanhosPerdidos(['P', 'M', 'G'], ['M', 'G', 'GG'], pecas)).toEqual(['P']);
    expect(tamanhosPerdidos(['P', 'M'], ['P', 'M'], pecas)).toEqual([]);
  });
});

describe('medidasReduzidas', () => {
  it('reduz só quando passa de 1600 no lado maior', () => {
    expect(medidasReduzidas(4000, 3000)).toEqual({ largura: 1600, altura: 1200 });
    expect(medidasReduzidas(3000, 4000)).toEqual({ largura: 1200, altura: 1600 });
    expect(medidasReduzidas(800, 600)).toEqual({ largura: 800, altura: 600 });
  });
});

describe('validações', () => {
  const ok = { nome: 'Polo', descricao: '', categoriaId: 'c1', precoCentavos: 100, tamanhos: {} };
  it('peça', () => {
    expect(validarPeca(ok)).toEqual({});
    expect(validarPeca({ ...ok, nome: '  ' })).toEqual({ nome: 'Escreva o nome da peça.' });
    expect(validarPeca({ ...ok, nome: 'x'.repeat(81) }).nome).toBeDefined();
    expect(validarPeca({ ...ok, categoriaId: '' })).toEqual({ categoriaId: 'Escolha a categoria.' });
    expect(validarPeca({ ...ok, precoCentavos: 0 })).toEqual({ preco: 'Preço inválido.' });
  });
  it('kit', () => {
    expect(validarKit({ titulo: 'Kit', descricao: '', pecaIds: ['a', 'b'] })).toEqual({});
    expect(validarKit({ titulo: '', descricao: '', pecaIds: ['a', 'b'] })).toEqual({ titulo: 'Escreva o título do kit.' });
    expect(validarKit({ titulo: 'Kit', descricao: '', pecaIds: ['a'] })).toEqual({ pecas: 'Escolha de 2 a 4 peças.' });
    expect(validarKit({ titulo: 'Kit', descricao: '', pecaIds: ['a', 'b', 'c', 'd', 'e'] }).pecas).toBeDefined();
    expect(validarKit({ titulo: 'Kit', descricao: '', pecaIds: ['a', 'a'] }).pecas).toBeDefined();
  });
  it('categoria', () => {
    expect(validarCategoria({ nome: 'Bonés', grade: ['U'], visivel: true })).toEqual({});
    expect(validarCategoria({ nome: '', grade: ['U'], visivel: true })).toEqual({ nome: 'Escreva o nome da categoria.' });
    expect(validarCategoria({ nome: 'Bonés', grade: [], visivel: true })).toEqual({ grade: 'Coloque ao menos um tamanho.' });
  });
  it('WhatsApp', () => {
    expect(validarWhatsapp('(48) 99999-9999')).toBeNull();
    expect(validarWhatsapp('+55 48 99999-9999')).toBe('5548999999999');
    expect(validarWhatsapp('55 48 3333-4444')).toBe('554833334444');
    expect(validarWhatsapp('55 48 99999-99999')).toBeNull();
  });
});

describe('resumoGeral', () => {
  it('conta peças à venda, esgotadas e kits afetados', () => {
    const d: DadosAdmin = {
      categorias: [{ id: 'c1', nome: 'C', slug: 'c', grade: ['P', 'M'], ordem: 1, visivel: true }],
      pecas: [
        peca('ok', { P: true, M: false }),
        peca('esg', { P: false, M: false }),
        peca('arq', { P: false, M: false }, { arquivada: true }),
        peca('fora', { XG: true }), // tamanho fora da grade não conta
      ],
      kits: [
        { id: 'k1', slug: 'k1', titulo: 'K1', descricao: '', fotoPath: null, publicado: true, ordem: 1, pecaIds: ['ok', 'esg'] },
        { id: 'k2', slug: 'k2', titulo: 'K2', descricao: '', fotoPath: null, publicado: true, ordem: 2, pecaIds: ['ok', 'ok'] },
        { id: 'k3', slug: 'k3', titulo: 'K3', descricao: '', fotoPath: null, publicado: true, ordem: 3, pecaIds: ['ok', 'arq'] },
      ],
      configuracoes: { lojaAberta: true, whatsappNumero: '', instagramUrl: '', grupoWhatsappUrl: '', textoEntrega: '' },
    };
    const r = resumoGeral(d);
    expect(r.pecasAtivas).toBe(3);
    expect(r.esgotadas.map((p) => p.id)).toEqual(['esg', 'fora']);
    expect(r.kitsComEsgotada.map((k) => k.id)).toEqual(['k1', 'k3']);
  });
});
