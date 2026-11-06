import { escolherFonte } from './escolherFonte';
import { fonteLocal } from './fonteLocal';

const ambiente = {
  VITE_SUPABASE_URL: 'https://gbhbzntuuysswbsptqgi.supabase.co',
  VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_abc',
};

describe('escolherFonte', () => {
  it('sem Supabase, em desenvolvimento e testes, usa o JSON de exemplo', () => {
    expect(escolherFonte({ DEV: true, MODE: 'development' })).toBe(fonteLocal);
    expect(escolherFonte({ DEV: false, MODE: 'test' })).toBe(fonteLocal);
  });

  it('sem Supabase, no build de produção, recusa em vez de mostrar peças de exemplo', async () => {
    const fonte = escolherFonte({ DEV: false, PROD: true, MODE: 'production' });
    expect(fonte).not.toBe(fonteLocal);
    await expect(fonte.carregar()).rejects.toThrow();
  });

  it('com Supabase, usa o banco', () => {
    expect(escolherFonte({ ...ambiente, DEV: false, PROD: true, MODE: 'production' })).not.toBe(fonteLocal);
    expect(escolherFonte({ ...ambiente, DEV: true, MODE: 'development' })).not.toBe(fonteLocal);
  });
});

describe('escolherFonte no build do e2e', () => {
  it('usa sempre o JSON de exemplo, mesmo com o Supabase no ambiente', () => {
    expect(escolherFonte({ ...ambiente, DEV: false, PROD: true, MODE: 'e2e' })).toBe(fonteLocal);
  });
});
