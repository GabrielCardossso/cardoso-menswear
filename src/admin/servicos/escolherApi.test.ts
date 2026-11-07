import { escolherApi } from './escolherApi';

const ambiente = {
  VITE_SUPABASE_URL: 'https://gbhbzntuuysswbsptqgi.supabase.co',
  VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_abc',
};
const ehMemoria = async (api: ReturnType<typeof escolherApi>) => (await api.entrar('a@exemplo.test', 'x')) === 'ok';

describe('escolherApi', () => {
  it('no e2e, sempre memória (mesmo com o Supabase no ambiente)', async () => {
    expect(await ehMemoria(escolherApi({ ...ambiente, MODE: 'e2e', DEV: false, PROD: true }))).toBe(true);
  });

  it('sem Supabase em dev e testes, memória', async () => {
    expect(await ehMemoria(escolherApi({ DEV: true, MODE: 'development' }))).toBe(true);
    expect(await ehMemoria(escolherApi({ DEV: false, MODE: 'test' }))).toBe(true);
  });

  it('sem Supabase no build de produção, avisa que não está configurado', async () => {
    await expect(escolherApi({ DEV: false, PROD: true, MODE: 'production' }).sessao()).rejects.toThrow('supabase-nao-configurado');
  });

  it('com Supabase, usa o banco (não é a memória)', async () => {
    const api = escolherApi({ ...ambiente, DEV: false, PROD: true, MODE: 'production' });
    expect(api.urlDaFoto('pecas/a.webp')).toBe(`${ambiente.VITE_SUPABASE_URL}/storage/v1/object/public/vitrine/pecas/a.webp`);
  });
});
