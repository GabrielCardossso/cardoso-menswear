export type AmbienteSupabase = { url: string; chavePublicavel: string };

const URL_SUPABASE = /^https:\/\/[a-z0-9-]+\.supabase\.co$/;

/** Lê o Supabase das variáveis do Vite. Só aceita a chave publicável: a secreta nunca vai para o navegador. */
export function lerAmbienteSupabase(env: Record<string, unknown>): AmbienteSupabase | null {
  const url = String(env.VITE_SUPABASE_URL ?? '').trim().replace(/\/+$/, '');
  const chave = String(env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '').trim();
  if (!URL_SUPABASE.test(url) || !chave.startsWith('sb_publishable_')) return null;
  return { url, chavePublicavel: chave };
}
