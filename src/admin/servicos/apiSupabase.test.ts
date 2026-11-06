import { ehErroSessao, paraCategoriaAdmin, paraKitAdmin, paraPecaAdmin } from './apiSupabase';

describe('mapeamentos do Supabase para o painel', () => {
  it('peça: preço em texto, fotos em ordem, descrição nula', () => {
    const p = paraPecaAdmin({
      id: 'p1',
      slug: 'polo',
      nome: 'Polo',
      descricao: null,
      categoria_id: 'c1',
      preco: '129.90',
      arquivada: true,
      criado_em: '2026-11-06T12:00:00+00:00',
      peca_fotos: [
        { id: 'f2', path: 'pecas/p1/b.webp', ordem: 1 },
        { id: 'f1', path: 'pecas/p1/a.webp', ordem: 0 },
      ],
      peca_tamanhos: [
        { tamanho: 'P', disponivel: false },
        { tamanho: 'M', disponivel: true },
      ],
    });
    expect(p).toEqual({
      id: 'p1',
      slug: 'polo',
      nome: 'Polo',
      descricao: '',
      categoriaId: 'c1',
      precoCentavos: 12990,
      arquivada: true,
      fotos: [
        { id: 'f1', path: 'pecas/p1/a.webp', ordem: 0 },
        { id: 'f2', path: 'pecas/p1/b.webp', ordem: 1 },
      ],
      tamanhos: { P: false, M: true },
      criadoEm: '2026-11-06T12:00:00+00:00',
    });
  });

  it('kit: peças em ordem, publicado e foto', () => {
    expect(
      paraKitAdmin({
        id: 'k1',
        slug: 'k',
        titulo: 'Kit',
        descricao: null,
        foto_path: null,
        publicado: false,
        ordem: 3,
        kit_pecas: [
          { peca_id: 'b', ordem: 1 },
          { peca_id: 'a', ordem: 0 },
        ],
      }),
    ).toEqual({ id: 'k1', slug: 'k', titulo: 'Kit', descricao: '', fotoPath: null, publicado: false, ordem: 3, pecaIds: ['a', 'b'] });
  });

  it('categoria', () => {
    expect(paraCategoriaAdmin({ id: 'c', nome: 'Polos', slug: 'polos', grade: ['P'], ordem: 2, visivel: false })).toEqual({
      id: 'c',
      nome: 'Polos',
      slug: 'polos',
      grade: ['P'],
      ordem: 2,
      visivel: false,
    });
  });
});

describe('ehErroSessao', () => {
  it('reconhece sessão vencida ou ausente', () => {
    expect(ehErroSessao({ status: 401 })).toBe(true);
    expect(ehErroSessao({ code: 'PGRST301' })).toBe(true);
    expect(ehErroSessao({ code: 'PGRST303' })).toBe(true);
    expect(ehErroSessao({ message: 'JWT expired' })).toBe(true);
    expect(ehErroSessao({ code: '42501' })).toBe(true);
    expect(ehErroSessao({ code: '23505' })).toBe(false);
    expect(ehErroSessao({ status: 500, message: 'falhou' })).toBe(false);
  });
});
