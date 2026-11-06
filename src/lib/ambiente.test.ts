import { lerAmbienteSupabase } from './ambiente';

const ok = {
  VITE_SUPABASE_URL: 'https://gbhbzntuuysswbsptqgi.supabase.co',
  VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_abc',
};

describe('lerAmbienteSupabase', () => {
  it('lê a URL e a chave publicável', () => {
    expect(lerAmbienteSupabase(ok)).toEqual({ url: ok.VITE_SUPABASE_URL, chavePublicavel: 'sb_publishable_abc' });
  });

  it('devolve null sem as variáveis', () => {
    expect(lerAmbienteSupabase({})).toBeNull();
    expect(lerAmbienteSupabase({ VITE_SUPABASE_URL: ok.VITE_SUPABASE_URL })).toBeNull();
  });

  it('nunca aceita chave secreta', () => {
    expect(lerAmbienteSupabase({ ...ok, VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_secret_x' })).toBeNull();
  });

  it('recusa URL que não seja do Supabase em https', () => {
    expect(lerAmbienteSupabase({ ...ok, VITE_SUPABASE_URL: 'http://localhost:54321' })).toBeNull();
  });

  it('ignora espaços e barra no fim', () => {
    expect(
      lerAmbienteSupabase({ VITE_SUPABASE_URL: ` ${ok.VITE_SUPABASE_URL}/ `, VITE_SUPABASE_PUBLISHABLE_KEY: ' sb_publishable_abc ' }),
    ).toEqual({ url: ok.VITE_SUPABASE_URL, chavePublicavel: 'sb_publishable_abc' });
  });
});
