import { createClient } from '@supabase/supabase-js';
import { lerAmbienteSupabase } from '../../lib/ambiente';
import type { ApiAdmin } from '../tipos';
import { criarApiMemoria } from './apiMemoria';
import { criarApiSupabase } from './apiSupabase';

/** Build de produção sem as variáveis: o painel diz que o Supabase não está configurado. */
function apiSemConfiguracao(): ApiAdmin {
  const recusar = async () => {
    throw new Error('supabase-nao-configurado');
  };
  return new Proxy({} as ApiAdmin, {
    get: (_, nome) => (nome === 'urlDaFoto' ? (path: string) => path : recusar),
  });
}

/**
 * e2e: sempre memória. Com o Supabase no ambiente: banco, com um cliente PRÓPRIO do painel, com sessão
 * (a vitrine segue com o cliente sem sessão, para o admin logado não ver peças escondidas na loja).
 * Sem ambiente: memória em dev e testes; aviso no build de produção.
 */
export function escolherApi(env: Record<string, unknown>): ApiAdmin {
  if (env.MODE === 'e2e') return criarApiMemoria();
  const ambiente = lerAmbienteSupabase(env);
  if (ambiente) {
    const cliente = createClient(ambiente.url, ambiente.chavePublicavel, {
      auth: { persistSession: true, autoRefreshToken: true, storageKey: 'cardoso-admin' },
    });
    return criarApiSupabase(cliente, ambiente.url);
  }
  return env.DEV === true || env.MODE === 'test' ? criarApiMemoria() : apiSemConfiguracao();
}
