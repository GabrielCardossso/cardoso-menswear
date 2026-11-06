// @vitest-environment node
// Lê os arquivos de supabase/migrations (sem rede) e confere as regras do plano da etapa 3.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import exemplo from '../vitrine/vitrine-exemplo.json';

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

  it('ligam a RLS em toda tabela criada em public', () => {
    const criadas = [...codigo.matchAll(/create table public\.(\w+)/gi)].map((m) => m[1]);
    for (const t of criadas) {
      expect(codigo, t).toMatch(new RegExp(`alter table public\\.${t} enable row level security`, 'i'));
    }
  });

  it('políticas chamam is_admin() e auth.uid() dentro de select (uma vez por consulta)', () => {
    expect(codigo).toMatch(/create policy/i);
    const semSelect = (fn: string) => new RegExp(`(?<!\\(select )${fn}\\(\\)`, 'gi');
    const politicas = [...codigo.matchAll(/create policy[\s\S]*?;/gi)].map((m) => m[0]);
    for (const p of politicas) {
      expect(p).not.toMatch(semSelect('private\\.is_admin'));
      expect(p).not.toMatch(semSelect('auth\\.uid'));
    }
  });

  it('is_admin é security definer com search_path vazio, sem execução para anon', () => {
    expect(codigo).toMatch(/create function private\.is_admin\(\)[\s\S]*?security definer[\s\S]*?set search_path = ''/i);
    expect(codigo).toMatch(/revoke execute on function private\.is_admin\(\) from public, anon/i);
  });

  it('dados iniciais: categorias e configurações iguais às do JSON de exemplo', () => {
    const arquivo = arquivos.find((f) => f.endsWith('_dados_iniciais.sql'));
    expect(arquivo).toBeDefined();
    const dados = readFileSync(join(PASTA, arquivo!), 'utf8');
    const literal = (s: string) => `'${s.replace(/'/g, "''")}'`;
    for (const c of exemplo.categorias) {
      const grade = `array[${c.grade.map(literal).join(', ')}]`;
      expect(dados, c.slug).toContain(`(${literal(c.nome)}, ${literal(c.slug)}, ${grade}, ${c.ordem}, true)`);
    }
    const cfg = exemplo.configuracoes;
    for (const v of [cfg.whatsappNumero, cfg.instagramUrl, cfg.grupoWhatsappUrl, cfg.textoEntrega]) {
      expect(dados).toContain(literal(v));
    }
    // Rodar duas vezes não duplica nem falha.
    expect(dados.match(/on conflict/gi)?.length).toBe(2);
    // Peças e kits de exemplo nunca entram por migração.
    expect(dados).not.toMatch(/insert into public\.(pecas|kits)/i);
  });

  it('fecha para a API a função do RLS automático criada pelo Supabase (aviso do Security Advisor)', () => {
    expect(codigo).toMatch(/revoke execute on function public\.rls_auto_enable\(\) from public, anon, authenticated/i);
  });

  it('só acrescentam: nada de drop table, drop column, rename ou truncate', () => {
    expect(codigo).not.toMatch(/\bdrop\s+table\b/i);
    expect(codigo).not.toMatch(/\bdrop\s+column\b/i);
    expect(codigo).not.toMatch(/\brename\b/i);
    expect(codigo).not.toMatch(/\btruncate\b/i);
  });
});
