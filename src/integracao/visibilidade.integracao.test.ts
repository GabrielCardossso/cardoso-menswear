// Confere o que o visitante vê com os dados de exemplo (supabase/exemplo/carregar.sql) no banco,
// e que limpar.sql não deixou nada. Rodar com EXEMPLO=carregado ou EXEMPLO=limpo:
//   EXEMPLO=carregado npm run test:integracao
import { createClient } from '@supabase/supabase-js';
import exemplo from '../vitrine/vitrine-exemplo.json';
import { lerAmbienteSupabase } from '../lib/ambiente';
import { escolherFonte } from '../vitrine/escolherFonte';

const env = import.meta.env as Record<string, unknown>;
const ambiente = lerAmbienteSupabase(env)!;
const db = createClient(ambiente.url, ambiente.chavePublicavel, { auth: { persistSession: false } });
const modo = process.env.EXEMPLO;
const ESCONDIDOS = ['exemplo-arquivada', 'exemplo-peca-escondida'];

describe.runIf(modo === 'carregado')('com os dados de exemplo', () => {
  it('o visitante vê as 12 peças e os 4 kits, e nada do que está escondido', async () => {
    const pecas = await db.from('pecas').select('slug');
    expect(pecas.error).toBeNull();
    const slugs = pecas.data!.map((p) => p.slug).sort();
    expect(slugs).toEqual(exemplo.pecas.map((p) => `exemplo-${p.slug}`).sort());
    for (const s of ESCONDIDOS) expect(slugs).not.toContain(s);

    const kits = await db.from('kits').select('slug');
    expect(kits.data!.map((k) => k.slug).sort()).toEqual(exemplo.kits.map((k) => `exemplo-${k.slug}`).sort());

    const cat = await db.from('categorias').select('slug').eq('slug', 'exemplo-escondida');
    expect(cat.data).toEqual([]);

    // Fotos e tamanhos da peça escondida também não aparecem.
    const fotos = await db.from('peca_fotos').select('peca_id');
    expect(fotos.data).toHaveLength(12);
  });

  it('a fonte monta a vitrine com preços, tamanhos e kits do exemplo', async () => {
    const v = await escolherFonte({ ...env, DEV: false, PROD: true, MODE: 'production' }).carregar();
    const p = v.pecas.find((x) => x.slug === 'exemplo-camisa-dry-fit-nk-preta')!;
    expect(p.precoCentavos).toBe(8990);
    expect(p.tamanhos).toEqual({ P: false, M: true, G: true, GG: true, XG: false });
    expect(p.fotos).toEqual(['/exemplo/kit-1.jpg']);
    const k = v.kits.find((x) => x.slug === 'exemplo-dry-fit-nk-preta-e-bermuda')!;
    expect(k.pecaIds.map((id) => v.pecas.find((x) => x.id === id)!.slug)).toEqual([
      'exemplo-camisa-dry-fit-nk-preta',
      'exemplo-bermuda-dry-fit-nk-preta',
    ]);
  });
});

describe.runIf(modo === 'limpo')('depois de limpar', () => {
  it('não sobra peça nem kit de exemplo (as peças reais ficam)', async () => {
    const pecas = await db.from('pecas').select('slug').like('slug', 'exemplo-%');
    const kits = await db.from('kits').select('slug').like('slug', 'exemplo-%');
    expect(pecas.error).toBeNull();
    expect(pecas.data).toEqual([]);
    expect(kits.data).toEqual([]);
  });
});
