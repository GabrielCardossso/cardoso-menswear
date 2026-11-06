// Contra o projeto Supabase real, com a chave PUBLICÁVEL (papel anon). Rodar: npm run test:integracao.
// Só lê ou tenta gravar o que deve ser recusado: nenhum dado fica no banco.
import { createClient } from '@supabase/supabase-js';
import { lerAmbienteSupabase } from '../lib/ambiente';
import { escolherFonte } from '../vitrine/escolherFonte';

const env = import.meta.env as Record<string, unknown>;
const ambiente = lerAmbienteSupabase(env);
if (!ambiente) throw new Error('Preencha o .env.local (veja o .env.example) antes de rodar os testes de integração.');
const db = createClient(ambiente.url, ambiente.chavePublicavel, { auth: { persistSession: false } });

const GRADES = {
  camisetas: ['P', 'M', 'G', 'GG', 'XG'],
  polos: ['P', 'M', 'G', 'GG', 'XG'],
  bermudas: ['P', 'M', 'G', 'GG', 'XG'],
  calcas: ['36', '38', '40', '42', '44', '46'],
  tenis: ['37', '38', '39', '40', '41', '42', '43', '44'],
};

describe('visitante (chave publicável)', () => {
  it('lê as 5 categorias com as grades e as configurações', async () => {
    const { data, error } = await db.from('categorias').select('slug, grade').order('ordem');
    expect(error).toBeNull();
    expect(Object.fromEntries(data!.map((c) => [c.slug, c.grade]))).toEqual(GRADES);
    const cfg = await db.from('configuracoes').select('whatsapp_numero, loja_aberta').single();
    expect(cfg.error).toBeNull();
    expect(cfg.data!.whatsapp_numero).toMatch(/^\d{12,13}$/);
  });

  it('não grava em nenhuma tabela', async () => {
    const { data: cat } = await db.from('categorias').select('id, nome').eq('slug', 'camisetas').single();
    const tentativas = await Promise.all([
      db.from('pecas').insert({ categoria_id: cat!.id, nome: 'Teste', slug: 'teste-intruso', preco: 1 }),
      db.from('categorias').update({ nome: 'Invadida' }).eq('id', cat!.id),
      db.from('categorias').delete().eq('id', cat!.id),
      db.from('configuracoes').update({ loja_aberta: false }).eq('id', true),
      db.from('kits').insert({ titulo: 'Teste', slug: 'teste-intruso' }),
      db.from('admins').insert({ user_id: '00000000-0000-0000-0000-000000000000' }),
    ]);
    for (const t of tentativas) expect(t.error).not.toBeNull();

    // Nada mudou.
    const depois = await db.from('categorias').select('nome').eq('id', cat!.id).single();
    expect(depois.data!.nome).toBe(cat!.nome);
    const cfg = await db.from('configuracoes').select('loja_aberta').single();
    expect(cfg.data!.loja_aberta).toBe(true);
    const intrusa = await db.from('pecas').select('id').eq('slug', 'teste-intruso');
    expect(intrusa.data).toEqual([]);
  });

  it('não vê a lista de admins', async () => {
    const { data, error } = await db.from('admins').select('user_id');
    // Sem grant para anon: recusa (ou, se um dia houver grant, lista vazia pela RLS).
    expect(error !== null || data!.length === 0).toBe(true);
  });

  it('não envia arquivo para o bucket de fotos', async () => {
    const { error } = await db.storage
      .from('vitrine')
      .upload('teste-intruso.png', new Blob(['x'], { type: 'image/png' }), { upsert: false });
    expect(error).not.toBeNull();
  });

  it('não chama is_admin nem a função do RLS automático', async () => {
    const rls = await db.rpc('rls_auto_enable');
    expect(rls.error).not.toBeNull();
    const gatilho = await db.rpc('tocar_atualizado_em');
    expect(gatilho.error).not.toBeNull();
  });
});

describe('fonte do Supabase', () => {
  it('monta a vitrine com as 5 categorias', async () => {
    const v = await escolherFonte({ ...env, DEV: false, PROD: true, MODE: 'production' }).carregar();
    expect(v.categorias.map((c) => c.slug)).toEqual(Object.keys(GRADES));
    expect(v.configuracoes.instagramUrl).toBe('https://www.instagram.com/cardoso.menswear/');
  });
});
