// @vitest-environment node
// Lê os arquivos de supabase/migrations (sem rede) e confere as regras do plano da etapa 3.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const PASTA = join(process.cwd(), 'supabase', 'migrations');
const arquivos = readdirSync(PASTA).filter((f) => f.endsWith('.sql')).sort();
const sql = arquivos.map((f) => readFileSync(join(PASTA, f), 'utf8')).join('\n');
/** SQL sem comentários de linha, para os comentários não contarem nas buscas. */
const codigo = sql.replace(/--.*$/gm, '');

const TABELAS = ['categorias', 'pecas', 'peca_fotos', 'peca_tamanhos', 'kits', 'kit_pecas', 'configuracoes', 'admins'];

describe('migrações', () => {
  it('nomes no formato AAAAMMDDHHMMSS_nome.sql, em ordem', () => {
    expect(arquivos.length).toBeGreaterThan(0);
    for (const f of arquivos) expect(f).toMatch(/^\d{14}_[a-z_]+\.sql$/);
    const datas = arquivos.map((f) => f.slice(0, 14));
    expect(new Set(datas).size).toBe(datas.length);
  });

  it('criam as 8 tabelas', () => {
    for (const t of TABELAS) expect(codigo).toMatch(new RegExp(`create table public\\.${t}\\b`, 'i'));
  });

  it('só acrescentam: nada de drop table, drop column, rename ou truncate', () => {
    expect(codigo).not.toMatch(/\bdrop\s+table\b/i);
    expect(codigo).not.toMatch(/\bdrop\s+column\b/i);
    expect(codigo).not.toMatch(/\brename\b/i);
    expect(codigo).not.toMatch(/\btruncate\b/i);
  });
});
