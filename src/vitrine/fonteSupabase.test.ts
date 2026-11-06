import type { SupabaseClient } from '@supabase/supabase-js';
import { criarFonteSupabase, montarVitrine, urlDaFoto, type Linhas } from './fonteSupabase';

const BASE = 'https://gbhbzntuuysswbsptqgi.supabase.co';

const linhas = (): Linhas => ({
  categorias: [{ id: 'c1', nome: 'Camisetas', slug: 'camisetas', grade: ['P', 'M'], ordem: 1 }],
  pecas: [
    {
      id: 'p1',
      slug: 'camisa-preta',
      nome: 'Camisa preta',
      descricao: null,
      categoria_id: 'c1',
      preco: '89.90',
      criado_em: '2026-11-05T12:00:00+00:00',
      peca_fotos: [
        { path: 'pecas/b.webp', ordem: 2 },
        { path: '/exemplo/kit-1.jpg', ordem: 1 },
      ],
      peca_tamanhos: [
        { tamanho: 'P', disponivel: false },
        { tamanho: 'M', disponivel: true },
      ],
    },
    {
      id: 'p2',
      slug: 'bermuda',
      nome: 'Bermuda',
      descricao: 'Leve',
      categoria_id: 'c1',
      preco: 89.9,
      criado_em: '2026-11-04T12:00:00+00:00',
      peca_fotos: [],
      peca_tamanhos: [],
    },
  ],
  kits: [
    {
      id: 'k1',
      slug: 'kit-preto',
      titulo: 'Kit preto',
      descricao: null,
      foto_path: null,
      ordem: 1,
      kit_pecas: [
        { peca_id: 'p2', ordem: 2 },
        { peca_id: 'p1', ordem: 1 },
      ],
    },
  ],
  configuracoes: {
    loja_aberta: true,
    whatsapp_numero: '5548999999999',
    instagram_url: 'https://www.instagram.com/cardoso.menswear/',
    grupo_whatsapp_url: 'https://chat.whatsapp.com/x',
    texto_entrega: 'Entrega',
  },
});

describe('urlDaFoto', () => {
  it('caminho do bucket vira URL pública; caminho do site fica igual', () => {
    expect(urlDaFoto('pecas/a b.webp', BASE)).toBe(`${BASE}/storage/v1/object/public/vitrine/pecas/a%20b.webp`);
    expect(urlDaFoto('/exemplo/kit-1.jpg', BASE)).toBe('/exemplo/kit-1.jpg');
  });
});

describe('montarVitrine', () => {
  it('preço em texto ou número vira centavos', () => {
    const v = montarVitrine(linhas(), BASE);
    expect(v.pecas.map((p) => p.precoCentavos)).toEqual([8990, 8990]);
  });

  it('fotos em ordem, tamanhos como mapa, descrição nula vira texto vazio', () => {
    const [p1] = montarVitrine(linhas(), BASE).pecas;
    expect(p1.fotos).toEqual(['/exemplo/kit-1.jpg', `${BASE}/storage/v1/object/public/vitrine/pecas/b.webp`]);
    expect(p1.tamanhos).toEqual({ P: false, M: true });
    expect(p1.descricao).toBe('');
    expect(p1.categoriaId).toBe('c1');
    expect(p1.criadoEm).toBe('2026-11-05T12:00:00+00:00');
  });

  it('kit: peças em ordem; sem foto própria usa a capa da primeira peça', () => {
    const [k] = montarVitrine(linhas(), BASE).kits;
    expect(k.pecaIds).toEqual(['p1', 'p2']);
    expect(k.foto).toBe('/exemplo/kit-1.jpg');
    expect(k.descricao).toBe('');
  });

  it('kit com foto própria usa a dela', () => {
    const l = linhas();
    l.kits[0].foto_path = 'kits/k1.webp';
    expect(montarVitrine(l, BASE).kits[0].foto).toBe(`${BASE}/storage/v1/object/public/vitrine/kits/k1.webp`);
  });

  it('configurações em camelCase', () => {
    expect(montarVitrine(linhas(), BASE).configuracoes).toEqual({
      lojaAberta: true,
      whatsappNumero: '5548999999999',
      instagramUrl: 'https://www.instagram.com/cardoso.menswear/',
      grupoWhatsappUrl: 'https://chat.whatsapp.com/x',
      textoEntrega: 'Entrega',
    });
  });
});

type Resposta = { data: unknown; error: unknown };

/** Cliente falso: from(tabela) devolve um encadeável que resolve com a resposta da tabela. */
function clienteFalso(respostas: Record<string, Resposta>): SupabaseClient {
  return {
    from(tabela: string) {
      const r = respostas[tabela];
      const encadeavel = {
        select: () => encadeavel,
        order: () => encadeavel,
        maybeSingle: () => encadeavel,
        then: (ok: (x: Resposta) => unknown, erro?: (e: unknown) => unknown) => Promise.resolve(r).then(ok, erro),
      };
      return encadeavel;
    },
  } as unknown as SupabaseClient;
}

function respostasOk(): Record<string, Resposta> {
  const l = linhas();
  return {
    categorias: { data: l.categorias, error: null },
    pecas: { data: l.pecas, error: null },
    kits: { data: l.kits, error: null },
    configuracoes: { data: l.configuracoes, error: null },
  };
}

describe('criarFonteSupabase', () => {
  it('carrega e monta a vitrine', async () => {
    const v = await criarFonteSupabase(clienteFalso(respostasOk()), BASE).carregar();
    expect(v.categorias).toHaveLength(1);
    expect(v.pecas).toHaveLength(2);
    expect(v.kits[0].pecaIds).toEqual(['p1', 'p2']);
  });

  it('rejeita quando uma consulta devolve erro', async () => {
    const r = respostasOk();
    r.pecas = { data: null, error: { message: 'falhou' } };
    await expect(criarFonteSupabase(clienteFalso(r), BASE).carregar()).rejects.toThrow();
  });

  it('rejeita quando não há configurações', async () => {
    const r = respostasOk();
    r.configuracoes = { data: null, error: null };
    await expect(criarFonteSupabase(clienteFalso(r), BASE).carregar()).rejects.toThrow();
  });
});
