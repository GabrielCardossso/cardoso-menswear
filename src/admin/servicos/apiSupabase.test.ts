import type { SupabaseClient } from '@supabase/supabase-js';
import { ErroCriacaoParcial, ErroSessao } from '../tipos';
import { criarApiSupabase, ehErroSessao, paraCategoriaAdmin, paraKitAdmin, paraPecaAdmin } from './apiSupabase';

type Resp = { data?: unknown; error?: unknown };

/** Cliente falso: cada `tabela:operação` (select/insert/update/delete) devolve a resposta configurada. */
function clienteFalso(respostas: Record<string, Resp>, opcoes: { sessao?: boolean; storageErro?: boolean } = {}) {
  const removidos: string[][] = [];
  const cliente = {
    auth: {
      getSession: async () => ({ data: { session: opcoes.sessao === false ? null : { user: { email: 'a@b.c' } } }, error: null }),
    },
    from(tabela: string) {
      let op = 'select';
      const b: Record<string, unknown> = {};
      for (const m of ['select', 'eq', 'in', 'not', 'like', 'order', 'limit', 'single', 'maybeSingle']) b[m] = () => b;
      b.insert = () => ((op = 'insert'), b);
      b.update = () => ((op = 'update'), b);
      b.delete = () => ((op = 'delete'), b);
      b.then = (ok: (r: Resp) => unknown) => Promise.resolve({ data: null, error: null, ...respostas[`${tabela}:${op}`] }).then(ok);
      return b;
    },
    storage: {
      from: () => ({
        remove: async (paths: string[]) => (removidos.push(paths), { error: opcoes.storageErro ? { message: 'falhou' } : null }),
        upload: async () => ({ error: null }),
      }),
    },
  };
  return { db: cliente as unknown as SupabaseClient, removidos };
}

describe('apiSupabase: sessão e falhas parciais', () => {
  const URL_BASE = 'https://x.supabase.co';

  it('carregar sem sessão rejeita com ErroSessao (não devolve só os dados públicos)', async () => {
    const { db } = clienteFalso({}, { sessao: false });
    await expect(criarApiSupabase(db, URL_BASE).carregar()).rejects.toBeInstanceOf(ErroSessao);
  });

  it('recusa da RLS no Storage conta como sessão perdida', () => {
    expect(ehErroSessao({ status: 403, message: 'new row violates row-level security policy' })).toBe(true);
  });

  it('excluir peça termina mesmo se a limpeza das fotos falhar', async () => {
    const { db, removidos } = clienteFalso(
      { 'peca_fotos:select': { data: [{ path: 'pecas/p1/a.webp' }] }, 'pecas:delete': { data: [{ id: 'p1' }] } },
      { storageErro: true },
    );
    await expect(criarApiSupabase(db, URL_BASE).excluirPeca('p1')).resolves.toBeUndefined();
    expect(removidos).toEqual([['pecas/p1/a.webp']]);
  });

  it('criar peça que grava a linha mas falha nos tamanhos devolve o id criado', async () => {
    const { db } = clienteFalso({
      'pecas:select': { data: [] },
      'pecas:insert': { data: { id: 'p-nova' } },
      'peca_tamanhos:update': { error: { message: 'rede caiu' } },
    });
    const erro = await criarApiSupabase(db, URL_BASE)
      .criarPeca({ nome: 'Polo', descricao: '', categoriaId: 'c', precoCentavos: 100, tamanhos: { M: true } })
      .catch((e: unknown) => e);
    expect(erro).toBeInstanceOf(ErroCriacaoParcial);
    expect((erro as ErroCriacaoParcial).id).toBe('p-nova');
  });

  it('criar kit que grava a linha mas falha nas peças devolve o id criado', async () => {
    const { db } = clienteFalso({
      'kits:select': { data: [] },
      'kits:insert': { data: { id: 'k-novo' } },
      'kit_pecas:insert': { error: { message: 'rede caiu' } },
    });
    const erro = await criarApiSupabase(db, URL_BASE)
      .criarKit({ titulo: 'Kit', descricao: '', pecaIds: ['a', 'b'] })
      .catch((e: unknown) => e);
    expect(erro).toBeInstanceOf(ErroCriacaoParcial);
    expect((erro as ErroCriacaoParcial).id).toBe('k-novo');
  });
});

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
