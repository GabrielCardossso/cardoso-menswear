import { createClient } from '@supabase/supabase-js';
import { lerAmbienteSupabase } from '../lib/ambiente';
import { criarFonteSupabase } from './fonteSupabase';
import { fonteLocal } from './fonteLocal';
import type { FonteVitrine } from './tipos';

/** Build de produção sem as variáveis: mostra o erro da vitrine em vez de peças de exemplo. */
const fonteSemConfiguracao: FonteVitrine = {
  async carregar() {
    throw new Error('Supabase não configurado: faltam VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY.');
  },
};

/** Supabase quando há ambiente; sem ele, o JSON de exemplo só em desenvolvimento e testes. */
export function escolherFonte(env: Record<string, unknown>): FonteVitrine {
  // O build do e2e (vite build --mode e2e) nunca toca o banco de produção: usa sempre o JSON de exemplo.
  if (env.MODE === 'e2e') return fonteLocal;
  const ambiente = lerAmbienteSupabase(env);
  if (ambiente) {
    // Etapa 3: só leitura pública. O login do admin (etapa 4) muda as opções de sessão.
    const cliente = createClient(ambiente.url, ambiente.chavePublicavel, { auth: { persistSession: false } });
    return criarFonteSupabase(cliente, ambiente.url);
  }
  return env.DEV === true || env.MODE === 'test' ? fonteLocal : fonteSemConfiguracao;
}
