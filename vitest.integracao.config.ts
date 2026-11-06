import { defineConfig, loadEnv } from 'vite';

// Testes contra o projeto Supabase real (só leitura ou tentativas que devem falhar).
// Lê o .env.local; rodar com `npm run test:integracao`.
export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/integracao/**/*.integracao.test.ts'],
    env: loadEnv('development', process.cwd(), 'VITE_'),
    testTimeout: 30_000,
    fileParallelism: false,
  },
});
